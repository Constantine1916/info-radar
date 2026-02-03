import { createClient } from '@supabase/supabase-js';
import './env-check';

// Client-side Supabase configuration - these are injected at build time by Vercel
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Runtime Supabase config check:');
console.log('  supabaseUrl:', supabaseUrl ? 'Set' : 'MISSING');
console.log('  supabaseAnonKey:', supabaseAnonKey ? 'Set' : 'MISSING');

if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = `Missing Supabase environment variables! URL: ${supabaseUrl ? 'OK' : 'MISSING'}, Key: ${supabaseAnonKey ? 'OK' : 'MISSING'}`;
  console.error('❌', errorMsg);
  throw new Error(errorMsg);
}

// Client-side Supabase client (ONLY use this in pages/components)
// For API routes, import from './supabase-admin' instead
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
