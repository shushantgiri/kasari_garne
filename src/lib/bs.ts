import NepaliDateModule from "nepali-date-converter";

/**
 * Bikram Sambat helpers on top of nepali-date-converter (months here are 1–12; the library's are 0–11).
 * The library covers BS 2000–2090; its 2083 weekdays match the government's holiday notice.
 */
const NepaliDate = (NepaliDateModule as unknown as { default?: typeof NepaliDateModule }).default ?? NepaliDateModule;

export const BS_MIN_YEAR = 2000;
export const BS_MAX_YEAR = 2090;

export const BS_MONTHS_NE = ["बैशाख", "जेठ", "असार", "साउन", "भदौ", "असोज", "कात्तिक", "मङ्सिर", "पुस", "माघ", "फागुन", "चैत"];
export const BS_MONTHS_EN = ["Baisakh", "Jestha", "Asar", "Shrawan", "Bhadra", "Asoj", "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"];
export const WEEKDAYS_NE = ["आइतबार", "सोमबार", "मङ्गलबार", "बुधबार", "बिहीबार", "शुक्रबार", "शनिबार"];
export const WEEKDAYS_SHORT_NE = ["आइत", "सोम", "मङ्गल", "बुध", "बिही", "शुक्र", "शनि"];
export const WEEKDAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export interface Bs {
  year: number;
  month: number;
  day: number;
}

/** AD (a local calendar date) to BS. */
export function adToBs(date: Date): Bs {
  const n = new NepaliDate(date);
  return { year: n.getYear(), month: n.getMonth() + 1, day: n.getDate() };
}

/** BS to AD (midnight, local time). Throws for dates outside the library's range. */
export function bsToAd(bs: Bs): Date {
  return new NepaliDate(bs.year, bs.month - 1, bs.day).toJsDate();
}

/** Days in a BS month (29–32). */
export function daysInBsMonth(year: number, month: number): number {
  for (let d = 32; d >= 29; d--) {
    try {
      const n = new NepaliDate(year, month - 1, d);
      if (n.getMonth() === month - 1 && n.getDate() === d) return d;
    } catch {
      // Not a valid date: try one less.
    }
  }
  return 30;
}

/** Today's date and hour in Nepal, whatever the device's time zone. */
export function nepalNow(): { date: Date; hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kathmandu", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { date: new Date(get("year"), get("month") - 1, get("day")), hour: get("hour"), minute: get("minute") };
}

/** Whole years, months and days from one AD date to another (the person's age, say). */
export function ageBetween(from: Date, to: Date): { years: number; months: number; days: number } | null {
  if (to < from) return null;
  let years = to.getFullYear() - from.getFullYear();
  let months = to.getMonth() - from.getMonth();
  let days = to.getDate() - from.getDate();
  if (days < 0) {
    months--;
    days += new Date(to.getFullYear(), to.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  return { years, months, days };
}
