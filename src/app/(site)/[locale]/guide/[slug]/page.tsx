import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, ChevronDown, CircleHelp, ExternalLink, GraduationCap, ReceiptText, ShieldCheck } from "lucide-react";
import { getDepartments, getGuide, getGuides } from "@/lib/content/repo";
import { LOCALES, type Department, type Fact, type Guide, type Locale, type ProcessMode } from "@/lib/content/types";
import { dict, digits, formatDate, isLocale, tr } from "@/lib/i18n";
import { buildTutorial } from "@/lib/video/script";
import { appliesTo, stepBody } from "@/lib/content/situations";
import { FactTag } from "@/components/ui/FactTag";
import { ServiceIcon } from "@/components/ui/ServiceIcon";
import { AssistantChat } from "@/components/guide/AssistantChat";
import { buildKnowledge } from "@/lib/assist/answer";
import { GuideTabs, type GuideTab } from "@/components/guide/GuideTabs";
import { GuideFlow } from "@/components/guide/GuideFlow";
import { ServiceScene } from "@/components/guide/ServiceScene";
import { StageTitle } from "@/components/guide/StageTitle";
import { FeedbackPrompt } from "@/components/guide/FeedbackPrompt";
import { ReportDialog } from "@/components/guide/ReportDialog";
import { InfoDialog } from "@/components/guide/InfoDialog";
import { ShareGuide } from "@/components/guide/ShareGuide";
import { OfficeFinder } from "@/components/guide/OfficeFinder";

