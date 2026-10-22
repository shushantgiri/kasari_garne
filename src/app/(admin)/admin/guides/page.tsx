import Link from "next/link";
import { MoreHorizontal, Plus, Search } from "lucide-react";
import { getAdmin } from "@/lib/admin/auth";
import { getGuidesForAdmin } from "@/lib/content/repo";
import { categories } from "@/lib/content/categories";
import { needsRecheck, unconfirmedFacts } from "@/lib/admin/validate";
import { awaitingReview, hasEnglish } from "@/lib/admin/attention";
import { PublishToggle } from "@/components/admin/PublishToggle";
import type { Guide, GuideStatus } from "@/lib/content/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { FlagButton } from "@/components/admin/FlagButton";
import { EmptyState, PageHeader, PublishBadge, VideoBadge } from "@/components/admin/ui";

const STATUSES: { id: GuideStatus; label: string }[] = [
  { id: "draft", label: "Draft" },
  { id: "under_review", label: "Under review" },
  { id: "verified", label: "Verified" },
  { id: "needs_update", label: "Needs update" },
  { id: "archived", label: "Archived" },
];

const catName = (id: string) => categories.find((c) => c.id === id)?.name.en ?? id;

export default async function GuidesListPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; pub?: string; category?: string }> }) {
  await getAdmin();
  const { q = "", status = "", pub = "", category = "" } = await searchParams;
  const { guides, problem } = await getGuidesForAdmin();

  const needle = q.trim().toLowerCase();
  const rows = guides
    .filter((g) => !needle || [g.slug, g.title.ne, g.title.en ?? "", ...g.keywords].some((x) => x.toLowerCase().includes(needle)))
    .filter((g) => !status || (status === "recheck" ? needsRecheck(g) : status === "review" ? awaitingReview(g) : g.status === status))
    .filter((g) => !pub || (pub === "published" ? g.published : !g.published))
    .filter((g) => !category || g.category === category)
    .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
  const filtered = Boolean(needle || status || pub || category);

  return (
    <div className="space-y-5">
      <PageHeader title="Guides" subtitle={`${guides.length} total`}>
        <Link href="/admin/guides/new" className="btn-primary min-h-[42px] text-sm"><Plus className="h-4 w-4" aria-hidden="true" /> Create guide</Link>
      </PageHeader>

      {problem && (
        <p role="alert" className="rounded-xl border border-brand/30 bg-brand-tint px-4 py-3 text-sm text-brand-dark"><strong>Database setup: </strong>{problem}</p>
      )}

      <nav aria-label="Quick filters" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
        {[
          { label: "All", href: "/admin/guides", on: !status && !pub, n: guides.length },
          { label: "Published", href: "/admin/guides?pub=published", on: pub === "published" && !status, n: guides.filter((g) => g.published).length },
          { label: "Drafts", href: "/admin/guides?status=draft", on: status === "draft", n: guides.filter((g) => g.status === "draft").length },
          { label: "Needs review", href: "/admin/guides?status=review", on: status === "review", n: guides.filter(awaitingReview).length },
          { label: "Verification overdue", href: "/admin/guides?status=recheck", on: status === "recheck", n: guides.filter((g) => needsRecheck(g)).length },
        ].map((f) => (
          <Link key={f.label} href={f.href} aria-current={f.on ? "page" : undefined} className={`pill ${f.on ? "pill-active" : ""}`}>
            {f.label}
            <span className={`ml-1.5 tabular-nums ${f.on ? "text-white/70" : "text-ink-faint"}`}>{f.n}</span>
          </Link>
        ))}
      </nav>

      <form method="get" className="card grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-[minmax(16rem,1fr)_10rem_10rem_12rem_auto]" role="search">
        <label className="relative block sm:col-span-2 lg:col-span-1">
          <span className="sr-only">Search guides</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
          <input name="q" defaultValue={q} placeholder="Search by title, slug or keyword" className="input min-h-[42px] pl-9 text-sm" />
        </label>
        <Select name="status" value={status} label="Verification">
          <option value="">Any verification</option>
          {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          <option value="review">Needs review</option>
          <option value="recheck">Due for re-check</option>
        </Select>
        <Select name="pub" value={pub} label="Publication">
          <option value="">Any publication</option>
          <option value="published">Published</option>
          <option value="hidden">Not published</option>
        </Select>
        <Select name="category" value={category} label="Category">
          <option value="">Any category</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name.en}</option>)}
        </Select>
        <div className="flex gap-2">
          <button className="btn-secondary min-h-[42px] flex-1 text-sm">Apply</button>
          {filtered && <Link href="/admin/guides" className="btn-ghost min-h-[42px] text-sm">Clear</Link>}
        </div>
      </form>

      {rows.length === 0 ? (
        <EmptyState title="No guides found" hint="Try changing your filters or create a new guide." action={{ href: "/admin/guides/new", label: "Create guide" }} />
      ) : (
        <>
          {/* Desktop table */}
          <div className="card hidden overflow-hidden md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-paper-line bg-paper-warm text-xs font-semibold text-ink-soft">
                <tr>
                  <th className="px-4 py-2.5">Guide</th>
                  <th className="px-4 py-2.5">Publication</th>
                  <th className="px-4 py-2.5">Verification</th>
                  <th className="px-4 py-2.5">Language</th>
                  <th className="px-4 py-2.5">Video</th>
                  <th className="px-4 py-2.5">Updated</th>
                  <th className="px-4 py-2.5"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-line">
                {rows.map((g) => (
                  <tr key={g.slug} className="hover:bg-paper-warm/60">
                    <td className="px-4 py-3">
                      <Link href={`/admin/guides/${g.slug}`} className="font-semibold hover:underline">{g.title.en || g.title.ne}</Link>
                      <div className="text-xs text-ink-faint">{catName(g.category)}</div>
                    </td>
                    <td className="px-4 py-3"><PublishBadge g={g} /></td>
                    <td className="px-4 py-3"><Verification g={g} /></td>
                    <td className="px-4 py-3"><Lang g={g} /></td>
                    <td className="px-4 py-3"><VideoBadge g={g} /></td>
                    <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{g.updatedAt || "—"}</td>
                    <td className="px-4 py-3 text-right"><Actions g={g} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile list */}
          <ul className="space-y-2 md:hidden">
            {rows.map((g) => (
              <li key={g.slug} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/admin/guides/${g.slug}`} className="font-semibold hover:underline">{g.title.en || g.title.ne}</Link>
                    <div className="text-xs text-ink-faint">{catName(g.category)} · updated {g.updatedAt || "—"}</div>
                  </div>
                  <Actions g={g} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <PublishBadge g={g} />
                  <Verification g={g} />
                  <Lang g={g} />
                  <VideoBadge g={g} />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function Select({ name, value, label, children }: { name: string; value: string; label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <select name={name} defaultValue={value} className="input min-h-[42px] text-sm">{children}</select>
    </label>
  );
}

/** Verification status, plus open facts and re-check due as small secondary signals. */
function Verification({ g }: { g: Guide }) {
  const open = unconfirmedFacts(g).length;
  const due = needsRecheck(g);
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <StatusBadge status={g.status} locale="en" />
      {open > 0 && <span className="text-xs text-warn" title="Facts not yet confirmed on an official page">{open} unconfirmed</span>}
      {due && <span className="text-xs text-warn">re-check due</span>}
    </span>
  );
}

/** Which languages are complete. Nepali is always required; English is optional. */
function Lang({ g }: { g: Guide }) {
  return hasEnglish(g)
    ? <span className="text-sm text-ink-soft" title="Nepali and English">NE · EN</span>
    : <span className="text-sm text-ink-faint" title="English is incomplete; visitors see Nepali where English is missing">NE only</span>;
}

function Actions({ g }: { g: Guide }) {
  const canFlag = g.published && g.status !== "needs_update";
  return (
    <span className="inline-flex items-start gap-1">
      <Link href={`/admin/guides/${g.slug}`} className="btn-ghost min-h-[34px] rounded-lg px-2.5 text-sm text-sky">Edit</Link>
      {g.status !== "archived" && <PublishToggle slug={g.slug} published={g.published} disabled={!g.published && g.status === "draft"} />}
      {g.published || canFlag ? (
        <details className="relative">
          <summary className="grid h-[34px] w-9 cursor-pointer list-none place-items-center rounded-lg text-ink-soft transition-colors hover:bg-paper-warm [&::-webkit-details-marker]:hidden" title="More actions">
            <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">More actions for {g.title.en || g.slug}</span>
          </summary>
          <div className="absolute right-0 z-10 mt-1 w-48 origin-top-right animate-pop rounded-xl border border-paper-line bg-white p-1 text-left text-sm shadow-pop">
            {g.published && <a href={`/ne/guide/${g.slug}`} target="_blank" rel="noopener noreferrer" className="block rounded-lg px-3 py-2 hover:bg-paper-warm">Preview live page</a>}
            {canFlag && <div className="rounded-lg px-3 py-2 hover:bg-paper-warm"><FlagButton slug={g.slug} label="Flag “Needs update”" /></div>}
          </div>
        </details>
      ) : (
        <span className="h-[34px] w-9" aria-hidden="true" />
      )}
    </span>
  );
}
