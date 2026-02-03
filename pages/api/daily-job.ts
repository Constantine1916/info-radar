import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../lib/supabase-admin';
import axios from 'axios';
import { DOMAINS } from '../../lib/types';

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

  const results = {
    collect: { success: false, count: 0, error: null as any },
    push: { success: false, count: 0, error: null as any },
  };

  try {
    console.log('🔄 Starting daily job...');
    
    // Step 1: Collect data
    console.log('📊 Step 1: Collecting data...');
    try {
      const collectResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_SITE_URL}/api/collect`,
        {
          headers: {
            'Authorization': `Bearer ${expectedToken}`,
          },
        }
      );
      
      results.collect.success = collectResponse.data.success;
      results.collect.count = collectResponse.data.filtered || 0;
      console.log(`✅ Collected ${results.collect.count} items`);
    } catch (error: any) {
      results.collect.error = error.message;
      console.error('❌ Collect failed:', error.message);
    }

    // Wait a bit between steps
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 2: Push to users
    console.log('📱 Step 2: Pushing to users...');
    try {
      // Get all verified users with subscriptions AND bot token configured
      const { data: profiles, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .select('id, telegram_chat_id, telegram_bot_token')
        .eq('telegram_verified', true)
        .not('telegram_chat_id', 'is', null)
        .not('telegram_bot_token', 'is', null);

      if (profileError || !profiles) {
        throw new Error('Failed to fetch users');
      }

      let successCount = 0;
      let skippedCount = 0;

      for (const profile of profiles) {
        if (!profile.telegram_bot_token) {
          skippedCount++;
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

          const { data: items } = await supabaseAdmin
            .from('info_items')
            .select('*')
            .in('domain', domains)
            .gte('collected_at', today.toISOString())
            .order('credibility_score', { ascending: false })
            .limit(20);

          if (!items || items.length === 0) {
            skippedCount++;
            continue;
          }

          // Generate digest
          let message = `📡 *Info Radar 每日摘要*\n`;
          message += `📅 ${new Date().toISOString().split('T')[0]}\n\n`;
          message += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
          message += `📊 今日为你精选 *${items.length}* 条信息\n\n`;

          // Group by domain
          type InfoItemType = typeof items[0];
          const grouped = items.reduce((acc, item) => {
            if (!acc[item.domain]) acc[item.domain] = [];
            acc[item.domain].push(item);
            return acc;
          }, {} as Record<string, InfoItemType[]>);

          (Object.entries(grouped) as [string, InfoItemType[]][]).forEach(([domain, domainItems]) => {
            const domainInfo = DOMAINS[domain as keyof typeof DOMAINS];
            message += `${domainInfo.emoji} *${domainInfo.name}* (${domainItems.length})\n`;
            message += `${'─'.repeat(30)}\n\n`;

            domainItems.slice(0, 5).forEach((item, i) => {
              message += `${i + 1}. ${item.title.substring(0, 80)}...\n`;
              message += `   🔗 ${item.link}\n`;
              message += `   📍 ${item.source} | ⭐ ${item.credibility_score}/5\n\n`;
            });

            if (domainItems.length > 5) {
              message += `   _...还有 ${domainItems.length - 5} 条_\n\n`;
            }
          });

          message += `━━━━━━━━━━━━━━━━━━━━━━━━\n`;
          message += `✅ 自动推送 | 💡 by Info Radar`;

          // Send to Telegram
          await sendTelegramMessage(profile.telegram_bot_token, profile.telegram_chat_id!, message);

          // Record push history
          await supabaseAdmin.from('push_history').insert({
            user_id: profile.id,
            items_count: items.length,
            domains,
            success: true,
          });

          successCount++;
          console.log(`✅ Pushed to user ${profile.id}`);
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

      results.push.success = true;
      results.push.count = successCount;
      console.log(`✅ Push completed: ${successCount}/${profiles.length} users (${skippedCount} skipped)`);
    } catch (error: any) {
      results.push.error = error.message;
      console.error('❌ Push failed:', error.message);
    }

    console.log('✅ Daily job completed');

    return res.status(200).json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Daily job error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      results,
    });
  }
}