export const revalidate = 300;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateStaticParams() {
  const guides = await getGuides();
  return LOCALES.flatMap((locale) => guides.filter((g) => g.published).map((g) => ({ locale, slug: g.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const g = await getGuide(slug);
  if (!g) return {};
  return {
    title: tr(g.question, locale),
    description: tr(g.intro, locale),
    alternates: { canonical: `/${locale}/guide/${slug}`, languages: { ne: `/ne/guide/${slug}`, en: `/en/guide/${slug}` } },
    // What WhatsApp, Facebook and Viber show beside the picture (the picture itself is opengraph-image.tsx).
    openGraph: {
      type: "article",
      siteName: "Kasari Garne",
      locale: locale === "ne" ? "ne_NP" : "en_US",
      url: `/${locale}/guide/${slug}`,
      title: tr(g.question, locale),
      description: tr(g.intro, locale),
    },
    twitter: { card: "summary_large_image", title: tr(g.question, locale), description: tr(g.intro, locale) },
    robots: g.published && g.status !== "archived" ? undefined : { index: false },
  };
}

const MODE: Record<ProcessMode, { ne: string; en: string; cls: string }> = {
  online: { ne: "पूरै अनलाइन", en: "Fully online", cls: "bg-ok-tint text-ok" },
  partly_online: { ne: "केही अनलाइन · कार्यालय पनि जानुपर्छ", en: "Partly online · office visit needed", cls: "bg-sky-tint text-sky" },
  in_person: { ne: "कार्यालयमै जानुपर्छ", en: "In person only", cls: "bg-paper-warm text-ink" },
  awaiting_verification: { ne: "प्रक्रिया पुष्टि हुन बाँकी", en: "Process awaiting verification", cls: "bg-warn-tint text-warn" },
};

/** The header's action buttons: a tile (icon above the label) on phones, a pill on wider screens. */
const ACTION = "inline-flex h-full min-h-[64px] w-full flex-col items-center justify-center gap-1 rounded-2xl px-2 text-xs font-semibold shadow-card transition-[box-shadow,transform,background-color] duration-150 active:scale-[.97] sm:min-h-[44px] sm:w-auto sm:flex-row sm:gap-2 sm:rounded-full sm:px-4 sm:text-sm";

const official = <T extends { check: Fact["check"] }>(xs: T[]) => xs.filter((x) => x.check === "official");

export default async function GuidePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const guide = await getGuide(slug);
  if (!guide) notFound();
  const t = dict(locale);

  const [departments, allGuides] = await Promise.all([getDepartments(), getGuides()]);
  if (!guide.published) return <ComingSoon guide={guide} locale={locale} dept={departments.find((d) => d.id === guide.departmentId)} />;
  const dept = departments.find((d) => d.id === guide.departmentId);
  const ne = locale === "ne";

  // Facts we may show as requirements: only ones read on an official page.
  const eligibility = official(guide.eligibility);
  const documents = official(guide.documents);
  const fees = official(guide.fees).filter((f) => f.amount);
  const time = guide.estimatedTime?.check === "official" ? guide.estimatedTime : undefined;
  const withheld = [
    guide.eligibility.length > eligibility.length && (ne ? "योग्यता" : "eligibility"),
    guide.documents.length > documents.length && (ne ? "कागजात" : "documents"),
    guide.fees.length > fees.length && (ne ? "दस्तुर" : "fees"),
    guide.estimatedTime && !time && (ne ? "लाग्ने समय" : "processing time"),
  ].filter(Boolean) as string[];

  const script = buildTutorial(guide, locale, { checkedOnLabel: formatDate(guide.lastChecked, locale) });
  const related = guide.related.map((s) => allGuides.find((g) => g.slug === s)).filter((g): g is Guide => !!g && g.published);
  const mode = MODE[guide.mode];
  // Uploaded recordings get chapters from each step's "starts at" time.
  const stepChapters = guide.steps
    .map((s, i) => (s.videoAt != null ? { at: s.videoAt, title: { ne: `चरण ${i + 1}: ${s.title.ne}`, en: `Step ${i + 1}: ${tr(s.title, "en")}` }, stepId: s.id } : null))
    .filter((c) => c !== null);
  const videoWithChapters = { ...guide.video, chapters: guide.video.chapters?.length ? guide.video.chapters : stepChapters.length ? stepChapters : undefined };

  const continueLabel = ne ? "अनलाइन आवेदन" : "Apply online";
  // Fees get their own note; other unconfirmed items are listed under "Important information".
  const feesUnconfirmed = guide.fees.length > fees.length;
  const otherWithheld = withheld.filter((w) => w !== (ne ? "दस्तुर" : "fees"));
  const hasKeyFacts = fees.length > 0 || feesUnconfirmed || eligibility.length > 0 || !!guide.visit || !!time || guide.mistakes.length > 0 || otherWithheld.length > 0;

  // One tutorial per verified purpose: same builder, only that purpose's documents and step wording.
  const scripts: Record<string, ReturnType<typeof buildTutorial>> = { all: script };
  for (const sit of guide.situations ?? []) {
    if (sit.pending) continue;
    const forSit = {
      ...guide,
      documents: guide.documents.filter((d) => appliesTo(d, sit.id)),
      steps: guide.steps.filter((st) => appliesTo(st, sit.id)).map((st) => ({ ...st, body: stepBody(st, sit.id) })),
    };
    scripts[sit.id] = buildTutorial(forSit, locale, { checkedOnLabel: formatDate(guide.lastChecked, locale) });
  }

  const howTo = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: tr(guide.question, locale),
    description: tr(guide.intro, locale),
    inLanguage: locale,
    step: guide.steps.map((s, i) => ({ "@type": "HowToStep", position: i + 1, name: tr(s.title, locale), text: tr(s.body, locale) })),
  };
  // Search engines: the page's place in the site, and its common questions with answers.
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: t.siteName, item: `${SITE}/${locale}` },
      { "@type": "ListItem", position: 2, name: t.allGuides, item: `${SITE}/${locale}/guides` },
      { "@type": "ListItem", position: 3, name: tr(guide.title, locale), item: `${SITE}/${locale}/guide/${guide.slug}` },
    ],
  };
  const faq = guide.faqs.length > 0 && {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: guide.faqs.map((f) => ({ "@type": "Question", name: tr(f.q, locale), acceptedAnswer: { "@type": "Answer", text: tr(f.a, locale) } })),
  };

  const hasChoice = (guide.situations?.length ?? 0) > 1;
  // The guide's steps, one shown at a time; each lists the page sections it holds.
  const steps: GuideTab[] = [
    ...(hasChoice ? [{ id: "purpose", label: ne ? "काम छान्नुहोस्" : "Choose", sections: ["purpose", "not-ready"] }] : []),
    { id: "how", label: ne ? "कसरी गर्ने" : "How to do it", sections: hasChoice ? ["video"] : ["video", "not-ready"] },
    { id: "need", label: ne ? "कागजात" : "Documents", sections: ["need"] },
    { id: "apply", label: ne ? "आवेदन" : "Apply", sections: ["finish"] },
    ...(guide.faqs.length > 0 || related.length > 0 ? [{ id: "more", label: ne ? "प्रश्न र थप" : "Questions", sections: ["faq", "related"] }] : []),
  ];
  // Stage numbers continue GuideFlow's: purpose (if any), how to do it, documents, then apply.
  const applyN = (hasChoice ? 1 : 0) + 3;

  return (
    <article className="-mb-16 bg-paper-warm/60 pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq ? [howTo, breadcrumbs, faq] : [howTo, breadcrumbs]) }} />

      {/* ---------- Header: what this is, in a few words ---------- */}
      {/* Not clipped and above the content below, so the Share menu can open over it;
          while the menu is open it also rises above the sticky step bar. */}
      <header className="mesh-bg grain z-10 border-b border-paper-line has-[[role=menu]]:z-40">
        <div className="container-page relative max-w-3xl pb-8 pt-6 sm:pb-10 sm:pt-8">
          {/* The moving scene as a wide banner, then the text below it. */}
          <div>
            {/* A little taller on phones, so the vehicles are big enough to see. */}
            <ServiceScene icon={guide.icon} className="w-full animate-rise max-sm:aspect-[3/1]" />
            <div className="mt-6 min-w-0 animate-rise [animation-delay:60ms] sm:mt-7">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-brand">
                <ServiceIcon name={guide.icon} className="h-4 w-4" />
                {tr(guide.title, locale)}
              </p>
              <h1 className="mt-2 text-balance text-[1.9rem] font-bold leading-[1.15] tracking-[-0.02em] sm:text-[2.6rem]">{tr(guide.question, locale)}</h1>
              <p className="mt-3 text-pretty text-[1.05rem] leading-relaxed text-ink-soft sm:text-lg">{tr(guide.summary, locale) || tr(guide.intro, locale)}</p>

              {/* Fees & rules (popup), Share and, for the licence, Test practice: equal tiles on phones, pills on wider screens. */}
              <div className={`mt-5 grid gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-2.5 ${guide.slug === "driving-licence" ? "grid-cols-3" : "grid-cols-2"}`}>
                {hasKeyFacts && (
                  <InfoDialog
                    label={ne ? "दस्तुर र नियम" : "Fees & rules"}
                    title={ne ? "दस्तुर र नियम" : "Fees and rules"}
                    closeLabel={t.close}
                    buttonClassName={`${ACTION} bg-white text-brand ring-1 ring-paper-line hover:shadow-pop`}
                    icon={<ReceiptText className="h-4 w-4" aria-hidden="true" />}
                  >
                  <dl className="-mt-3 divide-y divide-paper-line">
                    {(fees.length > 0 || feesUnconfirmed) && (
                      <FactRow label={ne ? "कति लाग्छ?" : "How much?"}>
                        {fees.map((f, i) => (
                          <p key={i} className="flex items-baseline justify-between gap-3">
                            <span>{tr(f.label, locale)}</span>
                            <span className="shrink-0 font-semibold tabular-nums text-ink">{tr(f.amount, locale)}</span>
                          </p>
                        ))}
                        {feesUnconfirmed && (
                          <p className={`text-warn ${fees.length > 0 ? "mt-1" : ""}`}>
                            {fees.length > 0 ? (ne ? "अरू दस्तुर पुष्टि हुन बाँकी।" : "Other fees not confirmed yet.") : ne ? "पुष्टि हुन बाँकी।" : "Not confirmed yet."}{" "}
                            {ne ? "तिर्नुअघि आधिकारिक वेबसाइट हेर्नुहोस्।" : "Check the official website before you pay."}
                          </p>
                        )}
                      </FactRow>
                    )}
                    {eligibility.length > 0 && (
                      <FactRow label={t.whoCanApply}>
                        {eligibility.map((e, i) => {
                          const text = tr(e.text, locale);
                          // "Car (category B): 18 years completed" reads best as label + value; other lines stay plain.
                          const at = text.indexOf(": ");
                          return at > 0 && /[0-9०-९]/.test(text.slice(at + 2)) ? (
                            <p key={i} className="flex items-baseline justify-between gap-3">
                              <span>{text.slice(0, at)}</span>
                              <span className="shrink-0 text-right font-semibold text-ink">{text.slice(at + 2)}</span>
                            </p>
                          ) : (
                            <p key={i}>{text}</p>
                          );
                        })}
                      </FactRow>
                    )}
                    {(guide.visit || guide.mode !== "awaiting_verification") && (
                      <FactRow label={ne ? "कार्यालय जानुपर्छ?" : "Office visit?"}>
                        <p>{guide.visit ? tr(guide.visit.text, locale) : ne ? mode.ne : mode.en} {guide.visit && <FactTag check={guide.visit.check} locale={locale} />}</p>
                      </FactRow>
                    )}
                    {time && (
                      <FactRow label={ne ? "कति समय लाग्छ?" : "How long?"}>
                        <p>{tr(time.text, locale)}</p>
                        {time.note && <p className="text-ink-faint">{tr(time.note, locale)}</p>}
                      </FactRow>
                    )}
                  </dl>

                  {guide.mistakes.length > 0 && (
                    <details className="group mt-3 rounded-xl bg-warn-tint">
                      <summary className="flex min-h-[48px] cursor-pointer list-none items-center gap-2 px-4 font-semibold text-warn [&::-webkit-details-marker]:hidden">
                        <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span className="flex-1">{ne ? `प्रायः हुने गल्ती (${digits(guide.mistakes.length, locale)})` : `Common mistakes (${guide.mistakes.length})`}</span>
                        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
                      </summary>
                      <ul className="space-y-1.5 px-4 pb-4 text-[0.98rem] text-ink">
                        {guide.mistakes.map((m, i) => (
                          <li key={i} className="flex gap-2.5">
                            <span className="mt-[0.65em] h-1.5 w-1.5 shrink-0 rounded-full bg-warn" aria-hidden="true" />
                            <span className="min-w-0">{tr(m.text, locale)} <FactTag check={m.check} locale={locale} /></span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                  {otherWithheld.length > 0 && (
                    <p className="mt-3 flex gap-2 text-sm text-warn" role="note">
                      <CircleHelp className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                      {ne ? `${otherWithheld.join(", ")} अझै पुष्टि भएको छैन। आधिकारिक वेबसाइटमा हेर्नुहोस्।` : `${otherWithheld.join(", ").replace(/^./, (c) => c.toUpperCase())} not confirmed yet. Check the official website.`}
                    </p>
                  )}
                  </InfoDialog>
                )}
                <ShareGuide locale={locale} title={tr(guide.question, locale)} buttonClassName={`${ACTION} bg-white text-ink ring-1 ring-paper-line hover:shadow-pop`} />
                {/* Driving licence only: practice for the written test and the colour check. */}
                {guide.slug === "driving-licence" && (
                  <Link
                    href={`/${locale}/guide/${guide.slug}/practice`}
                    className={`${ACTION} bg-ink text-white hover:bg-ink/90`}
                  >
                    <GraduationCap className="h-4 w-4" aria-hidden="true" />
                    {ne ? "परीक्षा अभ्यास" : "Test practice"}
                  </Link>
                )}
              </div>
            </div>
          </div>
          {guide.status === "needs_update" && (
            <p className="mt-3 text-sm font-semibold text-warn" role="note">{t.statusHelp.needs_update}</p>
          )}
        </div>
      </header>

      {/* One step at a time (see GuideTabs); each section is its own box (see .guide-body in globals.css). */}
      <GuideTabs locale={locale} tabs={steps} className="container-page guide-body mt-5 max-w-3xl sm:mt-6">
        <GuideFlow
          locale={locale}
          slug={guide.slug}
          serviceName={tr(guide.title, locale)}
          situations={(guide.situations ?? []).map((x) => ({ id: x.id, label: tr(x.label, locale), hint: x.hint ? tr(x.hint, locale) : undefined, pending: x.pending }))}
          gap={guide.situationsGap ? tr(guide.situationsGap, locale) : undefined}
          documents={documents.map((d) => ({ text: tr(d.text, locale), when: d.when ? tr(d.when, locale) : undefined, note: d.note ? tr(d.note, locale) : undefined, for: d.for }))}
          steps={guide.steps.map((s) => ({
            id: s.id,
            title: tr(s.title, locale),
            body: tr(s.body, locale),
            bodyFor: s.bodyFor ? Object.fromEntries(Object.entries(s.bodyFor).map(([k, v]) => [k, tr(v, locale)])) : undefined,
            for: s.for,
            unconfirmed: s.check !== "official",
            simpler: s.help ? tr(s.help.simpler, locale) : undefined,
            example: s.help?.example ? tr(s.help.example, locale) : undefined,
            warning: s.warning ? tr(s.warning, locale) : undefined,
            hasVideo: script.chapters.some((c) => c.stepId === s.id),
          }))}
          finishHref="#finish"
          scripts={scripts}
          video={videoWithChapters}
          help={{
            deptName: dept ? tr(dept.name, locale) : undefined,
            deptUrl: dept?.url,
            statusCheck: guide.statusCheck ? { label: tr(guide.statusCheck.label, locale), url: guide.statusCheck.url } : undefined,
          }}
        />

        {/* ---------- Apply online ---------- */}
        <section id="finish" className="scroll-mt-36" aria-labelledby="finish-title">
          <StageTitle n={applyN} id="finish-title" locale={locale}>{guide.officialPortal ? continueLabel : ne ? "पेस गर्नुअघि र पछि" : "Before and after you submit"}</StageTitle>
          <div className="mt-4 space-y-6">
            {/* The one big action: who runs it, the address, one button. */}
            {guide.officialPortal && (
              <div>
                <div className="flex flex-col gap-4 rounded-2xl border border-ok/20 bg-gradient-to-br from-ok-tint/80 to-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-ok shadow-card ring-1 ring-ok/15">
                      <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold leading-snug text-ink">{dept ? tr(dept.name, locale) : tr(guide.officialPortal.label, locale)}</p>
                      <p className="truncate text-sm">
                        <span className="font-medium text-ok">{ne ? "आधिकारिक" : "Official"}</span>
                        <span className="text-ink-faint"> · </span>
                        <span className="latin text-ink-faint">{siteName(guide.officialPortal.url)}</span>
                      </p>
                    </div>
                  </div>
                  <a href={guide.officialPortal.url} target="_blank" rel="noopener noreferrer" className="btn-primary w-full shrink-0 sm:w-auto">
                    {t.openOfficial} <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </a>
                </div>
              </div>
            )}

            {/* Office visit needed: the exact office in the person's district, with directions. */}
            {guide.mode !== "online" && dept && <OfficeFinder locale={locale} kind={dept.id === "dotm" ? "transport" : "dao"} />}

            <div>
              <h3 className="text-sm font-semibold text-ink-faint">{ne ? "पेस गर्नुअघि जाँच्नुहोस्" : "Before you submit"}</h3>
              <ul className="mt-2.5 space-y-2.5">
                {(ne
                  ? ["नाम, जन्ममिति र नम्बर कागजातसँग मिल्छ।", "वेबसाइटको ठेगाना .gov.np मा सकिन्छ।", "पेस गरेको फाराम प्रिन्ट वा सेभ गर्नुहोस्।"]
                  : ["Name, date of birth and numbers match your documents.", "The website address ends in .gov.np.", "Print or save the submitted form."]
                ).map((x) => (
                  <li key={x} className="flex items-start gap-3 leading-snug text-ink">
                    <span className="mt-px grid h-5 w-5 shrink-0 place-items-center rounded-full bg-ok-tint text-ok" aria-hidden="true">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    {x}
                  </li>
                ))}
              </ul>
            </div>

            {((guide.whatNext && guide.whatNext.length > 0) || guide.statusCheck) && (
              <div>
                <h3 className="text-sm font-semibold text-ink-faint">{ne ? "त्यसपछि के हुन्छ?" : "What happens next?"}</h3>
                {/* A short timeline: numbered dots joined by a thin line. */}
                <ol className="mt-2.5">
                  {(guide.whatNext ?? []).map((n, i, all) => (
                    <li key={i} className="relative flex gap-3 pb-4 last:pb-0">
                      {i < all.length - 1 && <span className="absolute -bottom-0 left-[11px] top-7 w-px bg-paper-line" aria-hidden="true" />}
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white text-xs font-bold text-ink ring-1 ring-paper-line" aria-hidden="true">{digits(i + 1, locale)}</span>
                      <span className="pt-0.5 leading-snug text-ink">{tr(n.text, locale)} <FactTag check={n.check} locale={locale} /></span>
                    </li>
                  ))}
                </ol>
                {guide.statusCheck && (
                  <a
                    href={guide.statusCheck.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={tr(guide.statusCheck.label, locale)}
                    className="ml-9 mt-1 inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-sky underline-offset-4 hover:underline"
                  >
                    {t.checkStatus} <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ---------- Common questions ---------- */}
        {guide.faqs.length > 0 && (
          <section id="faq" className="scroll-mt-36" aria-labelledby="faq-title">
            <StageTitle id="faq-title">{ne ? "प्रायः सोधिने प्रश्न" : "Common questions"}</StageTitle>
            <div className="box-bleed mt-4 divide-y divide-paper-line">
              {guide.faqs.map((f, i) => (
                <details key={i} className="disclosure">
                  <summary>{tr(f.q, locale)}</summary>
                  <div className="disclosure-body max-w-prose">
                    <p className="text-ink-soft">{tr(f.a, locale)}</p>
                    <FactTag check={f.check} locale={locale} />
                  </div>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* ---------- Related ---------- */}
        {related.length > 0 && (
          <section id="related" aria-labelledby="related-title">
            <h2 id="related-title" className="section-title">{t.related}</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {related.map((g) => (
                <li key={g.slug}>
                  <Link
                    href={`/${locale}/guide/${g.slug}`}
                    className="group flex h-full items-center gap-4 rounded-xl border border-paper-line p-4 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:border-brand/30 hover:shadow-card"
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-tint text-brand">
                      <ServiceIcon name={g.icon} className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold leading-snug text-ink">{tr(g.question, locale)}</span>
                      <span className="mt-0.5 block text-sm text-ink-faint">{tr(g.title, locale)}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-ink-faint transition-colors group-hover:text-brand" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </GuideTabs>

      {/* Feedback: asked in a popup once someone has spent a while on the guide. The report form
          opens from that popup and from steps ("still unclear"), so it's always on the page. */}
      <FeedbackPrompt locale={locale} guide={guide.slug} />
      <ReportDialog locale={locale} guide={guide.slug} button={false} />

      {/* Chat helper: free, answers from this guide in the browser. */}
      <AssistantChat
        locale={locale}
        knowledge={{ ne: buildKnowledge(guide, "ne", dept), en: buildKnowledge(guide, "en", dept) }}
        serviceName={tr(guide.title, locale)}
        suggestions={ne ? ["के-के कागजात चाहिन्छ?", "आवेदन कहाँ दिने?", "पेस गरेपछि के हुन्छ?"] : ["What documents do I need?", "Where do I apply?", "What happens after I apply?"]}
      />

    </article>
  );
}

/** One question and its plain answer, as a row: label on the left on wide screens, above on phones. */
function FactRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-3 sm:grid sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4">
      <dt className="font-semibold text-ink">{label}</dt>
      <dd className="mt-1 space-y-1 text-[0.98rem] leading-relaxed text-ink-soft sm:mt-0">{children}</dd>
    </div>
  );
}

/** A guide that isn't published yet: same header as every guide, then one honest message and one action. */
function ComingSoon({ guide, locale, dept }: { guide: Guide; locale: Locale; dept?: Department }) {
  const t = dict(locale);
  const ne = locale === "ne";
  return (
    <article className="-mb-16 bg-paper-warm/60 pb-16">
      <header className="relative overflow-hidden border-b border-paper-line bg-paper-warm">
        <div className="hero-texture absolute inset-0" aria-hidden="true" />
        <div className="container-page relative pb-7 pt-4 sm:pb-9 sm:pt-6">
          <Link href={`/${locale}/guides?category=${guide.category}`} className="muted inline-flex min-h-[44px] items-center gap-1.5 transition-colors hover:text-ink">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t.allGuides}
          </Link>
          <div className="mt-4 max-w-3xl">
            <p className="text-sm font-medium text-ink-soft">{tr(guide.title, locale)}</p>
            <h1 className="mt-3 text-[1.8rem] font-bold leading-[1.15] tracking-tight sm:text-[2.4rem]">{tr(guide.question, locale) || tr(guide.title, locale)}</h1>
            {tr(guide.summary, locale) && <p className="mt-2.5 text-[1.08rem] text-ink-soft">{tr(guide.summary, locale)}</p>}
          </div>
          <p className="mt-5 flex items-center gap-2 text-sm text-ink-soft">
            <span className="h-2 w-2 shrink-0 rounded-full bg-ink-faint" aria-hidden="true" />
            <span className="font-medium text-ink">{t.comingSoon}</span>
          </p>
        </div>
      </header>

      <div className="container-page guide-body mt-5 sm:mt-6">
        <section aria-labelledby="soon-title">
          <StageTitle id="soon-title">{ne ? "यो निर्देशिका तयार हुँदैछ" : "This guide is being prepared"}</StageTitle>
          <p className="mt-3 text-ink-soft">
            {ne
              ? "आधिकारिक स्रोतबाट जाँच नगरी हामी प्रक्रिया प्रकाशित गर्दैनौँ। माग गर्नुभयो भने हामी यसलाई छिटो तयार गर्छौँ।"
              : "We don't publish a process until it's checked against official sources. Requests help us prepare it sooner."}
          </p>
          <Link href={`/${locale}/request?service=${encodeURIComponent(tr(guide.title, locale))}`} className="btn-primary mt-5 w-full sm:w-auto">
            {t.requestThis}
          </Link>
        </section>

        {dept && (
          <div role="region" aria-labelledby="meanwhile-title" className="note-official p-5 sm:p-7">
            <p className="note-label text-ok"><ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />{ne ? "आधिकारिक सरकारी वेबसाइट" : "Official government website"}</p>
            <h2 id="meanwhile-title" className="font-semibold text-ink">{tr(dept.name, locale)}</h2>
            <p className="mt-1 text-ink-soft">{ne ? "त्यतिन्जेल, जानकारी सिधै विभागको वेबसाइटमा हेर्न सक्नुहुन्छ।" : "Meanwhile, you can check the department's own website."}</p>
            <a href={dept.url} target="_blank" rel="noopener noreferrer" className="btn-secondary mt-4 w-full sm:w-auto">
              {ne ? "वेबसाइट खोल्नुहोस्" : "Open their website"} <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        )}

        <p className="px-1 text-sm text-ink-soft">
          <Link href={`/${locale}/guides`} className="font-semibold text-sky hover:underline">{t.allGuides} →</Link>
        </p>
      </div>
    </article>
  );
}

/** Just the site's address, e.g. "enrollment.donidcr.gov.np", without the long page path. */
function siteName(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url.replace(/^https?:\/\//, "").split("/")[0];
  }
}
