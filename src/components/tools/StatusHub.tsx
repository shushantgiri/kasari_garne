import { ArrowRight, BadgeCheck, KeyRound, BookUser, Car, Fingerprint, IdCard, Landmark, ScrollText, Smartphone, type LucideIcon } from "lucide-react";
import type { Locale, Localized } from "@/lib/content/types";
import { tr } from "@/lib/i18n";
import { TONES } from "./ToolGrid";

interface StatusLink {
  Icon: LucideIcon;
  tone: keyof typeof TONES;
  title: Localized;
  /** What to have ready. */
  need: Localized;
  /** Where to click once the page opens, if it isn't obvious. */
  how?: Localized;
  url: string;
  site: string;
}

const o = (ne: string, en: string): Localized => ({ ne, en });

/**
 * Official pages to check whether something is ready. Every link is the government's own page
 * (checked to open); nothing is looked up through this site.
 */
const LINKS: StatusLink[] = [
  {
    Icon: BookUser,
    tone: "indigo",
    title: o("राहदानी (पासपोर्ट)", "Passport"),
    need: o("फाराम बुझाउँदा पाएको रेफरेन्स नम्बर वा बारकोड", "The reference number or barcode from your form"),
    how: o("पेजको 'राहदानीको स्थिति जाँच गर्नुहोस' मा", "Under 'Check passport status' on the page"),
    url: "https://nepalpassport.gov.np/#check-status",
    site: "nepalpassport.gov.np",
  },
  {
    Icon: Car,
    tone: "red",
    title: o("लाइसेन्स कार्ड प्रिन्ट", "Licence card printed"),
    need: o("आफ्नो नाम वा लाइसेन्स नम्बर", "Your name or licence number"),
    how: o("आफ्नो यातायात कार्यालयको सूची खोलेर नाम खोज्नुहोस्", "Open your transport office's list and find your name"),
    url: "https://dotm.gov.np/category/details-of-printed-licenses/",
    site: "dotm.gov.np",
  },
  {
    Icon: IdCard,
    tone: "green",
    title: o("राष्ट्रिय परिचयपत्र कार्ड", "National ID card"),
    need: o("आवेदन नम्बर (१६ अङ्क) वा राष्ट्रिय परिचय नम्बर", "Application number (16 digits) or NIN"),
    url: "https://citizenportal.donidcr.gov.np/ne/check-nid-card-status",
    site: "donidcr.gov.np",
  },
  {
    Icon: Fingerprint,
    tone: "amber",
    title: o("परिचय नम्बर / eNID", "ID number / eNID"),
    need: o("पूरा नाम, जन्म मिति (वि.सं.), नागरिकता जारी मिति", "Full name, date of birth (BS), citizenship issue date"),
    url: "https://citizenportal.donidcr.gov.np/ne/check-national-id-number",
    site: "donidcr.gov.np",
  },
  {
    Icon: Landmark,
    tone: "teal",
    title: o("प्यान (PAN) नम्बर", "PAN number"),
    need: o("प्यान नम्बर", "The PAN number"),
    url: "https://ird.gov.np/pan-search",
    site: "ird.gov.np",
  },
  {
    Icon: ScrollText,
    tone: "violet",
    title: o("लोक सेवा नतिजा", "Lok Sewa results"),
    need: o("रोल नम्बर वा नाम (नतिजाको सूचनामा)", "Roll number or name (in the result notice)"),
    url: "https://psc.gov.np/category/result.html",
    site: "psc.gov.np",
  },
  {
    Icon: Smartphone,
    tone: "green",
    title: o("नागरिक एप", "Nagarik App"),
    need: o("मोबाइल नम्बर र नागरिकता", "Mobile number and citizenship"),
    url: "https://nagarikapp.gov.np",
    site: "nagarikapp.gov.np",
  },
];

/**
 * Each check as a card: an icon with the name and the official site under it, what to have
 * ready in a soft box, and one clear button that opens the government page.
 */
export function StatusHub({ locale }: { locale: Locale }) {
  const ne = locale === "ne";
  return (
    <ul className="stagger grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
      {LINKS.map((l) => {
        const t = TONES[l.tone];
        return (
          <li key={l.url}>
            <a
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex h-full flex-col rounded-3xl bg-white p-4 shadow-[0_1px_2px_rgba(27,34,48,.04),0_8px_24px_-18px_rgba(27,34,48,.3)] ring-1 ring-paper-line transition-[box-shadow,transform] duration-300 ease-[cubic-bezier(.2,.8,.2,1)] hover:-translate-y-1 hover:shadow-[0_18px_40px_-22px_rgba(27,34,48,.45)] active:scale-[.99] sm:p-5"
            >
              <span className="flex items-center gap-3.5">
                <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${t.tile}`}>
                  <l.Icon className="h-6 w-6" strokeWidth={1.9} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[1.1rem] font-bold leading-snug text-ink">{tr(l.title, locale)}</span>
                  <span className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-ok">
                    <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    {l.site}
                  </span>
                </span>
                {/* On phones a round arrow here stands in for the big button, to keep the list short. */}
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-white sm:hidden">
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </span>
              <span className="mt-3 flex flex-1 gap-2.5 rounded-2xl bg-paper-warm px-3.5 py-2.5 text-[0.95rem] leading-snug sm:mt-4 sm:py-3">
                <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-ink-soft" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-xs font-semibold uppercase tracking-wide text-ink-faint">{ne ? "चाहिने" : "Have ready"}</span>
                  <span className="mt-0.5 block font-medium text-ink">{tr(l.need, locale)}</span>
                  {l.how && <span className="mt-1 block text-sm text-ink-soft">{tr(l.how, locale)}</span>}
                </span>
              </span>
              <span className="mt-3 hidden min-h-[46px] items-center justify-center gap-2 rounded-2xl bg-ink text-[0.95rem] font-semibold text-white transition-colors duration-200 group-hover:bg-black sm:inline-flex">
                {ne ? "जाँच गर्नुहोस्" : "Check now"}
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
