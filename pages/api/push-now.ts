import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { DOMAINS, DOMAIN_CONFIG } from '../../lib/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

interface ProfileData {
  telegram_bot_token: string | null;
  telegram_chat_id: string | null;
  telegram_verified: boolean | null;
  webhook_key: string | null;
  webhook_enabled: boolean | null;
}

async function sendTelegramMessage(botToken: string, chatId: string, text: string) {
  await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    chat_id: chatId,
    text,
    parse_mode: 'Markdown',
    disable_web_page_preview: true,
  });
}

async function sendWeComMessage(webhookUrl: string, text: string) {
  await axios.post(webhookUrl, {
    msgtype: 'markdown',
    markdown: { content: text },
  }, { headers: { 'Content-Type': 'application/json' } });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);

  if (userError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const channel = typeof req.query.channel === 'string' ? req.query.channel : null;

  try {
    // 获取用户配置
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('telegram_bot_token, telegram_chat_id, telegram_verified, webhook_key, webhook_enabled')
      .eq('id', user.id)
      .single<ProfileData>();

    if (profileError || !profile) {
      return res.status(400).json({ error: 'Profile not found' });
    }

    const hasTelegram = profile.telegram_verified && profile.telegram_bot_token && profile.telegram_chat_id;
    const hasWeCom = profile.webhook_enabled && profile.webhook_key;

    // 获取订阅
    const { data: subs } = await supabaseAdmin
      .from('subscriptions')
      .select('domain')
      .eq('user_id', user.id)
      .eq('enabled', true);

    if (!subs || subs.length === 0) {
      return res.status(400).json({ error: 'No active subscriptions' });
    }

    const domains = subs.map(s => s.domain);

    // 从数据库获取数据（最近24小时）
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);

    const { data: allItems } = await supabaseAdmin
      .from('info_items')
      .select('*')
      .in('domain', domains)
      .gte('collected_at', yesterday.toISOString())
      .order('credibility_score', { ascending: false })
      .limit(100);

    if (!allItems || allItems.length === 0) {
      return res.status(404).json({ error: 'No items found. Try again later.' });
    }

    // 过滤
    const filteredItems: typeof allItems = [];
    const domainItemCount: Record<string, number> = {};

    for (const item of allItems) {
      const config = DOMAIN_CONFIG[item.domain as keyof typeof DOMAIN_CONFIG];
      const currentCount = domainItemCount[item.domain] || 0;
      if (config && currentCount < config.maxItems && item.credibility_score >= config.minCredibility) {
        filteredItems.push(item);
        domainItemCount[item.domain] = currentCount + 1;
      }
    }

    if (filteredItems.length === 0) {
      return res.status(404).json({ error: 'No items meet quality criteria' });
    }

    // 生成消息
    let message = `📡 *Info Radar 推送*\n📅 ${new Date().toISOString().split('T')[0]}\n\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `📊 为你精选 *${filteredItems.length}* 条最新信息\n\n`;

    type InfoItemType = typeof filteredItems[0];
    const grouped = filteredItems.reduce((acc, item) => {
      if (!acc[item.domain]) acc[item.domain] = [];
      acc[item.domain].push(item);
      return acc;
    }, {} as Record<string, InfoItemType[]>);

    (Object.entries(grouped) as [string, InfoItemType[]][]).forEach(([domain, domainItems]) => {
      const domainInfo = DOMAINS[domain as keyof typeof DOMAINS];
      message += `${domainInfo.emoji} *${domainInfo.name}* (${domainItems.length})\n`;
      message += `${'─'.repeat(30)}\n\n`;
      domainItems.slice(0, 3).forEach((item, i) => {
        message += `${i + 1}. ${item.title.substring(0, 80)}...\n`;
        message += `   🔗 ${item.link}\n`;
        message += `   📍 ${item.source} | ⭐ ${item.credibility_score}/5\n\n`;
      });
    });

    message += `━━━━━━━━━━━━━━━━━━━━━━━━\n✅ by Info Radar`;

    // 发送
    const results: string[] = [];
    const shouldSendWeCom = !channel || channel === 'wecom';
    const shouldSendTelegram = !channel || channel === 'telegram';

    if (hasWeCom && shouldSendWeCom && profile.webhook_key) {
      const webhookUrl = profile.webhook_key.includes('key=') 
        ? profile.webhook_key 
        : `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=${profile.webhook_key}`;
      await sendWeComMessage(webhookUrl, message);
      results.push('WeCom');
    }

    if (hasTelegram && shouldSendTelegram && profile.telegram_bot_token && profile.telegram_chat_id) {
      await sendTelegramMessage(profile.telegram_bot_token, profile.telegram_chat_id, message);
      results.push('Telegram');
    }

    if (results.length === 0) {
      return res.status(400).json({ error: 'No channels configured' });
    }

    await supabaseAdmin.from('push_history').insert({
      user_id: user.id,
      items_count: filteredItems.length,
      domains,
      success: true,
    });

    return res.status(200).json({
      success: true,
      itemsCount: filteredItems.length,
      channels: results,
    });
  } catch (error) {
    console.error('Push error:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
