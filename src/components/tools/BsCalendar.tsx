"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Locale } from "@/lib/content/types";
import { adToBs, bsToAd, daysInBsMonth, nepalNow, BS_MAX_YEAR, BS_MIN_YEAR, BS_MONTHS_EN, BS_MONTHS_NE, WEEKDAYS_NE, WEEKDAYS_SHORT_NE, type Bs } from "@/lib/bs";
import { HOLIDAY_SOURCE, HOLIDAY_SOURCE_URL, HOLIDAYS_2083, HOLIDAY_YEAR, holidaysOn, isWeekend } from "@/lib/content/holidays";
import { digits } from "@/lib/i18n";

const EN_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const AD_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * A Nepali (BS) month calendar: weekends (Saturday and Sunday) and holidays in red, days off for some people marked with a
 * blue dot, the AD date small in each cell. Tap a day to see what it is; arrows slide month to month.
 * Below, the next few holidays in a short list.
 */
export function BsCalendar({ locale }: { locale: Locale }) {
  const ne = locale === "ne";
  const n = (v: number) => (ne ? digits(v, "ne") : String(v));
  const [today, setToday] = useState<Bs | null>(null);
  const [view, setView] = useState<{ year: number; month: number }>({ year: HOLIDAY_YEAR, month: 1 });
  const [picked, setPicked] = useState<number | null>(null);
  const [dir, setDir] = useState<"next" | "back">("next");

  useEffect(() => {
    const t = adToBs(nepalNow().date);
    setToday(t);
    setView({ year: t.year, month: t.month });
    setPicked(t.day);
  }, []);

  const go = (delta: number) => {
    setDir(delta > 0 ? "next" : "back");
    setPicked(null);
    setView(({ year, month }) => {
      let m = month + delta;
      let y = year;
      if (m > 12) (m = 1), y++;
      if (m < 1) (m = 12), y--;
      if (y < BS_MIN_YEAR || y > BS_MAX_YEAR) return { year, month };
      return { year: y, month: m };
    });
  };

  const { cells, first } = useMemo(() => {
    const days = daysInBsMonth(view.year, view.month);
    const first = bsToAd({ year: view.year, month: view.month, day: 1 });
    const lead = first.getDay();
    const cells: (null | { day: number; ad: Date; weekday: number })[] = Array.from({ length: lead }, () => null);
    for (let d = 1; d <= days; d++) {
      const ad = new Date(first);
      ad.setDate(first.getDate() + d - 1);
      cells.push({ day: d, ad, weekday: ad.getDay() });
    }
    return { cells, first };
  }, [view]);

  const last = cells[cells.length - 1]!.ad;
  const adRange = first.getMonth() === last.getMonth() ? `${AD_MONTHS[first.getMonth()]} ${first.getFullYear()}` : `${AD_MONTHS[first.getMonth()]}–${AD_MONTHS[last.getMonth()]} ${last.getFullYear()}`;
  const pickedCell = picked ? cells.find((c) => c?.day === picked) : null;
  const pickedHolidays = picked ? holidaysOn(view.year, view.month, picked) : [];
  const isToday = (d: number) => today?.year === view.year && today.month === view.month && today.day === d;

  // The next five holidays for everyone, from today.
  const upcoming = useMemo(() => {
    if (!today || today.year !== HOLIDAY_YEAR) return [];
    const key = (m: number, d: number) => m * 100 + d;
    const seen = new Set<string>();
    return HOLIDAYS_2083.filter((h) => !h.only && key(h.month, h.day) >= key(today.month, today.day))
      .sort((a, b) => key(a.month, a.day) - key(b.month, b.day))
      .filter((h) => (seen.has(h.name) ? false : (seen.add(h.name), true)))
      .slice(0, 5);
  }, [today]);

  return (
    <div>
      <div className="overflow-hidden rounded-3xl bg-white shadow-[0_1px_2px_rgba(27,34,48,.04),0_10px_30px_-20px_rgba(27,34,48,.3)] ring-1 ring-paper-line">
        {/* Month and arrows. */}
        <div className="flex items-center justify-between gap-2 border-b border-paper-line px-2 py-2">
          <button type="button" onClick={() => go(-1)} aria-label={ne ? "अघिल्लो महिना" : "Previous month"} className="grid h-11 w-11 place-items-center rounded-full text-ink-soft transition-colors hover:bg-paper-warm hover:text-ink">
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <div key={`${view.year}-${view.month}`} className={`text-center ${dir === "next" ? "animate-step-next" : "animate-step-back"}`}>
            <p className="text-lg font-bold text-ink">
              {ne ? BS_MONTHS_NE[view.month - 1] : BS_MONTHS_EN[view.month - 1]} {n(view.year)}
            </p>
            <p className="text-xs font-medium text-ink-faint">{adRange}</p>
          </div>
          <button type="button" onClick={() => go(1)} aria-label={ne ? "अर्को महिना" : "Next month"} className="grid h-11 w-11 place-items-center rounded-full text-ink-soft transition-colors hover:bg-paper-warm hover:text-ink">
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Weekday names, the weekend in red. */}
        <div className="grid grid-cols-7 px-2 pt-2 text-center text-xs font-semibold">
          {(ne ? WEEKDAYS_SHORT_NE : EN_SHORT).map((w, i) => (
            <span key={w} className={isWeekend(i) ? "text-brand" : "text-ink-faint"}>{w}</span>
          ))}
        </div>

        {/* The days. */}
        <div key={`g-${view.year}-${view.month}`} className={`grid grid-cols-7 gap-1 p-2 ${dir === "next" ? "animate-step-next" : "animate-step-back"}`}>
          {cells.map((c, i) => {
            if (!c) return <span key={`e${i}`} />;
            const hs = holidaysOn(view.year, view.month, c.day);
            const off = isWeekend(c.weekday) || hs.some((h) => !h.only);
            const some = !off && hs.length > 0;
            const sel = picked === c.day;
            return (
              <button
                key={c.day}
                type="button"
                onClick={() => setPicked(c.day)}
                aria-pressed={sel}
                aria-label={`${ne ? BS_MONTHS_NE[view.month - 1] : BS_MONTHS_EN[view.month - 1]} ${n(c.day)}${hs.length ? ` — ${hs.map((h) => h.name).join(", ")}` : ""}`}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-xl transition-[background-color,transform,box-shadow] duration-150 active:scale-95 ${
                  sel ? "bg-ink text-white shadow-pop" : isToday(c.day) ? "bg-ok-tint ring-2 ring-ok/40" : off ? "bg-brand-tint/60 hover:bg-brand-tint" : "hover:bg-paper-warm"
                }`}
              >
                <span className={`text-base font-bold leading-none sm:text-lg ${sel ? "" : off ? "text-brand" : "text-ink"}`}>{n(c.day)}</span>
                <span className={`mt-0.5 text-[0.62rem] leading-none ${sel ? "text-white/70" : "text-ink-faint"}`}>{c.ad.getDate()}</span>
                {(some || (off && hs.length > 0)) && <span className={`absolute bottom-1 h-1 w-1 rounded-full ${sel ? "bg-white" : some ? "bg-sky" : "bg-brand"}`} />}
              </button>
            );
          })}
        </div>

        {/* What the picked day is. */}
        {pickedCell && (
          <div key={`p-${picked}-${view.month}`} className="animate-pop border-t border-paper-line px-4 py-3">
            <p className="font-semibold text-ink">
              {ne
                ? `${WEEKDAYS_NE[pickedCell.weekday]}, ${BS_MONTHS_NE[view.month - 1]} ${n(pickedCell.day)} · ${pickedCell.ad.getDate()} ${AD_MONTHS[pickedCell.ad.getMonth()]} ${pickedCell.ad.getFullYear()}`
                : `${BS_MONTHS_EN[view.month - 1]} ${pickedCell.day} · ${pickedCell.ad.toDateString()}`}
            </p>
            {pickedHolidays.length > 0 ? (
              <ul className="mt-1 space-y-0.5 text-sm">
                {pickedHolidays.map((h) => (
                  <li key={h.name + (h.only ?? "")} className={h.only ? "text-sky" : "text-brand"}>
                    {h.name}
                    {h.only && <span className="text-ink-faint"> · {ne ? "बिदा: " : "Off for: "}{h.only}</span>}
                    {!h.only && h.servicesOpen && <span className="text-ink-faint"> · {ne ? "मुख्य सेवा खुला" : "key services open"}</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-0.5 text-sm text-ink-faint">{isWeekend(pickedCell.weekday) ? (ne ? "साप्ताहिक बिदा" : "Weekend, closed") : ne ? "कार्यालय खुल्ने दिन" : "Offices open"}</p>
            )}
          </div>
        )}
      </div>

      {/* Coming up. */}
      {upcoming.length > 0 && (
        <div className="mt-4">
          <p className="px-1 text-sm font-semibold text-ink-faint">{ne ? "आउँदा बिदा" : "Coming holidays"}</p>
          <ul className="stagger mt-2 space-y-1.5">
            {upcoming.map((h) => (
              <li key={h.name} className="flex items-center gap-3 rounded-2xl border border-paper-line bg-white px-3 py-2.5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-tint text-center leading-none text-brand">
                  <span>
                    <span className="block text-base font-bold">{n(h.day)}</span>
                    <span className="block text-[0.6rem] font-semibold">{ne ? BS_MONTHS_NE[h.month - 1] : BS_MONTHS_EN[h.month - 1].slice(0, 3)}</span>
                  </span>
                </span>
                <span className="min-w-0 flex-1 text-[0.95rem] font-medium leading-snug text-ink">{h.name}</span>
                {h.servicesOpen && <span className="shrink-0 rounded-full bg-warn-tint px-2 py-0.5 text-xs font-semibold text-warn">{ne ? "सेवा खुला" : "Services open"}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="mt-3 px-1 text-xs text-ink-faint">
        {ne ? "स्रोत: " : "Source: "}
        <a href={HOLIDAY_SOURCE_URL} target="_blank" rel="noopener noreferrer" className="underline decoration-paper-line underline-offset-2 hover:text-ink">{HOLIDAY_SOURCE}</a>
        {ne ? "। ईद पर्वको बिदा चन्द्रदर्शनअनुसार। प्रदेशले थप बिदा दिन सक्छ।" : ". Eid holidays follow the moon. Provinces may add days."}
      </p>
    </div>
  );
}
