"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Check, ExternalLink } from "lucide-react";
import type { Locale } from "@/lib/content/types";
import { appliesTo } from "@/lib/content/situations";
import { PrepChecklist } from "./PrepChecklist";
import { StepGuide, type StepView } from "./StepGuide";
import { StageTitle } from "./StageTitle";
import { Collapsible } from "./Collapsible";
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
  /** Server-rendered facts beside the checklist: eligibility, fees, time, office visit. */
  aside?: React.ReactNode;
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
 */
export function GuideFlow({ locale, slug, serviceName, situations, gap, documents, steps, aside, finishHref, help, scripts, video }: Props) {
  const ne = locale === "ne";
  const [choice, setChoice] = useState<string | null>(null);
  const [changing, setChanging] = useState(false);
  // Set when a person picks a purpose (not when it's restored from the link), so we can show its video.
  const [justChose, setJustChose] = useState(false);

  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("for");
    if (v && situations.some((s) => s.id === v)) setChoice(v);
  }, [situations]);

  const choose = (id: string) => {
    setChoice(id);
    setChanging(false);
    setJustChose(true);
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

  const docs = useMemo(() => documents.filter((d) => appliesTo(d, choice)), [documents, choice]);
  const stepList = useMemo(
    () => steps.filter((s) => appliesTo(s, choice)).map((s) => ({ ...s, body: (choice && s.bodyFor?.[choice]) || s.body })),
    [steps, choice],
  );
  const chosen = situations.find((s) => s.id === choice);
  const pending = !!chosen?.pending;
  const hasChoice = situations.length > 1;

  return (
    <>
      {hasChoice && (
        <section aria-labelledby="purpose-title" className="scroll-mt-20" id="purpose">
          <h2 id="purpose-title" className="section-title">{ne ? "तपाईं के गर्न चाहनुहुन्छ?" : "What do you want to do?"}</h2>

          {chosen && !changing ? (
            <div className="panel mt-4 flex animate-fade items-center justify-between gap-3 px-4 py-3">
              <span className="flex min-w-0 items-center gap-2.5 font-semibold">
                <Check className="h-5 w-5 shrink-0 text-ok" strokeWidth={2.5} aria-hidden="true" />
                {chosen.label}
              </span>
              <button type="button" onClick={() => setChanging(true)} className="btn-ghost min-h-[44px] shrink-0 text-sm text-sky">
                {ne ? "बदल्नुहोस्" : "Change"}
              </button>
            </div>
          ) : (
            <fieldset className="mt-4 animate-fade">
              <legend className="sr-only">{ne ? "एउटा छान्नुहोस्" : "Choose one"}</legend>
              <div className="panel divide-y divide-paper-line overflow-hidden">
                {situations.map((s) => {
                  const on = choice === s.id;
                  return (
                    <label key={s.id} className={`flex min-h-[60px] cursor-pointer items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-paper-warm active:bg-paper-warm has-[:focus-visible]:bg-sky-tint ${on ? "bg-brand-tint/60" : ""}`}>
                      <input type="radio" name={`purpose-${slug}`} value={s.id} checked={on} onChange={() => choose(s.id)} className="sr-only" />
                      <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition-colors duration-150 ${on ? "border-brand bg-brand" : "border-ink-faint/40 bg-white"}`} aria-hidden="true">
                        {on && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[1.05rem] font-semibold">{s.label}</span>
                        {s.pending && <span className="block text-sm text-ink-faint">{ne ? "गाइड छिट्टै आउँदैछ" : "Guide coming soon"}</span>}
                      </span>
                      
                    </label>
                  );
                })}
              </div>
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
        <section id="not-ready" className="scroll-mt-20" aria-labelledby="not-ready-title">
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

      {/* ---------- The video guide, for the chosen purpose; written steps one tap below ---------- */}
      {!pending && (
        <section id="video" className="scroll-mt-20" aria-labelledby="video-title">
          <StageTitle id="video-title">{ne ? "भिडियो गाइड" : "Video guide"}</StageTitle>
          {video && (scripts?.[choice ?? "all"] ?? scripts?.all) ? (
            <>
              <p className="mt-1 text-sm text-ink-faint">
                {chosen ? `${chosen.label} · ` : ""}{fmtDuration((scripts![choice ?? "all"] ?? scripts!.all).totalMs, locale)} · {ne ? "उपशीर्षक र लिखित रूपसहित" : "with subtitles and transcript"}
              </p>
              <div className="mt-4 w-full">
                {/* key: a new purpose starts its own video from the beginning */}
                <TutorialPlayer key={choice ?? "all"} locale={locale} script={scripts![choice ?? "all"] ?? scripts!.all} video={video} />
              </div>
            </>
          ) : (
            <p className="mt-2 text-ink-soft">{ne ? "यसको भिडियो अझै छैन। तलका लिखित चरण पछ्याउनुहोस्।" : "There's no video for this yet. Follow the written steps below."}</p>
          )}

          {stepList.length > 0 && (
            <div id="steps" className="mt-5 scroll-mt-20 border-t border-paper-line pt-4">
              <Collapsible
                size="row"
                openOnHash="steps"
                title={ne ? `पढ्न रुचाउनुहुन्छ? ${digits(stepList.length, locale)} लिखित चरण हेर्नुहोस्` : `Prefer reading? See the ${stepList.length} written steps`}
              >
                <StepGuide locale={locale} steps={stepList} memoryKey={`${slug}-${choice ?? "all"}`} finishHref={finishHref} />
              </Collapsible>
            </div>
          )}
        </section>
      )}

      {/* ---------- Stage 1: what you need ---------- */}
      {!pending && <section id="need" className="scroll-mt-20" aria-labelledby="need-title">
        <StageTitle n={1} id="need-title" locale={locale}>{ne ? "आवश्यक कागजात" : "Required documents"}</StageTitle>
        <div className={`mt-4 grid gap-8 ${aside ? "lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-10" : ""}`}>
          <div>
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
          </div>
          {aside && <aside className="border-t border-paper-line pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-1">{aside}</aside>}
        </div>
      </section>

      }
    </>
  );
}

/** m:ss, in Nepali digits on Nepali pages. */
function fmtDuration(ms: number, locale: Locale) {
  const sec = Math.round(ms / 1000);
  return digits(`${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`, locale);
}
