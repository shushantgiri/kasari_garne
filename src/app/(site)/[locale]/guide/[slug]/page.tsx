import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, ArrowRight, PlayCircle, ReceiptText, Check, CircleHelp, ExternalLink, ShieldCheck } from "lucide-react";
import { getDepartments, getGuide, getGuides } from "@/lib/content/repo";
import { LOCALES, type Department, type Fact, type Guide, type Locale, type ProcessMode } from "@/lib/content/types";
import { dict, digits, formatDate, isLocale, tr } from "@/lib/i18n";
import { buildTutorial } from "@/lib/video/script";
import { appliesTo, stepBody } from "@/lib/content/situations";
import { FactTag } from "@/components/ui/FactTag";
import { ServiceIcon } from "@/components/ui/ServiceIcon";
import { InfoDialog } from "@/components/guide/InfoDialog";
import { AssistantChat } from "@/components/guide/AssistantChat";
import { buildKnowledge } from "@/lib/assist/answer";
import { SectionNav } from "@/components/guide/SectionNav";
import { GuideFlow } from "@/components/guide/GuideFlow";
import { StageTitle } from "@/components/guide/StageTitle";
import { FeedbackWidget } from "@/components/guide/FeedbackWidget";
import { ReportDialog } from "@/components/guide/ReportDialog";

export const revalidate = 300;

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
    robots: g.published && g.status !== "archived" ? undefined : { index: false },
  };
}

