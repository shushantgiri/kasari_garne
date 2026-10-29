import { ArrowUpRight, BadgeCheck, BookUser, Car, Fingerprint, IdCard, Landmark, ScrollText, Smartphone, type LucideIcon } from "lucide-react";
import type { Locale, Localized } from "@/lib/content/types";
import { tr } from "@/lib/i18n";

interface StatusLink {
  Icon: LucideIcon;
  tone: string;
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
    tone: "bg-sky-tint text-sky",
    title: o("राहदानी (पासपोर्ट) तयार भयो?", "Is my passport ready?"),
    need: o("फाराम बुझाउँदा पाएको रेफरेन्स नम्बर वा बारकोड", "The reference number or barcode from your form"),
    how: o("पेजको 'राहदानीको स्थिति जाँच गर्नुहोस' मा", "Under 'Check passport status' on the page"),
    url: "https://nepalpassport.gov.np/#check-status",
    site: "nepalpassport.gov.np",
  },
  {
    Icon: Car,
    tone: "bg-brand-tint text-brand",
    title: o("लाइसेन्स (स्मार्ट कार्ड) प्रिन्ट भयो?", "Is my licence card printed?"),
    need: o("आफ्नो नाम वा लाइसेन्स नम्बर", "Your name or licence number"),
    how: o("आफ्नो यातायात कार्यालयको सूची खोलेर नाम खोज्नुहोस्", "Open your transport office's list and find your name"),
    url: "https://dotm.gov.np/category/details-of-printed-licenses/",
    site: "dotm.gov.np",
  },
  {
    Icon: IdCard,
    tone: "bg-ok-tint text-ok",
    title: o("राष्ट्रिय परिचयपत्र कार्डको अवस्था", "National ID card status"),
    need: o("आवेदन नम्बर (१६ अङ्क) वा राष्ट्रिय परिचय नम्बर", "Application number (16 digits) or NIN"),
    url: "https://citizenportal.donidcr.gov.np/ne/check-nid-card-status",
    site: "donidcr.gov.np",
  },
  {
    Icon: Fingerprint,
    tone: "bg-warn-tint text-warn",
    title: o("राष्ट्रिय परिचय नम्बर / eNID", "National ID number / eNID"),
    need: o("पूरा नाम, जन्म मिति (वि.सं.), नागरिकता जारी मिति", "Full name, date of birth (BS), citizenship issue date"),
    url: "https://citizenportal.donidcr.gov.np/ne/check-national-id-number",
    site: "donidcr.gov.np",
  },
  {
    Icon: Landmark,
    tone: "bg-sky-tint text-sky",
    title: o("प्यान (PAN) नम्बर जाँच", "Check a PAN number"),
    need: o("प्यान नम्बर", "The PAN number"),
    url: "https://ird.gov.np/pan-search",
    site: "ird.gov.np",
  },
  {
    Icon: ScrollText,
    tone: "bg-brand-tint text-brand",
    title: o("लोक सेवा आयोगको नतिजा", "Public Service Commission results"),
    need: o("रोल नम्बर वा नाम (नतिजाको सूचनामा)", "Roll number or name (in the result notice)"),
    url: "https://psc.gov.np/category/result.html",
    site: "psc.gov.np",
  },
  {
    Icon: Smartphone,
    tone: "bg-ok-tint text-ok",
    title: o("नागरिक एप — सबै विवरण एकै ठाउँमा", "Nagarik App — your records in one place"),
    need: o("मोबाइल नम्बर र नागरिकता", "Mobile number and citizenship"),
    url: "https://nagarikapp.gov.np",
    site: "nagarikapp.gov.np",
  },
];

export function StatusHub({ locale }: { locale: Locale }) {
  const ne = locale === "ne";
  return (
    <div>
      <ul className="stagger grid gap-3 sm:grid-cols-2">
        {LINKS.map((l) => (
          <li key={l.url}>
            <a
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex h-full items-start gap-4 rounded-3xl border border-paper-line bg-white p-4 transition-[border-color,box-shadow,transform] duration-200 ease-[cubic-bezier(.2,.8,.2,1)] hover:-translate-y-0.5 hover:border-sky/30 hover:shadow-card active:scale-[.99] sm:p-5"
            >
              <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 ${l.tone}`}>
                <l.Icon className="h-6 w-6" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-start justify-between gap-2">
                  <span className="text-[1.05rem] font-bold leading-snug text-ink">{tr(l.title, locale)}</span>
                  <ArrowUpRight className="mt-0.5 h-5 w-5 shrink-0 text-ink-faint transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-sky" aria-hidden="true" />
                </span>
                <span className="mt-1.5 block text-sm text-ink-soft">
                  <span className="font-semibold text-ink">{ne ? "चाहिने: " : "Have ready: "}</span>
                  {tr(l.need, locale)}
                </span>
                {l.how && <span className="mt-0.5 block text-sm text-ink-faint">{tr(l.how, locale)}</span>}
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-ok">
                  <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  {l.site}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
