"use client";

import { useEffect, useRef, useState } from "react";
import { Flag, X } from "lucide-react";
import type { Locale } from "@/lib/content/types";
import { FeedbackWidget } from "./FeedbackWidget";

/** Seconds actively on the page before asking, or after reading most of it (but not straight away). */
const AFTER_SECONDS = 40;
const AFTER_READING = 0.75;
const MIN_SECONDS = 15;

/**
 * "Was this guide useful?" as a small popup, once someone has spent a while on the guide:
 * about 40 seconds with the page in view, or after reading three quarters of it.
 * Shown once per guide on this device; closing it or answering means it won't come back.
 * Above the tab bar on phones, bottom-left on wider screens (the chat button is bottom-right).
 */
export function FeedbackPrompt({ locale, guide }: { locale: Locale; guide: string }) {
  const ne = locale === "ne";
  const key = `kg-feedback-${guide}`;
  const [show, setShow] = useState(false);
  const seconds = useRef(0);

  useEffect(() => {
    try {
      if (localStorage.getItem(key)) return;
    } catch {}
    let shown = false;
    const open = () => {
      if (shown) return;
      shown = true;
      setShow(true);
    };
    // Count only time with the page actually in view.
    const tick = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      seconds.current += 1;
      if (seconds.current >= AFTER_SECONDS) open();
    }, 1000);
    const scroll = () => {
      const read = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight;
      if (read >= AFTER_READING && seconds.current >= MIN_SECONDS) open();
    };
    window.addEventListener("scroll", scroll, { passive: true });
    return () => {
      window.clearInterval(tick);
      window.removeEventListener("scroll", scroll);
    };
  }, [key]);

  const remember = () => {
    try {
      localStorage.setItem(key, new Date().toISOString());
    } catch {}
  };
  const close = () => {
    remember();
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-label={ne ? "प्रतिक्रिया" : "Feedback"}
      className="no-print fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 animate-sheet-up rounded-3xl border border-paper-line bg-white p-5 shadow-pop sm:inset-x-auto sm:bottom-6 sm:left-6 sm:w-[22rem]"
    >
      <button type="button" onClick={close} aria-label={ne ? "बन्द गर्नुहोस्" : "Close"} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full text-ink-faint hover:bg-paper-warm hover:text-ink">
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
      <div className="pr-8">
        <FeedbackWidget
          locale={locale}
          guide={guide}
          onDone={() => {
            remember();
            window.setTimeout(() => setShow(false), 2500);
          }}
        />
      </div>
      <button
        type="button"
        onClick={() => {
          close();
          window.dispatchEvent(new CustomEvent("kg:report"));
        }}
        className="mt-4 inline-flex min-h-[40px] items-center gap-1.5 text-sm font-semibold text-sky hover:underline"
      >
        <Flag className="h-3.5 w-3.5" aria-hidden="true" />
        {ne ? "गलत जानकारी भेटिनुभयो?" : "Found something wrong?"}
      </button>
    </div>
  );
}
