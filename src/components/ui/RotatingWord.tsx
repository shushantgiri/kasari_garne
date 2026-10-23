"use client";

import { useEffect, useState } from "react";

/**
 * One word that takes turns with others every couple of seconds, sliding softly into place.
 * Screen readers hear the whole list once; people who turn motion off see the first word only.
 */
export function RotatingWord({ words, className = "" }: { words: string[]; className?: string }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (words.length < 2) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "reduce";
    if (still) return;
    const id = window.setInterval(() => setI((n) => (n + 1) % words.length), 2400);
    return () => window.clearInterval(id);
  }, [words.length]);

  return (
    <>
      <span className="sr-only">{words.join(", ")}</span>
      {/* key: each new word mounts again, so its entrance animation plays. */}
      <span key={i} className={`inline-block animate-word-in ${className}`} aria-hidden="true">
        {words[i]}
      </span>
    </>
  );
}
