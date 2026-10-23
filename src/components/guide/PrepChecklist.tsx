"use client";

import { useEffect, useId, useState } from "react";
import { Printer } from "lucide-react";
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

  return (
    <div>
      {/* Progress: how many are ready and Print on one line, a thin bar below. */}
      <div className="flex items-center justify-between gap-3">
        <p className={`text-sm font-semibold transition-colors duration-200 ${all ? "text-ok" : "text-ink-soft"}`} aria-live="polite">
          {all
            ? ne ? "सबै कागजात तयार छ ✓" : "All documents ready ✓"
            : ne ? `${digits(count, "ne")} / ${digits(items.length, "ne")} तयार` : `${count} of ${items.length} ready`}
        </p>
        <button type="button" onClick={() => window.print()} className="no-print -mr-2 inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-2 text-sm text-ink-faint transition-colors hover:text-ink">
          <Printer className="h-4 w-4" aria-hidden="true" />
          {ne ? "प्रिन्ट" : "Print"}
        </button>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-paper-line/70" aria-hidden="true">
        <div className="h-full rounded-full bg-ok transition-[width] duration-300 ease-soft" style={{ width: `${items.length ? (count / items.length) * 100 : 0}%` }} />
      </div>

      {/* One plain list per group, thin lines between items. */}
      {groups.map(({ title, list }) => (
        <div key={title} className="mt-5">
          {both && <h3 className="text-sm font-semibold text-ink-faint">{title}</h3>}
          <ul className="mt-1 divide-y divide-paper-line">
            {list.map(({ it, i }) => (
              <li key={i}>
                <label htmlFor={`${id}-${i}`} className="flex cursor-pointer items-start gap-3 py-3.5">
                  <input id={`${id}-${i}`} type="checkbox" checked={done[i]} onChange={() => toggle(i)} className="tick" />
                  <span className="min-w-0 flex-1">
                    <span className={`block leading-snug transition-colors duration-200 ${done[i] ? "text-ink-faint line-through decoration-ink-faint/40" : "text-ink"}`}>{it.text}</span>
                    {it.note && <span className="mt-1 block text-sm leading-snug text-ink-faint">{it.note}</span>}
                    {it.when && <span className="mt-1 block text-sm leading-snug text-sky">{it.when}</span>}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
