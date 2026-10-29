import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Briefcase, CalendarDays, FilePen, FileSearch, Files, Stamp } from "lucide-react";
import { isLocale, tr } from "@/lib/i18n";
import { LETTERS } from "@/lib/content/letters";
import { ToolHero } from "@/components/tools/ToolHero";
import { ToolMore } from "@/components/tools/ToolGrid";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return {
    title: locale === "ne" ? "निवेदनका ढाँचा" : "Application templates",
    description:
      locale === "ne"
        ? "सरकारी कार्यालयमा चल्ने ढाँचामा निवेदन फोनमै भर्नुहोस्, अनि कपी, शेयर वा प्रिन्ट गर्नुहोस्।"
        : "Fill in application letters in the usual government-office format on your phone, then copy, share or print.",
  };
}

/** One icon per letter, so the list is quick to scan. */
const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "ward-recommendation": Stamp,
  leave: CalendarDays,
  "lost-document": FileSearch,
  correction: FilePen,
  copy: Files,
  general: Briefcase,
};

export default async function LettersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ne = locale === "ne";
  return (
    <>
      <ToolHero
        locale={locale}
        tool="/tools/letters"
        first={ne ? "निवेदन लेख्न" : "Applications,"}
        second={ne ? "अब सजिलो" : "made easy"}
        text={ne ? "कार्यालयमा चल्ने ढाँचा, फोनमै भर्नुहोस्।" : "The usual office format, filled in on your phone."}
      />
      <div className="container-page max-w-4xl py-6 sm:py-10">
        <ul className="stagger grid gap-3 sm:grid-cols-2">
          {LETTERS.map((l) => {
            const Icon = ICONS[l.id] ?? Briefcase;
            return (
              <li key={l.id}>
                <Link
                  href={`/${locale}/tools/letters/${l.id}`}
                  className="group flex h-full items-center gap-4 rounded-3xl bg-white p-4 shadow-[0_1px_2px_rgba(27,34,48,.04),0_8px_24px_-18px_rgba(27,34,48,.3)] ring-1 ring-paper-line transition-[box-shadow,transform] duration-300 ease-[cubic-bezier(.2,.8,.2,1)] hover:-translate-y-1 hover:shadow-[0_18px_40px_-22px_rgba(27,34,48,.45)] active:scale-[.99] sm:p-5"
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#F6E5E2] text-[#9E3326]">
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold leading-snug text-ink">{tr(l.title, locale)}</span>
                    <span className="mt-0.5 block text-sm text-ink-faint">{tr(l.use, locale)}</span>
                  </span>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-paper-warm text-ink-soft transition-[background-color,color,transform] duration-300 group-hover:translate-x-0.5 group-hover:bg-ink group-hover:text-white">
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        <p className="mt-5 text-center text-sm text-ink-faint">
          {ne ? "यी सामान्य ढाँचा हुन्। कार्यालयको आफ्नै फाराम छ भने त्यही प्रयोग गर्नुहोस्।" : "These are common general formats. If an office has its own form, use that."}
        </p>
        <ToolMore locale={locale} current="/tools/letters" />
      </div>
    </>
  );
}
