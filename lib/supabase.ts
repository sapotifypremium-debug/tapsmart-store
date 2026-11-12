import { createClient, SupabaseClient } from "@supabase/supabase-js";
// SERVER ONLY. Never import this file from a "use client" component.
let cached: SupabaseClient | null = null;
export function db(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  cached ??= createClient(url, key, { auth: { persistSession: false } });
  return cached;
}
