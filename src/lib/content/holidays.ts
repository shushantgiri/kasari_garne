/**
 * Government holidays and office hours for 2083 BS, from the Ministry of Home Affairs notice in the
 * Nepal Gazette (खण्ड ७५, संख्या ६७, भाग ५, फागुन १८ गते २०८२). Weekly holiday: Saturday only.
 *
 * Section 10.1 of the notice says that on many festival and day holidays the offices for citizenship,
 * passport, transport (licence, vehicle registration and renewal), national ID, land revenue and
 * survey, local government services and others must keep serving the public. Those days are marked `servicesOpen`.
 * Eid ul-Fitr and Eid al-Adha are holidays "on the day" with no fixed date, so they aren't listed.
 */

export const HOLIDAY_YEAR = 2083;
export const HOLIDAY_SOURCE = "नेपाल राजपत्र, भाग ५, खण्ड ७५ संख्या ६७ (फागुन १८, २०८२), गृह मन्त्रालय";
export const HOLIDAY_SOURCE_URL = "https://www.moha.gov.np/page/government-and-public-holidays-in-2083";

export interface Holiday {
  /** BS month 1–12 and day. */
  month: number;
  day: number;
  name: string;
  /** Who gets the day off; absent = everyone, all over Nepal. */
  only?: string;
  /** Citizenship, passport, transport, ID and land offices still serve the public (notice section 10.1). */
  servicesOpen?: boolean;
}

/** One holiday over several days. */
function span(month: number, from: number, to: number, name: string, extra: Partial<Holiday> = {}): Holiday[] {
  const out: Holiday[] = [];
  for (let d = from; d <= to; d++) out.push({ month, day: d, name, ...extra });
  return out;
}

export const HOLIDAYS_2083: Holiday[] = [
  // Everyone, all over Nepal.
  { month: 1, day: 1, name: "नव वर्ष" },
  { month: 1, day: 18, name: "बुद्ध जयन्ती, उभौली पर्व, विश्व मजदुर दिवस", servicesOpen: true },
  { month: 2, day: 15, name: "गणतन्त्र दिवस", servicesOpen: true },
  { month: 5, day: 12, name: "रक्षाबन्धन", servicesOpen: true },
  { month: 5, day: 19, name: "श्रीकृष्ण जन्माष्टमी", servicesOpen: true },
  { month: 6, day: 3, name: "संविधान दिवस" },
  { month: 6, day: 25, name: "घटस्थापना", servicesOpen: true },
  { month: 6, day: 31, name: "दशैं (फूलपाती)" },
  ...span(7, 1, 6, "दशैं बिदा"),
  ...span(7, 22, 26, "तिहार बिदा"),
  { month: 7, day: 29, name: "छठ पर्व" },
  { month: 9, day: 9, name: "धान्य पूर्णिमा, उधौली पर्व, योमरी पुन्हि, ज्यापू दिवस", servicesOpen: true },
  { month: 9, day: 10, name: "क्रिसमस डे", servicesOpen: true },
  { month: 9, day: 15, name: "तमू ल्होछार", servicesOpen: true },
  { month: 9, day: 27, name: "पृथ्वी जयन्ती (राष्ट्रिय एकता दिवस)", servicesOpen: true },
  { month: 10, day: 1, name: "माघी पर्व / माघे सङ्क्रान्ति", servicesOpen: true },
  { month: 10, day: 16, name: "सहिद दिवस", servicesOpen: true },
  { month: 10, day: 24, name: "सोनम ल्होछार", servicesOpen: true },
  { month: 11, day: 7, name: "राष्ट्रिय प्रजातन्त्र दिवस", servicesOpen: true },
  { month: 11, day: 22, name: "महाशिवरात्री", servicesOpen: true },
  { month: 11, day: 24, name: "अन्तर्राष्ट्रिय महिला दिवस", servicesOpen: true },
  { month: 11, day: 25, name: "ग्याल्पो ल्होसार", servicesOpen: true },
  { month: 12, day: 7, name: "फागु पूर्णिमा (होली)", only: "हिमाली र पहाडी ५६ जिल्ला" },
  { month: 12, day: 8, name: "फागु पूर्णिमा (होली)", only: "तराईका २१ जिल्ला" },

  // Only for some people or places.
  { month: 5, day: 13, name: "गाईजात्रा", only: "काठमाडौं उपत्यका र देशभरका नेवार समुदाय", servicesOpen: true },
  { month: 5, day: 19, name: "गौरा पर्व", only: "सम्बन्धित क्षेत्र" },
  { month: 5, day: 29, name: "हरितालिका तीज", only: "महिला कर्मचारी" },
  { month: 6, day: 9, name: "इन्द्रजात्रा", only: "काठमाडौं उपत्यका", servicesOpen: true },
  { month: 6, day: 18, name: "जितिया पर्व", only: "पर्व मनाउने महिला कर्मचारी" },
  { month: 7, day: 25, name: "फाल्गुनन्द जयन्ती", only: "किराँत धर्मावलम्बी" },
  { month: 8, day: 17, name: "अन्तर्राष्ट्रिय अपाङ्गता दिवस", only: "अपाङ्गता भएका कर्मचारी" },
  { month: 9, day: 15, name: "दुरा म्हैप्रु नकुमा", only: "दुरा समुदाय" },
  { month: 10, day: 28, name: "वसन्त पञ्चमी", only: "शिक्षण संस्था" },
  { month: 12, day: 23, name: "घोडेजात्रा", only: "काठमाडौं उपत्यका", servicesOpen: true },
];

export const SERVICES_OPEN_NOTE = "नागरिकता, राहदानी, यातायात (लाइसेन्स, सवारी दर्ता/नवीकरण), राष्ट्रिय परिचयपत्र, मालपोत र स्थानीय तहका सेवा खुला रहने व्यवस्था छ।";

/** Holidays on a BS date (2083 only). */
export function holidaysOn(year: number, month: number, day: number): Holiday[] {
  if (year !== HOLIDAY_YEAR) return [];
  return HOLIDAYS_2083.filter((h) => h.month === month && h.day === day);
}

/**
 * Office hours on a BS date, as hours of the day [open, close]: 10–5 from Baisakh 1 to Kartik 15 and
 * from Magh 16 to the end of Chaitra; 10–4 from Kartik 16 to Magh 15; Fridays 10–3. `weekday` 0 = Sunday.
 */
export function officeHours(month: number, day: number, weekday: number): [number, number] {
  if (weekday === 5) return [10, 15];
  const winter = (month === 7 && day >= 16) || month === 8 || month === 9 || (month === 10 && day <= 15);
  return [10, winter ? 16 : 17];
}

export type OfficeDay =
  | { kind: "saturday" }
  | { kind: "holiday"; names: string[] }
  | { kind: "servicesOpen"; names: string[]; hours: [number, number] }
  | { kind: "open"; hours: [number, number]; partial: Holiday[] };

/** Whether government offices are open on a BS date. */
export function officeDay(year: number, month: number, day: number, weekday: number): OfficeDay {
  if (weekday === 6) return { kind: "saturday" };
  const hs = holidaysOn(year, month, day);
  const everyone = hs.filter((h) => !h.only);
  const hours = officeHours(month, day, weekday);
  if (everyone.length) {
    if (everyone.every((h) => h.servicesOpen)) return { kind: "servicesOpen", names: everyone.map((h) => h.name), hours };
    return { kind: "holiday", names: everyone.map((h) => h.name) };
  }
  return { kind: "open", hours, partial: hs };
}
