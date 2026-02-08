import Parser from 'rss-parser';
import { createHash } from 'crypto';
import { createClient } from '@supabase/supabase-js';

const parser = new Parser({ timeout: 30000 });
const supabase = createClient(
  'https://tlrhwwyctiyxcvezdpms.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRscmh3d3ljdGl5eGN2ZXpkcG1zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk0OTUxMiwiZXhwIjoyMDg1NTI1NTEyfQ.FErRw8O7ksEI2_TQ32bsp10-Iy7swO-n5JXDvAfQSCs'
);

const RSSHUB_BASE = 'https://rsshub.umzzz.com';

function generateId(link) {
  return createHash('md5').update(link).digest('hex').substring(0, 16);
}

async function collectAndInsert(name, url, domain, credibility) {
  console.log(`📡 采集 ${name}...`);
  try {
    const feed = await parser.parseURL(url);
    console.log(`  获取到 ${feed.items.length} 条`);
    
    let inserted = 0;
    for (const item of feed.items.slice(0, 50)) {
      const link = item.link || item.guid || '';
      if (!link) continue;
      
      const itemData = {
        item_id: generateId(link),
        title: item.title || 'Untitled',
        link,
        content: item.contentSnippet || item.content || '',
        source: name,
        domain,
        published_at: item.pubDate || new Date().toISOString(),
        collected_at: new Date().toISOString(),
        credibility_score: credibility,
      };
      
      const { error } = await supabase
        .from('info_items')
        .upsert(itemData, { onConflict: 'item_id', ignoreDuplicates: true });
      
      if (!error) inserted++;
    }
    
    console.log(`  ✅ 插入 ${inserted} 条新数据\n`);
    return inserted;
  } catch (error) {
    console.log(`  ❌ 失败: ${error.message}\n`);
    return 0;
  }
}

async function main() {
  console.log('🚀 手动采集 Hot 和 Entertainment 数据\n');
  console.log('='.repeat(50));
  
  let total = 0;
  
  // 知乎热榜
  total += await collectAndInsert(
    '知乎热榜',
    `${RSSHUB_BASE}/zhihu/hot`,
    'Hot',
    3
  );
  
  // B站番剧排行
  total += await collectAndInsert(
    'B站番剧排行',
    `${RSSHUB_BASE}/bilibili/ranking/1/3`,
    'Entertainment',
    3
  );
  
  // B站综合排行
  total += await collectAndInsert(
    'B站综合排行',
    `${RSSHUB_BASE}/bilibili/ranking/1/1`,
    'Entertainment',
    3
  );
  
  console.log('='.repeat(50));
  console.log(`\n🎉 共采集 ${total} 条新数据`);
}

main().catch(console.error);
