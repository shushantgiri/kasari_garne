import Link from "next/link";
import { ArrowRight, CalendarDays, FilePen, FileText, ImageUp, Receipt, SearchCheck, type LucideIcon } from "lucide-react";
import type { Locale } from "@/lib/content/types";

/** A tool's colour: a flat, muted tile with the icon in the deeper shade. */
interface Tone {
  tile: string;
}

export const TONES: Record<string, Tone> = {
  red: { tile: "bg-[#F6E5E2] text-[#9E3326]" },
  green: { tile: "bg-[#E5EFE7] text-[#2E6A43]" },
  indigo: { tile: "bg-[#E6EAF2] text-[#334E86]" },
  amber: { tile: "bg-[#F5EBD6] text-[#86591A]" },
  teal: { tile: "bg-[#E2EEEC] text-[#2A6863]" },
  violet: { tile: "bg-[#ECE7F1] text-[#5A4580]" },
};

interface Tool {
  href: string;
  Icon: LucideIcon;
  tone: keyof typeof TONES;
  ne: [string, string];
  en: [string, string];
}

export const TOOLS: Tool[] = [
  { href: "/tools/letters", Icon: FilePen, tone: "red", ne: ["निवेदन", "सरकारी ढाँचामा, फोनमै लेख्नुहोस्"], en: ["Applications", "Official format, written on your phone"] },
  { href: "/tools/calendar", Icon: CalendarDays, tone: "green", ne: ["मिति र बिदा", "बिदाको पात्रो, वि.सं. ↔ ई.सं."], en: ["Dates & holidays", "Holiday calendar, BS ↔ AD"] },
  { href: "/tools/status", Icon: SearchCheck, tone: "indigo", ne: ["तयार भयो?", "पासपोर्ट, लाइसेन्स, परिचयपत्र"], en: ["Is it ready?", "Passport, licence, ID card"] },
  { href: "/tools/vehicle-tax", Icon: Receipt, tone: "amber", ne: ["सवारी कर", "प्रदेशअनुसार कर र जरिवाना"], en: ["Vehicle tax", "Tax and fines by province"] },
  { href: "/tools/pdf", Icon: FileText, tone: "teal", ne: ["कागजात PDF", "फोटोबाट सानो PDF, अपलोडका लागि"], en: ["Documents to PDF", "Photos into a small PDF to upload"] },
  { href: "/tools/photo", Icon: ImageUp, tone: "violet", ne: ["फोटो साइज", "फारामले भनेको साइज र KB"], en: ["Photo size", "The size and KB a form asks for"] },
];

/** The tools as an app-style icon grid — icon and name only — for the home page. */
export function ToolIcons({ locale }: { locale: Locale }) {
  const ne = locale === "ne";
  return (
    <ul className="stagger grid grid-cols-3 gap-2.5 sm:grid-cols-6 sm:gap-3">
      {TOOLS.map((t) => (
        <li key={t.href}>
          <Link
            href={`/${locale}${t.href}`}
            className="group flex h-full flex-col items-center gap-2 rounded-2xl bg-white px-2 py-3.5 text-center ring-1 ring-paper-line transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-20px_rgba(27,34,48,.45)] active:scale-[.97] sm:py-4"
          >
            <span className={`grid h-12 w-12 place-items-center rounded-2xl transition-transform duration-300 group-hover:scale-105 ${TONES[t.tone].tile}`}>
              <t.Icon className="h-6 w-6" strokeWidth={1.9} aria-hidden="true" />
            </span>
            <span className="text-[0.85rem] font-semibold leading-tight text-ink sm:text-sm">{ne ? t.ne[0] : t.en[0]}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** At the foot of a tool page: the other tools as a row of small cards, so the next one is a tap away. */
export function ToolMore({ locale, current }: { locale: Locale; current: string }) {
  const ne = locale === "ne";
  return (
    <section className="mt-10 border-t border-paper-line pt-6">
      <h2 className="text-sm font-semibold text-ink-faint">{ne ? "अरू उपकरण" : "More tools"}</h2>
      <ul className="no-scrollbar -mx-4 mt-3 flex gap-2.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-5 sm:overflow-visible sm:px-0">
        {TOOLS.filter((t) => t.href !== current).map((t) => {
          const tone = TONES[t.tone];
          return (
            <li key={t.href} className="shrink-0">
              <Link
                href={`/${locale}${t.href}`}
                className="group flex h-full w-[8.5rem] flex-col items-start gap-2.5 rounded-2xl bg-white p-3 ring-1 ring-paper-line transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-20px_rgba(27,34,48,.45)] active:scale-[.98] sm:w-auto"
              >
                <span className={`grid h-9 w-9 place-items-center rounded-xl ${tone.tile}`}>
                  <t.Icon className="h-[1.1rem] w-[1.1rem]" strokeWidth={2} aria-hidden="true" />
                </span>
                <span className="text-sm font-semibold leading-snug text-ink">{ne ? t.ne[0] : t.en[0]}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * The tools as cards: a flat coloured icon, the name, one line, and (on wider screens) a round arrow
 * that darkens on hover; on phones the whole card is the button, kept short.
 */
export function ToolGrid({ locale, exclude }: { locale: Locale; exclude?: string }) {
  const ne = locale === "ne";
  return (
    <ul className="stagger grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
      {TOOLS.filter((t) => t.href !== exclude).map((t) => {
        const [title, text] = ne ? t.ne : t.en;
        const tone = TONES[t.tone];
        return (
          <li key={t.href}>
            <Link
              href={`/${locale}${t.href}`}
              className={`group relative flex h-full flex-col overflow-hidden rounded-3xl bg-white p-4 shadow-[0_1px_2px_rgba(27,34,48,.04),0_8px_24px_-18px_rgba(27,34,48,.3)] ring-1 ring-paper-line transition-[box-shadow,transform] duration-300 ease-[cubic-bezier(.2,.8,.2,1)] hover:-translate-y-1 hover:shadow-[0_18px_40px_-22px_rgba(27,34,48,.45)] active:scale-[.98] max-sm:p-3.5 sm:p-5`}
            >
              <span className={`relative grid h-11 w-11 place-items-center rounded-2xl sm:h-14 sm:w-14 ${tone.tile}`}>
                <t.Icon className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={1.9} aria-hidden="true" />
              </span>
              <span className="relative mt-3 block text-[1.05rem] sm:mt-4 font-bold leading-snug text-ink sm:text-lg">{title}</span>
              <span className="relative mt-0.5 block flex-1 text-[0.85rem] leading-snug text-ink-faint sm:mt-1 sm:text-sm">{text}</span>
              <span className="relative mt-3 hidden h-9 w-9 place-items-center self-end sm:grid rounded-full bg-paper-warm text-ink-soft transition-[background-color,color,transform] duration-300 group-hover:translate-x-0.5 group-hover:bg-ink group-hover:text-white">
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
