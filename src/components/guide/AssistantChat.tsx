"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, MessageCircle, Mic, SendHorizontal, Square, Volume2, VolumeX, X } from "lucide-react";
import type { Locale } from "@/lib/content/types";
import { looksPersonal } from "@/lib/privacy";
import { answer, type Knowledge } from "@/lib/assist/answer";
import { buildIndex, search, type Searchable } from "@/lib/search/search";
import { NEPALI_VOICE_MB, nepaliVoiceAccepted, prepareNepaliVoice, speakNepali, stopNepali, unlockAudio } from "@/lib/assist/nepaliVoice";

type Msg = { role: "user" | "assistant"; content: string; link?: { href: string; label: string } };

/** On pages that cover many services (the homepage): each guide, findable by search, with what the helper knows about it. */
export interface LibraryGuide extends Searchable {
  knowledge: Record<Locale, Knowledge>;
}

/* Browser speech recognition (not in every TypeScript DOM lib). */
interface Recognition {
  lang: string;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}
type RecognitionCtor = new () => Recognition;
const getRecognition = (): RecognitionCtor | undefined =>
  typeof window === "undefined"
    ? undefined
    : (window as unknown as { SpeechRecognition?: RecognitionCtor }).SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition?: RecognitionCtor }).webkitSpeechRecognition;

/**
 * A chat helper for one guide: type or speak a question, get a short answer drawn from the guide.
 * Free: no AI or outside service. Answers come from the guide itself (lib/assist/answer.ts).
 * Answers can be read aloud. Nothing is saved or sent anywhere.
 * Given a `library` instead of one guide's `knowledge`, it first finds which guide a question is
 * about (with the site's search), answers from that guide and links to it; follow-ups stay on that guide.
 */
