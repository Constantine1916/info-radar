import Parser from 'rss-parser';
import { createHash } from 'crypto';
import { createClient } from '@supabase/supabase-js';

const parser = new Parser({ timeout: 15000 });
const supabase = createClient(
  'https://tlrhwwyctiyxcvezdpms.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRscmh3d3ljdGl5eGN2ZXpkcG1zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk0OTUxMiwiZXhwIjoyMDg1NTI1NTEyfQ.FErRw8O7ksEI2_TQ32bsp10-Iy7swO-n5JXDvAfQSCs'
);

const RSSHUB_BASE = 'https://rsshub.umzzz.com';

async function debugCollect() {
  console.log('🔍 调试采集流程...\n');
  
  // 1. 单独测试 RSSHub
  console.log('📡 测试知乎热榜 RSS...');
  try {
    const feed = await parser.parseURL(`${RSSHUB_BASE}/zhihu/hot`);
    console.log(`  ✅ 获取到 ${feed.items.length} 条数据`);
    console.log(`  前3条:`);
    feed.items.slice(0, 3).forEach((item, i) => {
      console.log(`    ${i+1}. ${item.title?.substring(0, 40)}...`);
    });
    
    // 2. 检查是否已有这些数据
    const itemIds = feed.items.slice(0, 5).map(item => {
      const link = item.link || item.guid || '';
      return createHash('md5').update(link).digest('hex').substring(0, 16);
    });
    
    console.log('\n🔍 检查这5条是否已在数据库...');
    const { data: existing } = await supabase
      .from('info_items')
      .select('item_id')
      .in('item_id', itemIds);
    
    console.log(`  数据库已有: ${existing?.length || 0} 条`);
    
    // 3. 尝试插入一条测试数据
    const testItem = {
      item_id: itemIds[0],
      title: feed.items[0].title || 'Test',
      link: feed.items[0].link || 'https://test.com',
      content: feed.items[0].contentSnippet || '',
      source: '知乎热榜',
      domain: 'Hot',
      published_at: feed.items[0].pubDate || new Date().toISOString(),
      collected_at: new Date().toISOString(),
      credibility_score: 3,
    };
    
    console.log('\n🧪 插入测试数据...');
    const { data: inserted, error: insertError } = await supabase
      .from('info_items')
      .insert(testItem)
      .select()
      .single();
    
    if (insertError) {
      console.log('  ❌ 插入失败:', insertError.message);
    } else {
      console.log('  ✅ 插入成功:', inserted.id);
    }
    
  } catch (error) {
    console.log('  ❌ 错误:', error.message);
  }
}

debugCollect().catch(console.error);
