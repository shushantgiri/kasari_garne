"use server";

import { headers } from "next/headers";
import { supabaseService } from "@/lib/supabase/server";
import { hasSupabase } from "@/lib/supabase/env";
import { looksPersonal } from "@/lib/privacy";

export type ActionResult = { ok: true; demo?: boolean } | { ok: false; error: "invalid" | "personal_data" | "rate_limited" | "server" };

/* ------------------------------------------------------------------
 * Public submissions: correction reports, guide requests, feedback.
 * No accounts, no names, no IPs stored. A honeypot field and a tiny
 * in-memory rate limit keep casual spam out.
 * ------------------------------------------------------------------ */

const recent = new Map<string, number[]>();
async function rateLimited(bucket: string, max = 8, windowMs = 10 * 60_000) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const hits = (recent.get(key) ?? []).filter((t) => now - t < windowMs);
  hits.push(now);
  recent.set(key, hits);
  return hits.length > max;
}

const str = (v: FormDataEntryValue | null, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const LOCALES = new Set(["ne", "en"]);
const SLUG = /^[a-z0-9-]{1,80}$/;

export async function submitReport(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  if (str(form.get("website"), 100)) return { ok: true }; // honeypot
  const guide = str(form.get("guide"), 80);
  const step = str(form.get("step"), 80);
  const message = str(form.get("message"), 2000);
  const sourceUrl = str(form.get("source_url"), 500);
  const locale = LOCALES.has(str(form.get("locale"), 2)) ? str(form.get("locale"), 2) : "ne";
  if (message.length < 5 || (guide && !SLUG.test(guide)) || (sourceUrl && !/^https?:\/\//.test(sourceUrl))) return { ok: false, error: "invalid" };
  if (looksPersonal(message)) return { ok: false, error: "personal_data" };
  if (await rateLimited("report")) return { ok: false, error: "rate_limited" };

  const db = supabaseService();
  if (!db) return { ok: true, demo: !hasSupabase };
  const { error } = await db.from("reports").insert({
    guide_slug: guide || null,
    step_id: step || null,
    message,
    source_url: sourceUrl || null,
    locale,
  });
  if (error) {
    console.error("[report]", error.message);
    return { ok: false, error: "server" };
  }
  return { ok: true };
}

export async function submitRequest(_: ActionResult | null, form: FormData): Promise<ActionResult> {
  if (str(form.get("website"), 100)) return { ok: true };
  const service = str(form.get("service"), 200);
  const details = str(form.get("details"), 2000);
  const locale = LOCALES.has(str(form.get("locale"), 2)) ? str(form.get("locale"), 2) : "ne";
  if (service.length < 2) return { ok: false, error: "invalid" };
  if ((looksPersonal(service)) || (looksPersonal(details))) return { ok: false, error: "personal_data" };
  if (await rateLimited("request")) return { ok: false, error: "rate_limited" };

  const db = supabaseService();
  if (!db) return { ok: true, demo: !hasSupabase };
  const { error } = await db.from("guide_requests").insert({ service, details: details || null, locale });
  if (error) {
    console.error("[request]", error.message);
    return { ok: false, error: "server" };
  }
  return { ok: true };
}

const REASONS = new Set(["hard_to_understand", "outdated", "missing_step", "video_failed", "other"]);

export async function submitFeedback(input: { guide: string; useful: boolean; reason?: string; message?: string; locale: string }): Promise<ActionResult> {
  if (!SLUG.test(input.guide)) return { ok: false, error: "invalid" };
  const reason = input.reason && REASONS.has(input.reason) ? input.reason : null;
  const message = (input.message ?? "").trim().slice(0, 1000);
  if (message && (looksPersonal(message))) return { ok: false, error: "personal_data" };
  if (await rateLimited("feedback", 20)) return { ok: false, error: "rate_limited" };

  const db = supabaseService();
  if (!db) return { ok: true, demo: !hasSupabase };
  const { error } = await db.from("feedback").insert({
    guide_slug: input.guide,
    useful: input.useful,
    reason: input.useful ? null : reason,
    message: message || null,
    locale: LOCALES.has(input.locale) ? input.locale : "ne",
  });
  if (error) {
    console.error("[feedback]", error.message);
    return { ok: false, error: "server" };
  }
  return { ok: true };
}

/** Counts a tutorial view (no user data). */
export async function countView(slug: string): Promise<void> {
  if (!SLUG.test(slug)) return;
  const db = supabaseService();
  if (!db) return;
  await db.rpc("increment_views", { p_slug: slug });
}
