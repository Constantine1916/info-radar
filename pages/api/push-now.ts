import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import Parser from 'rss-parser';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
const parser = new Parser({ timeout: 15000 });

interface ProfileData {
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
  // 企微 markdown 限制约 4096 字节，按源分批发送
  const MAX_LEN = 3500;
  
  const sendOne = async (msg: string) => {
    try {
      await axios.post(webhookUrl, {
        msgtype: 'markdown', markdown: { content: msg },
      }, { headers: { 'Content-Type': 'application/json' } });
    } catch (e) {
      console.error('WeCom send error:', e);
    }
    await new Promise(r => setTimeout(r, 300));
  };

  if (Buffer.byteLength(text, 'utf8') <= MAX_LEN) {
    await sendOne(text);
    return;
  }

  // 按 "📌" 分段（每个源一段）
  const parts = text.split(/(?=📌)/);
  const header = parts[0]; // 头部信息
  let batch = header;

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    if (Buffer.byteLength(batch + part, 'utf8') > MAX_LEN && batch.trim().length > 0) {
      await sendOne(batch.trim());
      batch = '';
    }
    batch += part;
  }

  if (batch.trim()) {
    await sendOne(batch.trim());
  }
}

async function collectFeed(feedName: string, feedUrl: string): Promise<FeedItem[]> {
  try {
    const feed = await parser.parseURL(feedUrl);
    return (feed.items || []).slice(0, 10).map(item => ({
      title: item.title || 'Untitled',
      link: item.link || '',
      source: feedName,
    }));
  } catch {
    return [];
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  if (userError || !user) return res.status(401).json({ error: 'Unauthorized' });

  const channel = typeof req.query.channel === 'string' ? req.query.channel : null;

  try {
    // 获取用户配置
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('telegram_bot_token, telegram_chat_id, telegram_verified, webhook_key, webhook_enabled')
      .eq('id', user.id)
      .single<ProfileData>();

    if (profileError || !profile) return res.status(400).json({ error: 'Profile not found' });

    const hasTelegram = profile.telegram_verified && profile.telegram_bot_token && profile.telegram_chat_id;
    const hasWeCom = profile.webhook_enabled && profile.webhook_key;

    // 获取用户订阅的 RSS 源
    const { data: feeds } = await supabaseAdmin
      .from('user_feeds')
      .select('name, url')
      .eq('user_id', user.id)
      .eq('enabled', true);

    if (!feeds || feeds.length === 0) {
      return res.status(400).json({ error: '你还没有订阅任何 RSS 源' });
    }

    // 并发采集所有源
    const results = await Promise.allSettled(
      feeds.map(f => collectFeed(f.name, f.url))
    );

    const allItems: FeedItem[] = [];
    const feedResults: { name: string; count: number }[] = [];

    results.forEach((r, i) => {
      if (r.status === 'fulfilled' && r.value.length > 0) {
        allItems.push(...r.value);
        feedResults.push({ name: feeds[i].name, count: r.value.length });
      }
    });

    if (allItems.length === 0) {
      return res.status(404).json({ error: '未采集到任何内容，请稍后再试' });
    }

    // 构建消息
    const date = new Date().toISOString().split('T')[0];
    const totalCount = allItems.length;

    let tgMsg = `📡 <b>Info Radar 推送</b>\n📅 ${date}\n\n`;
    tgMsg += `📊 共 <b>${totalCount}</b> 条来自 ${feedResults.length} 个源\n\n`;

    let wecomMsg = `📡 **Info Radar 推送**\n📅 ${date}\n\n`;
    wecomMsg += `📊 共 **${totalCount}** 条来自 ${feedResults.length} 个源\n\n`;

    const pushedItems: FeedItem[] = [];
    // 按源分组输出
    for (const fr of feedResults) {
      const items = allItems.filter(item => item.source === fr.name);
      const displayItems = items.slice(0, 5);
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

    tgMsg += '✅ by Info Radar';
    wecomMsg += '✅ by Info Radar';

    // 发送
    const sent: string[] = [];

    if (hasWeCom && (!channel || channel === 'wecom') && profile.webhook_key) {
      const url = profile.webhook_key.includes('key=')
        ? profile.webhook_key
        : `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=${profile.webhook_key}`;
      await sendWeComMessage(url, wecomMsg);
      sent.push('WeCom');
    }

    if (hasTelegram && (!channel || channel === 'telegram') && profile.telegram_bot_token && profile.telegram_chat_id) {
      await sendTelegramMessage(profile.telegram_bot_token, profile.telegram_chat_id, tgMsg);
      sent.push('Telegram');
    }

    if (sent.length === 0) return res.status(400).json({ error: 'No channels configured' });

    await supabaseAdmin.from('push_history').insert({
      user_id: user.id, items_count: pushedItems.length, domains: feedResults.map(f => f.name), success: true, items: pushedItems,
    });

    return res.status(200).json({ success: true, itemsCount: totalCount, sources: feedResults, channels: sent });
  } catch (error) {
    console.error('Push error:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