const MODE: Record<ProcessMode, { ne: string; en: string; cls: string }> = {
  online: { ne: "पूरै अनलाइन", en: "Fully online", cls: "bg-ok-tint text-ok" },
  partly_online: { ne: "केही अनलाइन · कार्यालय पनि जानुपर्छ", en: "Partly online · office visit needed", cls: "bg-sky-tint text-sky" },
  in_person: { ne: "कार्यालयमै जानुपर्छ", en: "In person only", cls: "bg-paper-warm text-ink" },
  awaiting_verification: { ne: "प्रक्रिया पुष्टि हुन बाँकी", en: "Process awaiting verification", cls: "bg-warn-tint text-warn" },
};

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

  return (
    <article className="-mb-16 bg-paper-warm/60 pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howTo) }} />

      {/* ---------- Header: what, why, one action ---------- */}
      <header className="relative overflow-hidden border-b border-paper-line bg-paper-warm">
        <div className="hero-texture absolute inset-0" aria-hidden="true" />
        <div className="container-page relative pb-7 pt-4 sm:pb-9 sm:pt-6">
          <Link href={`/${locale}/guides?category=${guide.category}`} className="muted inline-flex min-h-[44px] items-center gap-1.5 transition-colors hover:text-ink">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t.allGuides}
          </Link>

          <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-12">
            <div className="min-w-0 lg:pt-2">
              {/* Which service this is: a clear icon and its name. */}
              <p className="flex items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand text-white shadow-[0_6px_16px_-8px_rgba(180,35,44,0.6)]">
                  <ServiceIcon name={guide.icon} className="h-5 w-5" />
                </span>
                <span className="text-sm font-semibold uppercase tracking-wide text-brand">{tr(guide.title, locale)}</span>
              </p>
              <h1 className="mt-4 text-[1.8rem] font-bold leading-[1.15] tracking-tight sm:text-[2.4rem]">{tr(guide.question, locale)}</h1>
              <p className="mt-2 max-w-2xl text-[1.08rem] text-ink-soft">{tr(guide.summary, locale) || tr(guide.intro, locale)}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <a href="#video" className="btn-secondary">
                  <PlayCircle className="h-5 w-5 text-brand" aria-hidden="true" />
                  {ne ? "भिडियो गाइड हेर्नुहोस्" : "Watch video guide"}
                </a>
                {hasKeyFacts && (
                  <InfoDialog
                    label={ne ? "दस्तुर र नियम" : "Fees & rules"}
                    title={ne ? "दस्तुर र महत्त्वपूर्ण जानकारी" : "Fees and important information"}
                    closeLabel={t.close}
                    icon={<ReceiptText className="h-5 w-5 text-brand" aria-hidden="true" />}
                  >
            {/* The essentials as small tiles. */}
            <div className="space-y-6">
              {(fees.length > 0 || feesUnconfirmed) && (
                <InfoTile label={ne ? "कति लाग्छ?" : "How much does it cost?"}>
                  {fees.length > 0 && (
                    <dl className="divide-y divide-paper-line">
                      {fees.map((f, i) => (
                        <div key={i} className="flex items-baseline justify-between gap-3 py-1.5">
                          <dt>{tr(f.label, locale)}</dt>
                          <dd className="shrink-0 font-semibold tabular-nums text-ink">{tr(f.amount, locale)}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                  {feesUnconfirmed && (
                    <div className={fees.length > 0 ? "mt-2" : ""}>
                      <p className="inline-flex rounded-full bg-warn-tint px-3 py-1 text-sm font-semibold text-warn">
                        {fees.length > 0 ? (ne ? "अरू दस्तुर पुष्टि हुन बाँकी" : "Other fees not confirmed") : ne ? "पुष्टि हुन बाँकी" : "Not confirmed yet"}
                      </p>
                      <p className="mt-2 text-ink-soft">{ne ? "तिर्नुअघि आधिकारिक वेबसाइटमा हेर्नुहोस्।" : "Check the official website before you pay."}</p>
                    </div>
                  )}
                </InfoTile>
              )}
              {eligibility.length > 0 && (
                <InfoTile label={t.whoCanApply}>
                  <ul className="divide-y divide-paper-line">
                    {eligibility.map((e, i) => {
                      const text = tr(e.text, locale);
                      // "Car (category B): 18 years completed" reads best as label + value; other lines stay plain.
                      const at = text.indexOf(": ");
                      return at > 0 && /[0-9०-९]/.test(text.slice(at + 2)) ? (
                        <li key={i} className="flex items-baseline justify-between gap-3 py-1.5">
                          <span>{text.slice(0, at)}</span>
                          <span className="shrink-0 text-right font-bold text-ink">{text.slice(at + 2)}</span>
                        </li>
                      ) : (
                        <li key={i} className="py-1.5">{text}</li>
                      );
                    })}
                  </ul>
                </InfoTile>
              )}
              {(guide.visit || guide.mode !== "awaiting_verification") && (
                <InfoTile label={ne ? "कार्यालय जानुपर्छ?" : "Do I need to visit an office?"}>
                  <p>{guide.visit ? tr(guide.visit.text, locale) : ne ? mode.ne : mode.en}</p>
                  {guide.visit && <FactTag check={guide.visit.check} locale={locale} />}
                </InfoTile>
              )}
              {time && (
                <InfoTile label={ne ? "कति समय लाग्छ?" : "How long does it take?"}>
                  <p>{tr(time.text, locale)}</p>
                  {time.note && <p className="mt-1 text-ink-faint">{tr(time.note, locale)}</p>}
                </InfoTile>
              )}
            </div>

            {guide.mistakes.length > 0 && (
              <div className="mt-6">
                <h3 className="text-[1.08rem] font-bold text-ink">{ne ? "प्रायः हुने गल्ती" : "Common mistakes"}</h3>
                <ul className="mt-2 space-y-2 text-[0.98rem] leading-relaxed text-ink">
                  {guide.mistakes.map((m, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-warn" aria-hidden="true" />
                      <span className="min-w-0">{tr(m.text, locale)} <FactTag check={m.check} locale={locale} /></span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {otherWithheld.length > 0 && (
              <p className="mt-4 flex gap-2 text-sm text-warn" role="note">
                <CircleHelp className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {ne ? `${otherWithheld.join(", ")} अझै पुष्टि भएको छैन। आधिकारिक वेबसाइटमा हेर्नुहोस्।` : `${otherWithheld.join(", ").replace(/^./, (c) => c.toUpperCase())} not confirmed yet. Check the official website.`}
              </p>
            )}
                  </InfoDialog>
                )}
              </div>
            </div>

            {/* "Where do I go?": the official site, one button, and how fresh this guide is. */}
            {guide.officialPortal && (
            <aside className="min-w-0 rounded-2xl border border-paper-line bg-white p-4 shadow-card sm:p-5" aria-label={ne ? "आधिकारिक वेबसाइट" : "Official website"}>
                <>
                  <p className="note-label text-ok"><ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />{ne ? "आधिकारिक वेबसाइट" : "Official website"}</p>
                  <p className="latin truncate font-semibold text-ink" title={guide.officialPortal.url}>{siteName(guide.officialPortal.url)}</p>
                  <a href={guide.officialPortal.url} target="_blank" rel="noopener noreferrer" className="btn-primary mt-3 w-full">
                    {t.openOfficial} <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </a>
                </>
            </aside>
            )}
          </div>
          {guide.status === "needs_update" && (
            <p className="mt-3 max-w-3xl text-sm font-semibold text-warn" role="note">{t.statusHelp.needs_update}</p>
          )}

        </div>
      </header>

      {/* Each section is its own box (see .guide-body in globals.css). */}
      <div className="container-page guide-body mt-5 sm:mt-6">
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

        {/* ---------- Video: optional, so it opens on demand ---------- */}


        {/* ---------- Apply online ---------- */}
        <section id="finish" className="scroll-mt-20" aria-labelledby="finish-title">
          <StageTitle n={4} id="finish-title" locale={locale}>{guide.officialPortal ? continueLabel : ne ? "पेस गर्नुअघि र पछि" : "Before and after you submit"}</StageTitle>
          <div className="mt-4 space-y-3">
            {/* The one big action: text on the left, button on the right (stacked on phones). */}
            {guide.officialPortal && (
              <div className="note-official flex flex-col gap-4 p-5 sm:p-6 md:flex-row md:items-center md:justify-between md:gap-8">
                <div className="min-w-0">
                  <p className="note-label text-ok"><ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />{ne ? "आधिकारिक सरकारी वेबसाइट" : "Official government website"}</p>
                  {dept && <p className="text-lg font-semibold leading-snug text-ink">{tr(dept.name, locale)}</p>}
                  <p className="mt-0.5 text-base text-ink-soft">{ne ? "आवेदन त्यहीँ दिनुहोस्। हामी मार्गदर्शन मात्र दिन्छौँ।" : "You apply there. We only guide you."}</p>
                </div>
                <div className="flex shrink-0 flex-col items-stretch gap-1.5 md:items-end">
                  <a href={guide.officialPortal.url} target="_blank" rel="noopener noreferrer" className="btn-primary">
                    {t.openOfficial} <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </a>
                  <span className="latin truncate text-center text-sm text-ink-faint md:text-right">{siteName(guide.officialPortal.url)}</span>
                </div>
              </div>
            )}

            {/* Before and after, as two quiet tiles. */}
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl bg-paper-warm/70 p-4 sm:p-5">
                <h3 className="text-sm font-semibold text-ink">{ne ? "पेस गर्नुअघि जाँच्नुहोस्" : "Before you submit"}</h3>
                <ul className="mt-3 space-y-2 text-base text-ink-soft">
                  {(ne
                    ? ["नाम, जन्ममिति र नम्बर कागजातसँग मिल्छ।", "वेबसाइटको ठेगाना .gov.np मा सकिन्छ।", "पेस गरेको फाराम प्रिन्ट वा सेभ गर्नुहोस्।"]
                    : ["Name, date of birth and numbers match your documents.", "The website address ends in .gov.np.", "Print or save the submitted form."]
                  ).map((x) => (
                    <li key={x} className="flex gap-2.5">
                      <Check className="mt-1 h-4 w-4 shrink-0 text-ok" strokeWidth={2.5} aria-hidden="true" />
                      {x}
                    </li>
                  ))}
                </ul>
              </div>
              {((guide.whatNext && guide.whatNext.length > 0) || guide.statusCheck) && (
                <div className="rounded-xl bg-paper-warm/70 p-4 sm:p-5">
                  <h3 className="text-sm font-semibold text-ink">{ne ? "त्यसपछि के हुन्छ?" : "What happens next?"}</h3>
                  <ol className="mt-3 space-y-2 text-base text-ink-soft">
                    {(guide.whatNext ?? []).map((n, i) => (
                      <li key={i} className="flex gap-2.5">
                        <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white text-xs font-semibold text-ink-soft ring-1 ring-paper-line" aria-hidden="true">{digits(i + 1, locale)}</span>
                        <span>{tr(n.text, locale)} <FactTag check={n.check} locale={locale} /></span>
                      </li>
                    ))}
                  </ol>
                  {guide.statusCheck && (
                    <a
                      href={guide.statusCheck.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={tr(guide.statusCheck.label, locale)}
                      className="mt-4 inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-paper-line bg-white px-3.5 text-sm font-medium text-sky transition-colors hover:border-sky/40"
                    >
                      {t.checkStatus} <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ---------- Common questions ---------- */}
        {guide.faqs.length > 0 && (
          <section id="faq" className="scroll-mt-20" aria-labelledby="faq-title">
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

        {/* ---------- Feedback + report ---------- */}
        <div role="region" className="panel grid gap-6 p-5 sm:p-6 md:grid-cols-2 md:divide-x md:divide-paper-line" aria-label={ne ? "प्रतिक्रिया" : "Feedback"}>
          <FeedbackWidget locale={locale} guide={guide.slug} />
          <div className="md:pl-6">
            <h2 className="text-lg font-bold">{t.report}</h2>
            <p className="mb-3 mt-1 text-sm text-ink-soft">{ne ? "कुनै बटन, नाम वा नियम फेरिएको छ भने हामीलाई भन्नुहोस्।" : "Tell us if a button, name or rule has changed."}</p>
            <ReportDialog locale={locale} guide={guide.slug} />
          </div>
        </div>

        {/* ---------- Related ---------- */}
        {related.length > 0 && (
          <section aria-labelledby="related-title">
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
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-paper-warm text-ink-soft transition-colors duration-200 group-hover:bg-brand group-hover:text-white">
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* Chat helper: free, answers from this guide in the browser. */}
      <AssistantChat
        locale={locale}
        knowledge={{ ne: buildKnowledge(guide, "ne", dept), en: buildKnowledge(guide, "en", dept) }}
        serviceName={tr(guide.title, locale)}
        suggestions={ne ? ["के-के कागजात चाहिन्छ?", "आवेदन कहाँ दिने?", "पेस गरेपछि के हुन्छ?"] : ["What documents do I need?", "Where do I apply?", "What happens after I apply?"]}
      />


      <SectionNav
        locale={locale}
        sections={[
          (guide.situations?.length ?? 0) > 1 && { id: "purpose", label: ne ? "उद्देश्य" : "Purpose" },
          { id: "video", label: ne ? "भिडियो" : "Video" },
          { id: "steps", label: ne ? "लिखित चरण" : "Written steps" },
          { id: "need", label: ne ? "कागजात" : "Documents" },
          { id: "finish", label: ne ? "आवेदन" : "Apply" },
          guide.faqs.length > 0 && { id: "faq", label: ne ? "प्रश्न" : "Questions" },
        ].filter((x): x is { id: string; label: string } => !!x)}
      />
    </article>
  );
}



/** One question and its plain answer. */
function InfoTile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[1.08rem] font-bold text-ink">{label}</h3>
      <div className="mt-2 text-[0.98rem] leading-relaxed text-ink">{children}</div>
    </div>
  );
}

function FactRow({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <div className="mt-1 text-[0.95rem] leading-relaxed text-ink-soft">{children}</div>
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
          <StageTitle id="soon-title">{ne ? "यो गाइड तयार हुँदैछ" : "This guide is being prepared"}</StageTitle>
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
