const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tlrhwwyctiyxcvezdpms.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRscmh3d3ljdGl5eGN2ZXpkcG1zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk0OTUxMiwiZXhwIjoyMDg1NTI1NTEyfQ.FErRw8O7ksEI2_TQ32bsp10-Iy7swO-n5JXDvAfQSCs';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function addColumn() {
  console.log('Adding telegram_bot_token column...');
  
  const sql = `
    ALTER TABLE public.user_profiles 
    ADD COLUMN IF NOT EXISTS telegram_bot_token TEXT;
  `;
  
  const { data, error } = await supabase.rpc('exec_sql', { query: sql });
  
  if (error) {
    console.error('Error:', error);
    console.log('\nTrying alternative method...');
    
    // Alternative: use PostgREST schema cache refresh
    // This won't work for DDL, we need direct SQL access
    console.error('Cannot execute SQL via RPC. Please run manually in Supabase SQL Editor:');
    console.log('\nALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS telegram_bot_token TEXT;');
    return;
  }
  
  console.log('✅ Column added successfully');
}

addColumn().catch(console.error);
