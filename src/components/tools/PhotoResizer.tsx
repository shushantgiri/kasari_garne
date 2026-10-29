"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Download, ImagePlus } from "lucide-react";
import type { Locale } from "@/lib/content/types";
import { digits } from "@/lib/i18n";

type Fit = "cover" | "contain";

/**
 * Starting points only: forms state their own size and KB limit, and people are asked to match those.
 * Passport-size is 35 × 45 mm at 300 dpi; A4 is at 150 dpi, plenty for a readable scan.
 */
const PRESETS = [
  { id: "passport", ne: "पासपोर्ट साइज फोटो", en: "Passport-size photo", hint: "35 × 45 mm", w: 413, h: 531, kb: 200, fit: "cover" as Fit },
  { id: "square", ne: "वर्गाकार फोटो", en: "Square photo", hint: "600 × 600", w: 600, h: 600, kb: 200, fit: "cover" as Fit },
  { id: "signature", ne: "हस्ताक्षर", en: "Signature", hint: "400 × 150", w: 400, h: 150, kb: 100, fit: "contain" as Fit },
  { id: "document", ne: "कागजात स्क्यान", en: "Document scan", hint: "A4", w: 1240, h: 1754, kb: 500, fit: "contain" as Fit },
  { id: "custom", ne: "आफ्नै साइज", en: "Custom size", hint: "px", w: 600, h: 800, kb: 300, fit: "cover" as Fit },
];

/** The largest JPEG quality that fits under `maxBytes` (a few tries, halving the gap each time). */
async function encode(canvas: HTMLCanvasElement, maxBytes: number): Promise<Blob | null> {
  const at = (q: number) => new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", q));
  let best = await at(0.92);
  if (!best || best.size <= maxBytes) return best;
  let lo = 0.2;
  let hi = 0.92;
  best = await at(lo);
  if (!best || best.size > maxBytes) return best; // can't get under the limit at this size
  for (let i = 0; i < 6; i++) {
    const mid = (lo + hi) / 2;
    const b = await at(mid);
    if (b && b.size <= maxBytes) {
      best = b;
      lo = mid;
    } else hi = mid;
  }
  return best;
}

/**
 * Resize a photo or scan to the pixel size and file size a form asks for.
 * Everything happens in the browser: the picture is never uploaded anywhere.
 */