export function AssistantChat({ locale, knowledge, library, serviceName, suggestions }: {
  locale: Locale;
  knowledge?: Record<Locale, Knowledge>;
  library?: LibraryGuide[];
  serviceName: string;
  suggestions: string[];
}) {
  const ne = locale === "ne";
  const [open, setOpen] = useState(false);
  // The Ask button can be dragged anywhere; let go and it settles at the nearest side.
  // Where it settled (side + height as a share of the screen) is remembered on this device.
  const [spot, setSpot] = useState<{ side: "left" | "right"; y: number } | null>(null);
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const grab = useRef<{ dx: number; dy: number; sx: number; sy: number; moved: boolean } | null>(null);
  const justDragged = useRef(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speak, setSpeak] = useState(false);
  const [listening, setListening] = useState(false);
  const [canVoice, setCanVoice] = useState(false);
  // Free downloadable Nepali voice, for phones without one built in.
  const [neVoice, setNeVoice] = useState<{ state: "offer" | "loading" | "failed"; pct: number } | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const pendingSpeech = useRef<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recRef = useRef<Recognition | null>(null);
  const viaVoice = useRef(false);
  const purpose = useRef<string | undefined>(undefined);
  const index = useMemo(() => (library ? buildIndex(library) : []), [library]);
  // The guide the conversation is about, on the homepage.
  const topic = useRef<LibraryGuide | undefined>(undefined);

  useEffect(() => {
    setCanVoice(!!getRecognition());
    // Voices load late in some browsers; ask once so they're ready when needed.
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.getVoices();
    const load = () => synth.getVoices();
    synth.addEventListener?.("voiceschanged", load);
    return () => synth.removeEventListener?.("voiceschanged", load);
  }, []);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, busy]);
  useEffect(() => {
    if (!open) {
      window.speechSynthesis?.cancel();
      stopNepali(audioRef.current);
      recRef.current?.stop();
      return;
    }
    inputRef.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    // Full-screen on phones: keep the page behind from scrolling.
    const small = window.matchMedia("(max-width: 639px)").matches;
    const prev = document.documentElement.style.overflow;
    if (small) document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", esc);
      document.documentElement.style.overflow = prev;
    };
  }, [open]);

  /**
   * Read an answer aloud in its own language, with the device's free built-in voices.
   * Nepali only ever uses a real Nepali voice (never Hindi), preferring the natural ones:
   * Microsoft Hemkala/Sagar in Edge, Google Nepali on Android.
   */
  const readAloud = (text: string, lang: Locale) => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const spoken = text
      .replace(/https?:\/\/\S+/g, lang === "ne" ? "आधिकारिक वेबसाइट" : "the official website")
      .replace(/^- /gm, "")
      .replace(/[“”"]/g, "");
    const u = new SpeechSynthesisUtterance(spoken);
    const voice = bestVoice(synth.getVoices(), lang);
    if (lang === "ne" && !voice) {
      // No Nepali voice on this phone: use the free downloaded one (ask first, it's ~28 MB).
      if (nepaliVoiceAccepted() && audioRef.current) {
        void speakNepali(text, audioRef.current).catch((e) => {
          console.warn("[nepali voice]", e);
          setNeVoice({ state: "failed", pct: 0 });
        });
      } else {
        pendingSpeech.current = text;
        setNeVoice((v) => v ?? { state: "offer", pct: 0 });
      }
      return;
    }
    if (voice) u.voice = voice;
    u.lang = voice?.lang ?? (lang === "ne" ? "ne-NP" : "en-IN");
    u.rate = voice && /natural|online|google/i.test(voice.name) ? 1 : 0.92;
    synth.speak(u);
  };

  const send = (text: string) => {
    if (audioRef.current && nepaliVoiceAccepted()) unlockAudio(audioRef.current);
    const q = text.trim();
    if (!q || busy) return;
    setError(null);
    if (looksPersonal(q)) {
      setError(ne ? "नागरिकता, लाइसेन्स, फोन नम्बर वा OTP यहाँ नलेख्नुहोस्। नम्बर हटाएर सोध्नुहोस्।" : "Please don't share citizenship, licence or phone numbers or OTPs here. Remove the number and ask again.");
      return;
    }
    const next: Msg[] = [...messages, { role: "user", content: q }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    const spokenQuestion = viaVoice.current;
    viaVoice.current = false;
    // Nepali script in the question gets a Nepali answer, whatever the page language.
    const lang: Locale = ne || /[ऀ-ॿ]/.test(q) ? "ne" : "en";
    let k = knowledge?.[lang];
    let link: Msg["link"];
    if (library) {
      // If nothing matches, try again without Nepali case endings ("लाइसेन्सको" → "लाइसेन्स").
      const hit =
        search(index, q, { limit: 1 })[0] ??
        search(index, q.replace(/(को|का|की|मा|लाई|ले|बाट|सँग)(?=[\s?।,!]|$)/g, ""), { limit: 1 })[0];
      const found = hit && library.find((g) => g.slug === hit.slug);
      if (found && found !== topic.current) {
        topic.current = found;
        purpose.current = undefined;
      }
      if (topic.current) {
        k = topic.current.knowledge[lang];
        link = { href: `/${locale}/guide/${topic.current.slug}`, label: ne ? "पूरा गाइड हेर्नुहोस्" : "Open the full guide" };
      }
    }
    let reply: string;
    if (k) {
      const r = answer(k, q, purpose.current);
      purpose.current = r.purpose;
      reply = library ? `${k.name}\n\n${r.text}` : r.text;
    } else {
      // No service recognised yet: ask which one, naming the guides we have.
      const names = (library ?? []).map((g) => g.knowledge[lang].name).join(", ");
      reply = lang === "ne" ? `कुन सेवाबारे सोध्नुभएको हो? जस्तै: ${names}।` : `Which service is this about? For example: ${names}.`;
    }
    // A short pause so the answer reads like a reply, not a page jump.
    window.setTimeout(() => {
      setMessages([...next, { role: "assistant", content: reply, link }]);
      setBusy(false);
      if (speak || spokenQuestion) readAloud(reply, lang);
    }, 450);
  };

  const getNepaliVoice = () => {
    const audio = audioRef.current;
    if (!audio) return;
    unlockAudio(audio); // during the tap, so the phone allows sound later
    setNeVoice({ state: "loading", pct: 0 });
    prepareNepaliVoice((pct) => setNeVoice({ state: "loading", pct }))
      .then(() => {
        setNeVoice(null);
        setSpeak(true);
        const text = pendingSpeech.current;
        pendingSpeech.current = null;
        if (text) return speakNepali(text, audio);
      })
      .catch((e) => {
        console.warn("[nepali voice]", e);
        setNeVoice({ state: "failed", pct: 0 });
      });
  };

  const listen = () => {
    if (audioRef.current && nepaliVoiceAccepted()) unlockAudio(audioRef.current);
    if (listening) return recRef.current?.stop();
    const Ctor = getRecognition();
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = ne ? "ne-NP" : "en-IN";
    rec.interimResults = true;
    let text = "";
    rec.onresult = (e) => {
      text = Array.from(e.results).map((r) => r[0].transcript).join(" ").trim();
      setInput(text);
    };
    rec.onerror = () => setError(ne ? "आवाज बुझ्न सकिएन। टाइप गरेर सोध्नुहोस्।" : "Couldn't hear that. Please type instead.");
    rec.onend = () => {
      setListening(false);
      recRef.current = null;
      if (text) {
        viaVoice.current = true; // answer this one aloud
        send(text);
      }
    };
    recRef.current = rec;
    setListening(true);
    rec.start();
  };

  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem("kg-ask-spot") ?? "null");
      if (v && (v.side === "left" || v.side === "right") && typeof v.y === "number") setSpot(v);
    } catch {}
  }, []);

  // Keep it below the site header and above the bottom edge.
  // On phones, stay above the bottom tab bar too.
  const clampY = (y: number, h: number) => Math.min(Math.max(y, 72), window.innerHeight - h - (window.innerWidth < 640 ? 84 : 12));

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    grab.current = { dx: e.clientX - r.left, dy: e.clientY - r.top, sx: e.clientX, sy: e.clientY, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const g = grab.current;
    if (!g) return;
    // A small wobble is still a tap.
    if (!g.moved && Math.hypot(e.clientX - g.sx, e.clientY - g.sy) < 8) return;
    g.moved = true;
    const r = e.currentTarget.getBoundingClientRect();
    setDrag({ x: Math.min(Math.max(e.clientX - g.dx, 8), window.innerWidth - r.width - 8), y: clampY(e.clientY - g.dy, r.height) });
  };
  const onPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    const g = grab.current;
    grab.current = null;
    if (!g?.moved) return;
    justDragged.current = true;
    const r = e.currentTarget.getBoundingClientRect();
    const next = { side: r.left + r.width / 2 < window.innerWidth / 2 ? ("left" as const) : ("right" as const), y: r.top / window.innerHeight };
    setSpot(next);
    setDrag(null);
    try {
      localStorage.setItem("kg-ask-spot", JSON.stringify(next));
    } catch {}
  };
  const onPointerCancel = () => {
    grab.current = null;
    setDrag(null);
  };

  const placed: React.CSSProperties | undefined = drag
    ? { left: drag.x, top: drag.y, right: "auto", bottom: "auto" }
    : spot
      ? {
          [spot.side]: 16,
          [spot.side === "left" ? "right" : "left"]: "auto",
          top: `clamp(72px, ${(spot.y * 100).toFixed(2)}vh, calc(100vh - 140px))`,
          bottom: "auto",
        }
      : undefined;

  return (
    <>
      <audio ref={audioRef} preload="none" playsInline className="hidden" />
      {!open && (
        <button
          type="button"
          onClick={() => {
            // The click that ends a drag shouldn't open the chat.
            if (justDragged.current) {
              justDragged.current = false;
              return;
            }
            setOpen(true);
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          style={placed}
          title={ne ? "थिचेर सार्न सकिन्छ" : "Drag to move"}
          className={`no-print fixed bottom-[calc(9rem+env(safe-area-inset-bottom))] right-4 z-30 inline-flex h-14 touch-none select-none items-center gap-2 rounded-full bg-brand px-4 text-white transition-[transform,box-shadow] duration-150 hover:bg-brand-dark sm:bottom-6 sm:right-6 sm:px-5 ${
            drag ? "scale-105 cursor-grabbing shadow-[0_14px_32px_rgba(27,34,48,.3)]" : "cursor-grab shadow-pop active:scale-95"
          }`}
          aria-haspopup="dialog"
        >
          <MessageCircle className="h-6 w-6" aria-hidden="true" />
          <span className="font-semibold">{ne ? "सोध्नुहोस्" : "Ask"}</span>
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={ne ? "सहयोगीसँग कुरा गर्नुहोस्" : "Chat with the helper"}
          className="fixed inset-0 z-50 flex animate-pop flex-col bg-white sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[min(640px,calc(100vh-3rem))] sm:w-[400px] sm:overflow-hidden sm:rounded-2xl sm:border sm:border-paper-line sm:shadow-pop"
        >
          <div className="flex items-center gap-3 border-b border-paper-line bg-paper-warm px-4 py-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-sm font-bold text-white" aria-hidden="true">?</span>
            <div className="min-w-0 flex-1">
              <p className="font-bold leading-tight text-ink">{ne ? "कसरी गर्ने? सहयोगी" : "Kasari Garne helper"}</p>
              <p className="truncate text-xs text-ink-faint">{serviceName} · {ne ? "सरकारी सेवा होइन" : "not a government service"}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSpeak((s) => !s);
                window.speechSynthesis?.cancel();
                stopNepali(audioRef.current);
                if (audioRef.current && nepaliVoiceAccepted()) unlockAudio(audioRef.current);
              }}
              aria-pressed={speak}
              aria-label={speak ? (ne ? "आवाजमा पढ्न बन्द गर्नुहोस्" : "Stop reading answers aloud") : ne ? "जवाफ आवाजमा सुन्नुहोस्" : "Read answers aloud"}
              className={`grid h-11 w-11 shrink-0 place-items-center rounded-full transition-colors ${speak ? "bg-brand-tint text-brand" : "text-ink-soft hover:bg-white"}`}
            >
              {speak ? <Volume2 className="h-5 w-5" aria-hidden="true" /> : <VolumeX className="h-5 w-5" aria-hidden="true" />}
            </button>
            <button type="button" onClick={() => setOpen(false)} aria-label={ne ? "बन्द गर्नुहोस्" : "Close"} className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-white">
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4" aria-live="polite">
            <Bubble role="assistant">
              {ne
                ? `नमस्ते! म ${serviceName} बारे मद्दत गर्छु। के जान्न चाहनुहुन्छ? लेखेर वा बोलेर सोध्नुहोस्।`
                : `Hi! I can help with ${serviceName}. What would you like to know? Type or speak your question.`}
            </Bubble>
            {messages.length === 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {suggestions.map((s) => (
                  <button key={s} type="button" onClick={() => send(s)} className="min-h-[44px] rounded-full border border-paper-line bg-white px-3.5 text-left text-sm text-ink-soft transition-colors hover:border-brand/30 hover:text-ink">
                    {s}
                  </button>
                ))}
              </div>
            )}
            {messages.map((m, i) =>
              m.role === "assistant" && !m.content ? (
                <Bubble key={i} role="assistant"><TypingDots label={ne ? "लेख्दै छ" : "Typing"} /></Bubble>
              ) : (
                <Bubble key={i} role={m.role}>
                  {m.content}
                  {m.link && (
                    <Link href={m.link.href} onClick={() => setOpen(false)} className="mt-2 flex items-center gap-1 font-semibold text-sky hover:underline">
                      {m.link.label} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  )}
                </Bubble>
              ),
            )}
            {neVoice && (
              <div className="rounded-2xl border border-paper-line bg-paper-warm p-3.5">
                {neVoice.state === "offer" && (
                  <>
                    <p className="text-[0.95rem] text-ink">यो फोनमा नेपाली आवाज छैन। शुद्ध नेपाली आवाजमा सुन्न निःशुल्क आवाज एक पटक डाउनलोड गर्नुहोस् (करिब {NEPALI_VOICE_MB} MB)।</p>
                    <div className="mt-3 flex gap-2">
                      <button type="button" onClick={getNepaliVoice} className="btn-primary min-h-[44px] px-4 text-sm">डाउनलोड गर्नुहोस्</button>
                      <button type="button" onClick={() => setNeVoice(null)} className="btn-ghost min-h-[44px] px-3 text-sm">अहिले होइन</button>
                    </div>
                  </>
                )}
                {neVoice.state === "loading" && (
                  <div role="status">
                    <p className="text-[0.95rem] text-ink">नेपाली आवाज डाउनलोड हुँदैछ… {neVoice.pct.toLocaleString("ne-NP")}%</p>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                      <div className="h-full rounded-full bg-brand transition-[width] duration-300" style={{ width: `${neVoice.pct}%` }} />
                    </div>
                  </div>
                )}
                {neVoice.state === "failed" && (
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[0.95rem] text-warn">नेपाली आवाज लोड हुन सकेन। इन्टरनेट जाँचेर फेरि प्रयास गर्नुहोस्।</p>
                    <button type="button" onClick={getNepaliVoice} className="btn-secondary min-h-[44px] shrink-0 px-3 text-sm">फेरि</button>
                  </div>
                )}
              </div>
            )}
            {error && <p role="alert" className="rounded-xl bg-warn-tint px-3 py-2 text-sm text-warn">{error}</p>}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="border-t border-paper-line bg-white px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3"
          >
            <div className="flex items-end gap-2">
              {canVoice && (
                <button
                  type="button"
                  onClick={listen}
                  aria-pressed={listening}
                  aria-label={listening ? (ne ? "सुन्न रोक्नुहोस्" : "Stop listening") : ne ? "बोलेर सोध्नुहोस्" : "Ask by voice"}
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-full transition-colors ${listening ? "animate-breathe bg-brand-tint text-brand" : "bg-paper-warm text-ink-soft hover:text-ink"}`}
                >
                  {listening ? <Square className="h-4 w-4" fill="currentColor" aria-hidden="true" /> : <Mic className="h-5 w-5" aria-hidden="true" />}
                </button>
              )}
              <label htmlFor="assist-input" className="sr-only">{ne ? "तपाईंको प्रश्न" : "Your question"}</label>
              <textarea
                id="assist-input"
                ref={inputRef}
                rows={1}
                maxLength={800}
                value={input}
                placeholder={listening ? (ne ? "सुन्दै छ…" : "Listening…") : ne ? "प्रश्न लेख्नुहोस्…" : "Type your question…"}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                className="max-h-32 min-h-[44px] flex-1 resize-none rounded-2xl border border-paper-line bg-white px-4 py-2.5 text-base text-ink placeholder:text-ink-faint focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/20"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                aria-label={ne ? "पठाउनुहोस्" : "Send"}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand text-white transition-colors hover:bg-brand-dark disabled:opacity-40"
              >
                <SendHorizontal className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <p className="mt-2 text-center text-xs text-ink-faint">
              {ne ? "जवाफ यही गाइडबाट आउँछ। केही पनि सुरक्षित गरिँदैन।" : "Answers come from this guide. Nothing is saved."}
            </p>
          </form>
        </div>
      )}
    </>
  );
}

/** The most natural voice for a language. Nepali: Nepali voices only, natural ones first. */
function bestVoice(voices: SpeechSynthesisVoice[], lang: Locale): SpeechSynthesisVoice | undefined {
  const code = (v: SpeechSynthesisVoice) => v.lang.toLowerCase().replace("_", "-");
  const pool = lang === "ne" ? voices.filter((v) => code(v).startsWith("ne")) : voices.filter((v) => code(v).startsWith("en"));
  const score = (v: SpeechSynthesisVoice) =>
    (/natural/i.test(v.name) ? 4 : 0) + (/online|google/i.test(v.name) ? 2 : 0) + (lang === "en" && code(v) === "en-in" ? 1 : 0) + (lang === "ne" && /hemkala|हेमकला/i.test(v.name) ? 1 : 0);
  return [...pool].sort((a, b) => score(b) - score(a))[0];
}

function Bubble({ role, children }: { role: "user" | "assistant"; children: React.ReactNode }) {
  return (
    <div className={`flex ${role === "user" ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-[0.98rem] leading-relaxed ${role === "user" ? "rounded-br-md bg-brand text-white" : "rounded-bl-md bg-paper-warm text-ink"}`}>
        {children}
      </div>
    </div>
  );
}

function TypingDots({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 py-1" aria-label={label}>
      {[0, 150, 300].map((d) => (
        <span key={d} className="h-2 w-2 animate-pulse rounded-full bg-ink-faint" style={{ animationDelay: `${d}ms` }} />
      ))}
    </span>
  );
}
