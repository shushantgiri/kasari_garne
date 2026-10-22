"use client";

import { useActionState } from "react";
import type { Locale } from "@/lib/content/types";
import { dict } from "@/lib/i18n";
import { submitReport, submitRequest, type ActionResult } from "@/app/actions";

export function RequestForm({ locale, service = "", mode }: { locale: Locale; service?: string; mode: "request" | "correction" }) {
  const t = dict(locale);
  const ne = locale === "ne";
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(mode === "request" ? submitRequest : submitReport, null);

  if (state?.ok) {
    return (
      <div role="status" className="card p-6">
        <p className="text-lg font-semibold text-ok">{t.thanks}</p>
        {state.demo && <p className="mt-1 text-sm text-ink-faint">{ne ? "(डेमो मोड: डाटाबेस जोडिएको छैन, त्यसैले सुरक्षित गरिएन।)" : "(Demo mode: no database connected, so this was not saved.)"}</p>}
      </div>
    );
  }

  const err =
    state && !state.ok
      ? state.error === "personal_data"
        ? ne ? "यसमा व्यक्तिगत नम्बर जस्तो देखियो। कृपया हटाएर फेरि पठाउनुहोस्।" : "This looks like it contains a personal number. Please remove it."
        : state.error === "invalid"
          ? ne ? "कृपया आवश्यक ठाउँ भर्नुहोस्।" : "Please fill in the required field."
          : t.formError
      : null;

  return (
    <form action={action} className="card space-y-4 p-5 sm:p-6">
      <input type="hidden" name="locale" value={locale} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      {mode === "request" ? (
        <>
          <div>
            <label className="label" htmlFor="rq-service">{t.requestService}</label>
            <input id="rq-service" name="service" required minLength={2} maxLength={200} defaultValue={service} className="input" placeholder={ne ? "जस्तै: जन्म दर्ता" : "e.g. Birth registration"} />
          </div>
          <div>
            <label className="label" htmlFor="rq-details">{t.requestDetails}</label>
            <textarea id="rq-details" name="details" rows={4} maxLength={2000} className="input py-3" />
          </div>
        </>
      ) : (
        <>
          <div>
            <label className="label" htmlFor="rq-message">{t.reportWhat}</label>
            <textarea id="rq-message" name="message" required minLength={5} maxLength={2000} rows={5} className="input py-3" placeholder={t.reportWhatHint} />
          </div>
          <div>
            <label className="label" htmlFor="rq-url">{t.reportWhere}</label>
            <input id="rq-url" name="source_url" type="url" className="input latin" placeholder="https://….gov.np/…" />
          </div>
        </>
      )}
      <p className="text-sm text-ink-soft">{t.noPersonal}</p>
      {err && <p role="alert" className="rounded-xl bg-brand-tint px-3 py-2 text-sm text-brand-dark">{err}</p>}
      <button type="submit" disabled={pending} className="btn-primary w-full sm:w-auto">{pending ? t.sending : t.send}</button>
    </form>
  );
}
