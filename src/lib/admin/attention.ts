/**
 * What needs an admin's attention, as plain rules over guide data.
 * Shared by the sidebar badges, the dashboard and the verification page so their counts always agree.
 */
import type { Guide } from "../content/types.ts";
import { needsRecheck } from "./validate.ts";

const DAY = 86400000;

/** Waiting for a reviewer, or flagged because the official process changed. */
export const awaitingReview = (g: Guide) => g.status === "under_review" || g.status === "needs_update";

/** Past its re-check date, or sources older than 120 days (published guides only). */
export const verificationOverdue = (g: Guide, today = new Date()) => needsRecheck(g, today);

/** Re-check date falls within the next `days` days and isn't overdue yet. */
export function verificationDueSoon(g: Guide, today = new Date(), days = 30): boolean {
  if (!g.published || !g.recheckBy || needsRecheck(g, today)) return false;
  const t = new Date(g.recheckBy).getTime() - today.getTime();
  return t > 0 && t <= days * DAY;
}

/** No official government page among the sources (drafts are still being written, so they are left out). */
export const missingOfficialSource = (g: Guide) => g.status !== "archived" && g.status !== "draft" && !g.sources.some((s) => s.official);

/** An MP4 is attached but no reviewer has decided on it yet. */
export const videoAwaitingReview = (g: Guide) => !!g.video.src && g.video.review !== "approved" && g.video.review !== "rejected";

/** English is filled for the title, question and every step. */
export function hasEnglish(g: Guide): boolean {
  return !!g.title.en?.trim() && !!g.question.en?.trim() && g.steps.every((s) => !!s.title.en?.trim() && !!s.body.en?.trim());
}

export interface SourceProblem { guide: string; sourceId: string; problem: string }

/** Problems with a guide's source list that an admin should fix. */
export function sourceProblems(g: Guide, today = new Date()): SourceProblem[] {
  const out: SourceProblem[] = [];
  for (const s of g.sources) {
    let host = "";
    try {
      const u = new URL(s.url);
      host = u.hostname;
      if (u.protocol !== "https:") out.push({ guide: g.slug, sourceId: s.id, problem: "Not an https:// link" });
    } catch {
      out.push({ guide: g.slug, sourceId: s.id, problem: "Not a valid URL" });
    }
    if (s.official && host && !host.endsWith(".gov.np") && !host.endsWith("nepalembassy.gov.np")) out.push({ guide: g.slug, sourceId: s.id, problem: "Marked official but not a .gov.np address" });
    if (!s.title.trim()) out.push({ guide: g.slug, sourceId: s.id, problem: "Missing description" });
    if (!s.checkedOn) out.push({ guide: g.slug, sourceId: s.id, problem: "No checked date" });
    else if ((today.getTime() - new Date(s.checkedOn).getTime()) / DAY > 180) out.push({ guide: g.slug, sourceId: s.id, problem: "Checked more than 180 days ago" });
  }
  return out;
}

/** The numbers behind the sidebar badges. */
export interface AttentionCounts {
  review: number;
  overdue: number;
  videos: number;
  sources: number;
  reports: number | null;
  requests: number | null;
}

export function guideCounts(guides: Guide[], today = new Date()) {
  return {
    review: guides.filter(awaitingReview).length,
    overdue: guides.filter((g) => verificationOverdue(g, today)).length,
    videos: guides.filter(videoAwaitingReview).length,
    sources: guides.filter((g) => g.status !== "draft" && (missingOfficialSource(g) || sourceProblems(g, today).length > 0)).length,
  };
}
