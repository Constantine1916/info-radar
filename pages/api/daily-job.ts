import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../lib/supabase-admin';
import axios from 'axios';
import Parser from 'rss-parser';
import { normalizePushLimit } from '../../lib/feed-push-limit';
import { splitMessageByByteLength } from '../../lib/message-chunks';

const parser = new Parser({ timeout: 15000 });
const PUSH_MESSAGE_MAX_BYTES = 3500;

interface ProfileData {
  id: string;
  telegram_bot_token: string | null;
  telegram_chat_id: string | null;
  telegram_verified: boolean | null;
  webhook_key: string | null;
  webhook_enabled: boolean | null;
}

interface FeedItem {
  title: string;
  link: string;
  source: string;
}

interface FeedRecord {
  name: string;
  url: string;
  push_limit: number | null;
}

async function sendTelegramMessage(botToken: string, chatId: string, text: string) {
  for (const chunk of splitMessageByByteLength(text, PUSH_MESSAGE_MAX_BYTES)) {
    await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      chat_id: chatId, text: chunk, parse_mode: 'HTML', disable_web_page_preview: true,
    });
    await new Promise(r => setTimeout(r, 300));
  }
}

async function sendWeComMessage(webhookUrl: string, text: string) {
  for (const chunk of splitMessageByByteLength(text, PUSH_MESSAGE_MAX_BYTES)) {
    try {
      await axios.post(webhookUrl, {
        msgtype: 'markdown', markdown: { content: chunk },
      }, { headers: { 'Content-Type': 'application/json' } });
    } catch (e) {
      console.error('WeCom send error:', e);
    }
    await new Promise(r => setTimeout(r, 300));
  }
}

async function collectFeed(feedRecord: FeedRecord): Promise<FeedItem[]> {
  try {
    const feed = await parser.parseURL(feedRecord.url);
    const pushLimit = normalizePushLimit(feedRecord.push_limit);
    return (feed.items || []).slice(0, pushLimit).map(item => ({
      title: item.title || 'Untitled',
      link: item.link || '',
      source: feedRecord.name,
    }));
  } catch { return []; }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authToken = req.headers['authorization'];
  const expectedToken = process.env.CRON_SECRET;
  if (authToken !== `Bearer ${expectedToken}`) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const results = {
    push: { telegram: 0, wecom: 0, skipped: 0 },
  };

  try {
    console.log('🔄 Starting daily job...');

    // 获取所有配置了推送渠道的用户
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, telegram_bot_token, telegram_chat_id, telegram_verified, webhook_key, webhook_enabled')
      .or('telegram_verified.eq.true, and(webhook_enabled.eq.true, webhook_key.not.is.null)');

    if (profileError || !profiles) {
      throw new Error('Failed to fetch users');
    }

    for (const profile of profiles) {
      // 获取用户的 RSS 源
      const { data: feeds } = await supabaseAdmin
        .from('user_feeds')
        .select('*')
        .order('sort_order', { ascending: true })
        .eq('user_id', profile.id)
        .eq('enabled', true)
        .returns<FeedRecord[]>();

      if (!feeds || feeds.length === 0) {
        results.push.skipped++;
        continue;
      }

      // 并发采集用户的所有 RSS 源
      const collectResults = await Promise.allSettled(
        feeds.map(f => collectFeed(f))
      );

      const allItems: FeedItem[] = [];
      const feedResults: { name: string; count: number }[] = [];

      collectResults.forEach((r, i) => {
        if (r.status === 'fulfilled' && r.value.length > 0) {
          allItems.push(...r.value);
          feedResults.push({ name: feeds[i].name, count: r.value.length });
        }
      });

      if (allItems.length === 0) {
        results.push.skipped++;
        continue;
      }

      // 构建消息
      const dateStr = new Date().toISOString().split('T')[0];

      let tgMsg = `📡 <b>Info Radar 每日摘要</b>\n📅 ${dateStr}\n\n`;
      tgMsg += `📊 共 <b>${allItems.length}</b> 条来自 ${feedResults.length} 个源\n\n`;

      let wecomMsg = `📡 **Info Radar 每日摘要**\n📅 ${dateStr}\n\n`;
      wecomMsg += `📊 共 **${allItems.length}** 条来自 ${feedResults.length} 个源\n\n`;

      const pushedItems: { title: string; link: string; source: string }[] = [];
      for (const fr of feedResults) {
        const items = allItems.filter(item => item.source === fr.name);
        const displayItems = items;
        tgMsg += `📌 <b>${fr.name}</b> (${displayItems.length})\n`;
        wecomMsg += `📌 **${fr.name}** (${displayItems.length})\n`;

        displayItems.forEach((item, i) => {
          const title = item.title.substring(0, 80) + (item.title.length > 80 ? '...' : '');
          tgMsg += `${i + 1}. <a href="${item.link}">${title}</a>\n`;
          wecomMsg += `${i + 1}. [${title}](${item.link})\n`;
        });
        tgMsg += '\n';
        pushedItems.push(...displayItems);
        wecomMsg += '\n';
      }

      tgMsg += '✅ 自动推送 | by Info Radar';
      wecomMsg += '✅ by Info Radar';

      // 发送 Telegram
      if (profile.telegram_verified && profile.telegram_bot_token && profile.telegram_chat_id) {
        try {
          await sendTelegramMessage(profile.telegram_bot_token, profile.telegram_chat_id, tgMsg);
          results.push.telegram++;
        } catch (e) { console.error('TG fail:', e); }
        await new Promise(r => setTimeout(r, 500));
      }

      // 发送企微
      if (profile.webhook_enabled && profile.webhook_key) {
        try {
          const url = profile.webhook_key.includes('key=')
            ? profile.webhook_key
            : `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=${profile.webhook_key}`;
          await sendWeComMessage(url, wecomMsg);
          results.push.wecom++;
        } catch (e) { console.error('WeCom fail:', e); }
        await new Promise(r => setTimeout(r, 500));
      }

      // 记录推送历史
      await supabaseAdmin.from('push_history').insert({
        user_id: profile.id,
        items_count: pushedItems.length,
        domains: feedResults.map(f => f.name),
        success: true,
        items: pushedItems,
      });
    }

    console.log('✅ Daily job completed:', results);
    return res.status(200).json({ success: true, results, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('❌ Daily job error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      results,
    });
  }
}
