"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Flag, X } from "lucide-react";
import type { Locale } from "@/lib/content/types";
import { dict } from "@/lib/i18n";
import { submitReport, type ActionResult } from "@/app/actions";

/**
 * Opens from the "report" button or from anywhere via `kg:report` (with { stepId, stepTitle } from a step).
 * `button={false}` mounts just the dialog, for pages that open it only through the event.
 */
export function ReportDialog({ locale, guide, button = true }: { locale: Locale; guide: string; button?: boolean }) {
  const t = dict(locale);
  const ne = locale === "ne";
  const ref = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState<{ id: string; title: string } | null>(null);
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(submitReport, null);

  useEffect(() => {
    const h = (e: Event) => {
      const d = (e as CustomEvent<{ stepId?: string; stepTitle?: string }>).detail;
      setStep(d?.stepId ? { id: d.stepId, title: d.stepTitle ?? "" } : null);
      ref.current?.showModal();
    };
    window.addEventListener("kg:report", h);
    return () => window.removeEventListener("kg:report", h);
  }, []);

  const err =
    state && !state.ok
      ? state.error === "personal_data"
        ? ne ? "यस सन्देशमा व्यक्तिगत नम्बर जस्तो देखियो। कृपया हटाएर फेरि पठाउनुहोस्।" : "This looks like it contains a personal number. Please remove it and send again."
        : state.error === "invalid"
          ? ne ? "कृपया के गलत छ भनेर केही शब्दमा लेख्नुहोस्।" : "Please describe what is wrong in a few words."
          : t.formError
      : null;

  return (
    <>
      {button && (
        <button type="button" className="btn-secondary" onClick={() => { setStep(null); ref.current?.showModal(); }}>
          <Flag className="h-4 w-4" aria-hidden="true" />
          {t.reportButton}
        </button>
      )}
      <dialog
        ref={ref}
        className="w-[min(92vw,32rem)] rounded-2xl p-0 backdrop:bg-ink/40"
        aria-labelledby="report-title"
        onClick={(e) => { if (e.target === ref.current) ref.current?.close(); }}
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <h2 id="report-title" className="text-lg font-bold">{step ? (ne ? "यो चरण बुझिएन / गलत छ" : "This step is unclear / wrong") : t.report}</h2>
            <button type="button" className="btn-ghost -mr-2 -mt-2" aria-label={t.close} onClick={() => ref.current?.close()}>
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          {state?.ok ? (
            <div className="mt-4" role="status">
              <p className="font-semibold text-ok">{t.thanks}</p>
              {state.demo && <p className="mt-1 text-sm text-ink-faint">{ne ? "(डेमो मोड: डाटाबेस जोडिएको छैन, त्यसैले सुरक्षित गरिएन।)" : "(Demo mode: no database connected, so this was not saved.)"}</p>}
              <button type="button" className="btn-secondary mt-4" onClick={() => ref.current?.close()}>{t.close}</button>
            </div>
          ) : (
            <form action={action} className="mt-4 space-y-4">
              <input type="hidden" name="guide" value={guide} />
              <input type="hidden" name="locale" value={locale} />
              {step && <input type="hidden" name="step" value={step.id} />}
              <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
              {step && <p className="rounded-xl bg-paper-warm px-3 py-2 text-sm">{step.title}</p>}
              <div>
                <label className="label" htmlFor="report-message">{t.reportWhat}</label>
                <textarea id="report-message" name="message" required minLength={5} maxLength={2000} rows={4} className="input py-3" placeholder={t.reportWhatHint} />
              </div>
              <div>
                <label className="label" htmlFor="report-url">{t.reportWhere}</label>
                <input id="report-url" name="source_url" type="url" inputMode="url" className="input latin" placeholder="https://….gov.np/…" />
              </div>
              <p className="text-sm text-ink-soft">{t.noPersonal}</p>
              {err && <p role="alert" className="rounded-xl bg-brand-tint px-3 py-2 text-sm text-brand-dark">{err}</p>}
              <button type="submit" className="btn-primary w-full" disabled={pending}>{pending ? t.sending : t.send}</button>
            </form>
          )}
        </div>
      </dialog>
    </>
  );
}
