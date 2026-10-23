"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Eye, RotateCcw } from "lucide-react";
import type { Locale } from "@/lib/content/types";
import { digits } from "@/lib/i18n";

/* ---------------- Dotted-number plates ---------------- */

/** 5×7 pixel digits; a dot belongs to the number if its centre falls on a lit pixel. */
const FONT: Record<string, string[]> = {
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
};

/** Orange-red number on green-olive dots: hard to tell apart with red-green colour blindness. */
const FIGURE = ["#E07B39", "#D9653B", "#EE9B4A", "#C9572F", "#E58A3F"];
const GROUND = ["#8DB33A", "#A5C04B", "#7AA33A", "#B7C860", "#9BAE4C", "#88A845"];

/** A small seeded random generator, so each plate looks the same every time. */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function Plate({ number, seed }: { number: string; seed: number }) {
  const dots = useMemo(() => {
    const rand = rng(seed);
    const cell = number.length > 1 ? 13 : 16;
    const w = number.length * 5 * cell + (number.length - 1) * cell;
    const x0 = 100 - w / 2;
    const y0 = 100 - (7 * cell) / 2;
    const lit = (x: number, y: number) => {
      const row = Math.floor((y - y0) / cell);
      if (row < 0 || row > 6) return false;
      const col = Math.floor((x - x0) / cell);
      const d = Math.floor(col / 6);
      const c = col % 6;
      if (d < 0 || d >= number.length || c > 4) return false;
      return FONT[number[d]][row][c] === "1";
    };
    const placed: { x: number; y: number; r: number; fill: string }[] = [];
    for (let i = 0; i < 2600 && placed.length < 520; i++) {
      const r = 2.2 + rand() * 4.3;
      const a = rand() * Math.PI * 2;
      const dist = Math.sqrt(rand()) * (92 - r);
      const x = 100 + Math.cos(a) * dist;
      const y = 100 + Math.sin(a) * dist;
      if (placed.some((p) => (p.x - x) ** 2 + (p.y - y) ** 2 < (p.r + r + 0.7) ** 2)) continue;
      const palette = lit(x, y) ? FIGURE : GROUND;
      placed.push({ x, y, r, fill: palette[Math.floor(rand() * palette.length)] });
    }
    return placed;
  }, [number, seed]);

  return (
    <svg viewBox="0 0 200 200" className="h-56 w-56 sm:h-64 sm:w-64" aria-hidden="true">
      <circle cx="100" cy="100" r="98" fill="#F4EFE6" />
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={d.fill} />
      ))}
    </svg>
  );
}

/* ---------------- The check ---------------- */

type Item =
  | { kind: "light"; color: string; answer: string }
  | { kind: "plate"; number: string; seed: number; options: string[] };

const COLOURS: Record<string, { ne: string; en: string }> = {
  red: { ne: "रातो", en: "Red" },
  amber: { ne: "पहेँलो", en: "Amber" },
  green: { ne: "हरियो", en: "Green" },
  blue: { ne: "निलो", en: "Blue" },
};

const ITEMS: Item[] = [
  { kind: "light", color: "#D7263D", answer: "red" },
  { kind: "plate", number: "12", seed: 11, options: ["12", "17", "72"] },
  { kind: "light", color: "#1E9E5A", answer: "green" },
  { kind: "plate", number: "8", seed: 23, options: ["8", "3", "6"] },
  { kind: "plate", number: "29", seed: 37, options: ["29", "70", "26"] },
  { kind: "light", color: "#F2A900", answer: "amber" },
  { kind: "plate", number: "5", seed: 41, options: ["5", "2", "3"] },
  { kind: "plate", number: "74", seed: 53, options: ["74", "21", "71"] },
];

const NOTHING = "none";

/**
 * A quick colour check like the one at the licence office: name the traffic-light colours, then read
 * the numbers hidden in dotted plates. Answers are shown only at the end. Screens show colours
 * differently, so this is a guide, not a medical test.
 */
