import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../lib/supabase-admin';
import axios from 'axios';
import Parser from 'rss-parser';

const parser = new Parser({ timeout: 15000 });

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

async function sendTelegramMessage(botToken: string, chatId: string, text: string) {
  await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true,
  });
}

async function sendWeComMessage(webhookUrl: string, text: string) {
  const MAX_LEN = 3800;
  if (text.length <= MAX_LEN) {
    await axios.post(webhookUrl, {
      msgtype: 'markdown', markdown: { content: text },
    }, { headers: { 'Content-Type': 'application/json' } });
    return;
  }
  const sections = text.split('\n\n');
  let batch = '';
  for (const sec of sections) {
    if (batch.length + sec.length + 2 > MAX_LEN && batch.length > 0) {
      await axios.post(webhookUrl, {
        msgtype: 'markdown', markdown: { content: batch.trim() },
      }, { headers: { 'Content-Type': 'application/json' } });
      await new Promise(r => setTimeout(r, 500));
      batch = '';
    }
    batch += sec + '\n\n';
  }
  if (batch.trim()) {
    await axios.post(webhookUrl, {
      msgtype: 'markdown', markdown: { content: batch.trim() },
    }, { headers: { 'Content-Type': 'application/json' } });
  }
}

async function collectFeed(name: string, url: string): Promise<FeedItem[]> {
  try {
    const feed = await parser.parseURL(url);
    return (feed.items || []).slice(0, 10).map(item => ({
      title: item.title || 'Untitled',
      link: item.link || '',
      source: name,
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
        .select('name, url')
        .eq('user_id', profile.id)
        .eq('enabled', true);

      if (!feeds || feeds.length === 0) {
        results.push.skipped++;
        continue;
      }

      // 并发采集用户的所有 RSS 源
      const collectResults = await Promise.allSettled(
        feeds.map(f => collectFeed(f.name, f.url))
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

      for (const fr of feedResults) {
        const items = allItems.filter(item => item.source === fr.name);
        tgMsg += `📌 <b>${fr.name}</b> (${items.length})\n`;
        wecomMsg += `📌 **${fr.name}** (${items.length})\n`;

        items.slice(0, 5).forEach((item, i) => {
          const title = item.title.substring(0, 80) + (item.title.length > 80 ? '...' : '');
          tgMsg += `${i + 1}. <a href="${item.link}">${title}</a>\n`;
          wecomMsg += `${i + 1}. [${title}](${item.link})\n`;
        });
        tgMsg += '\n';
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
        items_count: allItems.length,
        domains: feedResults.map(f => f.name),
        success: true,
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
