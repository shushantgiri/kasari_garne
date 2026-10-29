"use client";

import { useEffect, useRef, useState } from "react";
import { Bike, Car, Minus, Plus, Receipt } from "lucide-react";
import type { Locale } from "@/lib/content/types";
import { PROVINCES, TAX_YEAR, vehicleTax, type ProvinceId, type VehicleClass } from "@/lib/content/vehicleTax";
import { digits } from "@/lib/i18n";

/** Rupees with Nepali grouping: 1,25,000. */
function rupees(v: number, ne: boolean): string {
  const s = Math.round(v).toLocaleString("en-IN");
  return ne ? digits(s, "ne") : s;
}

/** A number that rolls to its new value. */
function useCountUp(target: number): number {
  const [shown, setShown] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(target);
      from.current = target;
      return;
    }
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / 450);
      const e = 1 - (1 - k) ** 3;
      const v = a + (target - a) * e;
      setShown(v);
      from.current = v;
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return shown;
}

const QUICK_CC: Record<VehicleClass, number[]> = { bike: [110, 125, 150, 160, 200, 250], car: [1000, 1200, 1500, 2000, 2500] };

/**
 * Vehicle tax and bluebook renewal: pick the province, bike or car, the engine cc, whether you're late
 * and how many years are unpaid — the total rolls up, with each part listed under it.
 */
