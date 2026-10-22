"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, Search, Square } from "lucide-react";
import type { Locale } from "@/lib/content/types";
import { buildIndex, detectPurpose, search } from "@/lib/search/search";
import type { GuideTeaser } from "@/lib/search/teaser";
import { guideHref } from "@/lib/search/href";
import { dict, tr } from "@/lib/i18n";
import { ServiceIcon } from "@/components/ui/ServiceIcon";

interface Props {
  locale: Locale;
  teasers: GuideTeaser[];
  initialQuery?: string;
  size?: "lg" | "md";
  autoFocus?: boolean;
  /** Example questions that take turns as the placeholder (homepage). */
  examples?: readonly string[];
}

/* Minimal typing for the browser speech API (not in TypeScript's DOM lib everywhere). */
interface Recognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}
type RecognitionCtor = new () => Recognition;
const getRecognition = (): RecognitionCtor | undefined =>
  typeof window === "undefined" ? undefined : ((window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }).SpeechRecognition ?? (window as unknown as { webkitSpeechRecognition?: RecognitionCtor }).webkitSpeechRecognition);

type Voice = { state: "idle" } | { state: "listening" } | { state: "processing" } | { state: "heard"; text: string } | { state: "error"; msg: string };

/**
 * Search with live suggestions and optional voice input. Works without JavaScript too (plain GET form).
 * Voice never searches on its own: the recognised words go into the box for the visitor to check first.
 */
