import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tlrhwwyctiyxcvezdpms.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRscmh3d3ljdGl5eGN2ZXpkcG1zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk0OTUxMiwiZXhwIjoyMDg1NTI1NTEyfQ.FErRw8O7ksEI2_TQ32bsp10-Iy7swO-n5JXDvAfQSCs'
);

async function testFlow() {
  console.log('📊 检查数据库状态...\n');
  
  // 1. 查看各 domain 数据量
  const { data: items } = await supabase
    .from('info_items')
    .select('domain, source, title')
    .limit(2000);
  
  const counts = {};
  const sources = {};
  
  items?.forEach(item => {
    counts[item.domain] = (counts[item.domain] || 0) + 1;
    if (!sources[item.domain]) sources[item.domain] = new Set();
    sources[item.domain].add(item.source);
  });
  
  console.log('各 Domain 数据量:');
  Object.entries(counts).forEach(([domain, count]) => {
    console.log(`  ${domain}: ${count} 条`);
  });
  
  console.log('\n各 Domain 数据来源:');
  Object.entries(sources).forEach(([domain, srcSet]) => {
    console.log(`  ${domain}: ${Array.from(srcSet).join(', ')}`);
  });
  
  // 2. 查看 Hot 和 Entertainment 的最新数据
  console.log('\n📰 Hot 领域最新数据:');
  const { data: hotItems } = await supabase
    .from('info_items')
    .select('title, source, published_at')
    .eq('domain', 'Hot')
    .order('published_at', { ascending: false })
    .limit(5);
  
  hotItems?.forEach(item => {
    console.log(`  - [${item.source}] ${item.title?.substring(0, 50)}...`);
  });
  
  console.log('\n🎬 Entertainment 领域最新数据:');
  const { data: entItems } = await supabase
    .from('info_items')
    .select('title, source, published_at')
    .eq('domain', 'Entertainment')
    .order('published_at', { ascending: false })
    .limit(5);
  
  entItems?.forEach(item => {
    console.log(`  - [${item.source}] ${item.title?.substring(0, 50)}...`);
  });
}

testFlow().catch(console.error);
