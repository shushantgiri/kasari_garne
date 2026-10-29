import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, MessageSquarePlus } from "lucide-react";
import { getDepartments, getGuides, getTopRequests } from "@/lib/content/repo";
import { dict, formatDate, isLocale, tr } from "@/lib/i18n";
import { toTeasers } from "@/lib/search/teaser";
import { SearchBox } from "@/components/search/SearchBox";
import { ServiceCard } from "@/components/home/ServiceCard";
import { ServiceIcon } from "@/components/ui/ServiceIcon";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AssistantChat } from "@/components/guide/AssistantChat";
import { ToolGrid } from "@/components/tools/ToolGrid";
import { OfficeToday } from "@/components/tools/OfficeToday";
import { buildKnowledge } from "@/lib/assist/answer";

export const revalidate = 300;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const POPULAR_ORDER = ["driving-licence", "passport", "national-id", "pan", "police-clearance", "voter-registration"];

/** One example per way of typing: Nepali, Romanized Nepali, English. All covered by search tests. */
const EXAMPLES = {
  ne: ["लाइसेन्स कसरी भर्ने?", "पासपोर्ट बनाउन के चाहिन्छ?", "license kasari bharne?"],
  en: ["Driving licence form", "license kasari bharne?", "PAN number"],
} as const;

