"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, ChevronDown, ChevronUp, CircleHelp, List, PlayCircle } from "lucide-react";
import type { Locale } from "@/lib/content/types";
import { dict, digits } from "@/lib/i18n";

export interface StepView {
  id: string;
  title: string;
  body: string;
  unconfirmed: boolean;
  simpler?: string;
  example?: string;
  warning?: string;
  hasVideo: boolean;
}

/**
 * The verified steps as a guided flow: one step at a time with "Step 3 of 8", Back and Next.
 * "Show all steps" lists them together. Printing always includes every step.
 * The current step is remembered for this browser tab, per guide and purpose.
 */
export function StepGuide({ locale, steps, memoryKey, finishHref }: { locale: Locale; steps: StepView[]; memoryKey: string; finishHref?: string }) {
  const t = dict(locale);
  const ne = locale === "ne";
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState<"next" | "back" | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [openHelp, setOpenHelp] = useState<string | null>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const key = `kg-step-${memoryKey}`;

  // Restore the step on return; start again when the purpose (and so the steps) changes.
  useEffect(() => {
    let saved = 0;
    try {
      saved = Number(sessionStorage.getItem(key) ?? 0);
    } catch {}
    setIdx(Number.isInteger(saved) && saved >= 0 && saved < steps.length ? saved : 0);
    setOpenHelp(null);
  }, [key, steps.length]);

  const go = (n: number) => {
    setDir(n > idx ? "next" : "back");
    setIdx(n);
    setOpenHelp(null);
    try {
      sessionStorage.setItem(key, String(n));
    } catch {}
    const el = topRef.current;
    if (el && el.getBoundingClientRect().top < 0) el.scrollIntoView({ block: "start" });
  };

  if (steps.length === 0) return null;
  const last = steps.length - 1;
  const of = (i: number) => (ne ? `चरण ${digits(i + 1, locale)} / ${digits(steps.length, locale)}` : `Step ${i + 1} of ${steps.length}`);

  const seek = (stepId: string) => window.dispatchEvent(new CustomEvent("kg:seek", { detail: { stepId } }));
  const report = (s: StepView, i: number) =>
    window.dispatchEvent(new CustomEvent("kg:report", { detail: { stepId: s.id, stepTitle: `${t.step} ${digits(i + 1, locale)}: ${s.title}` } }));

  const card = (s: StepView, i: number) => {
    const helpOpen = openHelp === s.id;
    return (
      <div className="flex gap-3 sm:gap-4">
        {/* Done = green tick, current = red, still to do = outlined. */}
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-base font-bold transition-colors duration-200 ${
            i < idx ? "bg-ok text-white" : i === idx ? "bg-brand text-white" : "border-2 border-paper-line bg-white text-ink-soft"
          }`}
          aria-hidden="true"
        >
          {i < idx ? <Check className="h-4 w-4" strokeWidth={3} /> : digits(i + 1, locale)}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="pt-0.5 text-lg font-bold leading-snug">
            <span className="sr-only">{t.step} {i + 1}: </span>
            {s.title}
          </h3>
          {s.unconfirmed && (
            <span className="chip mt-1.5 bg-warn-tint text-warn" title={t.needsReviewHint}>
              <CircleHelp className="h-3.5 w-3.5" aria-hidden="true" />
              {t.needsReview}
            </span>
          )}
          <p className="mt-1.5 max-w-prose text-[1.05rem] text-ink-soft">{s.body}</p>

          {s.warning && (
            <div className="note-warn mt-3">
              <p className="note-label text-warn"><AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />{ne ? "ध्यान दिनुहोस्" : "Watch out"}</p>
              <p>{s.warning}</p>
            </div>
          )}

          <div className="no-print mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setOpenHelp(helpOpen ? null : s.id)}
              aria-expanded={helpOpen}
              aria-controls={`help-${s.id}`}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-paper-line px-3.5 text-sm font-semibold text-sky hover:bg-sky-tint"
            >
              {ne ? "यो बुझिनँ" : "I don't understand"}
              {helpOpen ? <ChevronUp className="h-4 w-4" aria-hidden="true" /> : <ChevronDown className="h-4 w-4" aria-hidden="true" />}
            </button>
            {s.hasVideo && (
              <button type="button" onClick={() => seek(s.id)} className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-paper-line px-3.5 text-sm font-semibold text-ink-soft hover:bg-paper-warm">
                <PlayCircle className="h-4 w-4" aria-hidden="true" />
                {ne ? "भिडियोमा हेर्नुहोस्" : "Watch this step"}
              </button>
            )}
          </div>

          {helpOpen && (
            <div id={`help-${s.id}`} className="note-tip mt-3 animate-rise space-y-3">
              <p>{s.simpler ?? (ne ? "भिडियोमा यो चरण बिस्तारै हेर्नुहोस्, र गति ०.७५× मा राख्नुहोस्।" : "Watch this step in the video at 0.75× speed.")}</p>
              {s.example && (
                <div>
                  <p className="note-label text-sky">{ne ? "उदाहरण (काल्पनिक विवरण)" : "Example (fictional details)"}</p>
                  <p className="mt-1 rounded-lg bg-white px-3 py-2 text-[0.95rem]">{s.example}</p>
                </div>
              )}
              <button type="button" onClick={() => report(s, i)} className="text-sm font-semibold text-sky underline underline-offset-4">
                {ne ? "अझै बुझिनँ — हामीलाई भन्नुहोस्" : "Still unclear — tell us"}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const toggle = (
    <button type="button" onClick={() => setShowAll((v) => !v)} className="no-print inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink" aria-pressed={showAll}>
      <List className="h-4 w-4" aria-hidden="true" />
      {showAll ? (ne ? "एक-एक गरी हेर्नुहोस्" : "One step at a time") : ne ? "सबै चरण हेर्नुहोस्" : "Show all steps"}
    </button>
  );

  if (showAll) {
    return (
      <div ref={topRef} className="scroll-mt-24">
        <div className="mb-3 flex justify-end">{toggle}</div>
        <ol className="stagger space-y-3">
          {steps.map((s, i) => (
            <li key={s.id} id={`step-${s.id}`} onClick={() => i !== idx && go(i)} className={`scroll-mt-24 rounded-xl border bg-paper-warm/40 p-4 transition-colors duration-200 sm:p-5 ${i === idx ? "border-brand/30 bg-white" : "border-paper-line"}`}>{card(s, i)}</li>
          ))}
        </ol>
        {finishHref && <FinishLink href={finishHref} ne={ne} />}
      </div>
    );
  }

  return (
    <div ref={topRef} className="scroll-mt-24">
      {/* Progress */}
      <div className="no-print mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink" aria-live="polite">{of(idx)}</p>
        {toggle}
      </div>
      <div className="no-print mb-4 flex gap-1" aria-hidden="true">
        {steps.map((s, i) => (
          <span key={s.id} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ease-soft ${i <= idx ? "bg-brand" : "bg-paper-line"}`} />
        ))}
      </div>

      <ol>
        {steps.map((s, i) => (
          <li key={s.id} id={`step-${s.id}`} className={`scroll-mt-24 rounded-xl border border-paper-line bg-paper-warm/40 p-4 sm:p-5 ${i === idx ? (dir === "next" ? "animate-step-next" : dir === "back" ? "animate-step-back" : "") : "hidden print:mb-3 print:block"}`}>
            {card(s, i)}
          </li>
        ))}
      </ol>

      {/* One main action: the next step. Back is secondary. */}
      <div className="no-print mt-4 flex items-center justify-between gap-3">
        <button type="button" onClick={() => go(idx - 1)} disabled={idx === 0} className="btn-ghost disabled:invisible">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {ne ? "अघिल्लो" : "Back"}
        </button>
        {idx < last ? (
          <button type="button" onClick={() => go(idx + 1)} className="btn-primary">
            {ne ? "अर्को चरण" : "Next step"}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : (
          finishHref && (
            <a href={finishHref} className="btn-primary">
              {ne ? "सकियो — आवेदन दिनुहोस्" : "Done — go to apply"}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          )
        )}
      </div>
    </div>
  );
}

function FinishLink({ href, ne }: { href: string; ne: boolean }) {
  return (
    <a href={href} className="no-print mt-4 inline-flex min-h-[44px] items-center gap-1.5 font-semibold text-brand hover:underline">
      {ne ? "अर्को: आधिकारिक वेबसाइटमा जानुहोस्" : "Next: continue on the official website"} →
    </a>
  );
}
