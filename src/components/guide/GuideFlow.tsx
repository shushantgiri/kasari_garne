"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, ChevronDown, ExternalLink, FileText, ImageUp, PlayCircle } from "lucide-react";
import type { Locale } from "@/lib/content/types";
import { appliesTo } from "@/lib/content/situations";
import { PrepChecklist } from "./PrepChecklist";
import { StepGuide, type StepView } from "./StepGuide";
import { StageTitle } from "./StageTitle";
import { TutorialPlayer } from "@/components/video/TutorialPlayer";
import type { TutorialScript } from "@/lib/video/script";
import type { VideoAsset } from "@/lib/content/types";
import { digits } from "@/lib/i18n";

export interface SituationView { id: string; label: string; hint?: string; pending?: boolean }
export interface FlowDocument { text: string; when?: string; note?: string; for?: string[] }
export interface FlowStep extends StepView { for?: string[]; bodyFor?: Record<string, string> }

interface Props {
  locale: Locale;
  slug: string;
  serviceName: string;
  situations: SituationView[];
  gap?: string;
  documents: FlowDocument[];
  steps: FlowStep[];
  finishHref?: string;
  /** The tutorial, built per purpose ("all" = no purpose chosen yet). */
  scripts?: Record<string, TutorialScript>;
  video?: VideoAsset;
  /** Verified places to send people when their purpose isn't covered yet. */
  help?: { deptName?: string; deptUrl?: string; statusCheck?: { label: string; url: string } };
}

/**
 * "What do you want to do?" → only the documents and steps for that purpose.
 * The choice lives in the URL (?for=renew) so it survives reloads and can be shared.
 * Until something is chosen, everything shows, with "only when…" notes, so nothing is hidden.
 * Stages are numbered (purpose, how to do it, documents); the page continues the count with "Apply".
 */