export function SearchBox({ locale, teasers, initialQuery = "", size = "lg", autoFocus, examples }: Props) {
  const t = dict(locale);
  const ne = locale === "ne";
  const router = useRouter();
  const id = useId();
  const listId = `${id}-list`;
  const [q, setQ] = useState(initialQuery);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [canVoice, setCanVoice] = useState(false);
  const [voice, setVoice] = useState<Voice>({ state: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const [hint, setHint] = useState(0);
  const [canRotate, setCanRotate] = useState(false);
  const recRef = useRef<Recognition | null>(null);

  // Decided after mount so server and browser render the same HTML.
  useEffect(() => setCanVoice(!!getRecognition()), []);
  useEffect(() => () => recRef.current?.stop(), []);

  // Example questions take turns in the empty box: first the normal placeholder, then real questions.
  const hints = useMemo(() => [t.searchPlaceholder, ...(examples ?? [])], [t.searchPlaceholder, examples]);
  useEffect(() => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "reduce";
    setCanRotate(!!examples?.length && !still);
  }, [examples]);

  const index = useMemo(() => buildIndex(teasers), [teasers]);
  const hits = useMemo(() => {
    if (q.trim().length < 2) return [];
    return search(index, q, { includeDrafts: true, limit: 5 })
      .map((h) => teasers.find((g) => g.slug === h.slug)!)
      .filter(Boolean);
  }, [q, index, teasers]);

  const go = (slug?: string) => {
    setOpen(false);
    if (slug) {
      const g = teasers.find((x) => x.slug === slug);
      if (g) router.push(guideHref(locale, g, q));
    } else if (q.trim()) {
      router.push(`/${locale}/search?q=${encodeURIComponent(q.trim())}`);
    }
  };

  const listen = () => {
    if (voice.state === "listening" || voice.state === "processing") {
      recRef.current?.stop();
      return;
    }
    const Ctor = getRecognition();
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = ne ? "ne-NP" : "en-IN";
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    let text = "";
    rec.onresult = (e) => {
      text = Array.from(e.results).map((r) => r[0].transcript).join(" ").trim();
      setQ(text);
    };
    // Speech ended, words still being recognised.
    (rec as Recognition & { onspeechend: (() => void) | null }).onspeechend = () => setVoice((v) => (v.state === "listening" ? { state: "processing" } : v));
    rec.onerror = (e) =>
      setVoice({
        state: "error",
        msg:
          e.error === "not-allowed" || e.error === "service-not-allowed"
            ? ne ? "माइक्रोफोन प्रयोग गर्ने अनुमति दिनुहोस्, वा टाइप गर्नुहोस्।" : "Allow microphone access, or type instead."
            : e.error === "no-speech"
              ? ne ? "केही सुनिएन। फेरि बोल्नुहोस्।" : "Didn't hear anything. Try again."
              : e.error === "network"
                ? ne ? "आवाज बुझ्न इन्टरनेट चाहिन्छ। टाइप गरेर खोज्नुहोस्।" : "Voice needs internet. Please type instead."
                : ne ? "आवाज बुझ्न सकिएन। टाइप गरेर खोज्नुहोस्।" : "Couldn't understand. Please type instead.",
      });
    rec.onend = () => {
      recRef.current = null;
      setVoice((v) => (v.state === "error" ? v : text ? { state: "heard", text } : { state: "idle" }));
      if (text) {
        setOpen(true);
        inputRef.current?.focus();
      }
    };
    recRef.current = rec;
    setVoice({ state: "listening" });
    try {
      rec.start();
    } catch {
      setVoice({ state: "error", msg: ne ? "आवाज सुरु गर्न सकिएन। टाइप गर्नुहोस्।" : "Couldn't start voice. Please type." });
    }
  };

  const showList = open && hits.length > 0;
  const rotating = canRotate && !q && !focused && voice.state === "idle";
  useEffect(() => {
    if (!rotating) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setHint((h) => (h + 1) % hints.length);
    }, 2800);
    return () => window.clearInterval(timer);
  }, [rotating, hints.length]);
  const listening = voice.state === "listening";
  const processing = voice.state === "processing";
  const micLabel = listening || processing ? (ne ? "सुन्न रोक्नुहोस्" : "Stop listening") : ne ? "बोलेर खोज्नुहोस्" : "Search by voice";

  return (
    <form
      role="search"
      action={`/${locale}/search`}
      method="get"
      onSubmit={(e) => {
        e.preventDefault();
        go(active >= 0 ? hits[active]?.slug : undefined);
      }}
      className="relative w-full text-left"
    >
      <label htmlFor={`${id}-q`} className="sr-only">{t.searchLabel}</label>
      <div className={`flex items-stretch gap-1.5 rounded-2xl border bg-white p-1.5 shadow-card transition-[box-shadow,border-color] duration-200 focus-within:border-sky focus-within:shadow-pop focus-within:ring-2 focus-within:ring-sky/20 ${listening ? "border-brand ring-2 ring-brand/20" : "border-paper-line hover:border-ink-faint/40"} ${size === "lg" ? "sm:p-2" : ""}`}>
        <div className="relative flex flex-1 items-center gap-2 pl-2.5">
          <Search className="h-5 w-5 shrink-0 text-ink-faint" aria-hidden="true" />
          <input
            ref={inputRef}
            id={`${id}-q`}
            name="q"
            type="search"
            autoComplete="off"
            autoFocus={autoFocus}
            enterKeyHint="search"
            value={q}
            placeholder={listening ? (ne ? "सुन्दै छ… बोल्नुहोस्" : "Listening… speak now") : processing ? (ne ? "बुझ्दै छ…" : "Understanding…") : rotating ? "" : t.searchPlaceholder}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
              setActive(-1);
              if (voice.state !== "idle" && voice.state !== "listening") setVoice({ state: "idle" });
            }}
            onFocus={() => {
              setOpen(true);
              setFocused(true);
            }}
            onBlur={() => {
              setFocused(false);
              setTimeout(() => setOpen(false), 150);
            }}
            onKeyDown={(e) => {
              if (!showList) return;
              if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % hits.length); }
              if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a <= 0 ? hits.length - 1 : a - 1)); }
              if (e.key === "Escape") setOpen(false);
            }}
            role="combobox"
            aria-expanded={showList}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
            className={`w-full min-w-0 bg-transparent text-ink placeholder:text-ink-faint focus:outline-none ${size === "lg" ? "min-h-[48px] text-lg" : "min-h-[44px] text-base"}`}
          />
          {rotating && (
            <span
              key={hint}
              aria-hidden="true"
              lang={/[a-z]/i.test(hints[hint]) && hint > 0 ? "en" : undefined}
              className={`hint-in pointer-events-none absolute inset-y-0 left-10 right-0 flex items-center truncate text-ink-faint ${size === "lg" ? "text-lg" : "text-base"}`}
            >
              {hint > 0 ? `“${hints[hint]}”` : hints[hint]}
            </span>
          )}
        </div>
        {canVoice && (
          <button
            type="button"
            onClick={listen}
            aria-label={micLabel}
            aria-pressed={listening || processing}
            title={micLabel}
            className={`grid shrink-0 place-items-center rounded-xl transition-colors duration-150 active:scale-95 ${size === "lg" ? "w-12" : "w-11"} ${listening ? "animate-breathe bg-brand-tint text-brand" : processing ? "bg-paper-warm text-ink-soft" : "text-ink-soft hover:bg-paper-warm hover:text-ink"}`}
          >
            {listening ? (
              <Square className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true" />
            ) : processing ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-faint/40 border-t-ink-soft" aria-hidden="true" />
            ) : (
              <Mic className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        )}
        <button type="submit" className={`btn-primary shrink-0 ${size === "lg" ? "px-4 sm:px-6" : "min-h-[44px] px-4"}`}>
          <span className={size === "lg" ? "hidden sm:inline" : "sr-only"}>{t.searchButton}</span>
          <Search className={`h-5 w-5 ${size === "lg" ? "sm:hidden" : ""}`} aria-hidden="true" />
          {size === "lg" && <span className="sr-only sm:hidden">{t.searchButton}</span>}
        </button>
      </div>

      {/* Voice feedback: what was heard, so the visitor can check it before searching. */}
      <p className="mt-2 min-h-[1.25rem] text-sm" role="status" aria-live="polite">
        {listening && <span className="animate-fade font-medium text-brand">{ne ? "सुन्दै छ… आफ्नो प्रश्न बोल्नुहोस्।" : "Listening… say your question."}</span>}
        {processing && <span className="animate-fade text-ink-soft">{ne ? "बुझ्दै छ…" : "Understanding…"}</span>}
        {voice.state === "heard" && (
          <span className="animate-fade text-ink-soft">
            {ne ? "सुनियो: " : "Heard: "}<strong className="text-ink">“{voice.text}”</strong>
            {ne ? " — ठीक छ भने खोज्नुहोस्, नत्र सच्याउनुहोस्।" : " — search if that's right, or edit it."}
          </span>
        )}
        {voice.state === "error" && <span className="animate-fade text-warn">{voice.msg}</span>}
      </p>

      {showList && (
        <ul id={listId} role="listbox" className="absolute inset-x-0 top-[calc(100%-1.5rem)] z-30 origin-top animate-pop overflow-hidden rounded-2xl border border-paper-line bg-white p-1 shadow-pop">
          {hits.map((g, i) => {
            const purpose = detectPurpose(q, g.situations?.map((x) => x.id)).id;
            const label = purpose && g.situations?.find((x) => x.id === purpose)?.label;
            return (
              <li
                key={g.slug}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => { e.preventDefault(); go(g.slug); }}
                className={`flex min-h-[52px] cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-100 ${i === active ? "bg-paper-warm" : "hover:bg-paper-warm"}`}
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-tint text-brand"><ServiceIcon name={g.icon} className="h-5 w-5" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{tr(g.title, locale)}</span>
                  <span className="block truncate text-sm text-ink-soft">{label ? `→ ${tr(label, locale)}` : tr(g.question, locale)}</span>
                </span>
                {!g.published && <span className="chip bg-paper-warm text-ink-soft">{t.comingSoon}</span>}
              </li>
            );
          })}
        </ul>
      )}
    </form>
  );
}
