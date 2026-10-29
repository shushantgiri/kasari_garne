"use client";

import { useEffect, useState } from "react";
import { CalendarX2, Clock, ShieldCheck } from "lucide-react";
import type { Locale } from "@/lib/content/types";
import { adToBs, nepalNow, BS_MONTHS_EN, BS_MONTHS_NE, WEEKDAYS_EN, WEEKDAYS_NE } from "@/lib/bs";
import { HOLIDAY_YEAR, officeDay, SERVICES_OPEN_NOTE, type OfficeDay } from "@/lib/content/holidays";
import { digits } from "@/lib/i18n";

interface Today {
  day: OfficeDay;
  hour: number;
  minute: number;
  year: number;
  bsDay: number;
  month: string;
  weekday: string;
  next?: string;
}

/** Hours like "१० बजेदेखि ५ बजेसम्म" (24h → 12h, as offices write it). */
export function hoursText([a, b]: [number, number], ne: boolean): string {
  const h = (x: number) => (x > 12 ? x - 12 : x);
  return ne ? `${digits(h(a), "ne")} बजेदेखि ${digits(h(b), "ne")} बजेसम्म` : `${h(a)} am – ${h(b)} pm`;
}

function compute(ne: boolean): Today {
  const { date, hour, minute } = nepalNow();
  const bs = adToBs(date);
  const wd = date.getDay();
  const day = officeDay(bs.year, bs.month, bs.day, wd);
  let next: string | undefined;
  if (day.kind === "saturday" || day.kind === "holiday") {
    // The next day offices open.
    for (let i = 1; i < 20; i++) {
      const d = new Date(date);
      d.setDate(d.getDate() + i);
      const b = adToBs(d);
      const k = officeDay(b.year, b.month, b.day, d.getDay()).kind;
      if (k === "open" || k === "servicesOpen") {
        next = ne ? `${WEEKDAYS_NE[d.getDay()]}, ${BS_MONTHS_NE[b.month - 1]} ${digits(b.day, "ne")}` : `${WEEKDAYS_EN[d.getDay()]}, ${BS_MONTHS_EN[b.month - 1]} ${b.day}`;
        break;
      }
    }
  }
  return {
    day,
    hour,
    minute,
    year: bs.year,
    bsDay: bs.day,
    month: ne ? BS_MONTHS_NE[bs.month - 1] : BS_MONTHS_EN[bs.month - 1],
    weekday: ne ? WEEKDAYS_NE[wd] : WEEKDAYS_EN[wd],
    next,
  };
}

/** Flat, calm tints: the card, its edge, and the accent for the ring and the live dot. */
const TONES = {
  ok: { card: "bg-[#EDF4EE] text-[#1F4A32] ring-[#D3E5D8]", accent: "#2E6A43" },
  warn: { card: "bg-[#FAF2E1] text-[#5E410F] ring-[#ECDEBD]", accent: "#9A6A12" },
  brand: { card: "bg-[#FBECEA] text-[#6E2219] ring-[#F1D5D0]", accent: "#A8382A" },
};

