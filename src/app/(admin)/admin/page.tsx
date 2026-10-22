import Link from "next/link";
import { CalendarClock, CircleCheck, FileText, Flag, PencilLine, Plus, TriangleAlert } from "lucide-react";
import { getAdmin } from "@/lib/admin/auth";
import { getGuidesForAdmin } from "@/lib/content/repo";
import { needsRecheck } from "@/lib/admin/validate";
import { awaitingReview, verificationDueSoon } from "@/lib/admin/attention";
import type { Guide } from "@/lib/content/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState, PageHeader, PublishBadge, StatCard } from "@/components/admin/ui";

interface ReportLite { id: string; guide_slug: string | null; message: string; created_at: string }

/** Why a guide needs a person to look at it. Order = priority. */
function attentionReasons(g: Guide): string[] {
  const r: string[] = [];
  if (g.status === "needs_update") r.push("Marked “Needs update”");
  if (needsRecheck(g)) r.push("Re-check due");
  if (g.video.src && g.video.review !== "approved" && g.video.review !== "rejected") r.push("Video awaiting review");
  if (g.status === "under_review") r.push("Awaiting verification");
  return r;
}

const title = (g: Guide) => g.title.en || g.title.ne || g.slug;

export default async function AdminDashboard() {
  const admin = await getAdmin();
  const { guides, problem } = await getGuidesForAdmin();

  let reports: ReportLite[] = [];
  let newReports = 0;
  if (admin.live) {
    const { data, count } = await admin.db
      .from("reports")
      .select("id,guide_slug,message,created_at", { count: "exact" })
      .eq("state", "new")
      .order("created_at", { ascending: false })
      .limit(5);
    reports = (data ?? []) as ReportLite[];
    newReports = count ?? 0;
  }

  const attention = guides.map((g) => ({ g, reasons: attentionReasons(g) })).filter((x) => x.reasons.length > 0);
  const recent = [...guides].sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || "")).slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle={<>Signed in as {admin.name} · <span className="capitalize">{admin.role}</span></>}>
        <Link href="/admin/guides" className="btn-ghost min-h-[42px] text-sm">Manage guides</Link>
        <Link href="/admin/guides?status=review" className="btn-secondary min-h-[42px] text-sm">Review pending guides</Link>
        <Link href="/admin/guides/new" className="btn-primary min-h-[42px] text-sm"><Plus className="h-4 w-4" aria-hidden="true" /> Create guide</Link>
      </PageHeader>

      {problem && (
        <p role="alert" className="rounded-xl border border-brand/30 bg-brand-tint px-4 py-3 text-sm text-brand-dark"><strong>Database setup: </strong>{problem}</p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total guides" value={guides.length} Icon={FileText} href="/admin/guides" />
        <StatCard label="Published" value={guides.filter((g) => g.published).length} Icon={CircleCheck} href="/admin/guides?pub=published" />
        <StatCard label="Drafts" value={guides.filter((g) => g.status === "draft").length} Icon={PencilLine} href="/admin/guides?status=draft" />
        <StatCard label="Needs review" value={guides.filter(awaitingReview).length} Icon={TriangleAlert} tone="attention" href="/admin/guides?status=review" />
        <StatCard label="Overdue checks" value={guides.filter((g) => needsRecheck(g)).length} Icon={CalendarClock} tone="attention" href="/admin/verification#overdue" />
        <StatCard label="New reports" value={admin.live ? newReports : "—"} Icon={Flag} tone="attention" href="/admin/reports" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* What needs attention */}
        <section aria-labelledby="att-title">
          <h2 id="att-title" className="mb-2 font-bold">Needs attention</h2>
          {attention.length === 0 ? (
            <EmptyState title="Nothing needs attention" hint="All guides are checked and no videos are waiting." />
          ) : (
            <ul className="card divide-y divide-paper-line">
              {attention.map(({ g, reasons }) => (
                <li key={g.slug}>
                  <Link href={`/admin/guides/${g.slug}`} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-paper-warm/60">
                    <span className="min-w-0">
                      <span className="block font-semibold">{title(g)}</span>
                      <span className="block text-xs text-warn">{reasons.join(" · ")}</span>
                    </span>
                    <span className="flex items-center gap-1.5"><PublishBadge g={g} /><StatusBadge status={g.status} locale="en" /></span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recent correction reports */}
        <section aria-labelledby="rep-title">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <h2 id="rep-title" className="font-bold">New correction reports {admin.live && newReports > 0 && <span className="font-normal text-ink-faint">({newReports})</span>}</h2>
            <Link href="/admin/reports" className="text-sm font-semibold text-sky hover:underline">All reports</Link>
          </div>
          {!admin.live ? (
            <EmptyState title="Reports appear once Supabase is connected" hint="Demo mode shows bundled content only." />
          ) : reports.length === 0 ? (
            <EmptyState title="No new reports" hint="Visitors' corrections will show up here." />
          ) : (
            <ul className="card divide-y divide-paper-line">
              {reports.map((r) => (
                <li key={r.id} className="px-4 py-3">
                  <div className="flex items-center gap-2 text-xs text-ink-faint">
                    <Flag className="h-3.5 w-3.5" aria-hidden="true" />
                    {r.guide_slug ?? "General"} · {new Date(r.created_at).toLocaleDateString()}
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm">{r.message}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Upcoming verification */}
      {guides.some((g) => verificationDueSoon(g)) && (
        <section aria-labelledby="soon-title">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <h2 id="soon-title" className="font-bold">Due for verification in 30 days</h2>
            <Link href="/admin/verification#soon" className="text-sm font-semibold text-sky hover:underline">Verification</Link>
          </div>
          <ul className="card divide-y divide-paper-line">
            {guides.filter((g) => verificationDueSoon(g)).map((g) => (
              <li key={g.slug}>
                <Link href={`/admin/guides/${g.slug}?tab=Review%20%26%20publish`} className="flex items-center justify-between gap-2 px-4 py-3 transition-colors hover:bg-paper-warm/60">
                  <span className="font-semibold">{title(g)}</span>
                  <span className="text-sm text-ink-soft">Check by {g.recheckBy}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Recently updated */}
      <section aria-labelledby="recent-title">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <h2 id="recent-title" className="font-bold">Recently updated</h2>
          <Link href="/admin/guides" className="text-sm font-semibold text-sky hover:underline">All guides</Link>
        </div>
        <ul className="card divide-y divide-paper-line">
          {recent.map((g) => (
            <li key={g.slug}>
              <Link href={`/admin/guides/${g.slug}`} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:bg-paper-warm/60">
                <span className="min-w-0">
                  <span className="block font-semibold">{title(g)}</span>
                  <span className="block text-xs text-ink-faint">Updated {g.updatedAt || "—"} · sources checked {g.lastChecked || "—"}</span>
                </span>
                <span className="flex items-center gap-1.5"><PublishBadge g={g} /><StatusBadge status={g.status} locale="en" /></span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
