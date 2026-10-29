"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Camera, CheckCircle2, Download, FileText, ImagePlus, Loader2, RotateCw, Share2, Trash2, Wand2 } from "lucide-react";
import type { Locale } from "@/lib/content/types";
import { imagesToPdf, type PdfImage } from "@/lib/pdf";
import { digits } from "@/lib/i18n";

interface Page {
  id: number;
  file: File;
  url: string;
  rotate: number;
}

const LIMITS = [300, 500, 1024, 2048];

function kb(bytes: number, ne: boolean): string {
  const v = bytes / 1024;
  const s = v >= 1024 ? `${(v / 1024).toFixed(1)} MB` : `${Math.round(v)} KB`;
  return ne ? digits(s, "ne") : s;
}

async function loadImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    // Decoded: the URL isn't needed any more.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

/** One page as a JPEG: turned, scaled so its long side is at most `maxSide`, optionally made to look like a clean scan. */
async function renderPage(img: HTMLImageElement, rotate: number, maxSide: number, quality: number, scan: boolean): Promise<PdfImage> {
  const turned = rotate % 180 !== 0;
  const w0 = turned ? img.naturalHeight : img.naturalWidth;
  const h0 = turned ? img.naturalWidth : img.naturalHeight;
  const k = Math.min(1, maxSide / Math.max(w0, h0));
  const w = Math.max(1, Math.round(w0 * k));
  const h = Math.max(1, Math.round(h0 * k));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, w, h);
  ctx.translate(w / 2, h / 2);
  ctx.rotate((rotate * Math.PI) / 180);
  const dw = (turned ? h : w);
  const dh = (turned ? w : h);
  ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
  if (scan) {
    // Grey, brighter paper, darker ink: like a photocopy, and much smaller as a JPEG.
    const data = ctx.getImageData(0, 0, w, h);
    const p = data.data;
    for (let i = 0; i < p.length; i += 4) {
      const g = 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2];
      const v = Math.max(0, Math.min(255, (g - 128) * 1.45 + 150));
      p[i] = p[i + 1] = p[i + 2] = v;
    }
    ctx.putImageData(data, 0, 0);
  }
  const blob = await new Promise<Blob>((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("encode"))), "image/jpeg", quality));
  return { jpeg: new Uint8Array(await blob.arrayBuffer()), width: w, height: h };
}

/**
 * Photos of documents → one PDF under the size a form allows (often 1 MB). Pages can be turned,
 * reordered and removed; "scan look" makes them clean black-and-white. Shrinking is tried step by step
 * (quality first, then size) until the PDF fits. All of it happens on the phone; nothing is uploaded.
 */
