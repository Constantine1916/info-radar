#!/usr/bin/env node
import 'dotenv/config';
import { RSSCollector } from './collectors/rss-collector';
import { InfoFilter } from './processors/filter';
import { DigestGenerator } from './processors/digest';
import { TelegramNotifier } from './notifications/telegram';
import { WeComNotifier } from './notifications/wecom';
import { RSS_SOURCES } from './config/sources';

async function main() {
  console.log('🚀 Info Radar starting...\n');
  console.log('=' .repeat(60));
  
  // 步骤1: 采集信息
  const collector = new RSSCollector();
  const rawItems = await collector.collectAll(RSS_SOURCES);
  
  console.log('=' .repeat(60));
  
  // 步骤2: 过滤信息
  const filter = new InfoFilter();
  const filteredItems = filter.filter(rawItems);
  
  // 步骤3: 按领域分组
  const grouped = filter.groupByDomain(filteredItems);
  
  console.log('\n📋 Summary by Domain:');
  console.log('=' .repeat(60));
  
  grouped.forEach((items, domain) => {
    console.log(`\n🎯 ${domain} (${items.length} items):\n`);
    items.slice(0, 3).forEach((item, i) => {
      console.log(`  ${i + 1}. ${item.title.substring(0, 60)}...`);
      console.log(`     📍 ${item.source} | ⭐ ${item.credibilityScore}/5\n`);
    });
    
    if (items.length > 3) {
      console.log(`     ... and ${items.length - 3} more\n`);
    }
  });
  
  console.log('=' .repeat(60));
  console.log(`\n✅ Info Radar completed!`);
  console.log(`📊 Total: ${filteredItems.length} high-quality items collected\n`);
  
  // 步骤4: 生成摘要
  console.log('📝 Generating digest...');
  const digestGen = new DigestGenerator();
  const digest = digestGen.generate(grouped);
  
  // 步骤5: 推送到企业微信（如果配置了）
  const wecomKey = process.env.WEBHOOK_KEY;
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  
  if (wecomKey) {
    console.log('📱 Sending to WeCom...\n');
    const wecom = new WeComNotifier();
    await wecom.sendLong(digest);
  } else if (telegramToken) {
    console.log('📱 Sending to Telegram...\n');
    const telegram = new TelegramNotifier();
    await telegram.sendLong(digest);
  } else {
    console.log('📱 [NO NOTIFICATION CONFIGURED]');
    console.log('Add WEBHOOK_KEY or TELEGRAM credentials to .env\n');
    console.log(digest);
  }
  
  console.log('\n🎉 All done!');
}

main().catch(console.error);
