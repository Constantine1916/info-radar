import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tlrhwwyctiyxcvezdpms.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRscmh3d3ljdGl5eGN2ZXpkcG1zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk0OTUxMiwiZXhwIjoyMDg1NTI1NTEyfQ.FErRw8O7ksEI2_TQ32bsp10-Iy7swO-n5JXDvAfQSCs'
);

async function checkTable() {
  // 尝试直接插入一条 Hot 数据测试
  console.log('🧪 测试插入 Hot 数据...');
  
  const testItem = {
    item_id: 'test-hot-123',
    title: '测试知乎热榜',
    link: 'https://test.zhihu.com/test',
    content: '测试内容',
    source: '知乎热榜',
    domain: 'Hot',
    published_at: new Date().toISOString(),
    collected_at: new Date().toISOString(),
    credibility_score: 3,
  };
  
  const { data, error } = await supabase
    .from('info_items')
    .insert(testItem)
    .select()
    .single();
  
  if (error) {
    console.log('❌ 插入失败:', error.message);
    console.log('Details:', JSON.stringify(error, null, 2));
  } else {
    console.log('✅ 插入成功:', data.id);
    // 删除测试数据
    await supabase.from('info_items').delete().eq('id', data.id);
  }
}

checkTable().catch(console.error);
