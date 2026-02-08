import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tlrhwwyctiyxcvezdpms.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRscmh3d3ljdGl5eGN2ZXpkcG1zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk0OTUxMiwiZXhwIjoyMDg1NTI1NTEyfQ.FErRw8O7ksEI2_TQ32bsp10-Iy7swO-n5JXDvAfQSCs'
);

async function query() {
  // 获取所有数据
  const { data, error } = await supabase
    .from('info_items')
    .select('domain')
    .limit(1000);
  
  if (error) {
    console.log('Error:', error.message);
    return;
  }
  
  // 统计
  const counts = {};
  data?.forEach(item => {
    counts[item.domain] = (counts[item.domain] || 0) + 1;
  });
  
  console.log('Database domain counts:');
  Object.entries(counts).forEach(([domain, count]) => {
    console.log(`  ${domain}: ${count}`);
  });
  
  // 检查是否有 Hot 和 Entertainment
  console.log('\nHas Hot:', counts['Hot'] || 0);
  console.log('Has Entertainment:', counts['Entertainment'] || 0);
}

query().catch(console.error);
