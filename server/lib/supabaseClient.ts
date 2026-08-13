import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl) {
  console.warn('[supabase] SUPABASE_URL not set — database features will be unavailable');
}

// Admin client with service role key — bypasses RLS, for server-side operations only
export const supabaseAdmin: SupabaseClient | null = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

// Anon client — respects RLS, for operations that should be subject to row-level policies
export const supabaseAnon: SupabaseClient | null = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

export function getAdminClient(): SupabaseClient {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not configured — check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }
  return supabaseAdmin;
}

export function getAnonClient(): SupabaseClient {
  if (!supabaseAnon) {
    throw new Error('Supabase anon client not configured — check SUPABASE_URL and SUPABASE_ANON_KEY');
  }
  return supabaseAnon;
}

export function isSupabaseConfigured(): boolean {
  return supabaseAdmin !== null;
}
