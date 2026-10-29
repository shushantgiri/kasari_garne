import Link from "next/link";
import { ArrowRight, CalendarDays, FilePen, FileText, ImageUp, Receipt, SearchCheck, type LucideIcon } from "lucide-react";
import type { Locale } from "@/lib/content/types";

interface Tone {
  /** Icon tile gradient. */
  tile: string;
  /** Coloured shadow under the tile. */
  glow: string;
  /** The card's corner wash and hover ring. */
  wash: string;
  ring: string;
  /** The arrow button once hovered. */
  arrow: string;
}

const TONES: Record<string, Tone> = {
  red: { tile: "from-[#E5525B] to-[#A51C25]", glow: "shadow-[0_10px_20px_-10px_rgba(180,35,44,.7)]", wash: "bg-[#B4232C]", ring: "hover:ring-[#B4232C]/25", arrow: "group-hover:bg-[#B4232C]" },
  green: { tile: "from-[#38B072] to-[#17663E]", glow: "shadow-[0_10px_20px_-10px_rgba(30,122,76,.7)]", wash: "bg-[#1E7A4C]", ring: "hover:ring-[#1E7A4C]/25", arrow: "group-hover:bg-[#1E7A4C]" },
  indigo: { tile: "from-[#5571D9] to-[#1F3F8F]", glow: "shadow-[0_10px_20px_-10px_rgba(31,63,143,.7)]", wash: "bg-[#1F3F8F]", ring: "hover:ring-[#1F3F8F]/25", arrow: "group-hover:bg-[#1F3F8F]" },
  amber: { tile: "from-[#F4B53F] to-[#C77A0A]", glow: "shadow-[0_10px_20px_-10px_rgba(199,122,10,.7)]", wash: "bg-[#C77A0A]", ring: "hover:ring-[#C77A0A]/25", arrow: "group-hover:bg-[#C77A0A]" },
  teal: { tile: "from-[#2BB3B1] to-[#0F6E78]", glow: "shadow-[0_10px_20px_-10px_rgba(15,110,120,.7)]", wash: "bg-[#0F6E78]", ring: "hover:ring-[#0F6E78]/25", arrow: "group-hover:bg-[#0F6E78]" },
  violet: { tile: "from-[#9A6AE8] to-[#5B2DB0]", glow: "shadow-[0_10px_20px_-10px_rgba(91,45,176,.7)]", wash: "bg-[#5B2DB0]", ring: "hover:ring-[#5B2DB0]/25", arrow: "group-hover:bg-[#5B2DB0]" },
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

/**
 * The tools as cards: a glowing gradient icon, the name, one line, and (on wider screens) a round arrow
 * that fills with the tool's colour on hover; on phones the whole card is the button, kept short. Each card has a faint wash of its colour in the corner.
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
              className={`group relative flex h-full flex-col overflow-hidden rounded-3xl bg-white p-4 shadow-[0_1px_2px_rgba(27,34,48,.04),0_8px_24px_-18px_rgba(27,34,48,.3)] ring-1 ring-paper-line transition-[box-shadow,transform] duration-300 ease-[cubic-bezier(.2,.8,.2,1)] hover:-translate-y-1 hover:shadow-[0_18px_40px_-22px_rgba(27,34,48,.45)] active:scale-[.98] max-sm:p-3.5 sm:p-5 ${tone.ring}`}
            >
              <span className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-[.07] blur-xl transition-opacity duration-300 group-hover:opacity-[.14] ${tone.wash}`} aria-hidden="true" />
              <span className={`relative grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br text-white transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105 sm:h-14 sm:w-14 ${tone.tile} ${tone.glow}`}>
                <t.Icon className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={1.9} aria-hidden="true" />
              </span>
              <span className="relative mt-3 block text-[1.05rem] sm:mt-4 font-bold leading-snug text-ink sm:text-lg">{title}</span>
              <span className="relative mt-0.5 block flex-1 text-[0.85rem] leading-snug text-ink-faint sm:mt-1 sm:text-sm">{text}</span>
              <span className={`relative mt-3 hidden h-9 w-9 place-items-center self-end sm:grid rounded-full bg-paper-warm text-ink-soft transition-[background-color,color,transform] duration-300 group-hover:translate-x-0.5 group-hover:text-white ${tone.arrow}`}>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
