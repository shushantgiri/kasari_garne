"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Locale } from "@/lib/content/types";
import { digits } from "@/lib/i18n";

export interface GuideTab {
  id: string;
  label: string;
  /** The ids of the page sections shown in this step. */
  sections: string[];
}

/**
 * A guide one step at a time, so nobody has to scroll through everything at once: a numbered
 * step bar that stays in view, only the current step's sections on screen, and big Next / Back
 * buttons at the bottom. Links to a section (#finish, #steps…) and `kg:tab` events open the
 * step that holds it. The sections are ordinary page sections; this only hides the others.
 */
export function GuideTabs({ locale, tabs, className, children }: { locale: Locale; tabs: GuideTab[]; className?: string; children: React.ReactNode }) {
  const ne = locale === "ne";
  const [active, setActive] = useState(tabs[0].id);
  const rootRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const at = Math.max(0, tabs.findIndex((t) => t.id === active));

  // Show the current step's sections, hide the rest; again whenever sections come and go.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const show = new Set(tabs[at].sections);
    const apply = () => {
      for (const el of Array.from(root.children) as HTMLElement[]) {
        if (el.dataset.keep !== undefined) continue;
        el.hidden = !show.has(el.id);
      }
    };
    apply();
    const watch = new MutationObserver(apply);
    watch.observe(root, { childList: true });
    return () => watch.disconnect();
  }, [at, tabs]);

  /** Open a step and bring the top of it (just under the step bar) into view. */
  const open = useCallback(
    (id: string, scroll = true) => {
      setActive(id);
      if (!scroll) return;
      requestAnimationFrame(() => {
        const top = (rootRef.current?.getBoundingClientRect().top ?? 0) + window.scrollY - 140;
        if (window.scrollY > top) window.scrollTo({ top, behavior: "smooth" });
      });
    },
    [],
  );

  /** The step that holds a section, or anything inside one (e.g. #steps inside #video). */
  const stepFor = useCallback(
    (id: string) => {
      const direct = tabs.find((t) => t.sections.includes(id));
      if (direct) return direct.id;
      const el = document.getElementById(id);
      const section = el && rootRef.current ? (Array.from(rootRef.current.children) as HTMLElement[]).find((c) => c.contains(el)) : undefined;
      return section ? tabs.find((t) => t.sections.includes(section.id))?.id : undefined;
    },
    [tabs],
  );

  useEffect(() => {
    // Links to a section on this page open its step first.
    const click = (e: MouseEvent) => {
      const href = (e.target as HTMLElement).closest?.("a")?.getAttribute("href");
      if (!href?.startsWith("#") || href.length < 2) return;
      const step = stepFor(href.slice(1));
      if (step) {
        setActive(step);
        requestAnimationFrame(() => document.getElementById(href.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" }));
      }
    };
    // Other parts of the guide can ask for a step: `kg:tab` with { section }.
    const ask = (e: Event) => {
      const section = (e as CustomEvent<{ section: string }>).detail?.section;
      const step = section && stepFor(section);
      if (step) setActive(step);
    };
    // Arriving with #finish etc. in the address.
    const fromHash = () => {
      const step = window.location.hash.length > 1 && stepFor(window.location.hash.slice(1));
      if (step) setActive(step);
    };
    fromHash();
    document.addEventListener("click", click);
    window.addEventListener("kg:tab", ask);
    window.addEventListener("hashchange", fromHash);
    return () => {
      document.removeEventListener("click", click);
      window.removeEventListener("kg:tab", ask);
      window.removeEventListener("hashchange", fromHash);
    };
  }, [stepFor]);

  // Keep the current step's button in view in the step bar on narrow screens.
  useEffect(() => {
    barRef.current?.querySelector<HTMLElement>(`[data-step="${tabs[at].id}"]`)?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [at, tabs]);

  const prev = tabs[at - 1];
  const next = tabs[at + 1];
  const n = (v: number) => (ne ? digits(v, "ne") : String(v));

  return (
    <>
      {/* The step bar. */}
      <nav aria-label={ne ? "चरणहरू" : "Steps"} className="no-print sticky top-16 z-30 border-b border-paper-line bg-paper-warm/95 backdrop-blur">
        <div ref={barRef} className="no-scrollbar container-page flex max-w-3xl gap-1.5 overflow-x-auto py-2.5">
          {tabs.map((t, i) => {
            const on = i === at;
            const done = i < at;
            return (
              <button
                key={t.id}
                type="button"
                data-step={t.id}
                onClick={() => open(t.id)}
                aria-current={on ? "step" : undefined}
                className={`inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-full pl-1.5 pr-3.5 text-sm font-semibold transition-colors duration-150 ${
                  on ? "bg-ink text-white" : "bg-white text-ink-soft ring-1 ring-paper-line hover:text-ink"
                }`}
              >
                <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${on ? "bg-white text-ink" : done ? "bg-ok text-white" : "bg-paper-warm text-ink-soft"}`}>
                  {n(i + 1)}
                </span>
                {t.label}
              </button>
            );
          })}
        </div>
      </nav>

      <div ref={rootRef} className={className}>
        {children}
        {/* Next and back, at the end of every step. */}
        <div data-keep="" className="no-print flex gap-2">
          {prev && (
            <button type="button" onClick={() => open(prev.id)} className="btn-secondary min-h-[52px] shrink-0 px-4">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">{ne ? "अघिल्लो" : "Back"}</span>
            </button>
          )}
          {next && (
            <button type="button" onClick={() => open(next.id)} className="btn-primary min-h-[52px] flex-1 text-base">
              {ne ? `अर्को: ${next.label}` : `Next: ${next.label}`}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
