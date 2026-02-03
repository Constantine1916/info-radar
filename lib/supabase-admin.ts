import { createClient } from '@supabase/supabase-js';

// Server-side only Supabase clients
// This file should ONLY be imported in API routes (pages/api/*)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

// Client with anon key (for server-side auth checks)
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey || ''
);

// Client with service role key (for admin operations)
export const supabaseAdmin = createClient(
  supabaseUrl,
  serviceRoleKey || ''
);
