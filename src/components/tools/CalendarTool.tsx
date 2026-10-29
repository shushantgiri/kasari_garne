"use client";

import { useEffect, useState } from "react";
import { ArrowLeftRight, CalendarDays } from "lucide-react";
import type { Locale } from "@/lib/content/types";
import { OfficeToday } from "./OfficeToday";
import { BsCalendar } from "./BsCalendar";
import { DateConverter } from "./DateConverter";

/**
 * Today's office status on top, then one of two things at a time so there's little to scroll:
 * the calendar with holidays, or the BS ↔ AD converter. `#convert` in the link opens the converter.
 */
export function CalendarTool({ locale }: { locale: Locale }) {
  const ne = locale === "ne";
  const [tab, setTab] = useState<"calendar" | "convert">("calendar");
  useEffect(() => {
    if (window.location.hash === "#convert") setTab("convert");
  }, []);

  return (
    <div className="space-y-4">
      <OfficeToday locale={locale} />
      <div className="flex rounded-2xl bg-paper-warm p-1" role="tablist">
        {([
          ["calendar", CalendarDays, ne ? "पात्रो र बिदा" : "Calendar & holidays"],
          ["convert", ArrowLeftRight, ne ? "मिति बदल्नुहोस्" : "Convert a date"],
        ] as const).map(([id, Icon, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => {
              setTab(id);
              history.replaceState(null, "", id === "convert" ? "#convert" : location.pathname);
            }}
            className={`inline-flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-[background-color,color,box-shadow] duration-200 ${tab === id ? "bg-white text-ink shadow-[0_1px_3px_rgba(27,34,48,.12)]" : "text-ink-soft hover:text-ink"}`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
      <div key={tab} className={tab === "convert" ? "animate-step-next" : "animate-step-back"}>
        {tab === "calendar" ? <BsCalendar locale={locale} /> : <DateConverter locale={locale} />}
      </div>
    </div>
  );
}
