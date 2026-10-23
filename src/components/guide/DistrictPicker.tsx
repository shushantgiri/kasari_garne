"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ChevronRight, Search, X } from "lucide-react";
import type { Locale } from "@/lib/content/types";
import { DISTRICTS, type District } from "@/lib/content/districts";
import { digits } from "@/lib/i18n";

/**
 * Choose a district in two short steps: the province first (7 cards), then its districts.
 * Typing in the search box (English or Nepali) jumps straight to matching districts. Slides up as a sheet on phones, opens as a panel on wider screens.
 * Rendered at the top of the page (a portal): inside an animated section, a fixed panel would be
 * trapped within that section instead of covering the screen.
 */
export function DistrictPicker({ locale, onPick, onClose }: { locale: Locale; onPick: (d: District) => void; onClose: () => void }) {
  const ne = locale === "ne";
  const [q, setQ] = useState("");
  const [province, setProvince] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const provinces = useMemo(() => [...new Map(DISTRICTS.map((d) => [d.province.en, d.province])).values()], []);

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    window.addEventListener("keydown", key);
    return () => {
      document.documentElement.style.overflow = prev;
      window.removeEventListener("keydown", key);
    };
  }, [onClose]);

  const needle = q.trim().toLowerCase();
  const provinceName = (p: (typeof provinces)[number]) => (ne ? p.ne : p.en ?? p.ne);
  const list = DISTRICTS.filter(
    (d) =>
      // Typing searches every district; otherwise only the chosen province's.
      (needle ? true : d.province.en === province) &&
      (!needle || d.en.toLowerCase().includes(needle) || d.ne.includes(q.trim()) || d.aliases?.some((a) => a.toLowerCase().includes(needle))),
  );

  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ne ? "जिल्ला छान्नुहोस्" : "Pick your district"}
      className="fixed inset-0 z-50 flex animate-fade items-end justify-center bg-ink/50 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex max-h-[85vh] w-full max-w-lg animate-sheet-up flex-col rounded-t-3xl bg-white shadow-pop sm:animate-pop sm:rounded-3xl">
        <div className="px-5 pb-3 pt-4 sm:px-6 sm:pt-5">
          {/* Grab handle, as on app sheets. */}
          <span className="mx-auto mb-3 block h-1 w-10 rounded-full bg-paper-line sm:hidden" aria-hidden="true" />
          <div className="flex items-center justify-between gap-3">
            {province && !needle ? (
              <button type="button" onClick={() => setProvince(null)} className="-ml-2 inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-2 text-lg font-bold text-ink hover:bg-paper-warm">
                <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                {provinceName(provinces.find((p) => p.en === province)!)}
              </button>
            ) : (
              <h2 className="text-lg font-bold text-ink">{ne ? "जिल्ला छान्नुहोस्" : "Pick your district"}</h2>
            )}
            <button type="button" onClick={onClose} aria-label={ne ? "बन्द गर्नुहोस्" : "Close"} className="grid h-10 w-10 place-items-center rounded-full text-ink-soft hover:bg-paper-warm hover:text-ink">
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={ne ? "खोज्नुहोस्, जस्तै रुपन्देही वा rupan" : "Search, e.g. Rupandehi"}
              className="input pl-10"
              aria-label={ne ? "जिल्ला खोज्नुहोस्" : "Search districts"}
            />
          </div>
        </div>

        <div className="thin-scrollbar flex-1 overflow-y-auto border-t border-paper-line px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-6">
          {!province && !needle ? (
            // Step one: the provinces.
            <ul className="space-y-2">
              {provinces.map((p) => (
                <li key={p.en}>
                  <button
                    type="button"
                    onClick={() => setProvince(p.en ?? null)}
                    className="flex min-h-[56px] w-full items-center gap-3 rounded-2xl border border-paper-line px-4 text-left transition-colors hover:border-brand/40 hover:bg-brand-tint/40 active:bg-brand-tint"
                  >
                    <span className="min-w-0 flex-1 font-semibold text-ink">{provinceName(p)}</span>
                    <span className="shrink-0 text-sm text-ink-faint">
                      {ne ? `${digits(DISTRICTS.filter((d) => d.province.en === p.en).length, "ne")} जिल्ला` : `${DISTRICTS.filter((d) => d.province.en === p.en).length} districts`}
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-ink-faint" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          ) : list.length > 0 ? (
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {list.map((d) => (
                <li key={d.en}>
                  <button
                    type="button"
                    onClick={() => onPick(d)}
                    className="flex min-h-[52px] w-full min-w-0 flex-col items-start justify-center rounded-xl border border-paper-line px-3 py-2 text-left transition-colors hover:border-brand/40 hover:bg-brand-tint/40 active:bg-brand-tint"
                  >
                    <span className="w-full truncate text-[0.95rem] font-semibold leading-snug text-ink">{ne ? d.ne : d.en}</span>
                    <span className="w-full truncate text-xs text-ink-faint">{ne ? d.en : d.ne}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-8 text-center text-sm text-ink-faint">{ne ? "यो नामको जिल्ला भेटिएन।" : "No district by that name."}</p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
