"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/lib/content/types";

const SIZES = ["", "lg", "xl"] as const;

/** Cycles text size: normal → large → extra large. Remembered on this device only. */
export function TextSizeButton({ locale, className = "" }: { locale: Locale; className?: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const cur = document.documentElement.dataset.text ?? "";
    setI(Math.max(0, SIZES.indexOf(cur as (typeof SIZES)[number])));
  }, []);
  const next = () => {
    const n = (i + 1) % SIZES.length;
    setI(n);
    if (SIZES[n]) document.documentElement.dataset.text = SIZES[n];
    else delete document.documentElement.dataset.text;
    try {
      localStorage.setItem("kg-text", SIZES[n]);
    } catch {}
  };
  const label = locale === "ne" ? ["अक्षर ठूलो बनाउनुहोस्", "अक्षर अझ ठूलो", "अक्षर सामान्य"][i] : ["Larger text", "Even larger text", "Normal text"][i];
  return (
    <button type="button" onClick={next} className={`btn-ghost ${className}`} aria-label={label} title={label}>
      <span aria-hidden="true" className="font-bold">
        अ<span className="text-xs align-super">{i === 2 ? "−" : "+"}</span>
      </span>
      <span className="sr-only">{label}</span>
    </button>
  );
}
