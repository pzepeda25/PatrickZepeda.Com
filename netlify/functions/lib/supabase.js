import { createClient } from '@supabase/supabase-js';

let cached;

/**
 * Returns a Supabase client authenticated with the SERVICE ROLE key.
 * Service role bypasses RLS — only ever import this from server-side code
 * (Netlify Functions). Never bundle into the browser.
 */
export function getSupabaseAdmin() {
  if (cached) return cached;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars',
    );
  }

  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
