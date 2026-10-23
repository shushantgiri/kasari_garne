import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, SearchX } from "lucide-react";
import { getDepartments, getGuides } from "@/lib/content/repo";
import { dict, isLocale, tr } from "@/lib/i18n";
import { buildIndex, detectPurpose, isAmbiguous, POPULAR_QUERIES, search } from "@/lib/search/search";
import { toTeasers, type GuideTeaser } from "@/lib/search/teaser";
import { guideHref } from "@/lib/search/href";
import type { Locale } from "@/lib/content/types";
import { SearchBox } from "@/components/search/SearchBox";
import { ServiceIcon } from "@/components/ui/ServiceIcon";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: isLocale(locale) ? dict(locale).searchLabel : undefined, robots: { index: false } };
}

export default async function SearchPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ q?: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { q = "" } = await searchParams;
  const query = q.slice(0, 120);
  const t = dict(locale);
  const ne = locale === "ne";
  const [guides, departments] = await Promise.all([getGuides(), getDepartments()]);
  const teasers = toTeasers(guides, departments);
  const hits = query ? search(buildIndex(teasers), query, { includeDrafts: true }) : [];
  const results = hits.map((h) => teasers.find((g) => g.slug === h.slug)!).filter(Boolean);
  // Two services match about equally: ask once instead of guessing.
  const ambiguous = isAmbiguous(hits);
  const [best, ...others] = results;

  return (
    <div className="container-page max-w-3xl py-8 sm:py-10">
      <h1 className="sr-only">{t.searchLabel}</h1>
      <SearchBox locale={locale} teasers={teasers} initialQuery={query} autoFocus={!query} />

      {!query && (
        <div className="mt-6">
          <h2 className="font-bold">{ne ? "उदाहरण खोजहरू" : "Example searches"}</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {POPULAR_QUERIES[locale].map((p) => (
              <li key={p}><Link href={`/${locale}/search?q=${encodeURIComponent(p)}`} className="pill">{p}</Link></li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-ink-faint">{ne ? "नेपाली, English वा Romanized (जस्तै: license kasari bharne) मा लेख्न वा बोल्न सक्नुहुन्छ।" : "Type or speak in Nepali, English or Romanized Nepali (e.g. license kasari bharne)."}</p>
        </div>
      )}

      {query && results.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed border-paper-line p-8 text-center" aria-live="polite">
          <SearchX className="mx-auto h-10 w-10 text-ink-faint" aria-hidden="true" strokeWidth={1.5} />
          <p className="mt-3 font-semibold">{t.noResults}</p>
          <p className="mt-1 text-ink-soft">{t.noResultsHint}</p>
          <Link href={`/${locale}/request?service=${encodeURIComponent(query)}`} className="btn-primary mt-5">{t.requestThis}</Link>
        </div>
      )}

      {query && results.length > 0 && ambiguous && (
        <section className="mt-6" aria-live="polite" aria-labelledby="clarify">
          <h2 id="clarify" className="text-lg font-bold">{ne ? "तपाईंले कुन भन्नुभएको?" : "Which one did you mean?"}</h2>
          <ul className="panel stagger mt-3 divide-y divide-paper-line overflow-hidden">
            {results.slice(0, 3).map((g) => <li key={g.slug}><ResultRow g={g} q={query} locale={locale} /></li>)}
          </ul>
        </section>
      )}

      {query && best && !ambiguous && (
        <section className="mt-6" aria-live="polite" aria-labelledby="best">
          <h2 id="best" className="sr-only">{t.searchFor(query)}</h2>
          <BestMatch g={best} q={query} locale={locale} />
          {others.length > 0 && (
            <details className="disclosure panel mt-6">
              <summary><span>{ne ? "अरू नतिजा" : "Other results"} <span className="muted font-normal">({others.length})</span></span></summary>
              <ul className="divide-y divide-paper-line border-t border-paper-line">
                {others.map((g) => <li key={g.slug}><ResultRow g={g} q={query} locale={locale} /></li>)}
              </ul>
            </details>
          )}
        </section>
      )}
    </div>
  );
}

/** The one guide we think they want, with its purpose when the words named one. */
function BestMatch({ g, q, locale }: { g: GuideTeaser; q: string; locale: Locale }) {
  const t = dict(locale);
  const ne = locale === "ne";
  const p = detectPurpose(q, g.situations?.map((x) => x.id));
  const purpose = p.id && g.situations?.find((x) => x.id === p.id);
  return (
    <div className="panel animate-rise p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${g.published ? "bg-brand-tint text-brand" : "bg-paper-warm text-ink-faint"}`}><ServiceIcon name={g.icon} className="h-6 w-6" /></span>
        <div className="min-w-0">
          <p className="text-lg font-bold leading-snug">{tr(g.title, locale)}</p>
          <p className="mt-0.5 text-ink-soft">{purpose ? tr(purpose.label, locale) : tr(g.question, locale)}</p>
          {g.published && purpose && purpose.pending && (
            <p className="mt-2 text-sm text-warn">{ne ? "यो कामको निर्देशिका छिट्टै आउँदैछ। अहिलेलाई आधिकारिक वेबसाइट र अनुरोध गर्ने तरिका देखाउँछौँ।" : "This guide is coming soon. We'll show you the official website and how to request it."}</p>
          )}
          {p.asked && !p.id && g.published && (
            <p className="mt-2 text-sm text-warn">{ne ? "यो कामको छुट्टै निर्देशिका अझै छैन। सामान्य निर्देशिका हेर्नुहोस्।" : "There's no separate guide for that yet. See the general guide."}</p>
          )}
        </div>
      </div>
      <Link href={guideHref(locale, g, q)} className="btn-primary mt-5 w-full sm:w-auto">
        {g.published ? t.viewGuide : t.requestThis}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );
}

function ResultRow({ g, q, locale }: { g: GuideTeaser; q: string; locale: Locale }) {
  const t = dict(locale);
  return (
    <Link href={guideHref(locale, g, q)} className="flex min-h-[64px] items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-paper-warm">
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${g.published ? "bg-brand-tint text-brand" : "bg-paper-warm text-ink-faint"}`}><ServiceIcon name={g.icon} className="h-5 w-5" /></span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{tr(g.title, locale)}</span>
        {!g.published && <span className="block text-xs text-ink-faint">{t.comingSoon}</span>}
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden="true" />
    </Link>
  );
}
