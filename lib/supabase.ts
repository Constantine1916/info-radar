import { createClient } from '@supabase/supabase-js';
import './env-check';

// Client-side Supabase configuration - these are injected at build time by Vercel
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Only create client if environment variables are available
let supabaseClient = null;

if (supabaseUrl && supabaseAnonKey) {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn('⚠️ Supabase environment variables missing - some features may not work');
}

// Client-side Supabase client (ONLY use this in pages/components)
// For API routes, import from './supabase-admin' instead
export const supabase = supabaseClient;
