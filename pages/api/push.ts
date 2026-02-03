import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../lib/supabase-admin';
import axios from 'axios';
import { DOMAINS, DOMAIN_CONFIG } from '../../lib/types';

async function sendTelegramMessage(botToken: string, chatId: string, text: string) {
  await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    chat_id: chatId,
    text,
    parse_mode: 'Markdown',
    disable_web_page_preview: true,
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verify cron secret
  const authToken = req.headers['authorization'];
  const expectedToken = process.env.CRON_SECRET;
  
  if (authToken !== `Bearer ${expectedToken}`) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    console.log('📱 Starting push to users...');

    // Get all verified users with subscriptions AND bot token configured
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, telegram_chat_id, telegram_bot_token')
      .eq('telegram_verified', true)
      .not('telegram_chat_id', 'is', null)
      .not('telegram_bot_token', 'is', null);

    if (profileError || !profiles) {
      return res.status(500).json({ success: false, error: 'Failed to fetch users' });
    }

    let successCount = 0;
    let skippedCount = 0;

    for (const profile of profiles) {
      // Skip if bot token is not configured
      if (!profile.telegram_bot_token) {
        skippedCount++;
        console.log(`⏭️  Skipped user ${profile.id}: no bot token configured`);
        continue;
      }

      try {
        // Get user's subscriptions
        const { data: subs } = await supabaseAdmin
          .from('subscriptions')
          .select('domain')
          .eq('user_id', profile.id)
          .eq('enabled', true);

        if (!subs || subs.length === 0) {
          skippedCount++;
          continue;
        }

        const domains = subs.map(s => s.domain);

        // Get today's items for subscribed domains
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Fetch more items to allow for filtering by credibility
        const { data: allItems } = await supabaseAdmin
          .from('info_items')
          .select('*')
          .in('domain', domains)
          .gte('collected_at', today.toISOString())
          .order('credibility_score', { ascending: false })
          .limit(100); // Fetch more to filter

        if (!allItems || allItems.length === 0) {
          skippedCount++;
          continue;
        }

        // Filter and limit items per domain
        const filteredItems: typeof allItems = [];
        const domainItemCount: Record<string, number> = {};

        for (const item of allItems) {
          const config = DOMAIN_CONFIG[item.domain as keyof typeof DOMAIN_CONFIG];
          const currentCount = domainItemCount[item.domain] || 0;
          
          // Check if within limit and meets minimum credibility
          if (config && currentCount < config.maxItems && item.credibility_score >= config.minCredibility) {
            filteredItems.push(item);
            domainItemCount[item.domain] = currentCount + 1;
          }
        }

        if (filteredItems.length === 0) {
          skippedCount++;
          continue;
        }

        // Generate digest
        let message = `📡 *Info Radar 每日摘要*\n`;
        message += `📅 ${new Date().toISOString().split('T')[0]}\n\n`;
        message += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        message += `📊 今日为你精选 *${filteredItems.length}* 条信息\n\n`;

        // Group by domain
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

          domainItems.slice(0, 3).forEach((item, i) => { // Max 3 per domain
            message += `${i + 1}. ${item.title.substring(0, 80)}...\n`;
            message += `   🔗 ${item.link}\n`;
            message += `   📍 ${item.source} | ⭐ ${item.credibility_score}/5\n\n`;
          });
        });

        message += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        message += `✅ 自动推送 | 💡 by Info Radar`;

        // Send to Telegram using user's own bot token
        await sendTelegramMessage(profile.telegram_bot_token, profile.telegram_chat_id!, message);

        // Record push history
        await supabaseAdmin.from('push_history').insert({
          user_id: profile.id,
          items_count: filteredItems.length,
          domains,
          success: true,
        });

        successCount++;
        console.log(`✅ Pushed to user ${profile.id}: ${filteredItems.length} items`);
      } catch (error) {
        console.error(`❌ Failed to push to user ${profile.id}:`, error);
        await supabaseAdmin.from('push_history').insert({
          user_id: profile.id,
          items_count: 0,
          domains: [],
          success: false,
        });
      }
    }

    console.log(`✅ Push completed: ${successCount}/${profiles.length} users (${skippedCount} skipped)`);

    return res.status(200).json({
      success: true,
      totalUsers: profiles.length,
      successCount,
      skippedCount,
    });
  } catch (error) {
    console.error('❌ Push error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
