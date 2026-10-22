import Link from "next/link";
import { CircleCheck, TriangleAlert } from "lucide-react";
import { getAdmin } from "@/lib/admin/auth";
import { getGuidesForAdmin } from "@/lib/content/repo";
import { missingOfficialSource, sourceProblems } from "@/lib/admin/attention";
import type { Guide } from "@/lib/content/types";
import { PageHeader } from "@/components/admin/ui";

const title = (g: Guide) => g.title.en || g.title.ne || g.slug;

/** All official and supporting sources, grouped by guide, with the problems worth fixing. */
export default async function SourcesPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  await getAdmin();
  const { show } = await searchParams;
  const { guides, problem } = await getGuidesForAdmin();
  const today = new Date();
  const rows = guides
    .filter((g) => g.status !== "archived")
    .map((g) => ({ g, problems: sourceProblems(g, today), noOfficial: missingOfficialSource(g) }))
    .filter((r) => show !== "problems" || r.problems.length || r.noOfficial)
    .sort((a, b) => b.problems.length + Number(b.noOfficial) - (a.problems.length + Number(a.noOfficial)));
  const total = guides.reduce((n, g) => n + g.sources.length, 0);

  return (
    <div className="space-y-5">
      <PageHeader title="Official sources" subtitle={`${total} sources across ${guides.length} guides. Edit them in each guide's “Review & publish” tab.`} />
      {problem && <p role="alert" className="rounded-xl border border-brand/30 bg-brand-tint px-4 py-3 text-sm text-brand-dark"><strong>Database setup: </strong>{problem}</p>}

      <nav aria-label="Filter" className="flex gap-2">
        <Link href="/admin/sources" className={`pill ${show !== "problems" ? "pill-active" : ""}`} aria-current={show !== "problems" ? "page" : undefined}>All</Link>
        <Link href="/admin/sources?show=problems" className={`pill ${show === "problems" ? "pill-active" : ""}`} aria-current={show === "problems" ? "page" : undefined}>Needs fixing</Link>
      </nav>

      {rows.length === 0 && <p className="rounded-xl border border-dashed border-paper-line bg-white px-4 py-6 text-center text-sm text-ink-soft">No source problems found.</p>}

      {rows.map(({ g, problems, noOfficial }) => (
        <section key={g.slug} className="card overflow-hidden" aria-labelledby={`s-${g.slug}`}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-paper-line px-4 py-3">
            <h2 id={`s-${g.slug}`} className="font-bold">{title(g)}</h2>
            <span className="flex items-center gap-3 text-sm">
              {problems.length || noOfficial ? (
                <span className="inline-flex items-center gap-1 text-warn"><TriangleAlert className="h-4 w-4" aria-hidden="true" />{problems.length + Number(noOfficial)} to fix</span>
              ) : (
                <span className="inline-flex items-center gap-1 text-ok"><CircleCheck className="h-4 w-4" aria-hidden="true" />OK</span>
              )}
              <Link href={`/admin/guides/${g.slug}?tab=Review%20%26%20publish`} className="font-semibold text-sky hover:underline">Edit sources</Link>
            </span>
          </div>
          {noOfficial && <p className="border-b border-paper-line bg-warn-tint/50 px-4 py-2 text-sm text-warn">No official (.gov.np) source. This guide can't be verified yet.</p>}
          {g.sources.length === 0 ? (
            <p className="px-4 py-3 text-sm text-ink-soft">No sources yet.</p>
          ) : (
            <ul className="divide-y divide-paper-line text-sm">
              {g.sources.map((s) => {
                const issues = problems.filter((p) => p.sourceId === s.id);
                return (
                  <li key={s.id} className="flex flex-wrap items-start gap-x-3 gap-y-1 px-4 py-2.5">
                    <span className={`chip mt-0.5 shrink-0 ${s.official ? "bg-ok-tint text-ok" : "bg-paper-warm text-ink-soft"}`}>{s.official ? "Official" : "Supporting"}</span>
                    <span className="min-w-0 flex-1">
                      <a href={s.url} target="_blank" rel="noopener noreferrer nofollow" className="link break-words">{s.title || s.url}</a>
                      <span className="block text-xs text-ink-faint">{s.id} · checked {s.checkedOn || "—"}</span>
                      {issues.map((p) => <span key={p.problem} className="block text-xs font-medium text-warn">{p.problem}</span>)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
