const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tlrhwwyctiyxcvezdpms.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRscmh3d3ljdGl5eGN2ZXpkcG1zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk0OTUxMiwiZXhwIjoyMDg1NTI1NTEyfQ.FErRw8O7ksEI2_TQ32bsp10-Iy7swO-n5JXDvAfQSCs';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function runMigration() {
  console.log('Running migration...');
  
  // Supabase JS client doesn't support raw SQL execution
  // We need to use the SQL editor in Dashboard or create a stored procedure
  
  console.log('❌ Cannot run raw SQL via Supabase JS client.');
  console.log('Please run the migration manually in Supabase Dashboard:');
  console.log('');
  console.log('ALTER TABLE public.user_profiles');
  console.log('ADD COLUMN IF NOT EXISTS telegram_bot_token TEXT;');
}

runMigration();