export function GuideFlow({ locale, slug, serviceName, situations, gap, documents, steps, finishHref, help, scripts, video }: Props) {
  const ne = locale === "ne";
  const [choice, setChoice] = useState<string | null>(null);
  const [changing, setChanging] = useState(false);
  // Set when a person picks a purpose (not when it's restored from the link), so we can show its video.
  const [justChose, setJustChose] = useState(false);
  // Watch or read. Both stay on the page (printing shows the steps); only one is visible.
  const [view, setView] = useState<"video" | "steps">("video");
  const viewRef = useRef(view);
  viewRef.current = view;

  const show = (v: "video" | "steps") => {
    if (v === "steps") window.dispatchEvent(new Event("kg:pause"));
    setView(v);
  };

  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("for");
    if (v && situations.some((s) => s.id === v)) setChoice(v);
  }, [situations]);

  const choose = (id: string) => {
    setChoice(id);
    setChanging(false);
    setJustChose(true);
    setView("video");
    const url = new URL(window.location.href);
    url.searchParams.set("for", id);
    window.history.replaceState(null, "", url);
  };

  // After a pick: bring that purpose's video into view and start it (or the "not ready" note).
  useEffect(() => {
    if (!justChose || !choice) return;
    setJustChose(false);
    const target = situations.find((s) => s.id === choice)?.pending ? "not-ready" : "video";
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Wait a frame so the new player for this purpose is on the page.
    const raf = requestAnimationFrame(() => {
      document.getElementById(target)?.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "start" });
      if (target === "video") window.dispatchEvent(new Event("kg:play"));
    });
    return () => cancelAnimationFrame(raf);
  }, [justChose, choice, situations]);

  // Links to "#steps" (section menu, sidebar, shared links) open the written steps.
  useEffect(() => {
    const check = () => window.location.hash === "#steps" && show("steps");
    check();
    window.addEventListener("hashchange", check);
    // Same-hash clicks don't fire hashchange, so also listen for clicks on links to it.
    const click = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest?.("a")?.getAttribute("href") === "#steps") show("steps");
    };
    document.addEventListener("click", click);
    return () => {
      window.removeEventListener("hashchange", check);
      document.removeEventListener("click", click);
    };
  }, []);

  // "Watch this step" from the written steps: switch to the player, then bring it into view.
  useEffect(() => {
    const h = () => {
      if (viewRef.current === "video") return;
      setView("video");
      requestAnimationFrame(() => document.getElementById("panel-video")?.scrollIntoView({ block: "center" }));
    };
    window.addEventListener("kg:seek", h);
    return () => window.removeEventListener("kg:seek", h);
  }, []);

  const docs = useMemo(() => documents.filter((d) => appliesTo(d, choice)), [documents, choice]);
  const stepList = useMemo(
    () => steps.filter((s) => appliesTo(s, choice)).map((s) => ({ ...s, body: (choice && s.bodyFor?.[choice]) || s.body })),
    [steps, choice],
  );
  const chosen = situations.find((s) => s.id === choice);
  const pending = !!chosen?.pending;
  const hasChoice = situations.length > 1;
  const script = video ? scripts?.[choice ?? "all"] ?? scripts?.all : undefined;
  const tabs = !!script && stepList.length > 0;
  // Stage numbers: purpose (when there's a choice), how to do it, documents.
  const n0 = hasChoice ? 1 : 0;
  // Purposes with a guide come first; "coming soon" ones stay folded away so the choice stays short.
  const ready = situations.filter((s) => !s.pending);
  const later = situations.filter((s) => s.pending);

  const option = (s: SituationView) => {
    const on = choice === s.id;
    return (
      <label
        key={s.id}
        className={`group flex cursor-pointer items-center gap-3 rounded-xl border px-4 transition-[border-color,background-color] duration-150 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-sky/40 ${
          s.pending ? "min-h-[52px] py-2" : "min-h-[60px] py-3"
        } ${on ? "border-brand bg-brand-tint/50" : "border-paper-line bg-white hover:border-ink-faint/50"}`}
      >
        <input type="radio" name={`purpose-${slug}`} value={s.id} checked={on} onChange={() => choose(s.id)} className="sr-only" />
        <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition-colors duration-150 ${on ? "border-brand bg-brand" : "border-ink-faint/40 bg-white"}`} aria-hidden="true">
          {on && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
        </span>
        <span className={`min-w-0 flex-1 leading-snug ${s.pending ? "text-ink-soft" : "text-[1.05rem] font-semibold text-ink"}`}>{s.label}</span>
      </label>
    );
  };

  return (
    <>
      {hasChoice && (
        <section aria-labelledby="purpose-title" className="scroll-mt-24" id="purpose">
          <StageTitle n={1} id="purpose-title" locale={locale}>
            {ne ? "तपाईं के गर्न चाहनुहुन्छ?" : "What do you want to do?"}
          </StageTitle>

          {chosen && !changing ? (
            <div className="mt-4 flex animate-fade items-center justify-between gap-3 rounded-xl border border-brand/25 bg-brand-tint/50 py-2 pl-4 pr-2">
              <span className="flex min-w-0 items-center gap-2.5 font-semibold">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand text-white" aria-hidden="true">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                </span>
                {chosen.label}
              </span>
              <button type="button" onClick={() => setChanging(true)} className="btn-ghost min-h-[44px] shrink-0 text-sm text-sky hover:bg-white">
                {ne ? "बदल्नुहोस्" : "Change"}
              </button>
            </div>
          ) : (
            <fieldset className="mt-4 animate-fade">
              <legend className="sr-only">{ne ? "एउटा छान्नुहोस्" : "Choose one"}</legend>
              <div className="grid gap-2.5 sm:grid-cols-2">{ready.map(option)}</div>
              {later.length > 0 && (
                <details className="group mt-2" open={later.some((s) => s.id === choice)}>
                  <summary className="inline-flex min-h-[44px] cursor-pointer list-none items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink [&::-webkit-details-marker]:hidden">
                    {ne ? `अरू ${digits(later.length, locale)} काम · गाइड छिट्टै आउँदैछ` : `${later.length} more · guides coming soon`}
                    <ChevronDown className="h-4 w-4 transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <div className="mt-1 grid gap-2 sm:grid-cols-2">{later.map(option)}</div>
                </details>
              )}
            </fieldset>
          )}

          <div className="mt-3 space-y-1">
            {situations.some((s) => s.hint) && (!chosen || changing) && (
              <details className="group text-sm">
                <summary className="inline-flex min-h-[44px] cursor-pointer list-none items-center font-semibold text-sky [&::-webkit-details-marker]:hidden">
                  {ne ? "कुन छान्ने थाहा छैन?" : "Not sure which to choose?"}
                </summary>
                <ul className="mb-1 space-y-1.5 rounded-xl bg-sky-tint px-4 py-3 text-ink-soft">
                  {situations.map((s) => s.hint && (
                    <li key={s.id}><strong className="text-ink">{s.label}:</strong> {s.hint}</li>
                  ))}
                </ul>
              </details>
            )}
            {gap && (
              <p className="muted">
                {gap}{" "}
                <Link href={`/${locale}/request?service=${encodeURIComponent(serviceName)}`} className="font-semibold text-sky hover:underline">
                  {ne ? "माग्नुहोस्" : "Request it"}
                </Link>
              </p>
            )}
          </div>
        </section>
      )}

      {/* A purpose we can't verify yet: say so plainly, and point to places that can help. */}
      {pending && chosen && (
        <section id="not-ready" className="scroll-mt-24" aria-labelledby="not-ready-title">
          <StageTitle id="not-ready-title">{ne ? "यो गाइड अझै तयार छैन" : "This guide isn't ready yet"}</StageTitle>
          <p className="mt-2 max-w-2xl text-ink-soft">
            {ne
              ? `“${chosen.label}” का चरण हामीले आधिकारिक पृष्ठमा अझै पुष्टि गरेका छैनौँ, त्यसैले यसको भिडियो वा लिखित गाइड अझै छैन।`
              : `We haven't confirmed the steps for “${chosen.label}” on an official page yet, so there's no video or written guide for it yet.`}
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {chosen.id === "status" && help?.statusCheck && (
              <a href={help.statusCheck.url} target="_blank" rel="noopener noreferrer" className="btn-primary w-full sm:w-auto">
                {ne ? "छापिएको अवस्था हेर्नुहोस्" : "Check print status"} <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            )}
            {help?.deptUrl && (
              <a href={help.deptUrl} target="_blank" rel="noopener noreferrer" className={`${chosen.id === "status" && help.statusCheck ? "btn-secondary" : "btn-primary"} w-full sm:w-auto`}>
                {help.deptName ?? (ne ? "विभागको वेबसाइट" : "Department website")} <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            )}
            <Link href={`/${locale}/request?service=${encodeURIComponent(`${serviceName}: ${chosen.label}`)}`} className="btn-secondary w-full sm:w-auto">
              {ne ? "यो गाइड माग्नुहोस्" : "Request this guide"}
            </Link>
          </div>
          {chosen.id === "status" && help?.statusCheck && <p className="mt-3 text-sm text-ink-faint">{help.statusCheck.label}</p>}
          <p className="mt-4 text-sm text-ink-soft">
            {chosen.id === "status"
              ? ne ? "कार्ड तयार भयो कि भएन, आफ्नो यातायात कार्यालयले पनि बताउन सक्छ।" : "Your transport office can also tell you if your card is ready."
              : ne ? "के लैजाने भनेर आफ्नो यातायात कार्यालयले पनि बताउन सक्छ।" : "Your transport office can also tell you what to bring."}
          </p>
          {situations.some((x) => !x.pending) && (
            <p className="mt-1 text-sm text-ink-faint">
              {ne
                ? `यस पृष्ठको बाँकी भाग “${situations.find((x) => !x.pending)!.label}” का लागि हो।`
                : `The rest of this page is about “${situations.find((x) => !x.pending)!.label}”.`}
            </p>
          )}
        </section>
      )}

      {/* ---------- How to do it: watch the video or read the steps ---------- */}
      {!pending && (
        <section id="video" className="scroll-mt-24" aria-labelledby="video-title">
          <StageTitle n={n0 + 1} id="video-title" locale={locale}>
            {ne ? "कसरी गर्ने?" : "How to do it"}
          </StageTitle>

          {tabs && (
            <div role="tablist" aria-label={ne ? "हेर्ने वा पढ्ने" : "Watch or read"} className="no-print mt-4 flex w-full rounded-xl bg-paper-warm p-1 sm:inline-flex sm:w-auto">
              {([
                ["video", PlayCircle, ne ? "भिडियो हेर्नुहोस्" : "Watch the video", "panel-video"],
                ["steps", FileText, ne ? "पढ्नुहोस्" : "Read", "steps"],
              ] as const).map(([v, Icon, label, panel]) => (
                <button
                  key={v}
                  type="button"
                  role="tab"
                  id={`tab-${v}`}
                  aria-selected={view === v}
                  aria-controls={panel}
                  onClick={() => show(v)}
                  className={`inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg px-4 text-[0.95rem] font-semibold transition-[background-color,color,box-shadow] duration-150 sm:flex-none ${
                    view === v ? "bg-white text-ink shadow-[0_1px_3px_rgba(27,34,48,.12)]" : "text-ink-soft hover:text-ink"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${view === v ? "text-brand" : ""}`} aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
          )}

          {script && video ? (
            <div id="panel-video" role={tabs ? "tabpanel" : undefined} aria-labelledby={tabs ? "tab-video" : undefined} className={`mt-4 scroll-mt-24 ${tabs && view !== "video" ? "hidden" : ""}`}>
              {/* key: a new purpose starts its own video from the beginning */}
              <TutorialPlayer key={choice ?? "all"} locale={locale} script={script} video={video} />
            </div>
          ) : (
            <p className="mt-2 text-ink-soft">{ne ? "यसको भिडियो अझै छैन। तलका लिखित चरण पछ्याउनुहोस्।" : "There's no video for this yet. Follow the written steps below."}</p>
          )}

          {stepList.length > 0 && (
            <div id="steps" role={tabs ? "tabpanel" : undefined} aria-labelledby={tabs ? "tab-steps" : undefined} className={`mt-4 scroll-mt-24 ${tabs && view !== "steps" ? "hidden print:block" : ""}`}>
              <StepGuide locale={locale} steps={stepList} memoryKey={`${slug}-${choice ?? "all"}`} finishHref={finishHref} />
            </div>
          )}
        </section>
      )}

      {/* ---------- What you need ---------- */}
      {!pending && (
        <section id="need" className="scroll-mt-24" aria-labelledby="need-title">
          <StageTitle n={n0 + 2} id="need-title" locale={locale}>
            {ne ? "आवश्यक कागजात" : "Documents you need"}
          </StageTitle>
          <div className="mt-4">
            {docs.length === 0 && (
              <div className="note-warn text-sm" role="note">
                <p className="note-label text-warn">{ne ? "पुष्टि हुन बाँकी" : "Not confirmed yet"}</p>
                <p>{ne ? "आवश्यक कागजात अझै आधिकारिक स्रोतमा पुष्टि भएको छैन। जानुअघि आधिकारिक वेबसाइटमा हेर्नुहोस्।" : "The required documents aren't confirmed on an official page yet. Check the official website before you go."}</p>
              </div>
            )}
            {docs.length > 0 && (
              <PrepChecklist
                key={choice ?? "all"}
                locale={locale}
                slug={choice ? `${slug}-${choice}` : slug}
                // Once a purpose is chosen, "only when…" notes that just restate the purpose are noise; keep the rest.
                items={docs.map((d) => ({ text: d.text, when: choice && d.for?.length ? undefined : d.when, note: d.note }))}
              />
            )}
            {/* Most forms want photos and scans at a set size; point to the tool that does it. */}
            <Link href={`/${locale}/tools/photo`} className="no-print mt-4 flex min-h-[52px] items-center gap-3 rounded-2xl bg-sky-tint/70 px-4 py-3 text-sm transition-colors hover:bg-sky-tint">
              <ImageUp className="h-5 w-5 shrink-0 text-sky" aria-hidden="true" />
              <span className="min-w-0 flex-1 text-ink-soft">
                <strong className="font-semibold text-ink">{ne ? "फोटो वा स्क्यानको साइज मिलाउनु छ?" : "Need a photo or scan at the right size?"}</strong>{" "}
                {ne ? "फोटो साइज टुल प्रयोग गर्नुहोस्।" : "Use the photo size tool."}
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-sky" aria-hidden="true" />
            </Link>
          </div>
        </section>
      )}
    </>
  );
}
