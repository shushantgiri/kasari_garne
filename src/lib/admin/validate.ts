import type { Fact, Guide } from "../content/types";

export interface Check {
  errors: string[];
  warnings: string[];
}

/** Facts that still need confirming, with where they live — for the "Verified" gate. */
export function unconfirmedFacts(g: Guide): string[] {
  const out: string[] = [];
  const scan = (label: string, xs: { check: Fact["check"] }[]) =>
    xs.forEach((x, i) => x.check !== "official" && out.push(`${label} #${i + 1}`));
  scan("Eligibility", g.eligibility);
  scan("Document", g.documents);
  scan("Fee", g.fees);
  scan("Step", g.steps);
  scan("Mistake", g.mistakes);
  scan("FAQ", g.faqs);
  scan("What next", g.whatNext ?? []);
  scan("Purpose", (g.situations ?? []).filter((x) => !x.pending));
  if (g.visit && g.visit.check !== "official") out.push("Office visit");
  if (g.estimatedTime && g.estimatedTime.check !== "official") out.push("Estimated time");
  g.fees.forEach((f, i) => f.check === "official" && !f.amount && out.push(`Fee #${i + 1} (no amount)`));
  return out;
}

function isGovNp(url: string) {
  try {
    return new URL(url).hostname.endsWith(".gov.np");
  } catch {
    return false;
  }
}

/** Rules shared by the editor (live hints) and the save action (enforced). */
export function validateGuide(g: Guide): Check {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!/^[a-z0-9-]{2,80}$/.test(g.slug)) errors.push("Slug: lowercase letters, numbers and hyphens only.");
  if (!g.title.ne.trim()) errors.push("Nepali title is required.");
  if (!g.question.ne.trim()) errors.push("Nepali question is required.");
  if (!g.departmentId) errors.push("Choose a department.");
  if (g.officialPortal && !/^https:\/\//.test(g.officialPortal.url)) errors.push("Official portal must be an https:// link.");
  if (g.officialPortal && !isGovNp(g.officialPortal.url))
    warnings.push("Official portal is not a .gov.np address — double-check it is the real government site.");

  const ids = new Set(g.sources.map((s) => s.id));
  const refs = [...(g.situations ?? []), ...g.eligibility, ...g.documents, ...g.steps, ...g.mistakes, ...g.faqs, ...g.fees, ...(g.whatNext ?? [])];
  refs.forEach((r) => (r.sourceIds ?? []).forEach((id) => !ids.has(id) && errors.push(`Unknown source id "${id}".`)));
  refs.forEach((r) => r.check === "official" && !(r.sourceIds ?? []).some((id) => g.sources.find((s) => s.id === id)?.official) && warnings.push("An item marked official has no official source attached."));
  g.sources.forEach((s) => !/^https?:\/\//.test(s.url) && errors.push(`Source "${s.id}" needs a full URL.`));

  const stepIds = g.steps.map((s) => s.id);
  if (new Set(stepIds).size !== stepIds.length) errors.push("Step ids must be unique.");

  // Purposes ("new", "renew"…): ids unique, every reference points at one, every purpose has steps.
  const sit = (g.situations ?? []).map((x) => x.id);
  if (sit.some((id) => !/^[a-z0-9-]{1,40}$/.test(id))) errors.push("Purpose ids: lowercase letters, numbers and hyphens only.");
  if (new Set(sit).size !== sit.length) errors.push("Purpose ids must be unique.");
  if ((g.situations ?? []).some((x) => !x.label.ne.trim())) errors.push("Every purpose needs a Nepali label.");
  const known = new Set(sit);
  const tagged = [...g.documents.map((d) => d.for ?? []), ...g.steps.flatMap((st) => [st.for ?? [], Object.keys(st.bodyFor ?? {})])].flat();
  tagged.forEach((id) => !known.has(id) && errors.push(`Unknown purpose id "${id}" on a document or step.`));
  (g.situations ?? []).filter((x) => !x.pending).forEach(({ id }) => !g.steps.some((st) => !st.for?.length || st.for.includes(id)) && errors.push(`Purpose "${id}" has no steps.`));
  const pendingIds = new Set((g.situations ?? []).filter((x) => x.pending).map((x) => x.id));
  [...g.documents, ...g.steps].forEach((x) => (x.for ?? []).some((id) => pendingIds.has(id)) && errors.push("A “coming soon” purpose can't have documents or steps yet. Untick “coming soon” once it's verified."));
  if ((g.situations ?? []).filter((x) => !x.pending).length === 1 && sit.length === 1) warnings.push("Only one purpose is set. Add another, or remove it so no choice is shown.");

  if (g.status === "archived" && g.published) errors.push("Archived guides cannot be published.");
  if (g.published && g.status === "draft") errors.push("Move the guide out of Draft before publishing.");
  if (g.published && g.steps.length === 0) errors.push("A published guide needs at least one step.");

  if (g.status === "verified") {
    if (!g.lastChecked) errors.push("Verified needs a 'last checked' date.");
    if (!g.sources.some((s) => s.official)) errors.push("Verified needs at least one official source.");
    const open = unconfirmedFacts(g);
    if (open.length) errors.push(`Verified needs every item confirmed on an official page. Still open: ${open.slice(0, 6).join(", ")}${open.length > 6 ? "…" : ""}`);
    if (g.mode === "awaiting_verification") errors.push("Set the process mode (online / partly online / in person) before verifying.");
  }

  if (g.lastChecked) {
    const days = (Date.now() - new Date(g.lastChecked).getTime()) / 86400000;
    if (days > 180) warnings.push(`Sources were last checked ${Math.round(days)} days ago — re-check before keeping it Verified.`);
  }
  if (g.video.src && g.video.review !== "approved") warnings.push("The uploaded video is hidden until a reviewer approves it.");
  if (g.video.src && !g.video.subtitles?.ne) warnings.push("The uploaded video has no Nepali captions.");

  return { errors: [...new Set(errors)], warnings: [...new Set(warnings)] };
}

/** Guides due for a re-check: past their recheck date, or checked more than 120 days ago. */
export function needsRecheck(g: Guide, today = new Date()): boolean {
  if (!g.published) return false;
  if (g.recheckBy && new Date(g.recheckBy) <= today) return true;
  if (!g.lastChecked) return true;
  return (today.getTime() - new Date(g.lastChecked).getTime()) / 86400000 > 120;
}
