export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/** True when the project is connected to Supabase; otherwise the site runs on seed content. */
export const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