/** Real questions that take turns in the search box, one per way of typing. */
const ROTATING = {
  ne: ["पासपोर्ट कसरी बनाउने?", "license renew kasari garne?", "राष्ट्रिय परिचयपत्र बनाउन के चाहिन्छ?", "police report online kasari line?"],
  en: ["passport renew", "license kasari bharne?", "National ID card", "police report online"],
} as const;

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = dict(locale);
  const ne = locale === "ne";

  const [guides, departments, topRequests] = await Promise.all([getGuides(), getDepartments(), getTopRequests()]);
  const live = guides.filter((g) => g.published && g.status !== "archived");
  const popular = POPULAR_ORDER.map((s) => guides.find((g) => g.slug === s)).filter((g) => g !== undefined);
  const recent = [...live].sort((a, b) => (b.lastChecked || "").localeCompare(a.lastChecked || "")).slice(0, 3);
  const anyVerified = live.some((g) => g.status === "verified");

  // Search engines: the site's name, and a search box they may show under it in results.
  const site = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Kasari Garne",
    alternateName: "कसरी गर्ने?",
    url: `${SITE}/${locale}`,
    inLanguage: locale,
    potentialAction: { "@type": "SearchAction", target: `${SITE}/${locale}/search?q={query}`, "query-input": "required name=query" },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(site) }} />
      {/* Hero: one headline, one sentence, the search box. */}
      <section className="mesh-bg grain overflow-hidden border-b border-paper-line">

        <div className="container-page relative py-12 sm:py-16">
          <div className="mx-auto max-w-2xl text-center">
            {/* Two deliberate lines on every screen: the topic, then the promise starting with the key words in red. */}
            <h1 className="animate-rise text-[2.35rem] font-bold leading-[1.12] tracking-[-0.02em] sm:text-[3.5rem]">
              <span className="block">{t.heroParts[0].trim()}</span>
              <span className="block">
                {/* The vertical padding keeps Devanagari marks inside the gradient's clip. */}
                <span className="text-brand">{t.heroParts[1]}</span>
                {t.heroParts[2]}
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-md animate-rise text-balance text-[1.08rem] leading-relaxed text-ink-soft [animation-delay:80ms] sm:max-w-lg sm:text-xl">{t.heroText}</p>

            {/* The search box, with a soft glow behind it. */}
            <div className="relative z-20 mt-8 animate-rise [animation-delay:120ms]">
              <div className="relative">
                <SearchBox locale={locale} teasers={toTeasers(guides, departments)} examples={ROTATING[locale]} />
              </div>
            </div>

            <div className="stagger flex flex-wrap items-center justify-center gap-2">
              <span className="muted">{ne ? "जस्तै:" : "Try:"}</span>
              {EXAMPLES[locale].map((q) => (
                <Link
                  key={q}
                  href={`/${locale}/search?q=${encodeURIComponent(q)}`}
                  lang={/[a-z]/i.test(q) ? "en" : "ne"}
                  className="inline-flex min-h-[40px] items-center rounded-full bg-white/80 px-3.5 text-sm text-ink-soft ring-1 ring-paper-line transition-[color,transform,box-shadow] duration-200 ease-[cubic-bezier(.2,.8,.2,1)] hover:-translate-y-px hover:text-ink hover:shadow-card hover:ring-ink-faint/40 active:translate-y-0"
                >
                  {q}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Popular services */}
      <section id="popular" className="container-page scroll-mt-20 pb-10 pt-8 sm:pb-14 sm:pt-10" aria-labelledby="popular-title">
        <SectionHead id="popular-title" title={t.popularServices} href={`/${locale}/guides`} linkLabel={t.allGuides} />
        <ul className="stagger mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {popular.map((g) => (
            <li key={g.slug}><ServiceCard guide={g} locale={locale} /></li>
          ))}
        </ul>
      </section>

      {/* Handy tools, with today's office status first. */}
      <section className="container-page pb-10 sm:pb-14" aria-labelledby="tools-title">
        <SectionHead id="tools-title" title={ne ? "उपयोगी उपकरण" : "Handy tools"} href={`/${locale}/tools`} linkLabel={ne ? "सबै" : "All"} />
        <div className="mt-5 space-y-3">
          <OfficeToday locale={locale} compact />
          <ToolGrid locale={locale} />
        </div>
      </section>

      {/* Recently checked */}
      {recent.length > 0 && (
        <section className="container-page pb-10 sm:pb-14" aria-labelledby="recent-title">
          <SectionHead id="recent-title" title={anyVerified ? (ne ? "भर्खरै प्रमाणित" : "Recently verified") : t.recentlyUpdated} />
          <ul className="panel mt-5 divide-y divide-paper-line overflow-hidden">
            {recent.map((g) => (
              <li key={g.slug}>
                <Link href={`/${locale}/guide/${g.slug}`} className="flex min-h-[68px] items-center gap-4 px-4 py-3 transition-colors duration-150 hover:bg-paper-warm">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-tint text-brand"><ServiceIcon name={g.icon} className="h-5 w-5" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold leading-snug">{tr(g.question, locale)}</span>
                    <span className="muted block">{t.lastChecked}: {formatDate(g.lastChecked, locale)}</span>
                  </span>
                  <span className="hidden sm:block"><StatusBadge status={g.status} locale={locale} /></span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Chat helper for every published guide: it works out which service a question is about. */}
      <AssistantChat
        locale={locale}
        library={toTeasers(live, departments).map((tz) => {
          const g = live.find((x) => x.slug === tz.slug)!;
          const d = departments.find((x) => x.id === g.departmentId);
          return { ...tz, knowledge: { ne: buildKnowledge(g, "ne", d), en: buildKnowledge(g, "en", d) } };
        })}
        serviceName={ne ? "सरकारी सेवाहरू" : "Government services"}
        suggestions={ne ? ["पासपोर्ट बनाउन के चाहिन्छ?", "लाइसेन्सको दस्तुर कति?", "राष्ट्रिय परिचयपत्र कहाँ बनाउने?"] : ["What do I need for a passport?", "Driving licence fee?", "Where do I get a National ID?"]}
      />

      {/* Request a guide — the only other call to action on the page. */}
      <section className="container-page">
        <div className="panel flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
          <MessageSquarePlus className="hidden h-8 w-8 shrink-0 text-sky sm:block" aria-hidden="true" strokeWidth={1.6} />
          <div className="flex-1">
            <h2 className="text-lg font-bold">{t.requestTitle}</h2>
            <p className="mt-0.5 text-ink-soft">{t.requestText}</p>
            {topRequests.length > 0 && (
              <p className="muted mt-2">
                {ne ? "धेरैले मागेका: " : "Often requested: "}
                {topRequests.slice(0, 4).map((r) => r.service).join(" · ")}
              </p>
            )}
          </div>
          <Link href={`/${locale}/request`} className="btn-secondary w-full sm:w-auto">{t.requestGuide}</Link>
        </div>
      </section>
    </>
  );
}

function SectionHead({ id, title, href, linkLabel }: { id: string; title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 id={id} className="section-title">{title}</h2>
      {href && (
        <Link href={href} className="inline-flex min-h-[44px] shrink-0 items-center gap-1 text-sm font-semibold text-ink-soft hover:text-ink">
          {linkLabel}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
