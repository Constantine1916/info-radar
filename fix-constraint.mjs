import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tlrhwwyctiyxcvezdpms.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRscmh3d3ljdGl5eGN2ZXpkcG1zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk0OTUxMiwiZXhwIjoyMDg1NTI1NTEyfQ.FErRw8O7ksEI2_TQ32bsp10-Iy7swO-n5JXDvAfQSCs'
);

async function fixConstraint() {
  // 删除旧约束
  console.log('Dropping old constraint...');
  const { error: dropError } = await supabase.rpc('alter_drop_constraint', {
    sql: 'ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_domain_check'
  });
  console.log('Drop error:', dropError);
  
  // 创建新约束（包含所有 domain）
  const newConstraint = `
    ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_domain_check 
    CHECK (domain IN (
      'AI', 'FullStack', 'ChinaPolicy', 'WorldPolitics', 
      'Investment', 'Crypto', 'Product', 'Design', 
      'Productivity', 'Hot', 'Entertainment'
    ))
  `;
  
  console.log('\nCreating new constraint...');
  const { error: createError } = await supabase.rpc('exec_sql', { sql: newConstraint });
  console.log('Create error:', createError);
}

fixConstraint().catch(console.error);
