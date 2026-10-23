"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { Eye, Languages, RotateCcw, Share2, X } from "lucide-react";
import NepaliDateModule from "nepali-date-converter";
import type { Locale } from "@/lib/content/types";
import { ATTACHMENTS_FIELD, DECLARATION, SIGNER_FIELDS, fillLetter, type LetterTemplate } from "@/lib/content/letters";
import { digits, tr } from "@/lib/i18n";
import { bestNepali, convertLastWord, suggestions } from "@/lib/translit";

// The package is UMD: bundlers hand over the class itself, plain Node hands over { default }.
const NepaliDate = (NepaliDateModule as unknown as { default?: typeof NepaliDateModule }).default ?? NepaliDateModule;

/** Today's date in Bikram Sambat, as letters write it: २०८३/०७/०५. */
function todayBS(): string {
  try {
    return digits(new NepaliDate(new Date()).format("YYYY/MM/DD"), "ne");
  } catch {
    return "";
  }
}

/**
 * Fill in a letter on the phone: fields first, the letter below updating as you type,
 * and Copy / Share / Print always at hand. The main text follows the fields until the person
 * edits it themselves. What they type is kept on this device only, so they can come back to it.
 */
export function LetterEditor({ locale, template }: { locale: Locale; template: LetterTemplate }) {
  const ne = locale === "ne";
  const id = useId();
  const key = `kg-letter-${template.id}`;
  const fields = [...template.fields, ...SIGNER_FIELDS, ...(template.attachments ? [ATTACHMENTS_FIELD] : [])];

  const [values, setValues] = useState<Record<string, string>>({});
  const [date, setDate] = useState("");
  // null = the main text follows the fields; a string = the person has written their own.
  const [body, setBody] = useState<string | null>(null);
  // The finished letter, full screen, as it will look on paper.
  const [previewing, setPreviewing] = useState(false);
  // The truthfulness line from official forms: on by default only where it fits (not for leave).
  const [declare, setDeclare] = useState(!!template.declaration);
  // Type in Roman letters, get Nepali: "raam " → "राम ". On by default; the choice is remembered.
  const [roman, setRoman] = useState(true);

  useEffect(() => {
    try {
      setRoman(localStorage.getItem("kg-roman") !== "off");
    } catch {}
  }, []);
  const toggleRoman = () =>
    setRoman((on) => {
      try {
        localStorage.setItem("kg-roman", on ? "off" : "on");
      } catch {}
      return !on;
    });

  type Field = HTMLInputElement | HTMLTextAreaElement;
  // While a Roman word is being typed: Nepali spellings to choose from, shown under that field.
  const [sugg, setSugg] = useState<{ field: string; start: number; end: number; list: string[]; el: Field; apply: (v: string) => void } | null>(null);

  /** Work out suggestions for the Roman word just before the cursor, if there is one. */
  const suggestFor = (field: string, el: Field, text: string, caret: number, apply: (v: string) => void) => {
    const m = /[A-Za-z~]+$/.exec(text.slice(0, caret));
    setSugg(m ? { field, start: m.index, end: caret, list: suggestions(m[0], 5), el, apply } : null);
  };

  /** As someone types: the Roman word before a space or punctuation becomes Nepali, keeping the cursor in place. */
  const typed = (e: React.ChangeEvent<Field>, field: string, apply: (v: string) => void, plain?: boolean) => {
    const el = e.target;
    const caret = el.selectionStart ?? el.value.length;
    if (!roman) {
      setSugg(null);
      return apply(el.value);
    }
    // Number fields (phone, dates…): digits become Nepali as typed; same length, so the cursor stays put.
    if (plain) {
      setSugg(null);
      return apply(digits(el.value, "ne"));
    }
    const r = convertLastWord(el.value, caret);
    if (!r) {
      apply(el.value);
      return suggestFor(field, el, el.value, caret, apply);
    }
    apply(r.text);
    setSugg(null);
    requestAnimationFrame(() => el.setSelectionRange(r.caret, r.caret));
  };

  /** A tapped suggestion replaces the word being typed, followed by a space; the keyboard stays open. */
  const pick = (choice: string) => {
    if (!sugg) return;
    const { el, start, end, apply } = sugg;
    const v = el.value;
    const next = v.slice(0, start) + choice + " " + v.slice(end);
    apply(next);
    setSugg(null);
    const caret = start + choice.length + 1;
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(caret, caret);
    });
  };

  /** Leaving a field: its last word, with no space after it yet, becomes Nepali too. */
  const left = (e: React.FocusEvent<Field>, apply: (v: string) => void, plain?: boolean) => {
    setSugg(null);
    if (!roman || plain) return;
    const v = e.target.value;
    const next = v.replace(/[A-Za-z~]+$/, (w) => bestNepali(w));
    if (next !== v) apply(next);
  };

  /** The row of suggestions under a field; the first is what a space would choose. */
  const chips = (field: string) =>
    sugg?.field === field && sugg.list.length > 0 ? (
      <div className="mt-2 flex animate-fade gap-1.5 overflow-x-auto pb-0.5" role="listbox" aria-label={ne ? "शब्द छान्नुहोस्" : "Choose a word"}>
        {sugg.list.map((w, i) => (
          <button
            key={w}
            type="button"
            role="option"
            aria-selected={i === 0}
            // Keep focus (and the phone keyboard) in the field while tapping.
            onPointerDown={(e) => e.preventDefault()}
            onClick={() => pick(w)}
            className={`min-h-[40px] shrink-0 rounded-full px-3.5 text-base transition-colors ${i === 0 ? "bg-sky text-white" : "bg-white text-ink ring-1 ring-paper-line hover:bg-sky-tint"}`}
          >
            {w}
          </button>
        ))}
      </div>
    ) : null;
  // Phones would capitalise and "correct" Roman Nepali into English words; switch that off while converting.
  const romanProps = roman ? ({ autoCapitalize: "off", autoCorrect: "off", spellCheck: false } as const) : {};

  useEffect(() => {
    let saved: { values?: Record<string, string>; date?: string; body?: string | null; declare?: boolean } = {};
    try {
      saved = JSON.parse(localStorage.getItem(key) ?? "{}");
    } catch {}
    setValues(saved.values ?? {});
    setDate(saved.date || todayBS());
    setBody(saved.body ?? null);
    setDeclare(saved.declare ?? !!template.declaration);
  }, [key, template.declaration]);

  useEffect(() => {
    if (!date) return; // not loaded yet
    try {
      localStorage.setItem(key, JSON.stringify({ values, date, body, declare }));
    } catch {}
  }, [key, values, date, body, declare]);

  const set = (k: string, v: string) => setValues((x) => ({ ...x, [k]: v }));
  const mainText = body ?? fillLetter(template.body, values);

  const letter = useMemo(
    () => ({
      to: template.to.map((l) => fillLetter(l, values)),
      subject: fillLetter(template.subject, values),
      signer: [
        "दस्तखत: ........................",
        `नाम थर: ${fillLetter("{name}", values)}`,
        ...(template.signer ?? []).map((l) => fillLetter(l, values)),
        `ठेगाना: ${fillLetter("{address}", values)}`,
        `सम्पर्क नं.: ${fillLetter("{phone}", values)}`,
      ],
      attachments: template.attachments && values.attachments?.trim() ? `संलग्न कागजात: ${values.attachments.trim()}` : "",
    }),
    [template, values],
  );

  const plain = () =>
    [
      `मिति: ${date}`, "", ...letter.to, "", `विषय: ${letter.subject}`, "", "महोदय,", mainText, "",
      ...(declare ? [DECLARATION, ""] : []),
      "निवेदक", ...letter.signer,
      ...(letter.attachments ? ["", letter.attachments] : []),
    ].join("\n");

  // Preview: close with Escape, and keep the page behind from scrolling.
  useEffect(() => {
    if (!previewing) return;
    const key = (e: KeyboardEvent) => e.key === "Escape" && setPreviewing(false);
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    window.addEventListener("keydown", key);
    return () => {
      document.documentElement.style.overflow = prev;
      window.removeEventListener("keydown", key);
    };
  }, [previewing]);
  const share = () => {
    const text = plain();
    if ("share" in navigator) navigator.share({ title: letter.subject, text }).catch(() => {});
    else window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  };
  const reset = () => {
    setValues({});
    setBody(null);
    setDate(todayBS());
    setDeclare(!!template.declaration);
  };

  const action = "inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors";

  const paper = (
    <article
      lang="ne"
      className="print-letter rounded-2xl border border-paper-line bg-white px-6 py-8 text-[0.98rem] leading-[1.9] text-ink shadow-[0_18px_40px_-28px_rgba(27,34,48,0.45)] sm:px-10 sm:py-12"
      aria-label={ne ? "निवेदनको नमुना" : "Letter preview"}
    >
      <p className="text-right">मिति: {date}</p>
      <div className="mt-4">
        {letter.to.map((l, i) => (
          <p key={i}>{l}</p>
        ))}
      </div>
      <p className="mt-5 text-center font-bold">
        विषय: <span className="underline decoration-1 underline-offset-4">{letter.subject}</span>
      </p>
      <p className="mt-5">महोदय,</p>
      {mainText.split(/\n\s*\n/).map((para, i) => (
        <p key={i} className="mt-2 whitespace-pre-wrap indent-8">{para}</p>
      ))}
      {declare && <p className="mt-6 text-[0.92rem]">{DECLARATION}</p>}
      <div className="ml-auto mt-10 w-fit min-w-[14rem]">
        <p className="font-bold">निवेदक</p>
        {letter.signer.map((l, i) => (
          <p key={i}>{l}</p>
        ))}
      </div>
      {letter.attachments && <p className="mt-8 text-[0.92rem]">{letter.attachments}</p>}
    </article>
  );

  return (
    <div className="pb-20 md:pb-0">
      <div className="grid gap-5 md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] md:items-start">
        {/* ---------- Fields ---------- */}
        <section className="no-print rounded-3xl border border-paper-line bg-white p-5 sm:p-6" aria-labelledby={`${id}-fill`}>
          <div className="flex items-center justify-between gap-3">
            <h2 id={`${id}-fill`} className="font-bold text-ink">{ne ? "विवरण भर्नुहोस्" : "Fill in the details"}</h2>
            <button type="button" onClick={reset} className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-2.5 text-sm text-ink-faint hover:bg-paper-warm hover:text-ink">
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              {ne ? "सबै मेटाउनुहोस्" : "Clear"}
            </button>
          </div>

          {/* Roman → Nepali switch, with the few rules people need. */}
          <button
            type="button"
            role="switch"
            aria-checked={roman}
            onClick={toggleRoman}
            className="mt-4 flex w-full items-center gap-3 rounded-xl bg-paper-warm/70 px-3.5 py-2.5 text-left"
          >
            <Languages className={`h-5 w-5 shrink-0 ${roman ? "text-sky" : "text-ink-faint"}`} aria-hidden="true" />
            <span className="min-w-0 flex-1 text-sm">
              <span className="font-semibold text-ink">{ne ? "रोमनमा लेख्नुहोस्" : "Type in Roman"}</span>
              <span className="latin ml-1.5 text-ink-faint">raam → <span lang="ne">राम</span></span>
            </span>
            <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${roman ? "bg-sky" : "bg-ink-faint/40"}`} aria-hidden="true">
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-[left] duration-150 ${roman ? "left-[1.375rem]" : "left-0.5"}`} />
            </span>
          </button>

          {/* Nepali verbs agree with the writer: "आएको छु" (man), "आएकी छु" (woman). */}
          <div className="mt-3 flex rounded-xl bg-paper-warm p-1" role="group" aria-label={ne ? "निवेदक" : "Applicant"}>
            {([
              ["को", ne ? "पुरुष" : "Man"],
              ["की", ne ? "महिला" : "Woman"],
            ] as const).map(([v, text]) => {
              const on = (values.ko ?? "को") === v;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => set("ko", v)}
                  aria-pressed={on}
                  className={`min-h-[40px] flex-1 rounded-lg text-sm font-semibold transition-[background-color,color,box-shadow] duration-150 ${on ? "bg-white text-ink shadow-[0_1px_3px_rgba(27,34,48,.12)]" : "text-ink-soft hover:text-ink"}`}
                >
                  {text}
                </button>
              );
            })}
          </div>

          <div className="mt-4 space-y-3.5">
            <div>
              <label className="label" htmlFor={`${id}-date`}>{ne ? "मिति" : "Date"}</label>
              <input id={`${id}-date`} value={date} inputMode="tel" onChange={(e) => setDate(roman ? digits(e.target.value, "ne") : e.target.value)} className="input" />
            </div>
            {fields.map((f) => (
              <div key={f.key}>
                <label className="label" htmlFor={`${id}-${f.key}`}>{tr(f.label, locale)}</label>
                {f.key === "message" ? (
                  <textarea
                    id={`${id}-${f.key}`}
                    rows={4}
                    value={values[f.key] ?? ""}
                    placeholder={f.example}
                    onChange={(e) => typed(e, f.key, (v) => set(f.key, v))}
                    onBlur={(e) => left(e, (v) => set(f.key, v))}
                    className="input py-3"
                    {...romanProps}
                  />
                ) : (
                  <input
                    id={`${id}-${f.key}`}
                    value={values[f.key] ?? ""}
                    placeholder={f.example}
                    inputMode={f.plain && f.key !== "docNumber" ? "tel" : undefined}
                    onChange={(e) => typed(e, f.key, (v) => set(f.key, v), f.plain)}
                    onBlur={(e) => left(e, (v) => set(f.key, v), f.plain)}
                    className="input"
                    {...(f.plain ? {} : romanProps)}
                  />
                )}
                {chips(f.key)}
              </div>
            ))}
            <div>
              <div className="flex items-baseline justify-between gap-2">
                <label className="label" htmlFor={`${id}-body`}>{ne ? "मुख्य कुरा (आफैँ बदल्न सकिन्छ)" : "Main text (you can change it)"}</label>
                {body !== null && (
                  <button type="button" onClick={() => setBody(null)} className="mb-1.5 shrink-0 text-xs font-semibold text-sky hover:underline">
                    {ne ? "पहिलेजस्तै" : "Undo changes"}
                  </button>
                )}
              </div>
              <textarea
                id={`${id}-body`}
                rows={6}
                value={mainText}
                onChange={(e) => typed(e, "body", setBody)}
                onBlur={(e) => left(e, setBody)}
                className="input py-3 leading-relaxed"
                {...romanProps}
              />
              {chips("body")}
            </div>
            {/* Official forms carry this line; ordinary letters (leave and so on) don't need it. */}
            <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-paper-warm/70 px-3.5 py-3">
              <input type="checkbox" checked={declare} onChange={(e) => setDeclare(e.target.checked)} className="tick mt-0.5" />
              <span className="min-w-0 text-sm">
                <span className="block font-semibold text-ink">{ne ? "सत्यताको उद्घोष थप्ने" : "Add the declaration of truth"}</span>
                <span className="block text-ink-faint">{ne ? "सरकारी कार्यालयका निवेदनमा प्रायः चाहिन्छ।" : "Usually needed for government offices."}</span>
              </span>
            </label>
          </div>
          <p className="mt-4 text-sm text-ink-faint">
            {ne ? "तपाईंले लेखेको कुरा यही फोनमा मात्र रहन्छ। कार्यालयको आफ्नै फाराम छ भने त्यही प्रयोग गर्नुहोस्।" : "What you type stays on this device only. If the office has its own form, use that instead."}
          </p>
        </section>

        {/* ---------- The letter ---------- */}
        <div className="md:sticky md:top-24">
          {paper}

          {/* Actions: under the letter on wide screens, fixed to the bottom on phones. */}
          <div className="no-print fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t border-paper-line sm:bottom-0 bg-white/95 p-3 backdrop-blur md:static md:mt-4 md:border-0 md:bg-transparent md:p-0">
            <div className="mx-auto flex max-w-xl gap-2">
              <button type="button" onClick={() => setPreviewing(true)} className={`${action} bg-paper-warm text-ink hover:bg-paper-line/60`}>
                <Eye className="h-4 w-4" aria-hidden="true" />
                {ne ? "पूर्वावलोकन" : "Preview"}
              </button>
              <button type="button" onClick={share} className={`${action} bg-brand text-white hover:bg-brand-dark`}>
                <Share2 className="h-4 w-4" aria-hidden="true" />
                {ne ? "शेयर" : "Share"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {previewing && (
        <div role="dialog" aria-modal="true" aria-label={ne ? "पूर्वावलोकन" : "Preview"} className="no-print fixed inset-0 z-50 flex animate-fade flex-col bg-ink/60 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3 bg-white px-4 py-2.5 shadow-card">
            <p className="font-semibold text-ink">{ne ? "पूर्वावलोकन" : "Preview"}</p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={share} className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark">
                <Share2 className="h-4 w-4" aria-hidden="true" />
                {ne ? "शेयर" : "Share"}
              </button>
              <button type="button" onClick={() => setPreviewing(false)} aria-label={ne ? "बन्द गर्नुहोस्" : "Close"} className="grid h-11 w-11 place-items-center rounded-full text-ink-soft hover:bg-paper-warm hover:text-ink">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 sm:p-8" onClick={(e) => e.target === e.currentTarget && setPreviewing(false)}>
            <div className="mx-auto max-w-2xl animate-rise">{paper}</div>
          </div>
        </div>
      )}
    </div>
  );
}
