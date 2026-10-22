import "server-only";
import { supabaseServer } from "../supabase/server";
import { getGuidesForAdmin, seedGuides } from "../content/repo";
import { guideCounts, type AttentionCounts } from "./attention";

/**
 * Real counts for the sidebar badges. Returns null when nobody is signed in as an admin
 * (e.g. on the login page), so it never redirects and never leaks numbers.
 * Row-level security limits every query to what this admin may read.
 */
export async function getAttentionCounts(): Promise<AttentionCounts | null> {
  const db = await supabaseServer();
  if (!db) return { ...guideCounts(seedGuides), reports: null, requests: null };

  const { data: u } = await db.auth.getUser();
  if (!u.user) return null;
  const { data: admin } = await db.from("admins").select("role").eq("user_id", u.user.id).maybeSingle();
  if (!admin) return null;

  const [{ guides }, reports, requests] = await Promise.all([
    getGuidesForAdmin(),
    db.from("reports").select("id", { count: "exact", head: true }).eq("state", "new"),
    db.from("guide_requests").select("id", { count: "exact", head: true }).eq("state", "new"),
  ]);
  return {
    ...guideCounts(guides),
    reports: reports.error ? null : reports.count ?? 0,
    requests: requests.error ? null : requests.count ?? 0,
  };
}
