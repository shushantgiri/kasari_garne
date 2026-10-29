"use client";

import { useEffect, useRef, useState } from "react";
import { Bike, Car, ChevronDown, MapPin, Minus, Plus, Receipt } from "lucide-react";
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

/** One question: a small number, the question, then its answer. */
function Step({ no, title, children, side }: { no: string; title: string; children?: React.ReactNode; side?: React.ReactNode }) {
  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <div className="flex items-center gap-2.5">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-paper-warm text-xs font-bold text-ink-soft ring-1 ring-paper-line">{no}</span>
        <p className="min-w-0 flex-1 font-semibold text-ink">{title}</p>
        {side}
      </div>
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}

/**
 * Vehicle tax and bluebook renewal as five short questions — province, bike or car, cc, on time or late,
 * years unpaid — with a receipt beside them whose total rolls to each new answer.
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
    setLate((l) => (l === -1 ? -1 : 0));
  };

  const seg = (on: boolean) =>
    `inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl px-3 text-[0.95rem] font-semibold transition-[background-color,color,box-shadow] duration-200 ${on ? "bg-white text-ink shadow-[0_1px_3px_rgba(27,34,48,.14)]" : "text-ink-soft hover:text-ink"}`;
  const pill = (on: boolean) =>
    `shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold transition-[background-color,color,transform] duration-150 active:scale-95 ${on ? "bg-ink text-white" : "bg-paper-warm text-ink-soft hover:text-ink"}`;
  const field = "min-h-[52px] w-full rounded-2xl border border-paper-line bg-white text-ink transition-colors hover:border-ink-faint/40 focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/25";
  const stepBtn = "grid h-10 w-10 place-items-center rounded-full bg-white text-ink shadow-sm transition-transform active:scale-90 disabled:opacity-40";

  const rows: [string, number][] = [
    [ne ? `यो वर्षको कर (${n(r.slab.from)}–${r.slab.to === Infinity ? "" : n(r.slab.to)} सीसी)` : `This year's tax (${r.slab.from}–${r.slab.to === Infinity ? "" : r.slab.to} cc)`, r.tax],
    [ne ? "ढिलाइ जरिवाना" : "Late fine", r.fine],
    [ne ? `अघिल्ला ${n(years)} वर्षको कर` : `Tax for ${years} earlier years`, r.pastTax],
    [ne ? "अघिल्ला वर्षको जरिवाना" : "Fines for earlier years", r.pastFine],
    [ne ? "नवीकरण दस्तुर" : "Renewal fee", r.renewal],
    [ne ? "ढिला नवीकरण थप" : "Late renewal charge", r.renewalLate],
  ];

  return (
    <div className="grid gap-4 md:grid-cols-[1.1fr_1fr] md:items-start md:gap-6">
      <div className="divide-y divide-paper-line rounded-3xl bg-white p-4 shadow-[0_1px_2px_rgba(27,34,48,.04),0_10px_30px_-20px_rgba(27,34,48,.3)] ring-1 ring-paper-line sm:p-6">
        {/* 1. Province: the phone's own picker, so seven names never crowd the screen. */}
        <Step no={n(1)} title={ne ? "कुन प्रदेशमा दर्ता छ?" : "Registered in which province?"}>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
            <select
              value={province}
              onChange={(e) => chooseProvince(e.target.value as ProvinceId)}
              aria-label={ne ? "प्रदेश" : "Province"}
              className={`${field} appearance-none pl-12 pr-10 text-[1.05rem] font-semibold`}
            >
              {PROVINCES.map((x) => (
                <option key={x.id} value={x.id}>
                  {ne ? `${x.ne} प्रदेश` : x.en}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
          </div>
        </Step>

        {/* 2. Bike or car: two big tiles. */}
        <Step no={n(2)} title={ne ? "कुन सवारी?" : "Which vehicle?"}>
          <div className="grid grid-cols-2 gap-2.5">
            {([
              ["bike", Bike, ne ? "मोटरसाइकल" : "Motorcycle", ne ? "स्कुटर पनि" : "or scooter"],
              ["car", Car, ne ? "कार" : "Car", ne ? "जिप, भ्यान पनि" : "jeep or van"],
            ] as const).map(([v, Icon, l, sub]) => {
              const on = vehicle === v;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => chooseVehicle(v)}
                  aria-pressed={on}
                  className={`flex items-center gap-3 rounded-2xl p-3 text-left transition-[background-color,box-shadow,transform] duration-200 active:scale-[.98] ${on ? "bg-paper-warm ring-2 ring-ink" : "bg-white ring-1 ring-paper-line hover:ring-ink-faint/40"}`}
                >
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl transition-colors duration-200 ${on ? "bg-[#F5EBD6] text-[#86591A]" : "bg-paper-warm text-ink-soft"}`}>
                    <Icon className="h-6 w-6" strokeWidth={1.9} aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-bold leading-tight text-ink">{l}</span>
                    <span className="block text-sm leading-tight text-ink-faint">{sub}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </Step>

        {/* 3. Engine size. */}
        <Step no={n(3)} title={ne ? "इन्जिन कति सीसी? (ब्लुबुकमा)" : "Engine cc? (in the bluebook)"}>
          <div className="relative">
            <input
              type="number"
              inputMode="numeric"
              min={1}
              value={cc || ""}
              onChange={(e) => setCc(Math.max(0, Number(e.target.value)))}
              aria-label={ne ? "इन्जिन क्षमता (सीसी)" : "Engine size (cc)"}
              className={`${field} px-4 pr-14 text-lg font-bold tabular-nums`}
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink-faint">{ne ? "सीसी" : "cc"}</span>
          </div>
          <div className="no-scrollbar mt-2.5 flex gap-1.5 overflow-x-auto">
            {QUICK_CC[vehicle].map((v) => (
              <button key={v} type="button" onClick={() => setCc(v)} className={pill(cc === v)}>
                {n(v)}
              </button>
            ))}
          </div>
        </Step>

        {/* 4. On time or late; the late choices open only when needed. */}
        <Step no={n(4)} title={ne ? "यो वर्षको कर समयमै?" : "Paying this year on time?"}>
          <div className="flex rounded-2xl bg-paper-warm p-1">
            <button type="button" onClick={() => setLate(-1)} aria-pressed={late === -1} className={seg(late === -1)}>
              {ne ? "समयमै" : "On time"}
            </button>
            <button type="button" onClick={() => setLate((l) => (l === -1 ? 0 : l))} aria-pressed={late !== -1} className={seg(late !== -1)}>
              {ne ? "ढिलो भयो" : "Late"}
            </button>
          </div>
          {late !== -1 && (
            <div className="mt-2.5 grid animate-pop gap-1.5">
              {p.lateThisYear.map((s, i) => {
                const on = late === i;
                return (
                  <button
                    key={s.en}
                    type="button"
                    onClick={() => setLate(i)}
                    aria-pressed={on}
                    className={`flex min-h-[46px] items-center gap-3 rounded-xl px-3.5 text-left text-[0.95rem] transition-[background-color,box-shadow] duration-150 ${on ? "bg-paper-warm font-semibold text-ink ring-2 ring-ink" : "bg-white text-ink-soft ring-1 ring-paper-line hover:text-ink"}`}
                  >
                    <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition-colors ${on ? "border-ink" : "border-paper-line"}`}>
                      {on && <span className="h-2.5 w-2.5 rounded-full bg-ink" />}
                    </span>
                    {ne ? s.ne : s.en}
                  </button>
                );
              })}
            </div>
          )}
        </Step>

        {/* 5. Years behind. */}
        <Step
          no={n(5)}
          title={ne ? "अघिल्ला कति वर्ष बाँकी?" : "Earlier years unpaid?"}
          side={
            <div className="flex items-center gap-1 rounded-full bg-paper-warm p-1">
              <button type="button" onClick={() => setYears((y) => Math.max(0, y - 1))} aria-label={ne ? "घटाउनुहोस्" : "Fewer"} className={stepBtn} disabled={years === 0}>
                <Minus className="h-4 w-4" aria-hidden="true" />
              </button>
              <span key={years} className="w-8 animate-pop text-center text-lg font-bold tabular-nums text-ink">{n(years)}</span>
              <button type="button" onClick={() => setYears((y) => Math.min(5, y + 1))} aria-label={ne ? "बढाउनुहोस्" : "More"} className={stepBtn} disabled={years === 5}>
                <Plus className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          }
        />
      </div>

      {/* The receipt. */}
      <div className="md:sticky md:top-20">
        <div className="overflow-hidden rounded-3xl bg-white shadow-[0_1px_2px_rgba(27,34,48,.04),0_18px_40px_-24px_rgba(27,34,48,.4)] ring-1 ring-paper-line">
          <div className="relative bg-ink p-5 text-white sm:p-6">
            <p className="relative flex items-center gap-2 text-sm font-semibold text-white/70">
              <Receipt className="h-4 w-4" aria-hidden="true" />
              {/* Sudurpashchim's 2083/84 act isn't out yet, so its rates are last year's. */}
              {ne ? `${p.ne} प्रदेश · आ.व. ${p.note ? "२०८२/८३" : TAX_YEAR}` : `${p.en} · FY ${p.note ? "2082/83" : "2083/84"}`}
            </p>
            <p className="relative mt-3 text-sm text-white/70">{ne ? "जम्मा तिर्नुपर्ने (अनुमानित)" : "Total to pay (estimate)"}</p>
            <p className="relative mt-1 text-[2.6rem] font-bold leading-none tracking-tight tabular-nums">
              <span className="mr-1.5 text-xl font-semibold text-white/60">{ne ? "रु." : "Rs"}</span>
              {rupees(total, ne)}
            </p>
          </div>
          <ul className="px-5 py-2 sm:px-6">
            {rows
              .filter(([, v]) => v > 0)
              .map(([l, v]) => (
                <li key={l} className="flex animate-rise items-baseline justify-between gap-3 border-b border-dashed border-paper-line py-3 last:border-0">
                  <span className="text-ink-soft">{l}</span>
                  <span className="font-bold tabular-nums text-ink">{rupees(v, ne)}</span>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
