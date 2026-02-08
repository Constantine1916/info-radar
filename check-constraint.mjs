import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tlrhwwyctiyxcvezdpms.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRscmh3d3ljdGl5eGN2ZXpkcG1zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk0OTUxMiwiZXhwIjoyMDg1NTI1NTEyfQ.FErRw8O7ksEI2_TQ32bsp10-Iy7swO-n5JXDvAfQSCs'
);

async function checkConstraint() {
  // 查看表的检查约束
  const { data, error } = await supabase
    .from('subscriptions')
    .select('domain');
  
  console.log('Current domains in table:');
  console.log(JSON.stringify(data, null, 2));
  
  // 尝试插入一个测试 domain
  const testDomain = 'Hot';
  console.log('\nTesting insert with domain:', testDomain);
  
  const { error: insertError } = await supabase
    .from('subscriptions')
    .insert({
      user_id: 'e9ae3d01-7f5f-4748-82b9-b3d4c4666bd3',
      domain: testDomain,
      enabled: true
    });
  
  console.log('Insert error:', insertError);
}

checkConstraint().catch(console.error);
