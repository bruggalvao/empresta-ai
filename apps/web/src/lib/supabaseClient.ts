import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Created on first use, so pages that do not need Supabase (the landing)
// still render when the variables are missing. Only the anon key belongs
// here (rules/secrets.md).
let client: SupabaseClient | undefined;

export function getSupabase(): SupabaseClient {
  if (client) return client;
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
  }
  client = createClient(supabaseUrl, supabaseAnonKey);
  return client;
}
