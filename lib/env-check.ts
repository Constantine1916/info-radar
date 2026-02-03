// Build-time environment variable validation
const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('=== Build-time Environment Check ===');
console.log('NEXT_PUBLIC_SUPABASE_URL:', NEXT_PUBLIC_SUPABASE_URL ? '✓ Set' : '✗ Missing');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing');

if (!NEXT_PUBLIC_SUPABASE_URL || !NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('❌ Missing required environment variables!');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', NEXT_PUBLIC_SUPABASE_URL);
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export const ENV_CHECK = {
  NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY,
};
