import { getAdmin } from "@/lib/admin/auth";
import { DemoNotice, EmptyState, PageHeader } from "@/components/admin/ui";
import { RequestRow } from "@/components/admin/RowActions";

interface Req { id: string; service: string; details: string | null; locale: string; state: string; created_at: string }

export default async function RequestsPage() {
  const admin = await getAdmin();
  const rows: Req[] = admin.live ? (((await admin.db.from("guide_requests").select("*").order("created_at", { ascending: false }).limit(200)).data ?? []) as Req[]) : [];
  const counts = new Map<string, number>();
  rows.forEach((r) => counts.set(r.service.trim().toLowerCase(), (counts.get(r.service.trim().toLowerCase()) ?? 0) + 1));
  const top = [...counts].sort((a, b) => b[1] - a[1]).slice(0, 10);
  return (
    <div className="space-y-4">
      <PageHeader title="Guide requests" subtitle="Services visitors asked us to cover." />
      {!admin.live && <DemoNotice what="Requests" />}
      {admin.live && rows.length === 0 && <EmptyState title="No requests yet" hint="Requests from the public form will appear here." />}
      {top.length > 0 && (
        <div className="card p-4">
          <h2 className="font-bold">Most requested</h2>
          <p className="text-xs text-ink-faint">Services asked for 3+ times appear on the public homepage (names only).</p>
          <ul className="mt-2 flex flex-wrap gap-2">{top.map(([s, n]) => <li key={s} className="chip bg-paper-warm text-ink">{s} · {n}</li>)}</ul>
        </div>
      )}
      {rows.length > 0 && <ul className="card divide-y divide-paper-line">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="font-semibold">{r.service}</p>
              {r.details && <p className="mt-1 whitespace-pre-wrap text-sm text-ink-soft">{r.details}</p>}
              <p className="mt-1 text-xs text-ink-faint">{new Date(r.created_at).toLocaleString()} · {r.locale}</p>
            </div>
            <RequestRow id={r.id} state={r.state} />
          </li>
        ))}
      </ul>}
    </div>
  );
}
