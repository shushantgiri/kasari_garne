"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL, hasSupabase } from "./env";

let client: ReturnType<typeof createBrowserClient> | null = null;

/** Browser client for admin sign-in and media uploads (RLS limits writes to admins). */
export function supabaseBrowser() {
  if (!hasSupabase) return null;
  client ??= createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return client;
}
