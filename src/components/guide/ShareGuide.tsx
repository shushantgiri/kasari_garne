"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Link2, MessageCircle, Phone, Share2 } from "lucide-react";
import type { Locale } from "@/lib/content/types";

/**
 * "Share" for one guide: WhatsApp and Viber (how most people in Nepal pass things on),
 * copy the link, and the phone's own share sheet where there is one.
 * The link keeps the chosen purpose (?for=…), so the person receiving it lands on the same steps.
 */
export function ShareGuide({ locale, title }: { locale: Locale; title: string }) {
  const ne = locale === "ne";
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [canNative, setCanNative] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => setCanNative(typeof navigator !== "undefined" && "share" in navigator), []);

  // Close on Escape or a tap outside.
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const tap = (e: PointerEvent) => !rootRef.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("keydown", key);
    document.addEventListener("pointerdown", tap);
    return () => {
      document.removeEventListener("keydown", key);
      document.removeEventListener("pointerdown", tap);
    };
  }, [open]);

  const link = () => window.location.href.split("#")[0];
  const message = () => `${title}\n${link()}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {}
  };
  const native = () => {
    setOpen(false);
    navigator.share({ title, url: link() }).catch(() => {});
  };

  const row = "flex min-h-[48px] w-full items-center gap-3 rounded-xl px-3 text-left text-[0.95rem] font-medium text-ink transition-colors hover:bg-paper-warm";
  const dot = (bg: string) => `grid h-8 w-8 shrink-0 place-items-center rounded-full text-white ${bg}`;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-ink shadow-card ring-1 ring-paper-line transition-[box-shadow,transform] duration-150 hover:shadow-pop active:scale-[.98]"
      >
        <Share2 className="h-4 w-4 text-sky" aria-hidden="true" />
        {ne ? "शेयर" : "Share"}
      </button>

      {open && (
        <div role="menu" className="absolute left-0 top-full z-30 mt-2 w-60 animate-pop rounded-2xl border border-paper-line bg-white p-1.5 shadow-pop">
          <a role="menuitem" href={`https://wa.me/?text=${encodeURIComponent(message())}`} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className={row}>
            <span className={dot("bg-[#25D366]")}><MessageCircle className="h-4 w-4" aria-hidden="true" /></span>
            WhatsApp
          </a>
          <a role="menuitem" href={`viber://forward?text=${encodeURIComponent(message())}`} onClick={() => setOpen(false)} className={row}>
            <span className={dot("bg-[#7360F2]")}><Phone className="h-4 w-4" aria-hidden="true" /></span>
            Viber
          </a>
          <button role="menuitem" type="button" onClick={copy} className={row}>
            <span className={dot(copied ? "bg-ok" : "bg-ink-soft")}>{copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Link2 className="h-4 w-4" aria-hidden="true" />}</span>
            <span aria-live="polite">{copied ? (ne ? "लिंक कपी भयो" : "Link copied") : ne ? "लिंक कपी गर्नुहोस्" : "Copy link"}</span>
          </button>
          {canNative && (
            <button role="menuitem" type="button" onClick={native} className={row}>
              <span className={dot("bg-sky")}><Share2 className="h-4 w-4" aria-hidden="true" /></span>
              {ne ? "अरू एप" : "More apps"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
