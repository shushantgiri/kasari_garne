"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Bike, Car, ChevronDown, Minus, XCircle } from "lucide-react";
import type { Locale, Localized } from "@/lib/content/types";
import { TRIAL, TRIAL_PASS, type TrialScene, type TrialVehicle } from "@/lib/content/trial";
import { digits, tr } from "@/lib/i18n";
import { TrialPlayer } from "./TrialPlayer";

/** Short names for the station chips. */
const SHORT: Record<TrialScene, Localized> = {
  figure8: { ne: "आठ", en: "Eight" },
  plank: { ne: "साँघुरो", en: "Narrow" },
  light: { ne: "बत्ती", en: "Lights" },
  uturn: { ne: "यू-टर्न", en: "U-turn" },
  breaker: { ne: "ब्रेकर", en: "Breaker" },
  ramp: { ne: "उकालो", en: "Ramp" },
  parking: { ne: "पार्किङ", en: "Parking" },
  behaviour: { ne: "बानी", en: "Habits" },
};

/**
 * The trial (practical) test, one station at a time so there's little to read and scroll:
 * motorcycle or car, the whole course from above, a row of station chips, the current station's clip with its steps lighting
 * up in turn, its points, and its mistakes folded under one button. Next / Back move along.
 */
export function TrialGuide({ locale, onBack }: { locale: Locale; onBack: () => void }) {
  const ne = locale === "ne";
  const n = (v: number) => (ne ? digits(v, "ne") : String(v));
  const [vehicle, setVehicle] = useState<TrialVehicle>("bike");
  const [at, setAt] = useState(0);
  const [details, setDetails] = useState(false);
  const stations = TRIAL[vehicle];
  const s = stations[Math.min(at, stations.length - 1)];
  const next = stations[at + 1];

  const go = (i: number) => {
    setAt(i);
    setDetails(false);
  };

  return (
    <div className="animate-fade">
      {/* Title row: back, the name, and the pass mark. */}
      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={onBack} aria-label={ne ? "अभ्यासमा फर्कनुहोस्" : "Back to practice"} className="-ml-2 grid h-10 w-10 place-items-center rounded-full text-ink-soft hover:bg-paper-warm hover:text-ink">
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <h2 className="min-w-0 flex-1 text-xl font-bold text-ink">{ne ? "ट्रायल परीक्षा" : "Trial test"}</h2>
        <span className="shrink-0 rounded-full bg-ok-tint px-3 py-1 text-sm font-semibold text-ok">
          {ne ? `पास ${n(TRIAL_PASS)}/${n(100)}` : `Pass ${TRIAL_PASS}/100`}
        </span>
      </div>

      {/* Motorcycle or car. */}
      <div className="mt-3 flex rounded-xl bg-paper-warm p-1" role="tablist" aria-label={ne ? "सवारी" : "Vehicle"}>
        {([
          ["bike", Bike, ne ? "मोटरसाइकल" : "Motorcycle"],
          ["car", Car, ne ? "कार" : "Car"],
        ] as const).map(([v, Icon, label]) => (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={vehicle === v}
            onClick={() => {
              setVehicle(v);
              go(0);
            }}
            className={`inline-flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-[background-color,color,box-shadow] duration-150 ${vehicle === v ? "bg-white text-ink shadow-[0_1px_3px_rgba(27,34,48,.12)]" : "text-ink-soft hover:text-ink"}`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {/* The whole ground from above, the vehicle driving the course in order; tap a station to open it. */}
      <div className="mt-3 overflow-hidden rounded-3xl border border-paper-line bg-white">
        <p className="px-4 pb-2 pt-3 text-sm font-semibold text-ink-soft">{ne ? "पूरा मैदान, माथिबाट हेर्दा" : "The whole course, seen from above"}</p>
        <TrialPlayer
          scene="drone"
          vehicle={vehicle}
          locale={locale}
          onPick={(scene) => {
            const i = stations.findIndex((st) => st.scene === scene);
            if (i >= 0) go(i);
          }}
        />
      </div>

      {/* Stations: short chips, the current one dark, the ones seen ticked green. */}
      <div className="no-scrollbar -mx-4 mt-3 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {stations.map((st, i) => (
          <button
            key={`${vehicle}-${st.scene}`}
            type="button"
            onClick={() => go(i)}
            aria-current={i === at ? "step" : undefined}
            className={`inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-full pl-1.5 pr-3 text-sm font-semibold transition-colors ${
              i === at ? "bg-ink text-white" : "bg-white text-ink-soft ring-1 ring-paper-line hover:text-ink"
            }`}
          >
            <span className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${i === at ? "bg-white text-ink" : i < at ? "bg-ok text-white" : "bg-paper-warm"}`}>{n(i + 1)}</span>
            {tr(SHORT[st.scene], locale)}
          </button>
        ))}
      </div>

      {/* The current station. */}
      <div key={`${vehicle}-${at}`} className="mt-4 animate-step-next overflow-hidden rounded-3xl border border-paper-line bg-white">
        <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-4">
          <h3 className="min-w-0 text-lg font-bold leading-snug text-ink">{tr(s.title, locale)}</h3>
          <span className="shrink-0 rounded-full bg-brand-tint px-3 py-1 text-sm font-bold text-brand">{ne ? `${n(s.points)} अङ्क` : `${s.points} pts`}</span>
        </div>
        <TrialPlayer scene={s.scene} vehicle={vehicle} locale={locale} />

        {(s.minus.length > 0 || s.fail.length > 0) && (
          <div className="px-5 pb-4 pt-3">
            <button
              type="button"
              onClick={() => setDetails((d) => !d)}
              aria-expanded={details}
              className="flex min-h-[44px] w-full items-center justify-between gap-2 rounded-xl bg-paper-warm px-3.5 text-sm font-semibold text-ink"
            >
              {ne ? "गल्ती र अङ्क कटौती" : "Mistakes and lost points"}
              <ChevronDown className={`h-4 w-4 text-ink-faint transition-transform duration-200 ${details ? "rotate-180" : ""}`} aria-hidden="true" />
            </button>
            {details && (
              <div className="mt-3 animate-rise space-y-3">
                {s.minus.length > 0 && (
                  <ul className="space-y-1.5">
                    {s.minus.map(([what, pts]) => (
                      <li key={what.en} className="flex items-start gap-2.5 text-[0.95rem] text-ink">
                        <span className="mt-0.5 inline-flex shrink-0 items-center rounded-md bg-warn-tint px-1.5 py-0.5 text-xs font-bold text-warn">
                          <Minus className="h-3 w-3" aria-hidden="true" />
                          {n(pts)}
                        </span>
                        {tr(what, locale)}
                      </li>
                    ))}
                  </ul>
                )}
                {s.fail.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-brand">{ne ? "सिधै फेल हुने" : "Fails the trial at once"}</p>
                    <ul className="mt-1.5 space-y-1.5">
                      {s.fail.map((f) => (
                        <li key={f.en} className="flex items-start gap-2.5 text-[0.95rem] text-ink">
                          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
                          {tr(f, locale)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {s.minus.length === 0 && s.fail.length === 0 && <div className="pb-4" />}
      </div>

      {/* Next and back. */}
      <div className="mt-4 flex gap-2">
        {at > 0 && (
          <button type="button" onClick={() => go(at - 1)} aria-label={ne ? "अघिल्लो" : "Back"} className="btn-secondary min-h-[52px] shrink-0 px-4">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
        {next ? (
          <button type="button" onClick={() => go(at + 1)} className="btn-primary min-h-[52px] flex-1 text-base">
            {ne ? `अर्को: ${tr(SHORT[next.scene], locale)}` : `Next: ${tr(SHORT[next.scene], locale)}`}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : (
          <button type="button" onClick={onBack} className="btn-primary min-h-[52px] flex-1 text-base">
            {ne ? "सकियो — अभ्यासमा फर्कनुहोस्" : "Done — back to practice"}
          </button>
        )}
      </div>
    </div>
  );
}
