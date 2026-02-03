const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tlrhwwyctiyxcvezdpms.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRscmh3d3ljdGl5eGN2ZXpkcG1zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTk0OTUxMiwiZXhwIjoyMDg1NTI1NTEyfQ.FErRw8O7ksEI2_TQ32bsp10-Iy7swO-n5JXDvAfQSCs';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function fixProfiles() {
  console.log('Checking for users without profiles...');
  
  // Get all auth users
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
  
  if (usersError) {
    console.error('Error fetching users:', usersError);
    return;
  }
  
  console.log(`Found ${users.length} users`);
  
  for (const user of users) {
    console.log(`\nChecking user: ${user.email} (${user.id})`);
    
    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError && profileError.code === 'PGRST116') {
      // Profile doesn't exist, create it
      console.log('  → Profile missing, creating...');
      
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      
      if (insertError) {
        console.error('  ✗ Error creating profile:', insertError.message);
      } else {
        console.log('  ✓ Profile created successfully');
      }
    } else if (profileError) {
      console.error('  ✗ Error checking profile:', profileError.message);
    } else {
      console.log('  ✓ Profile already exists');
    }
  }
  
  console.log('\n✅ Done!');
}

fixProfiles().catch(console.error);
