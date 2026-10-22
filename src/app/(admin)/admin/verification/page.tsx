import Link from "next/link";
import { getAdmin } from "@/lib/admin/auth";
import { getGuidesForAdmin } from "@/lib/content/repo";
import { awaitingReview, missingOfficialSource, verificationDueSoon, verificationOverdue } from "@/lib/admin/attention";
import type { Guide } from "@/lib/content/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState, PageHeader, PublishBadge } from "@/components/admin/ui";

const title = (g: Guide) => g.title.en || g.title.ne || g.slug;

export default async function VerificationPage() {
  await getAdmin();
  const { guides, problem } = await getGuidesForAdmin();
  const today = new Date();

  const groups: { id: string; title: string; hint: string; list: Guide[]; tone?: "attention" }[] = [
    { id: "overdue", title: "Overdue", hint: "Past the re-check date, or sources older than 120 days.", list: guides.filter((g) => verificationOverdue(g, today)), tone: "attention" },
    { id: "soon", title: "Due in the next 30 days", hint: "Plan these checks now.", list: guides.filter((g) => verificationDueSoon(g, today)) },
    { id: "review", title: "Awaiting review", hint: "Under review, or flagged “Needs update”. Check the official source before publishing.", list: guides.filter(awaitingReview) },
    { id: "nosource", title: "No official source", hint: "Add a .gov.np page before this guide can be verified.", list: guides.filter(missingOfficialSource) },
  ];
  const recent = [...guides].filter((g) => g.lastChecked).sort((a, b) => b.lastChecked.localeCompare(a.lastChecked)).slice(0, 5);

  return (
    <div className="space-y-8">
      <PageHeader title="Verification" subtitle="Keep every published guide matched to its official source." />
      {problem && <p role="alert" className="rounded-xl border border-brand/30 bg-brand-tint px-4 py-3 text-sm text-brand-dark"><strong>Database setup: </strong>{problem}</p>}

      <nav aria-label="Jump to" className="flex flex-wrap gap-2">
        {groups.map((g) => (
          <a key={g.id} href={`#${g.id}`} className={`pill ${g.tone === "attention" && g.list.length ? "border-warn/40 text-warn" : ""}`}>
            {g.title} <span className="ml-1.5 tabular-nums text-ink-faint">{g.list.length}</span>
          </a>
        ))}
      </nav>

      {groups.map((grp) => (
        <section key={grp.id} id={grp.id} className="scroll-mt-6" aria-labelledby={`${grp.id}-t`}>
          <div className="mb-2">
            <h2 id={`${grp.id}-t`} className="font-bold">{grp.title} <span className="font-normal text-ink-faint">({grp.list.length})</span></h2>
            <p className="text-sm text-ink-soft">{grp.hint}</p>
          </div>
          {grp.list.length === 0 ? (
            <p className="rounded-xl border border-dashed border-paper-line bg-white px-4 py-3 text-sm text-ink-soft">Nothing here.</p>
          ) : (
            <GuideRows list={grp.list} />
          )}
        </section>
      ))}

      <section aria-labelledby="recent-t">
        <h2 id="recent-t" className="mb-2 font-bold">Recently checked</h2>
        {recent.length ? <GuideRows list={recent} /> : <EmptyState title="No checks recorded yet" />}
      </section>
    </div>
  );
}

function GuideRows({ list }: { list: Guide[] }) {
  return (
    <ul className="card divide-y divide-paper-line">
      {list.map((g) => (
        <li key={g.slug}>
          <Link href={`/admin/guides/${g.slug}?tab=Review%20%26%20publish`} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 transition-colors hover:bg-paper-warm/60">
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{title(g)}</span>
              <span className="block text-xs text-ink-faint">
                Last checked {g.lastChecked || "never"} · Next check {g.recheckBy || "not set"}{g.reviewer ? ` · Reviewer: ${g.reviewer}` : ""}
              </span>
            </span>
            <span className="flex items-center gap-1.5"><PublishBadge g={g} /><StatusBadge status={g.status} locale="en" /></span>
            <span className="text-sm font-semibold text-sky">Open</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
