"use client";

import { useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import type { Locale } from "@/lib/content/types";
import { dict } from "@/lib/i18n";
import { submitFeedback } from "@/app/actions";

const REASONS = [
  { id: "hard_to_understand", ne: "बुझ्न गाह्रो भयो", en: "Hard to understand" },
  { id: "outdated", ne: "जानकारी पुरानो छ", en: "Information is outdated" },
  { id: "missing_step", ne: "एउटा चरण छुटेको छ", en: "A step is missing" },
  { id: "video_failed", ne: "भिडियो चलेन", en: "Video didn't play" },
  { id: "other", ne: "अरू समस्या", en: "Something else" },
];

export function FeedbackWidget({ locale, guide }: { locale: Locale; guide: string }) {
  const t = dict(locale);
  const ne = locale === "ne";
  const [stage, setStage] = useState<"ask" | "reason" | "done">("ask");
  const [reason, setReason] = useState<string>("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async (useful: boolean) => {
    setBusy(true);
    setError(null);
    const r = await submitFeedback({ guide, useful, reason: reason || undefined, message, locale }).catch(() => ({ ok: false as const, error: "server" as const }));
    setBusy(false);
    if (r.ok) setStage("done");
    else setError(r.error === "personal_data" ? (ne ? "व्यक्तिगत नम्बर हटाएर पठाउनुहोस्।" : "Please remove personal numbers and try again.") : t.formError);
  };

  if (stage === "done") {
    return <p role="status" className="font-semibold text-ok">{ne ? "धन्यवाद! तपाईंको प्रतिक्रियाले गाइड सुधार्न मद्दत गर्छ।" : "Thank you! Your feedback helps us improve this guide."}</p>;
  }

  return (
    <div>
      <h2 className="text-lg font-bold">{ne ? "यो गाइड उपयोगी भयो?" : "Was this guide useful?"}</h2>
      {stage === "ask" && (
        <div className="mt-3 flex gap-2">
          <button type="button" disabled={busy} onClick={() => send(true)} className="btn-secondary flex-1 sm:flex-none">
            <ThumbsUp className="h-5 w-5" aria-hidden="true" /> {ne ? "भयो" : "Yes"}
          </button>
          <button type="button" disabled={busy} onClick={() => setStage("reason")} className="btn-secondary flex-1 sm:flex-none">
            <ThumbsDown className="h-5 w-5" aria-hidden="true" /> {ne ? "भएन" : "No"}
          </button>
        </div>
      )}
      {stage === "reason" && (
        <form
          className="mt-3 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            send(false);
          }}
        >
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">{ne ? "के समस्या भयो?" : "What went wrong?"}</legend>
            <div className="flex flex-wrap gap-2">
              {REASONS.map((r) => (
                <label key={r.id} className={`cursor-pointer rounded-full border px-3.5 py-2 text-sm ${reason === r.id ? "border-sky bg-sky-tint font-semibold text-sky" : "border-paper-line hover:bg-paper-warm"}`}>
                  <input type="radio" name="reason" value={r.id} className="sr-only" checked={reason === r.id} onChange={() => setReason(r.id)} />
                  {ne ? r.ne : r.en}
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <label className="label" htmlFor="fb-msg">{ne ? "थप कुरा (ऐच्छिक)" : "Anything else? (optional)"}</label>
            <textarea id="fb-msg" rows={3} maxLength={1000} value={message} onChange={(e) => setMessage(e.target.value)} className="input py-3" />
            <p className="mt-1 text-xs text-ink-faint">{t.noPersonal}</p>
          </div>
          {error && <p role="alert" className="text-sm text-brand-dark">{error}</p>}
          <button type="submit" disabled={busy || !reason} className="btn-primary">{busy ? t.sending : t.send}</button>
        </form>
      )}
    </div>
  );
}
