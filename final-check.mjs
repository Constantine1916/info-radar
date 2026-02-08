import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tlrhwwyctiyxcvezdpms.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRscmh3d3ljdGl5eGN2ZXpkcG1zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk0OTUxMiwiZXhwIjoyMDg1NTI1NTEyfQ.FErRw8O7ksEI2_TQ32bsp10-Iy7swO-n5JXDvAfQSCs'
);

async function check() {
  // 查看所有 domain 数量
  console.log('📊 数据库各 Domain 数据统计:\n');
  
  const { data: items } = await supabase
    .from('info_items')
    .select('domain')
    .limit(5000);
  
  const counts = {};
  items?.forEach(item => {
    counts[item.domain] = (counts[item.domain] || 0) + 1;
  });
  
  Object.entries(counts).forEach(([domain, count]) => {
    console.log(`  ${domain}: ${count} 条`);
  });
  
  // 查找 Hot 和 Entertainment
  console.log('\n🔍 查找 Hot 数据...');
  const { data: hot } = await supabase
    .from('info_items')
    .select('title, source')
    .eq('domain', 'Hot')
    .limit(5);
  
  console.log(`Hot: ${hot?.length || 0} 条`);
  hot?.forEach(item => {
    console.log(`  - [${item.source}] ${item.title?.substring(0, 40)}...`);
  });
  
  console.log('\n🔍 查找 Entertainment 数据...');
  const { data: ent } = await supabase
    .from('info_items')
    .select('title, source')
    .eq('domain', 'Entertainment')
    .limit(5);
  
  console.log(`Entertainment: ${ent?.length || 0} 条`);
  ent?.forEach(item => {
    console.log(`  - [${item.source}] ${item.title?.substring(0, 40)}...`);
  });
}

check().catch(console.error);
