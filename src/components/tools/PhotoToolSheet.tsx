"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, ImageUp, X } from "lucide-react";
import type { Locale } from "@/lib/content/types";
import { PhotoResizer } from "./PhotoResizer";

/**
 * "Need a photo or scan at the right size?": opens the photo tool in a sheet over the guide,
 * so people don't lose their place. Rendered at the top of the page (a portal), since guide
 * sections are animated and would otherwise trap a fixed panel inside them.
 */
export function PhotoToolSheet({ locale }: { locale: Locale }) {
  const ne = locale === "ne";
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    window.addEventListener("keydown", key);
    return () => {
      document.documentElement.style.overflow = prev;
      window.removeEventListener("keydown", key);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="no-print mt-4 flex min-h-[56px] w-full items-center gap-3 rounded-2xl bg-sky-tint/70 px-4 py-3 text-left text-sm transition-colors hover:bg-sky-tint"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-sky shadow-card">
          <ImageUp className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-ink">{ne ? "फोटो वा स्क्यानको साइज मिलाउनु छ?" : "Need a photo or scan at the right size?"}</span>
          <span className="block text-ink-soft">{ne ? "यहीँ मिलाउनुहोस्" : "Fix it right here"}</span>
        </span>
        <ArrowRight className="h-4 w-4 shrink-0 text-sky" aria-hidden="true" />
      </button>

      {open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={ne ? "फोटो साइज मिलाउनुहोस्" : "Resize a photo"}
            className="fixed inset-0 z-50 flex animate-fade items-end justify-center bg-ink/50 backdrop-blur-sm sm:items-center sm:p-6"
            onClick={(e) => e.target === e.currentTarget && setOpen(false)}
          >
            <div className="flex max-h-[92vh] w-full max-w-4xl animate-sheet-up flex-col rounded-t-3xl bg-paper-warm shadow-pop sm:animate-pop sm:rounded-3xl">
              <div className="flex items-center justify-between gap-3 border-b border-paper-line px-5 py-3 sm:px-6">
                <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
                  <ImageUp className="h-5 w-5 text-sky" aria-hidden="true" />
                  {ne ? "फोटो र कागजातको साइज" : "Photo and document size"}
                </h2>
                <button type="button" onClick={() => setOpen(false)} aria-label={ne ? "बन्द गर्नुहोस्" : "Close"} className="grid h-10 w-10 place-items-center rounded-full text-ink-soft hover:bg-white hover:text-ink">
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <div className="thin-scrollbar flex-1 overflow-y-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:p-6">
                <PhotoResizer locale={locale} />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
