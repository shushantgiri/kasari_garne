import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Locale } from "@/lib/content/types";
import { TONES, TOOLS } from "./ToolGrid";

/**
 * The header of a tool page. With `tool`, a compact app-like bar: a link back to all tools, the tool's
 * icon, and the title with its second part softer — short, so the tool itself
 * starts near the top. Without it (the tools hub), the large centred header.
 */
export function ToolHero({ first, second, text, locale, tool, width = "max-w-4xl" }: { first: string; second: string; text: string; locale?: Locale; tool?: string; width?: string }) {
  const t = tool ? TOOLS.find((x) => x.href === tool) : undefined;
  if (!t || !locale) {
    return (
      <section className="mesh-bg grain overflow-hidden border-b border-paper-line">
        <div className="container-page py-10 text-center sm:py-12">
          <h1 className="animate-rise text-[2rem] font-bold leading-[1.15] tracking-[-0.02em] sm:text-[2.6rem]">
            {first}{" "}
            <span className="block text-brand">{second}</span>
          </h1>
          <p className="mx-auto mt-3 max-w-md animate-rise text-balance text-ink-soft [animation-delay:60ms] sm:text-lg">{text}</p>
        </div>
      </section>
    );
  }
  const tone = TONES[t.tone];
  const ne = locale === "ne";
  return (
    <section className="relative overflow-hidden border-b border-paper-line bg-paper-warm">
      <div className={`container-page relative py-4 sm:py-7 ${width}`}>
        <Link
          href={`/${locale}/tools`}
          className="group inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-white px-3 text-sm font-semibold text-ink-soft ring-1 ring-paper-line transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" aria-hidden="true" />
          {ne ? "सबै उपकरण" : "All tools"}
        </Link>
        <div className="mt-3 flex items-center gap-3.5 sm:mt-4 sm:gap-5">
          <span className={`grid h-14 w-14 shrink-0 animate-pop place-items-center rounded-[1.1rem] sm:h-[4.5rem] sm:w-[4.5rem] sm:rounded-3xl ${tone.tile}`}>
            <t.Icon className="h-7 w-7 sm:h-9 sm:w-9" strokeWidth={1.9} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h1 className="animate-rise text-[1.55rem] font-bold leading-tight tracking-[-0.02em] sm:text-[2.1rem]">
              {first}{" "}
              <span className="text-ink-soft">{second}</span>
            </h1>
            <p className="mt-0.5 animate-rise text-[0.95rem] leading-snug text-ink-soft [animation-delay:60ms] sm:mt-1 sm:text-lg">{text}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
