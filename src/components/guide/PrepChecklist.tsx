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
    { title: null as string | null, list: rows.filter((x) => !x.it.when) },
    { title: ne ? "लागू भए मात्र" : "Only if it applies", list: rows.filter((x) => x.it.when) },
  ].filter((g) => g.list.length);

  const both = groups.length > 1;

  return (
    <div>
      {/* Count as a small pill (green when everything is ready) and Print. */}
      <div className="flex items-center justify-between gap-3">
        <p
          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium transition-colors duration-200 ${all ? "bg-ok-tint text-ok" : "bg-paper-warm text-ink-soft"}`}
          aria-live="polite"
        >
          {all
            ? ne ? "सबै तयार छ" : "All ready"
            : ne ? `${digits(count, "ne")} / ${digits(items.length, "ne")} तयार` : `${count} of ${items.length} ready`}
        </p>
        <button type="button" onClick={() => window.print()} className="no-print inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-3 text-sm text-ink-faint transition-colors hover:bg-paper-warm hover:text-ink">
          <Printer className="h-4 w-4" aria-hidden="true" />
          {ne ? "प्रिन्ट" : "Print"}
        </button>
      </div>

      {/* Two tiles: warm for everyone, blue for "only if it applies" (matching the blue conditions). */}
      <div className={`mt-4 grid gap-3 ${both ? "md:grid-cols-2" : "max-w-2xl"}`}>
        {groups.map(({ title, list }) => {
          const conditional = !!title;
          return (
            <div key={title ?? "all"} className={`rounded-xl px-4 pb-1 pt-3.5 ${conditional ? "bg-sky-tint/70" : "bg-paper-warm/70"}`}>
              {both && (
                <p className="text-sm font-semibold text-ink">{title ?? (ne ? "सबैलाई चाहिने" : "Everyone needs")}</p>
              )}
              <ul className={`divide-y ${conditional ? "divide-sky/10" : "divide-paper-line"} ${both ? "mt-1" : ""}`}>
                {list.map(({ it, i }) => (
                  <li key={i}>
                    <label htmlFor={`${id}-${i}`} className="group flex cursor-pointer items-start gap-3 py-3">
                      <input id={`${id}-${i}`} type="checkbox" checked={done[i]} onChange={() => toggle(i)} className="tick" />
                      <span className="min-w-0">
                        <span className={`block leading-snug transition-colors duration-200 ${done[i] ? "text-ink-faint line-through decoration-ink-faint/40" : "text-ink"}`}>{it.text}</span>
                        {(it.when || it.note) && (
                          <span className="mt-0.5 block text-[0.95rem] text-ink-soft">
                            {it.when && <span className="text-sky">{it.when}</span>}
                            {it.when && it.note && " · "}
                            {it.note}
                          </span>
                        )}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
