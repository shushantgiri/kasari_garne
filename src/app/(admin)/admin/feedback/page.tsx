import { getAdmin } from "@/lib/admin/auth";
import { DemoNotice, EmptyState, PageHeader } from "@/components/admin/ui";

interface Fb { guide_slug: string; useful: boolean; reason: string | null; message: string | null; created_at: string }
const REASON: Record<string, string> = { hard_to_understand: "Hard to understand", outdated: "Outdated", missing_step: "Missing step", video_failed: "Video failed", other: "Other" };

export default async function FeedbackPage() {
  const admin = await getAdmin();
  const rows: Fb[] = admin.live ? (((await admin.db.from("feedback").select("*").order("created_at", { ascending: false }).limit(1000)).data ?? []) as Fb[]) : [];
  const by = new Map<string, Fb[]>();
  rows.forEach((r) => by.set(r.guide_slug, [...(by.get(r.guide_slug) ?? []), r]));
  return (
    <div className="space-y-4">
      <PageHeader title="Ratings" subtitle="Answers to “Was this guide useful?”, grouped by guide." />
      {!admin.live && <DemoNotice what="Feedback results" />}
      {admin.live && rows.length === 0 && <EmptyState title="No feedback yet" hint="Feedback appears after visitors answer on a guide page." />}
      {[...by].map(([slug, fs]) => {
        const yes = fs.filter((f) => f.useful).length;
        const reasons = new Map<string, number>();
        fs.forEach((f) => f.reason && reasons.set(f.reason, (reasons.get(f.reason) ?? 0) + 1));
        return (
          <section key={slug} className="card p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <a href={`/admin/guides/${slug}`} className="font-bold hover:underline">{slug}</a>
              <span className="text-sm text-ink-soft"><strong className="text-ok">{yes} useful</strong> · <strong className="text-ink">{fs.length - yes} not useful</strong> · {Math.round((yes / fs.length) * 100)}%</span>
            </div>
            {reasons.size > 0 && <ul className="mt-2 flex flex-wrap gap-1.5">{[...reasons].map(([r, n]) => <li key={r} className="chip bg-paper-warm text-ink">{REASON[r] ?? r} · {n}</li>)}</ul>}
            <ul className="mt-3 space-y-1 text-sm text-ink-soft">
              {fs.filter((f) => f.message).slice(0, 8).map((f, i) => <li key={i}>“{f.message}” <span className="text-ink-faint">— {new Date(f.created_at).toLocaleDateString()}</span></li>)}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
