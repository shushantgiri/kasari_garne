"use client";

import { useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";

/**
 * A closed-by-default section: a title row with a one-line preview, opened on tap.
 * It also opens itself when the page is linked to `#${openOnHash}` (e.g. from the section menu).
 */
export function Collapsible({ title, preview, openOnHash, titleId, size = "section", tone, icon, children }: {
  /** "warn": amber title, for warnings such as common mistakes. */
  tone?: "warn";
  icon?: React.ReactNode;
  title: string;
  /** "section": the title is the section heading. "row": a smaller row inside a section. */
  size?: "section" | "row";
  preview?: string;
  openOnHash?: string;
  titleId?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (!openOnHash) return;
    const check = () => {
      if (window.location.hash === `#${openOnHash}` && ref.current) ref.current.open = true;
    };
    check();
    window.addEventListener("hashchange", check);
    // Same-hash clicks don't fire hashchange, so also listen for clicks on links to it.
    const click = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest?.("a");
      if (a?.getAttribute("href") === `#${openOnHash}` && ref.current) ref.current.open = true;
    };
    document.addEventListener("click", click);
    return () => {
      window.removeEventListener("hashchange", check);
      document.removeEventListener("click", click);
    };
  }, [openOnHash]);

  return (
    <details ref={ref} className="group">
      <summary className="-m-2 flex cursor-pointer list-none items-center gap-4 rounded-xl p-2 transition-colors hover:bg-paper-warm/60 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0 flex-1">
          <span id={titleId} className={size === "section" ? "section-title block" : `flex items-center gap-2 font-semibold ${tone === "warn" ? "text-warn" : "text-ink"}`}>{icon}{title}</span>
          {preview && <span className="mt-0.5 block text-sm text-ink-faint">{preview}</span>}
        </span>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-paper-line text-ink-soft transition-transform duration-200 group-open:rotate-180">
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </span>
      </summary>
      <div className="mt-5">{children}</div>
    </details>
  );
}
