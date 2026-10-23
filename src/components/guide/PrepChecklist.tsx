"use client";

import { useEffect, useId, useState } from "react";
import { ArrowRight, Building2, Camera, Check, FileText, PartyPopper, Printer, ScanLine, Smartphone } from "lucide-react";
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
 */
export function PrepChecklist({ locale, slug, items }: { locale: Locale; slug: string; items: ChecklistItem[] }) {
  const ne = locale === "ne";
  const id = useId();
  const key = `kg-check-${slug}`;
  const [done, setDone] = useState<boolean[]>(() => items.map(() => false));

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
        <button type="button" onClick={() => window.print()} className="no-print inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full px-3 text-sm text-ink-faint transition-colors hover:bg-paper-warm hover:text-ink">
          <Printer className="h-4 w-4" aria-hidden="true" />
          {ne ? "प्रिन्ट" : "Print"}
        </button>
      </div>

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

/** A picture for each kind of document, guessed from its wording (Nepali or English). */
function iconFor(text: string) {
  if (/mobile|phone|मोबाइल|फोन/i.test(text)) return Smartphone;
  if (/photo|फोटो/i.test(text)) return Camera;
  if (/scan|स्क्यान/i.test(text)) return ScanLine;
  if (/office|कार्यालय/i.test(text)) return Building2;
  return FileText;
}