export function DocToPdf({ locale }: { locale: Locale }) {
  const ne = locale === "ne";
  const n = (v: number) => (ne ? digits(v, "ne") : String(v));
  const [pages, setPages] = useState<Page[]>([]);
  const [limit, setLimit] = useState(1024);
  const [scan, setScan] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);
  const [result, setResult] = useState<{ url: string; size: number; fits: boolean; blob: Blob } | null>(null);
  const idRef = useRef(0);
  const pickRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => pages.forEach((p) => URL.revokeObjectURL(p.url)), []); // eslint-disable-line react-hooks/exhaustive-deps

  const clearResult = () => {
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
  };

  const add = (files: FileList | null) => {
    if (!files) return;
    const imgs = [...files].filter((f) => f.type.startsWith("image/"));
    setPages((ps) => [...ps, ...imgs.map((file) => ({ id: ++idRef.current, file, url: URL.createObjectURL(file), rotate: 0 }))]);
    clearResult();
  };
  const update = (fn: (ps: Page[]) => Page[]) => {
    setPages(fn);
    clearResult();
  };
  const move = (i: number, d: number) =>
    update((ps) => {
      const j = i + d;
      if (j < 0 || j >= ps.length) return ps;
      const out = [...ps];
      [out[i], out[j]] = [out[j], out[i]];
      return out;
    });

  const make = async () => {
    if (!pages.length) return;
    clearResult();
    setBusy(0);
    try {
      const imgs = await Promise.all(pages.map((p) => loadImage(p.file)));
      const target = limit * 1024;
      let best: Uint8Array | null = null;
      let side = 2000;
      const qualities = [0.82, 0.7, 0.58, 0.48, 0.4];
      let tries = 0;
      outer: while (side >= 600) {
        for (const q of qualities) {
          tries++;
          setBusy(Math.min(95, tries * 7));
          const rendered: PdfImage[] = [];
          for (let i = 0; i < imgs.length; i++) rendered.push(await renderPage(imgs[i], pages[i].rotate, side, q, scan));
          const pdf = imagesToPdf(rendered);
          if (!best || pdf.length < best.length) best = pdf;
          if (pdf.length <= target) {
            best = pdf;
            break outer;
          }
        }
        side = Math.round(side * 0.78);
      }
      const blob = new Blob([best as BlobPart], { type: "application/pdf" });
      setBusy(100);
      setResult({ url: URL.createObjectURL(blob), size: blob.size, fits: blob.size <= target, blob });
    } catch {
      setResult(null);
    } finally {
      setBusy(null);
    }
  };

  const fileName = "documents.pdf";
  const share = async () => {
    if (!result) return;
    const file = new File([result.blob], fileName, { type: "application/pdf" });
    if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file] }).catch(() => {});
  };
  const [canShare, setCanShare] = useState(false);
  useEffect(() => {
    try {
      setCanShare(typeof navigator !== "undefined" && !!navigator.canShare?.({ files: [new File([""], "a.pdf", { type: "application/pdf" })] }));
    } catch {
      setCanShare(false);
    }
  }, []);

  return (
    <div className="space-y-4">
      <input ref={pickRef} type="file" accept="image/*" multiple hidden onChange={(e) => (add(e.target.files), (e.target.value = ""))} />
      <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => (add(e.target.files), (e.target.value = ""))} />

      {/* Add pages. */}
      {pages.length === 0 ? (
        <div className="animate-rise rounded-3xl border-2 border-dashed border-paper-line bg-white p-6 text-center sm:p-10">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-sky-tint text-sky">
            <FileText className="h-8 w-8" aria-hidden="true" />
          </span>
          <p className="mt-4 text-lg font-bold text-ink">{ne ? "कागजातको फोटो थप्नुहोस्" : "Add photos of your documents"}</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-ink-soft">{ne ? "नागरिकता, प्रमाणपत्र, फारम… एक वा धेरै पाना। एउटै PDF बन्छ।" : "Citizenship, certificates, forms… one or many pages, into one PDF."}</p>
          <div className="mx-auto mt-5 grid max-w-sm grid-cols-2 gap-2">
            <button type="button" onClick={() => camRef.current?.click()} className="btn-primary">
              <Camera className="h-5 w-5" aria-hidden="true" />
              {ne ? "फोटो खिच्नुहोस्" : "Take photo"}
            </button>
            <button type="button" onClick={() => pickRef.current?.click()} className="btn-secondary">
              <ImagePlus className="h-5 w-5" aria-hidden="true" />
              {ne ? "ग्यालेरी" : "Gallery"}
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-paper-line bg-white p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2 px-1">
            <p className="font-semibold text-ink">{ne ? `${n(pages.length)} पाना` : `${pages.length} page${pages.length > 1 ? "s" : ""}`}</p>
            <div className="flex gap-1.5">
              <button type="button" onClick={() => camRef.current?.click()} aria-label={ne ? "फोटो खिच्नुहोस्" : "Take photo"} className="grid h-10 w-10 place-items-center rounded-full bg-paper-warm text-ink hover:bg-paper-line">
                <Camera className="h-4 w-4" aria-hidden="true" />
              </button>
              <button type="button" onClick={() => pickRef.current?.click()} className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full bg-paper-warm px-3 text-sm font-semibold text-ink hover:bg-paper-line">
                <ImagePlus className="h-4 w-4" aria-hidden="true" />
                {ne ? "थप्नुहोस्" : "Add"}
              </button>
            </div>
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {pages.map((p, i) => (
              <li key={p.id} className="animate-pop">
                <div className="relative overflow-hidden rounded-2xl border border-paper-line bg-paper-warm">
                  <div className="grid aspect-[3/4] place-items-center p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.url}
                      alt={ne ? `पाना ${n(i + 1)}` : `Page ${i + 1}`}
                      className={`max-h-full max-w-full rounded-md object-contain shadow-card transition-[transform,filter] duration-300 ${scan ? "contrast-150 grayscale" : ""}`}
                      style={{ transform: `rotate(${p.rotate}deg)` }}
                    />
                  </div>
                  <span className="absolute left-2 top-2 grid h-6 min-w-6 place-items-center rounded-full bg-ink px-1.5 text-xs font-bold text-white">{n(i + 1)}</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={ne ? "अगाडि सार्नुहोस्" : "Move earlier"} className="grid h-9 w-9 place-items-center rounded-full text-ink-soft hover:bg-paper-warm disabled:opacity-30">
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button type="button" onClick={() => update((ps) => ps.map((x) => (x.id === p.id ? { ...x, rotate: (x.rotate + 90) % 360 } : x)))} aria-label={ne ? "घुमाउनुहोस्" : "Rotate"} className="grid h-9 w-9 place-items-center rounded-full text-ink-soft hover:bg-paper-warm">
                    <RotateCw className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      URL.revokeObjectURL(p.url);
                      update((ps) => ps.filter((x) => x.id !== p.id));
                    }}
                    aria-label={ne ? "हटाउनुहोस्" : "Remove"}
                    className="grid h-9 w-9 place-items-center rounded-full text-ink-soft hover:bg-brand-tint hover:text-brand"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === pages.length - 1} aria-label={ne ? "पछाडि सार्नुहोस्" : "Move later"} className="grid h-9 w-9 place-items-center rounded-full text-ink-soft hover:bg-paper-warm disabled:opacity-30">
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {pages.length > 0 && (
        <div className="animate-rise space-y-4 rounded-3xl border border-paper-line bg-white p-4 sm:p-5">
          {/* Size limit. */}
          <div>
            <p className="text-sm font-semibold text-ink-faint">{ne ? "फारमले भनेको बढीमा साइज" : "Largest size the form allows"}</p>
            <div className="mt-2 grid grid-cols-4 gap-1.5">
              {LIMITS.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => (setLimit(l), clearResult())}
                  aria-pressed={limit === l}
                  className={`min-h-[44px] rounded-xl text-sm font-bold transition-[background-color,color] ${limit === l ? "bg-ink text-white" : "bg-paper-warm text-ink-soft hover:text-ink"}`}
                >
                  {kb(l * 1024, ne)}
                </button>
              ))}
            </div>
          </div>
          {/* Scan look. */}
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-paper-warm px-3.5 py-3">
            <Wand2 className="h-5 w-5 shrink-0 text-sky" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-ink">{ne ? "स्क्यान जस्तो (कालो-सेतो)" : "Scan look (black and white)"}</span>
              <span className="block text-sm text-ink-faint">{ne ? "अक्षर प्रस्ट, साइज सानो" : "Sharper text, smaller file"}</span>
            </span>
            <input type="checkbox" checked={scan} onChange={(e) => (setScan(e.target.checked), clearResult())} className="tick" />
          </label>

          {busy !== null ? (
            <div className="space-y-2" role="status">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                {ne ? "PDF बनाउँदै…" : "Making the PDF…"}
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-paper-warm">
                <div className="h-full rounded-full bg-gradient-to-r from-sky to-brand transition-[width] duration-300" style={{ width: `${busy}%` }} />
              </div>
            </div>
          ) : (
            !result && (
              <button type="button" onClick={make} className="btn-primary w-full text-base">
                <FileText className="h-5 w-5" aria-hidden="true" />
                {ne ? "PDF बनाउनुहोस्" : "Make PDF"}
              </button>
            )
          )}

          {/* The PDF. */}
          {result && (
            <div className="animate-pop rounded-2xl bg-ok-tint p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className={`h-8 w-8 shrink-0 ${result.fits ? "text-ok" : "text-warn"}`} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-ink">{result.fits ? (ne ? "PDF तयार!" : "PDF ready!") : ne ? "यति सानो बनाउन सकिएन" : "Couldn't get it this small"}</p>
                  <p className="text-sm text-ink-soft">
                    {kb(result.size, ne)} · {ne ? `${n(pages.length)} पाना` : `${pages.length} pages`}
                    {!result.fits && (ne ? " — पाना घटाउनुहोस् वा 'स्क्यान जस्तो' छान्नुहोस्" : " — remove a page or turn on scan look")}
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <a href={result.url} download={fileName} className="btn-primary">
                  <Download className="h-5 w-5" aria-hidden="true" />
                  {ne ? "डाउनलोड" : "Download"}
                </a>
                {canShare ? (
                  <button type="button" onClick={share} className="btn-secondary">
                    <Share2 className="h-5 w-5" aria-hidden="true" />
                    {ne ? "पठाउनुहोस्" : "Share"}
                  </button>
                ) : (
                  <a href={result.url} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                    {ne ? "हेर्नुहोस्" : "Open"}
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