/** A ring that empties as the office day runs out; the time left in the middle. */
function Countdown({ left, total, top, bottom, accent }: { left: number; total: number; top: string; bottom: string; accent: string }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  const frac = total > 0 ? Math.min(1, Math.max(0, left / total)) : 0;
  return (
    <div className="relative grid h-[84px] w-[84px] shrink-0 place-items-center sm:h-24 sm:w-24">
      <svg viewBox="0 0 72 72" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(27,34,48,.08)" strokeWidth="6" />
        <circle cx="36" cy="36" r={r} fill="none" stroke={accent} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${frac * c} ${c}`} className="transition-[stroke-dasharray] duration-700 ease-out" />
      </svg>
      <span className="text-center leading-none">
        <span className="block text-lg font-bold tabular-nums sm:text-xl">{top}</span>
        <span className="mt-1 block text-[0.62rem] font-semibold opacity-70 sm:text-[0.68rem]">{bottom}</span>
      </span>
    </div>
  );
}

/**
 * "Are government offices open today?" — from the 2083 holiday notice and office hours, in Nepal time.
 * A calm tinted card: green when open, red on a Saturday or holiday (with the next working day), amber on
 * holidays when citizenship, passport and transport offices still serve. On the right, a ring counts down
 * the office day.
 */
export function OfficeToday({ locale, compact = false }: { locale: Locale; compact?: boolean }) {
  const ne = locale === "ne";
  const n = (v: number) => (ne ? digits(v, "ne") : String(v));
  const [today, setToday] = useState<Today | null>(null);

  useEffect(() => {
    const tick = () => setToday(compute(ne));
    tick();
    const t = window.setInterval(tick, 30_000);
    return () => clearInterval(t);
  }, [ne]);

  if (!today) return <div className="h-[132px] animate-pulse rounded-3xl bg-paper-warm" />;

  const { day, hour, minute } = today;
  const now = hour + minute / 60;
  const open = day.kind === "open" || day.kind === "servicesOpen";
  const hours = open ? day.hours : null;
  const nowOpen = hours ? now >= hours[0] && now < hours[1] : false;
  const tone = TONES[day.kind === "open" ? "ok" : day.kind === "servicesOpen" ? "warn" : "brand"];

  const title =
    day.kind === "open"
      ? ne ? "कार्यालय खुला छ" : "Offices are open"
      : day.kind === "servicesOpen"
        ? ne ? "बिदा, तर मुख्य सेवा खुला" : "Holiday, key services open"
        : day.kind === "saturday"
          ? ne ? "शनिबार — कार्यालय बन्द" : "Saturday — closed"
          : ne ? "सार्वजनिक बिदा" : "Public holiday";

  // The ring: minutes left while open; before opening, the opening hour; after, closed.
  const leftMin = hours && nowOpen ? Math.round((hours[1] - now) * 60) : 0;
  const ring = hours
    ? nowOpen
      ? { left: leftMin, total: (hours[1] - hours[0]) * 60, top: `${n(Math.floor(leftMin / 60))}:${ne ? digits(String(leftMin % 60).padStart(2, "0"), "ne") : String(leftMin % 60).padStart(2, "0")}`, bottom: ne ? "घण्टा बाँकी" : "left" }
      : now < hours[0]
        ? { left: (hours[1] - hours[0]) * 60, total: (hours[1] - hours[0]) * 60, top: n(hours[0]), bottom: ne ? "बजे खुल्छ" : "am opens" }
        : { left: 0, total: 1, top: ne ? "बन्द" : "Shut", bottom: ne ? "भोलि आउनुहोस्" : "come tomorrow" }
    : null;
  const StatusIcon = day.kind === "servicesOpen" ? ShieldCheck : CalendarX2;

  return (
    <div className={`relative animate-rise rounded-3xl p-4 ring-1 sm:p-5 ${tone.card}`} aria-live="polite">
      <div className="relative flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <p className="inline-flex items-center gap-2 text-sm font-semibold opacity-80">
            {nowOpen && (
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 motion-reduce:animate-none" style={{ background: tone.accent }} />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: tone.accent }} />
              </span>
            )}
            {ne ? "आज" : "Today"} · {today.weekday}, {today.month} {n(today.bsDay)}
          </p>
          <p className="mt-1 text-[1.4rem] font-bold leading-tight tracking-tight sm:text-[1.7rem]">{title}</p>
          {(day.kind === "holiday" || day.kind === "servicesOpen") && <p className="mt-0.5 text-[0.95rem] font-medium opacity-90">{day.names.join(" · ")}</p>}
          {hours && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-sm font-medium">
              <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
              {hoursText(hours, ne)}
            </p>
          )}
          {today.next && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-sm font-medium">
              {ne ? "अर्को खुल्ने: " : "Next open: "}
              <span className="font-bold">{today.next}</span>
            </p>
          )}
        </div>
        {ring ? (
          <Countdown {...ring} accent={tone.accent} />
        ) : (
          <span className="grid h-[84px] w-[84px] shrink-0 place-items-center rounded-full bg-white/80 sm:h-24 sm:w-24">
            <StatusIcon className="h-9 w-9" style={{ color: tone.accent }} aria-hidden="true" />
          </span>
        )}
      </div>

      {!compact && day.kind === "servicesOpen" && <p className="relative mt-3 rounded-2xl bg-white/80 px-3 py-2 text-sm leading-relaxed">{SERVICES_OPEN_NOTE}</p>}
      {!compact && day.kind === "open" && day.partial.length > 0 && (
        <p className="relative mt-3 rounded-2xl bg-white/80 px-3 py-2 text-sm">
          {ne ? "केहीका लागि मात्र बिदा: " : "Holiday for some only: "}
          {day.partial.map((h) => `${h.name} (${h.only})`).join(" · ")}
        </p>
      )}
      {today.year !== HOLIDAY_YEAR && <p className="relative mt-2 text-xs opacity-70">{ne ? `बिदाको सूची ${digits(HOLIDAY_YEAR, "ne")} सालको मात्र` : `Holiday list for ${HOLIDAY_YEAR} BS only`}</p>}
    </div>
  );
}
