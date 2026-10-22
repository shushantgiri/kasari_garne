import { getAdmin } from "@/lib/admin/auth";
import { DemoNotice, EmptyState, PageHeader } from "@/components/admin/ui";
import { ReportRow } from "@/components/admin/RowActions";

interface Report { id: string; guide_slug: string | null; step_id: string | null; message: string; source_url: string | null; locale: string; state: string; admin_note: string | null; created_at: string }

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ state?: string }> }) {
  const admin = await getAdmin();
  const { state = "open" } = await searchParams;
  let rows: Report[] = [];
  if (admin.live) {
    let q = admin.db.from("reports").select("*").order("created_at", { ascending: false }).limit(100);
    q = state === "open" ? q.in("state", ["new", "in_progress"]) : q.in("state", ["resolved", "rejected"]);
    rows = ((await q).data ?? []) as Report[];
  }
  return (
    <div className="space-y-4">
      <PageHeader title="Correction reports" subtitle="Problems visitors found in a guide." />
      <nav aria-label="Report state" className="flex gap-2">
        <a href="?state=open" aria-current={state === "open" ? "page" : undefined} className={`pill ${state === "open" ? "pill-active" : ""}`}>Open</a>
        <a href="?state=closed" aria-current={state !== "open" ? "page" : undefined} className={`pill ${state !== "open" ? "pill-active" : ""}`}>Closed</a>
      </nav>
      {!admin.live && <DemoNotice what="Reports" />}
      {admin.live && rows.length === 0 && <EmptyState title={state === "open" ? "No open reports" : "No closed reports"} hint={state === "open" ? "New corrections from visitors will appear here." : undefined} />}
      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.id} className="card p-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {r.guide_slug ? <a className="font-semibold hover:underline" href={`/admin/guides/${r.guide_slug}`}>{r.guide_slug}</a> : <span className="font-semibold">General</span>}
              {r.step_id && <span className="chip bg-paper-warm text-ink-soft">step: {r.step_id}</span>}
              <span className="ml-auto text-xs text-ink-faint">{new Date(r.created_at).toLocaleString()} · {r.locale}</span>
            </div>
            <p className="mt-2 whitespace-pre-wrap">{r.message}</p>
            {r.source_url && <a className="link mt-1 block break-all text-sm" href={r.source_url} target="_blank" rel="noopener noreferrer nofollow">{r.source_url}</a>}
            <ReportRow id={r.id} state={r.state} note={r.admin_note} guide={r.guide_slug} />
          </li>
        ))}
      </ul>
    </div>
  );
}