export function VehicleTaxCalc({ locale }: { locale: Locale }) {
  const ne = locale === "ne";
  const n = (v: number) => (ne ? digits(v, "ne") : String(v));
  const [province, setProvince] = useState<ProvinceId>("bagmati");
  const [vehicle, setVehicle] = useState<VehicleClass>("bike");
  const [cc, setCc] = useState(125);
  const [late, setLate] = useState(-1);
  const [years, setYears] = useState(0);

  const p = PROVINCES.find((x) => x.id === province)!;
  const r = vehicleTax({ province, vehicle, cc, late, yearsBehind: years });
  const total = useCountUp(r.total);

  const chooseVehicle = (v: VehicleClass) => {
    setVehicle(v);
    setCc(v === "bike" ? 125 : 1200);
  };
  const chooseProvince = (id: ProvinceId) => {
    setProvince(id);
    setLate(-1);
  };

  const chip = (on: boolean) =>
    `min-h-[42px] rounded-xl px-3 text-sm font-semibold transition-[background-color,color,box-shadow,transform] duration-150 active:scale-[.97] ${on ? "bg-ink text-white shadow-card" : "bg-white text-ink-soft ring-1 ring-paper-line hover:text-ink"}`;
  const label = "text-sm font-semibold text-ink-faint";

  const rows: [string, number][] = [
    [ne ? `यो वर्षको कर (${n(r.slab.from)}–${r.slab.to === Infinity ? "" : n(r.slab.to)} सीसी)` : `This year's tax (${r.slab.from}–${r.slab.to === Infinity ? "" : r.slab.to} cc)`, r.tax],
    [ne ? "ढिलाइ जरिवाना" : "Late fine", r.fine],
    [ne ? `अघिल्ला ${n(years)} वर्षको कर` : `Tax for ${years} earlier years`, r.pastTax],
    [ne ? "अघिल्ला वर्षको जरिवाना" : "Fines for earlier years", r.pastFine],
    [ne ? "नवीकरण दस्तुर" : "Renewal fee", r.renewal],
    [ne ? "ढिला नवीकरण थप" : "Late renewal charge", r.renewalLate],
  ];

  return (
    <div className="grid gap-4 md:grid-cols-[1.15fr_1fr] md:items-start">
      <div className="space-y-5 rounded-3xl border border-paper-line bg-white p-4 sm:p-5">
        {/* Province. */}
        <div>
          <p className={label}>{ne ? "प्रदेश" : "Province"}</p>
          <div className="mt-2 grid grid-cols-3 gap-1.5 sm:grid-cols-4">
            {PROVINCES.map((x) => (
              <button key={x.id} type="button" onClick={() => chooseProvince(x.id)} aria-pressed={province === x.id} className={chip(province === x.id)}>
                {ne ? x.ne : x.en}
              </button>
            ))}
          </div>
        </div>

        {/* Bike or car. */}
        <div className="flex rounded-xl bg-paper-warm p-1">
          {([
            ["bike", Bike, ne ? "मोटरसाइकल / स्कुटर" : "Motorcycle / scooter"],
            ["car", Car, ne ? "कार / जिप / भ्यान" : "Car / jeep / van"],
          ] as const).map(([v, Icon, l]) => (
            <button
              key={v}
              type="button"
              onClick={() => chooseVehicle(v)}
              aria-pressed={vehicle === v}
              className={`inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg px-2 text-sm font-semibold transition-[background-color,color,box-shadow] duration-150 ${vehicle === v ? "bg-white text-ink shadow-[0_1px_3px_rgba(27,34,48,.12)]" : "text-ink-soft"}`}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{l}</span>
            </button>
          ))}
        </div>

        {/* Engine size. */}
        <div>
          <label htmlFor="cc" className={label}>
            {ne ? "इन्जिन क्षमता (सीसी) — ब्लुबुकमा लेखिएको" : "Engine size (cc) — as in the bluebook"}
          </label>
          <input
            id="cc"
            type="number"
            inputMode="numeric"
            min={1}
            value={cc || ""}
            onChange={(e) => setCc(Math.max(0, Number(e.target.value)))}
            className="mt-2 min-h-[52px] w-full rounded-xl border border-paper-line px-4 text-lg font-bold text-ink focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/25"
          />
          <div className="no-scrollbar mt-2 flex gap-1.5 overflow-x-auto">
            {QUICK_CC[vehicle].map((v) => (
              <button key={v} type="button" onClick={() => setCc(v)} className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${cc === v ? "bg-sky text-white" : "bg-sky-tint text-sky hover:bg-sky/15"}`}>
                {n(v)}
              </button>
            ))}
          </div>
        </div>

        {/* On time or late. */}
        <div>
          <p className={label}>{ne ? "यो वर्षको कर कहिले तिर्दै हुनुहुन्छ?" : "When are you paying this year's tax?"}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button type="button" onClick={() => setLate(-1)} aria-pressed={late === -1} className={chip(late === -1)}>
              {ne ? "म्यादभित्रै (९० दिन)" : "On time (90 days)"}
            </button>
            {p.lateThisYear.map((s, i) => (
              <button key={s.en} type="button" onClick={() => setLate(i)} aria-pressed={late === i} className={chip(late === i)}>
                {ne ? s.ne : s.en}
              </button>
            ))}
          </div>
        </div>

        {/* Years behind. */}
        <div className="flex items-center justify-between gap-3">
          <p className={label}>{ne ? "अघिल्ला कति वर्षको कर बाँकी छ?" : "Earlier years unpaid?"}</p>
          <div className="flex items-center gap-1 rounded-full bg-paper-warm p-1">
            <button type="button" onClick={() => setYears((y) => Math.max(0, y - 1))} aria-label={ne ? "घटाउनुहोस्" : "Fewer"} className="grid h-9 w-9 place-items-center rounded-full bg-white text-ink shadow-sm active:scale-90 disabled:opacity-40" disabled={years === 0}>
              <Minus className="h-4 w-4" aria-hidden="true" />
            </button>
            <span key={years} className="w-8 animate-pop text-center text-lg font-bold tabular-nums text-ink">{n(years)}</span>
            <button type="button" onClick={() => setYears((y) => Math.min(5, y + 1))} aria-label={ne ? "बढाउनुहोस्" : "More"} className="grid h-9 w-9 place-items-center rounded-full bg-white text-ink shadow-sm active:scale-90 disabled:opacity-40" disabled={years === 5}>
              <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* The bill. */}
      <div className="md:sticky md:top-20">
        <div className="overflow-hidden rounded-3xl bg-ink text-white shadow-[0_24px_48px_-28px_rgba(27,34,48,.8)]">
          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-2 text-sm text-white/70">
              <Receipt className="h-4 w-4" aria-hidden="true" />
              {ne ? `${p.ne} प्रदेश · आ.व. ${TAX_YEAR}` : `${p.en} · FY 2083/84`}
            </div>
            <p className="mt-2 text-sm text-white/70">{ne ? "जम्मा तिर्नुपर्ने (अनुमानित)" : "Total to pay (estimate)"}</p>
            <p className="mt-0.5 text-[2.4rem] font-bold leading-none tracking-tight tabular-nums">
              <span className="mr-1 text-xl font-semibold text-white/70">{ne ? "रु." : "Rs"}</span>
              {rupees(total, ne)}
            </p>
          </div>
          <ul className="space-y-0 border-t border-white/10 px-5 py-3 text-[0.95rem] sm:px-6">
            {rows
              .filter(([, v]) => v > 0)
              .map(([l, v]) => (
                <li key={l} className="flex animate-rise items-baseline justify-between gap-3 py-1.5">
                  <span className="text-white/75">{l}</span>
                  <span className="font-semibold tabular-nums">{rupees(v, ne)}</span>
                </li>
              ))}
          </ul>
        </div>
        <p className="mt-3 px-1 text-xs leading-relaxed text-ink-faint">
          {ne
            ? `दर: प्रदेश आर्थिक ऐन २०८३${p.note ? ` (${p.note})` : ""}। तेस्रो पक्ष बीमा, १५ वर्षभन्दा पुराना सवारीको थप कर, विद्युतीय सवारी र छुट योजना समावेश छैनन्। अघिल्ला वर्षको कर आजको दरले जोडिएको। अन्तिम रकम यातायात कार्यालयको बिलअनुसार हुन्छ।`
            : `Rates: provincial Finance Acts 2083${p.note ? ` (${p.en}: 2082/83 rates)` : ""}. Not included: third-party insurance, the extra tax on vehicles over 15 years old, electric vehicles and relief schemes. Earlier years use today's rate. The transport office's bill is final.`}
        </p>
      </div>
    </div>
  );
}
