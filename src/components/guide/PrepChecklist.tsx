"use client";

import { useEffect, useId, useState } from "react";
import { ArrowRight, Building2, Camera, Check, Copy, FileText, MessageCircle, PartyPopper, Phone, Printer, ScanLine, Send, Share2, Smartphone } from "lucide-react";
import type { Locale } from "@/lib/content/types";
import { digits } from "@/lib/i18n";

export interface ChecklistItem {
  text: string;
  when?: string;
  note?: string;
}

/**
 * "Before you start" checklist. Ticks are remembered on this device only
 * (just true/false per line — never document contents).
 * One list in two groups: what everyone needs, then what's needed only in some cases.
 * "Send" passes the list (ticked or not) to a family member on WhatsApp or Viber, with the guide link.
 */
export function PrepChecklist({ locale, slug, items, title }: { locale: Locale; slug: string; items: ChecklistItem[]; title?: string }) {
  const ne = locale === "ne";
  const id = useId();
  const key = `kg-check-${slug}`;
  const [done, setDone] = useState<boolean[]>(() => items.map(() => false));
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [canNative, setCanNative] = useState(false);
  useEffect(() => setCanNative(typeof navigator !== "undefined" && "share" in navigator), []);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key) ?? "null");
      if (Array.isArray(saved) && saved.length === items.length) setDone(saved.map(Boolean));
    } catch {}
  }, [key, items.length]);

  const toggle = (i: number) => {
    setDone((d) => {
      const n = d.map((v, j) => (j === i ? !v : v));
      try {
        localStorage.setItem(key, JSON.stringify(n));
      } catch {}
      return n;
    });
  };
  const count = done.filter(Boolean).length;
  const all = items.length > 0 && count === items.length;
  const rows = items.map((it, i) => ({ it, i }));
  const groups = [
    { title: ne ? "सबैलाई चाहिने" : "Everyone needs", list: rows.filter((x) => !x.it.when) },
    { title: ne ? "लागू भए मात्र" : "Only if it applies", list: rows.filter((x) => x.it.when) },
  ].filter((g) => g.list.length);
  const both = groups.length > 1;

  const pct = items.length ? count / items.length : 0;

  /** The list as a message: a tick for what's ready, an empty box for what isn't, then the link. */
  const message = () => {
    const head = `📋 ${title ? `${title} — ` : ""}${ne ? "चाहिने कागजात" : "documents needed"}`;
    const lines = items.map((it, i) => `${done[i] ? "✅" : "⬜"} ${it.text}${it.when ? ` (${it.when})` : ""}`);
    const link = window.location.href.split("#")[0];
    return [head, "", ...lines, "", `${ne ? "पूरा निर्देशिका" : "Full guide"}: ${link}`].join("\n");
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  return (
    <div>
      {/* Progress: a ring that fills green, the count inside it, and Print on the side. */}
      <div className="flex items-center gap-4">
        <div className="relative h-14 w-14 shrink-0" aria-hidden="true">
          <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#E7E3DC" strokeWidth="3.5" />
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke="#1E7A4C"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray={`${pct * 97.4} 97.4`}
              className="transition-[stroke-dasharray] duration-500 ease-soft"
            />
          </svg>
          <span className={`absolute inset-0 grid place-items-center text-sm font-bold ${all ? "text-ok" : "text-ink"}`}>
            {all ? <Check className="h-5 w-5" strokeWidth={3} /> : ne ? `${digits(count, "ne")}/${digits(items.length, "ne")}` : `${count}/${items.length}`}
          </span>
        </div>
        <div className="min-w-0 flex-1" aria-live="polite">
          <p className={`font-semibold ${all ? "text-ok" : "text-ink"}`}>
            {all ? (ne ? "सबै कागजात तयार छ" : "All documents ready") : ne ? "कागजात तयार" : "Documents ready"}
          </p>
          <p className="text-sm text-ink-faint">{ne ? "भएको कागजातमा चिनो लगाउनुहोस्" : "Tick each one you have"}</p>
        </div>
        <div className="no-print flex shrink-0 items-center">
          <button
            type="button"
            onClick={() => setSending((s) => !s)}
            aria-expanded={sending}
            className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-3 text-sm font-semibold transition-colors ${sending ? "bg-ink text-white" : "text-sky hover:bg-sky-tint"}`}
          >
            <Send className="h-4 w-4" aria-hidden="true" />
            {ne ? "पठाउनुहोस्" : "Send"}
          </button>
          <button type="button" onClick={() => window.print()} aria-label={ne ? "प्रिन्ट" : "Print"} className="grid h-11 w-11 place-items-center rounded-full text-ink-faint transition-colors hover:bg-paper-warm hover:text-ink">
            <Printer className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Send the list: one row of apps, opening with a small drop. */}
      {sending && (
        <div className="no-print mt-3 animate-pop rounded-2xl bg-paper-warm p-2">
          <p className="px-2 pb-2 pt-1 text-sm text-ink-soft">{ne ? "परिवार वा साथीलाई सूची पठाउनुहोस्" : "Send the list to family or a friend"}</p>
          <div className="stagger grid grid-cols-2 gap-2 sm:grid-cols-4">
            <a href={`https://wa.me/?text=${encodeURIComponent(message())}`} target="_blank" rel="noopener noreferrer" className={sendBtn}>
              <span className={`${sendDot} bg-[#25D366]`}><MessageCircle className="h-4 w-4" aria-hidden="true" /></span>
              WhatsApp
            </a>
            <a href={`viber://forward?text=${encodeURIComponent(message())}`} className={sendBtn}>
              <span className={`${sendDot} bg-[#7360F2]`}><Phone className="h-4 w-4" aria-hidden="true" /></span>
              Viber
            </a>
            <button type="button" onClick={copy} className={sendBtn}>
              <span className={`${sendDot} ${copied ? "bg-ok" : "bg-ink-soft"}`}>{copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}</span>
              {copied ? (ne ? "कपी भयो" : "Copied") : ne ? "कपी" : "Copy"}
            </button>
            {canNative && (
              <button type="button" onClick={() => navigator.share({ text: message() }).catch(() => {})} className={sendBtn}>
                <span className={`${sendDot} bg-sky`}><Share2 className="h-4 w-4" aria-hidden="true" /></span>
                {ne ? "अरू एप" : "More"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Everything ticked: say so, and point to the next step. */}
      {all && (
        <a href="#finish" className="no-print mt-4 flex animate-rise items-center gap-3 rounded-2xl bg-ok-tint px-4 py-3 text-ok transition-colors hover:bg-ok-tint/70">
          <PartyPopper className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="min-w-0 flex-1 font-semibold">{ne ? "सबै कागजात तयार! अब आवेदन दिनुहोस्" : "All set! Now apply"}</span>
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
        </a>
      )}

      {/* Each document as a card: an icon for its kind, the text, and a round tick on the right. */}
      {groups.map(({ title, list }) => (
        <div key={title} className="mt-6">
          {both && (
            <h3 className="mb-2 text-sm font-semibold text-ink-faint">
              {title} <span className="text-ink-faint/70">· {ne ? digits(list.length, "ne") : list.length}</span>
            </h3>
          )}
          <ul className="space-y-2">
            {list.map(({ it, i }) => {
              const Icon = done[i] ? Check : iconFor(it.text);
              return (
                <li key={i}>
                  <label
                    htmlFor={`${id}-${i}`}
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-3.5 py-3 transition-colors duration-200 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-sky/40 ${
                      done[i] ? "border-ok/25 bg-ok-tint/50" : "border-paper-line bg-white hover:border-ink-faint/40"
                    }`}
                  >
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-colors duration-200 ${done[i] ? "bg-ok text-white" : "bg-paper-warm text-ink-soft"}`}>
                      <Icon className="h-5 w-5" strokeWidth={done[i] ? 3 : 1.75} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block leading-snug transition-colors duration-200 ${done[i] ? "text-ink-soft" : "text-ink"}`}>{it.text}</span>
                      {it.note && <span className="mt-0.5 block text-sm leading-snug text-ink-faint">{it.note}</span>}
                      {it.when && <span className="mt-1 inline-block rounded-md bg-sky-tint px-2 py-0.5 text-xs font-medium leading-relaxed text-sky">{it.when}</span>}
                    </span>
                    <input id={`${id}-${i}`} type="checkbox" checked={done[i]} onChange={() => toggle(i)} className="tick mt-0" />
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

const sendBtn = "flex min-h-[48px] items-center gap-2.5 rounded-xl bg-white px-3 text-sm font-semibold text-ink ring-1 ring-paper-line transition-[box-shadow,transform] duration-150 hover:shadow-card active:scale-[.98]";
const sendDot = "grid h-8 w-8 shrink-0 place-items-center rounded-full text-white";

/** A picture for each kind of document, guessed from its wording (Nepali or English). */
function iconFor(text: string) {
  if (/mobile|phone|मोबाइल|फोन/i.test(text)) return Smartphone;
  if (/photo|फोटो/i.test(text)) return Camera;
  if (/scan|स्क्यान/i.test(text)) return ScanLine;
  if (/office|कार्यालय/i.test(text)) return Building2;
  return FileText;
}