export function ColorTest({ locale, onBack }: { locale: Locale; onBack: () => void }) {
  const ne = locale === "ne";
  const n = (v: number) => (ne ? digits(v, "ne") : String(v));
  const [at, setAt] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);

  const done = at >= ITEMS.length;
  const correct = (item: Item, a: string) => (item.kind === "light" ? a === item.answer : a === item.number);

  const answer = (a: string) => {
    setAnswers((x) => [...x, a]);
    setAt((i) => i + 1);
  };
  const restart = () => {
    setAnswers([]);
    setAt(0);
  };

  const header = (
    <div className="flex items-center justify-between gap-3">
      <button type="button" onClick={onBack} className="-ml-2 inline-flex min-h-[40px] items-center gap-1.5 rounded-full px-2 text-sm font-semibold text-ink-soft hover:bg-paper-warm hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {ne ? "अभ्यास" : "Practice"}
      </button>
      {!done && (
        <p className="text-sm font-semibold text-ink-soft">
          {ne ? `${n(at + 1)}/${n(ITEMS.length)}` : `${at + 1} of ${ITEMS.length}`}
        </p>
      )}
    </div>
  );

  if (done) {
    const plates = ITEMS.map((it, i) => ({ it, a: answers[i] })).filter((x) => x.it.kind === "plate");
    const lights = ITEMS.map((it, i) => ({ it, a: answers[i] })).filter((x) => x.it.kind === "light");
    const platesOk = plates.filter((x) => correct(x.it, x.a)).length;
    const lightsOk = lights.filter((x) => correct(x.it, x.a)).length;
    const allGood = platesOk === plates.length && lightsOk === lights.length;
    return (
      <div className="animate-rise">
        {header}
        <div className="mt-4 rounded-3xl border border-paper-line bg-white p-6 text-center sm:p-8">
          <span className={`mx-auto grid h-16 w-16 place-items-center rounded-full ${allGood ? "bg-ok-tint text-ok" : "bg-warn-tint text-warn"}`}>
            <Eye className="h-8 w-8" aria-hidden="true" />
          </span>
          <p className="mt-4 text-xl font-bold text-ink">
            {allGood ? (ne ? "रङ पहिचान ठीक देखियो" : "Your colour vision looks fine") : ne ? "केही रङ छुटे" : "Some colours were missed"}
          </p>
          <div className="mx-auto mt-4 grid max-w-xs grid-cols-2 gap-2 text-sm">
            <div className="rounded-xl bg-paper-warm p-3">
              <p className="text-ink-faint">{ne ? "बत्तीका रङ" : "Light colours"}</p>
              <p className="text-lg font-bold text-ink">{n(lightsOk)}/{n(lights.length)}</p>
            </div>
            <div className="rounded-xl bg-paper-warm p-3">
              <p className="text-ink-faint">{ne ? "अङ्क चिन्ने" : "Hidden numbers"}</p>
              <p className="text-lg font-bold text-ink">{n(platesOk)}/{n(plates.length)}</p>
            </div>
          </div>
          {!allGood && (
            <p className="mx-auto mt-4 max-w-sm text-[0.95rem] text-ink-soft">
              {ne ? "लाइसेन्सको परीक्षाअघि आँखा विशेषज्ञसँग रङ पहिचानको जाँच गराउनुहोस्।" : "Have an eye specialist check your colour vision before the licence test."}
            </p>
          )}
          <button type="button" onClick={restart} className="btn-secondary mt-6">
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            {ne ? "फेरि गर्नुहोस्" : "Do it again"}
          </button>
          <p className="mt-4 text-xs text-ink-faint">
            {ne ? "स्क्रिनअनुसार रङ फरक देखिन सक्छ। यो चिकित्सकीय जाँच होइन।" : "Screens show colours differently. This is not a medical test."}
          </p>
        </div>
      </div>
    );
  }

  const item = ITEMS[at];
  const choice = "flex min-h-[56px] items-center justify-center rounded-2xl border-2 border-paper-line bg-white px-4 text-lg font-semibold text-ink transition-colors hover:border-ink-faint/50 hover:bg-paper-warm/50 active:bg-paper-warm";

  return (
    <div className="animate-fade">
      {header}
      <div className="mt-2 flex gap-1" aria-hidden="true">
        {ITEMS.map((_, i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i < at ? "bg-sky" : i === at ? "bg-ink/30" : "bg-paper-line"}`} />
        ))}
      </div>

      <div key={at} className="mt-5 animate-step-next rounded-3xl border border-paper-line bg-white p-5 text-center sm:p-7">
        <h2 className="text-xl font-bold text-ink">
          {item.kind === "light" ? (ne ? "यो बत्ती कुन रङको हो?" : "What colour is this light?") : ne ? "थोप्लाभित्र कुन अङ्क देख्नुहुन्छ?" : "Which number do you see in the dots?"}
        </h2>

        <div className="mt-5 grid place-items-center">
          {item.kind === "light" ? (
            <span className="grid h-40 w-24 place-items-center rounded-[2rem] bg-ink shadow-[0_18px_40px_-20px_rgba(27,34,48,0.6)]">
              <span className="h-16 w-16 rounded-full" style={{ background: item.color, boxShadow: `0 0 28px 6px ${item.color}66` }} />
            </span>
          ) : (
            <Plate number={item.number} seed={item.seed} />
          )}
        </div>

        <div className={`mt-6 grid gap-2.5 ${item.kind === "light" ? "grid-cols-2" : "grid-cols-3"}`}>
          {item.kind === "light"
            ? Object.entries(COLOURS).map(([id, c]) => (
                <button key={id} type="button" onClick={() => answer(id)} className={choice}>
                  {ne ? c.ne : c.en}
                </button>
              ))
            : [...item.options].sort().map((o) => (
                <button key={o} type="button" onClick={() => answer(o)} className={`${choice} latin`}>
                  {o}
                </button>
              ))}
          {item.kind === "plate" && (
            <button type="button" onClick={() => answer(NOTHING)} className={`${choice} col-span-3 text-base`}>
              {ne ? "केही देखिँदैन" : "I can't see a number"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
