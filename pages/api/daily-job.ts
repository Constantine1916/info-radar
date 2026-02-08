import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '../../lib/supabase-admin';
import axios from 'axios';
import { DOMAINS } from '../../lib/types';

interface ProfileData {
  id: string;
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
    push: { success: false, channels: { telegram: 0, wecom: 0 }, error: null as any },
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
      // Get all verified users with subscriptions
      const { data: profiles, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .select('id, telegram_bot_token, telegram_chat_id, telegram_verified, webhook_key, webhook_enabled')
        .eq('telegram_verified', true)
        .or(`webhook_enabled.eq.true, webhook_key.not.is.null`);

      if (profileError || !profiles) {
        throw new Error('Failed to fetch users');
      }

      let telegramSuccess = 0;
      let wecomSuccess = 0;
      let skippedCount = 0;

      for (const profile of profiles) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

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

        // Build messages
        const dateStr = new Date().toISOString().split('T')[0];
        const totalCount = items.length;

        // Telegram message (Markdown)
        let tgMessage = `📡 <b>Info Radar 每日摘要</b>\n📅 ${dateStr}\n\n`;
        tgMessage += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        tgMessage += `📊 今日为你精选 <b>${totalCount}</b> 条信息\n\n`;

        // WeCom message (Markdown with links)
        let wecomMessage = `📡 **Info Radar 每日摘要**\n📅 ${dateStr}\n\n`;
        wecomMessage += `━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        wecomMessage += `📊 今日为你精选 **${totalCount}** 条信息\n\n`;

        // Group by domain
        type InfoItemType = typeof items[0];
        const grouped = items.reduce((acc, item) => {
          if (!acc[item.domain]) acc[item.domain] = [];
          acc[item.domain].push(item);
          return acc;
        }, {} as Record<string, InfoItemType[]>);

        for (const domain of domains) {
          const domainItems = grouped[domain];
          if (!domainItems || domainItems.length === 0) continue;

          const domainInfo = DOMAINS[domain as keyof typeof DOMAINS];
          
          tgMessage += `${domainInfo.emoji} <b>${domainInfo.name}</b> (${domainItems.length})\n`;
          tgMessage += `${'─'.repeat(30)}\n\n`;
          
          wecomMessage += `${domainInfo.emoji} **${domainInfo.name}** (${domainItems.length})\n`;
          wecomMessage += `${'─'.repeat(30)}\n\n`;

          domainItems.slice(0, 5).forEach((item, i) => {
            const title = item.title.substring(0, 80) + (item.title.length > 80 ? '...' : '');
            
            // Telegram: HTML link
            tgMessage += `${i + 1}. <a href="${item.link}">${title}</a>\n`;
            tgMessage += `   📍 ${item.source} | ⭐ ${item.credibility_score}/5\n\n`;
            
            // WeCom: Markdown link
            wecomMessage += `${i + 1}. [${title}](${item.link})\n`;
            wecomMessage += `   📍 ${item.source} | ⭐ ${item.credibility_score}/5\n\n`;
          });

          if (domainItems.length > 5) {
            tgMessage += `   _...还有 ${domainItems.length - 5} 条_\n\n`;
            wecomMessage += `   _...还有 ${domainItems.length - 5} 条_\n\n`;
          }
        }

        tgMessage += `━━━━━━━━━━━━━━━━━━━━━━━━\n✅ 自动推送 | 💡 by Info Radar`;
        wecomMessage += `━━━━━━━━━━━━━━━━━━━━━━━━\n✅ by Info Radar`;

        // Push to Telegram
        if (profile.telegram_verified && profile.telegram_bot_token && profile.telegram_chat_id) {
          try {
            await sendTelegramMessage(profile.telegram_bot_token, profile.telegram_chat_id, tgMessage);
            telegramSuccess++;
            console.log(`✅ Telegram pushed to user ${profile.id}`);
          } catch (error) {
            console.error(`❌ Telegram failed for user ${profile.id}:`, error);
          }
          // Avoid hitting rate limits
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Push to WeCom
        if (profile.webhook_enabled && profile.webhook_key) {
          try {
            const webhookUrl = profile.webhook_key.includes('key=') 
              ? profile.webhook_key 
              : `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=${profile.webhook_key}`;
            await sendWeComMessage(webhookUrl, wecomMessage);
            wecomSuccess++;
            console.log(`✅ WeCom pushed to user ${profile.id}`);
          } catch (error) {
            console.error(`❌ WeCom failed for user ${profile.id}:`, error);
          }
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Record push history
        await supabaseAdmin.from('push_history').insert({
          user_id: profile.id,
          items_count: items.length,
          domains,
          success: true,
        });
      }

      results.push.success = true;
      results.push.channels = { telegram: telegramSuccess, wecom: wecomSuccess };
      console.log(`✅ Push completed: TG ${telegramSuccess}, WeCom ${wecomSuccess}`);
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
