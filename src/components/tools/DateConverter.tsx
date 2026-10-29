"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownUp, Cake, Check, Copy } from "lucide-react";
import type { Locale } from "@/lib/content/types";
import { adToBs, ageBetween, bsToAd, daysInBsMonth, nepalNow, BS_MAX_YEAR, BS_MIN_YEAR, BS_MONTHS_EN, BS_MONTHS_NE, WEEKDAYS_EN, WEEKDAYS_NE, type Bs } from "@/lib/bs";
import { digits } from "@/lib/i18n";

const AD_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const AD_MIN = new Date(1943, 3, 14);
const AD_MAX = new Date(2034, 3, 12);
const pad = (v: number) => String(v).padStart(2, "0");

/**
 * BS ↔ AD converter, for forms that ask for a date in the other calendar. Pick a date, see the other
 * one at once, copy it in the form's usual style (२०८३/०७/१३ or 2026-10-30), and, for a past date,
 * the age today — handy for date of birth.
 */
export function DateConverter({ locale }: { locale: Locale }) {
  const ne = locale === "ne";
  const n = (v: number | string) => (ne ? digits(v, "ne") : String(v));
  const [from, setFrom] = useState<"bs" | "ad">("bs");
  const [bs, setBs] = useState<Bs>({ year: 2060, month: 1, day: 1 });
  const [ad, setAd] = useState("2003-04-14");
  const [now, setNow] = useState<Date | null>(null);
  const [copied, setCopied] = useState(false);

  // Start on today's date.
  useEffect(() => {
    const d = nepalNow().date;
    setNow(d);
    setBs(adToBs(d));
    setAd(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
  }, []);

  // Keep the day valid when the month changes length.
  const maxDay = daysInBsMonth(bs.year, bs.month);
  useEffect(() => {
    if (bs.day > maxDay) setBs((b) => ({ ...b, day: maxDay }));
  }, [bs.day, maxDay]);

  const result = useMemo(() => {
    try {
      if (from === "bs") {
        const d = bsToAd({ ...bs, day: Math.min(bs.day, maxDay) });
        return { adDate: d, bsDate: { ...bs, day: Math.min(bs.day, maxDay) } };
      }
      const [y, m, d] = ad.split("-").map(Number);
      if (!y || !m || !d) return null;
      const date = new Date(y, m - 1, d);
      if (date < AD_MIN || date > AD_MAX) return null;
      return { adDate: date, bsDate: adToBs(date) };
    } catch {
      return null;
    }
  }, [from, bs, ad, maxDay]);

  const age = result && now ? ageBetween(result.adDate, now) : null;
  const out = result
    ? from === "bs"
      ? {
          big: ne ? `${result.adDate.getDate()} ${AD_MONTHS[result.adDate.getMonth()]} ${result.adDate.getFullYear()}` : `${result.adDate.getDate()} ${AD_MONTHS[result.adDate.getMonth()]} ${result.adDate.getFullYear()}`,
          copy: `${result.adDate.getFullYear()}-${pad(result.adDate.getMonth() + 1)}-${pad(result.adDate.getDate())}`,
        }
      : {
          big: ne ? `${BS_MONTHS_NE[result.bsDate.month - 1]} ${n(result.bsDate.day)}, ${n(result.bsDate.year)}` : `${result.bsDate.day} ${BS_MONTHS_EN[result.bsDate.month - 1]} ${result.bsDate.year}`,
          copy: ne ? digits(`${result.bsDate.year}/${pad(result.bsDate.month)}/${pad(result.bsDate.day)}`, "ne") : `${result.bsDate.year}/${pad(result.bsDate.month)}/${pad(result.bsDate.day)}`,
        }
    : null;

  const copy = async () => {
    if (!out) return;
    try {
      await navigator.clipboard.writeText(out.copy);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {}
  };

  const swap = () => {
    if (result) {
      setBs(result.bsDate);
      setAd(`${result.adDate.getFullYear()}-${pad(result.adDate.getMonth() + 1)}-${pad(result.adDate.getDate())}`);
    }
    setFrom((f) => (f === "bs" ? "ad" : "bs"));
  };

  const select = "min-h-[52px] w-full rounded-xl border border-paper-line bg-white px-3 text-base font-semibold text-ink focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/25";
  const years = Array.from({ length: BS_MAX_YEAR - BS_MIN_YEAR + 1 }, (_, i) => BS_MAX_YEAR - i);

  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-[0_1px_2px_rgba(27,34,48,.04),0_10px_30px_-20px_rgba(27,34,48,.3)] ring-1 ring-paper-line">
      <div className="p-4 sm:p-5">
        <p className="text-sm font-semibold text-ink-faint">{from === "bs" ? (ne ? "विक्रम संवत् (वि.सं.) मिति" : "Date in BS") : ne ? "अंग्रेजी (ई.सं.) मिति" : "Date in AD"}</p>
        <div key={from} className="mt-2 animate-rise">
          {from === "bs" ? (
            <div className="grid grid-cols-[1.1fr_1.4fr_1fr] gap-2">
              <select aria-label={ne ? "साल" : "Year"} value={bs.year} onChange={(e) => setBs((b) => ({ ...b, year: Number(e.target.value) }))} className={select}>
                {years.map((y) => (
                  <option key={y} value={y}>{n(y)}</option>
                ))}
              </select>
              <select aria-label={ne ? "महिना" : "Month"} value={bs.month} onChange={(e) => setBs((b) => ({ ...b, month: Number(e.target.value) }))} className={select}>
                {(ne ? BS_MONTHS_NE : BS_MONTHS_EN).map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
              <select aria-label={ne ? "गते" : "Day"} value={Math.min(bs.day, maxDay)} onChange={(e) => setBs((b) => ({ ...b, day: Number(e.target.value) }))} className={select}>
                {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>{n(d)}</option>
                ))}
              </select>
            </div>
          ) : (
            <input type="date" value={ad} min="1943-04-14" max="2034-04-12" onChange={(e) => setAd(e.target.value)} aria-label={ne ? "अंग्रेजी मिति" : "AD date"} className={select} />
          )}
        </div>
      </div>

      {/* Swap: turns the arrows and the direction. */}
      <div className="relative h-0">
        <button
          type="button"
          onClick={swap}
          aria-label={ne ? "उल्टो गर्नुहोस्" : "Swap"}
          className="absolute left-1/2 top-0 z-10 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-ink text-white shadow-pop transition-transform duration-300 hover:rotate-180 active:scale-90"
        >
          <ArrowDownUp className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="border-t border-paper-line bg-paper-warm p-4 pt-6 sm:p-5 sm:pt-7">
        <p className="text-sm font-semibold text-ink-faint">{from === "bs" ? (ne ? "अंग्रेजी (ई.सं.) मा" : "In AD") : ne ? "विक्रम संवत्मा" : "In BS"}</p>
        {out && result ? (
          <div key={out.copy} className="mt-1 animate-pop">
            <div className="flex items-center justify-between gap-3">
              <p className="text-2xl font-bold tracking-tight text-ink sm:text-[1.7rem]">{out.big}</p>
              <button type="button" onClick={copy} className={`inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-semibold transition-colors ${copied ? "bg-ok text-white" : "bg-white text-ink ring-1 ring-paper-line hover:bg-paper-warm"}`}>
                {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
                {copied ? (ne ? "कपी भयो" : "Copied") : out.copy}
              </button>
            </div>
            <p className="mt-0.5 text-sm text-ink-soft">{ne ? WEEKDAYS_NE[result.adDate.getDay()] : WEEKDAYS_EN[result.adDate.getDay()]}</p>
            {age && (age.years > 0 || age.months > 0 || age.days > 0) && (
              <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-ink shadow-card">
                <Cake className="h-4 w-4 text-brand" aria-hidden="true" />
                {ne ? `आजसम्म: ${n(age.years)} वर्ष ${n(age.months)} महिना ${n(age.days)} दिन` : `Until today: ${age.years} years ${age.months} months ${age.days} days`}
              </p>
            )}
          </div>
        ) : (
          <p className="mt-1 text-ink-soft">{ne ? "वि.सं. २००० देखि २०९० सम्मको मिति मात्र मिल्छ।" : "Only dates from 2000 to 2090 BS (1943–2034 AD) work."}</p>
        )}
      </div>
    </div>
  );
}