export function PhotoResizer({ locale }: { locale: Locale }) {
  const ne = locale === "ne";
  const id = useId();
  const [image, setImage] = useState<ImageBitmap | null>(null);
  const [fileName, setFileName] = useState("");
  const [preset, setPreset] = useState(PRESETS[0]);
  const [w, setW] = useState(PRESETS[0].w);
  const [h, setH] = useState(PRESETS[0].h);
  const [kb, setKb] = useState(PRESETS[0].kb);
  const [fit, setFit] = useState<Fit>(PRESETS[0].fit);
  const [result, setResult] = useState<{ url: string; bytes: number; ok: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const urlRef = useRef<string | null>(null);

  const pick = (p: (typeof PRESETS)[number]) => {
    setPreset(p);
    setW(p.w);
    setH(p.h);
    setKb(p.kb);
    setFit(p.fit);
  };

  const open = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    try {
      // Browsers apply the photo's own rotation (from the camera) when decoding.
      setImage(await createImageBitmap(file));
      setFileName(file.name);
    } catch {
      setError(ne ? "यो फाइल खोल्न सकिएन। JPG वा PNG फोटो छान्नुहोस्।" : "Couldn't open this file. Choose a JPG or PNG picture.");
    }
  };

  // Redraw and re-encode whenever the picture or a setting changes.
  useEffect(() => {
    if (!image || w < 16 || h < 16 || kb < 5) return;
    let cancelled = false;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);
    const scale = fit === "cover" ? Math.max(w / image.width, h / image.height) : Math.min(w / image.width, h / image.height);
    const dw = image.width * scale;
    const dh = image.height * scale;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(image, (w - dw) / 2, (h - dh) / 2, dw, dh);
    encode(canvas, kb * 1024).then((blob) => {
      if (cancelled || !blob) return;
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      setResult({ url, bytes: blob.size, ok: blob.size <= kb * 1024 });
    });
    return () => {
      cancelled = true;
    };
  }, [image, w, h, kb, fit]);

  useEffect(() => () => {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
  }, []);

  const n = (v: number) => digits(v, locale);
  const label = "mb-2 block text-sm font-semibold text-ink-faint";
  const num = "grid h-6 w-6 shrink-0 place-items-center rounded-full bg-paper-warm text-xs font-bold text-ink-soft ring-1 ring-paper-line";

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-start">
      {/* ---------- Settings ---------- */}
      <div className="space-y-4">
        <section className="rounded-3xl bg-white p-4 shadow-[0_1px_2px_rgba(27,34,48,.04),0_10px_30px_-20px_rgba(27,34,48,.3)] ring-1 ring-paper-line sm:p-6">
          <h2 className="flex items-center gap-2.5 font-bold text-ink"><span className={num}>{n(1)}</span>{ne ? "फोटो छान्नुहोस्" : "Choose a picture"}</h2>
          <label
            htmlFor={`${id}-file`}
            className="mt-3 flex min-h-[112px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-paper-line bg-paper-warm/60 px-4 py-5 text-center transition-colors hover:border-ink-faint/50 hover:bg-paper-warm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ink/20"
          >
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#ECE7F1] text-[#5A4580]"><ImagePlus className="h-6 w-6" aria-hidden="true" /></span>
            <span className="font-semibold text-ink">{image ? fileName : ne ? "फोटो छान्नुहोस् वा खिच्नुहोस्" : "Choose or take a photo"}</span>
            <span className="text-sm text-ink-faint">{image ? (ne ? "बदल्न थिच्नुहोस्" : "Tap to change") : "JPG, PNG"}</span>
            <input id={`${id}-file`} type="file" accept="image/*" className="sr-only" onChange={(e) => open(e.target.files?.[0])} />
          </label>
          {error && <p role="alert" className="mt-2 text-sm text-brand-dark">{error}</p>}
        </section>

        <section className="rounded-3xl bg-white p-4 shadow-[0_1px_2px_rgba(27,34,48,.04),0_10px_30px_-20px_rgba(27,34,48,.3)] ring-1 ring-paper-line sm:p-6">
          <h2 className="flex items-center gap-2.5 font-bold text-ink"><span className={num}>{n(2)}</span>{ne ? "साइज छान्नुहोस्" : "Choose the size"}</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {PRESETS.map((p) => {
              const on = preset.id === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => pick(p)}
                  aria-pressed={on}
                  className={`flex min-h-[56px] flex-col items-start justify-center rounded-xl px-3 py-2 text-left transition-[background-color,box-shadow,transform] duration-200 active:scale-[.98] ${on ? "bg-paper-warm ring-2 ring-ink" : "ring-1 ring-paper-line hover:ring-ink-faint/40"} ${p.id === "custom" ? "col-span-2" : ""}`}
                >
                  <span className="text-sm font-semibold leading-snug text-ink">{ne ? p.ne : p.en}</span>
                  <span className="latin text-xs text-ink-faint">{p.hint}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div>
              <label className={label} htmlFor={`${id}-w`}>{ne ? "चौडाइ (px)" : "Width (px)"}</label>
              <input id={`${id}-w`} type="number" inputMode="numeric" min={16} max={4000} value={w} onChange={(e) => { setPreset(PRESETS[4]); setW(Number(e.target.value)); }} className="input latin" />
            </div>
            <div>
              <label className={label} htmlFor={`${id}-h`}>{ne ? "उचाइ (px)" : "Height (px)"}</label>
              <input id={`${id}-h`} type="number" inputMode="numeric" min={16} max={4000} value={h} onChange={(e) => { setPreset(PRESETS[4]); setH(Number(e.target.value)); }} className="input latin" />
            </div>
            <div>
              <label className={label} htmlFor={`${id}-kb`}>{ne ? "बढीमा KB" : "Max KB"}</label>
              <input id={`${id}-kb`} type="number" inputMode="numeric" min={5} max={5000} value={kb} onChange={(e) => setKb(Number(e.target.value))} className="input latin" />
            </div>
          </div>
          <p className="mt-2 text-sm text-ink-faint">{ne ? "फारामले जुन साइज र KB भन्छ, त्यही राख्नुहोस्।" : "Use the exact size and KB the form asks for."}</p>

          <div className="mt-4 flex rounded-xl bg-paper-warm p-1" role="group" aria-label={ne ? "कसरी मिलाउने" : "How to fit"}>
            {([
              ["cover", ne ? "भर्ने (किनार काट्ने)" : "Fill (trim edges)"],
              ["contain", ne ? "पूरै राख्ने (सेतो किनारा)" : "Keep all (white edges)"],
            ] as const).map(([v, text]) => (
              <button
                key={v}
                type="button"
                onClick={() => setFit(v)}
                aria-pressed={fit === v}
                className={`min-h-[44px] flex-1 rounded-lg px-3 text-sm font-semibold transition-[background-color,color,box-shadow] duration-150 ${fit === v ? "bg-white text-ink shadow-[0_1px_3px_rgba(27,34,48,.12)]" : "text-ink-soft hover:text-ink"}`}
              >
                {text}
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* ---------- Result ---------- */}
      <section className="rounded-3xl bg-white p-4 shadow-[0_1px_2px_rgba(27,34,48,.04),0_10px_30px_-20px_rgba(27,34,48,.3)] ring-1 ring-paper-line sm:p-6 md:sticky md:top-24" aria-live="polite">
        <h2 className="flex items-center gap-2.5 font-bold text-ink"><span className={num}>{n(3)}</span>{ne ? "डाउनलोड गर्नुहोस्" : "Download"}</h2>
        <div className="mt-3 grid min-h-[220px] place-items-center rounded-2xl bg-[repeating-conic-gradient(#F3F1ED_0_25%,#FBFAF8_0_50%)] bg-[length:20px_20px] p-4">
          {result && image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={result.url} alt={ne ? "मिलाइएको फोटो" : "Resized picture"} className="max-h-72 w-auto rounded-md shadow-card ring-1 ring-black/5" />
          ) : (
            <p className="max-w-[16rem] text-center text-sm text-ink-faint">{ne ? "फोटो छानेपछि यहाँ देखिन्छ।" : "Your picture shows here once you choose one."}</p>
          )}
        </div>

        {result && image && (
          <>
            <p className={`mt-3 flex animate-pop items-center gap-2 text-sm font-semibold ${result.ok ? "text-ok" : "text-warn"}`}>
              {result.ok ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : <AlertTriangle className="h-4 w-4" aria-hidden="true" />}
              <span className="latin">{n(w)} × {n(h)} px · {n(Math.max(1, Math.round(result.bytes / 1024)))} KB · JPG</span>
            </p>
            {!result.ok && (
              <p className="mt-1 text-sm text-ink-soft">{ne ? "यति सानो KB मा मिलेन। KB बढाउनुहोस् वा साइज घटाउनुहोस्।" : "Couldn't get it that small. Allow more KB or choose a smaller size."}</p>
            )}
            <a href={result.url} download={`photo-${w}x${h}.jpg`} className="btn-primary mt-4 w-full">
              <Download className="h-5 w-5" aria-hidden="true" />
              {ne ? "डाउनलोड गर्नुहोस्" : "Download"}
            </a>
          </>
        )}

      </section>
    </div>
  );
}
