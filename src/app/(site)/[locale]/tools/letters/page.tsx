import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Briefcase, CalendarDays, FilePen, FileSearch, Files, Stamp } from "lucide-react";
import { isLocale, tr } from "@/lib/i18n";
import { LETTERS } from "@/lib/content/letters";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return {
    title: locale === "ne" ? "निवेदनका ढाँचा" : "Application letter templates",
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
      <section className="mesh-bg grain overflow-hidden border-b border-paper-line">
        <div className="container-page py-10 text-center sm:py-12">
          <h1 className="animate-rise text-[2rem] font-bold leading-[1.15] tracking-[-0.02em] sm:text-[2.6rem]">
            {ne ? "निवेदन लेख्न" : "Application letters,"}{" "}
            <span className="block bg-gradient-to-r from-[#D63A44] to-brand-dark bg-clip-text py-[0.12em] text-transparent">{ne ? "अब सजिलो" : "made easy"}</span>
          </h1>
          <p className="mx-auto mt-3 max-w-md animate-rise text-balance text-ink-soft [animation-delay:60ms] sm:text-lg">
            {ne ? "कार्यालयमा चल्ने ढाँचा। फोनमै भर्नुहोस्, अनि प्रिन्ट वा शेयर गर्नुहोस्।" : "The usual office format. Fill it in on your phone, then print or share."}
          </p>
        </div>
      </section>
      <div className="container-page max-w-4xl py-8 sm:py-10">
        <ul className="stagger grid gap-3 sm:grid-cols-2">
          {LETTERS.map((l) => {
            const Icon = ICONS[l.id] ?? Briefcase;
            return (
              <li key={l.id}>
                <Link
                  href={`/${locale}/tools/letters/${l.id}`}
                  className="group flex h-full items-center gap-4 rounded-2xl border border-paper-line bg-white p-4 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:border-brand/30 hover:shadow-card sm:p-5"
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-tint text-brand">
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold leading-snug text-ink">{tr(l.title, locale)}</span>
                    <span className="mt-0.5 block text-sm text-ink-faint">{tr(l.use, locale)}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-ink-faint transition-colors group-hover:text-brand" aria-hidden="true" />
                </Link>
              </li>
            );
          })}
        </ul>
        <p className="mt-6 text-center text-sm text-ink-faint">
          {ne ? "यी सामान्य ढाँचा हुन्। कार्यालयको आफ्नै फाराम छ भने त्यही प्रयोग गर्नुहोस्।" : "These are common general formats. If an office has its own form, use that."}
        </p>
      </div>
    </>
  );
}
