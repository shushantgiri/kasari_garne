"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronUp } from "lucide-react";
import type { Locale } from "@/lib/content/types";

export interface NavSection { id: string; label: string }

/**
 * Which section is on screen: the last one whose top has passed the upper third of the viewport.
 * Also which of the sections are on the page now, and whether the page has scrolled past the header.
 */
export function useActiveSection(ids: string[]) {
  const key = ids.join(",");
  const [current, setCurrent] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [present, setPresent] = useState<Set<string>>(() => new Set(ids));

  useEffect(() => {
    const list = key.split(",");
    const update = () => {
      const els = list.map((id) => document.getElementById(id)).filter((e): e is HTMLElement => !!e);
      setPresent((prev) => {
        const next = new Set(els.map((e) => e.id));
        return next.size === prev.size && [...next].every((x) => prev.has(x)) ? prev : next;
      });
      const line = window.innerHeight * 0.33;
      let id: string | null = null;
      for (const el of els) if (el.getBoundingClientRect().top <= line) id = el.id;
      setCurrent(id);
      setScrolled(window.scrollY > 320);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [key]);

  return { current, present, scrolled };
}

/**
 * "On this page" for long guides: one small floating button that shows the section you're in
 * and opens a short text menu. It floats instead of sticking under the site header, so there
 * are never two stacked sticky bars. Links are plain #anchors, so history and direct links work.
 */
export function SectionNav({ locale, sections }: { locale: Locale; sections: NavSection[] }) {
  const ne = locale === "ne";
  const { current, present, scrolled: visible } = useActiveSection(sections.map((s) => s.id));
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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

  const shown = sections.filter((s) => present.has(s.id));
  if (shown.length < 4) return null;
  const label = sections.find((s) => s.id === current)?.label ?? (ne ? "यस पृष्ठमा" : "On this page");

  return (
    <div
      ref={rootRef}
      className={`no-print fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-30 sm:bottom-4 flex justify-center px-4 transition-[opacity,transform] duration-200 ${visible || open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"}`}
    >
      <div className="relative">
        {open && (
          <nav aria-label={ne ? "यस पृष्ठमा" : "On this page"} id="section-menu" className="absolute bottom-full left-1/2 mb-2 w-60 -translate-x-1/2 overflow-hidden rounded-2xl border border-paper-line bg-white py-1.5 shadow-pop">
            <ul>
              {shown.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    onClick={() => setOpen(false)}
                    aria-current={s.id === current ? "location" : undefined}
                    className={`flex min-h-[44px] items-center px-4 text-[0.95rem] transition-colors ${s.id === current ? "bg-paper-warm font-semibold text-ink" : "text-ink-soft hover:bg-paper-warm/60 hover:text-ink"}`}
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="section-menu"
          tabIndex={visible || open ? 0 : -1}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-paper-line bg-white/95 px-4 text-sm shadow-pop backdrop-blur"
        >
          <span className="text-ink-faint">{ne ? "खण्ड:" : "Section:"}</span>
          <span className="font-semibold text-ink">{label}</span>
          <ChevronUp className={`h-4 w-4 text-ink-faint transition-transform duration-200 ${open ? "" : "rotate-180"}`} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
