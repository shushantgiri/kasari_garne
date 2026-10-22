"use client";

/**
 * Renders one tutorial scene from the reusable templates at a given progress
 * (0 → 1). Everything is plain HTML/CSS sized in container units, so it is
 * crisp at any width and costs almost nothing to download.
 *
 * The video renderer in /video mirrors these templates for MP4 output.
 */
import { AlertTriangle, CheckCircle2, Circle, FileCheck2, Globe, Lock, ShieldCheck } from "lucide-react";
import type { Scene } from "@/lib/video/script";

export interface SceneLabels {
  step: string;
  demo: string;
  unconfirmed: string;
  /** "ne" shows step numbers in Devanagari digits. */
  digits?: "ne" | "en";
}

const NE = "०१२३४५६७८९";
const num = (n: number, d?: "ne" | "en") => (d === "ne" ? String(n).replace(/\d/g, (x) => NE[+x]) : String(n));

const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
const between = (p: number, a: number, b: number) => ease((p - a) / (b - a));

export function SceneView({ scene, progress, labels }: { scene: Scene; progress: number; labels: SceneLabels }) {
  return (
    <div className="absolute inset-0 flex flex-col bg-[#FAF8F5] text-ink" style={{ containerType: "inline-size" }}>
      {scene.stepNumber && (
        <div className="absolute left-[3cqw] top-[3cqw] z-10 flex items-center gap-[1.2cqw]">
          <span className="rounded-full bg-brand px-[1.8cqw] py-[0.5cqw] text-[max(12px,2.4cqw)] font-bold text-white">
            {labels.step} {num(scene.stepNumber, labels.digits)}
          </span>
          {scene.unconfirmed && (
            <span className="rounded-full bg-warn-tint px-[1.5cqw] py-[0.4cqw] text-[max(11px,2cqw)] font-semibold text-warn">{labels.unconfirmed}</span>
          )}
        </div>
      )}
      <Body scene={scene} p={progress} labels={labels} />
    </div>
  );
}

function Body({ scene, p, labels }: { scene: Scene; p: number; labels: SceneLabels }) {
  switch (scene.template) {
    case "title":
      return (
        <div className="flex flex-1 flex-col justify-center px-[7cqw]">
          <div className="mb-[2cqw] h-[0.8cqw] rounded bg-brand" style={{ width: `${12 * between(p, 0, 0.25)}cqw` }} />
          <h3 className="text-[5.2cqw] font-bold leading-tight" style={{ opacity: between(p, 0, 0.2) }}>{scene.heading}</h3>
          <ul className="mt-[3cqw] space-y-[1cqw] text-[max(13px,2.8cqw)] text-ink-soft">
            {scene.lines?.map((l, i) => (
              <li key={i} style={{ opacity: between(p, 0.2 + i * 0.12, 0.35 + i * 0.12), transform: `translateY(${(1 - between(p, 0.2 + i * 0.12, 0.35 + i * 0.12)) * 1.5}cqw)` }}>
                {i === 0 ? <strong className="text-ink">{l}</strong> : `• ${l}`}
              </li>
            ))}
          </ul>
        </div>
      );

    case "checklist":
      return (
        <Panel icon={<FileCheck2 className="h-[4cqw] w-[4cqw] text-sky" />} heading={scene.heading}>
          <ul className="space-y-[1.4cqw]">
            {scene.lines?.map((l, i) => {
              const on = p > 0.15 + (i * 0.7) / (scene.lines!.length || 1);
              return (
                <li key={i} className="flex items-center gap-[1.6cqw] text-[max(13px,2.8cqw)]" style={{ opacity: between(p, i * 0.08, i * 0.08 + 0.15) }}>
                  {on ? <CheckCircle2 className="h-[3.4cqw] w-[3.4cqw] shrink-0 text-ok" /> : <Circle className="h-[3.4cqw] w-[3.4cqw] shrink-0 text-ink-faint" />}
                  <span className={on ? "text-ink" : "text-ink-soft"}>{l}</span>
                </li>
              );
            })}
          </ul>
        </Panel>
      );

    case "warning":
      return (
        <Panel icon={<AlertTriangle className="h-[4cqw] w-[4cqw] text-warn" />} heading={scene.heading} tone="warn">
          <ul className="space-y-[1.6cqw]">
            {scene.lines?.map((l, i) => (
              <li key={i} className="flex gap-[1.4cqw] text-[max(13px,2.6cqw)] leading-snug" style={{ opacity: between(p, i * 0.2, i * 0.2 + 0.15) }}>
                <span className="mt-[0.9cqw] h-[1.2cqw] w-[1.2cqw] shrink-0 rounded-full bg-warn" />
                {l}
              </li>
            ))}
          </ul>
        </Panel>
      );

    case "progress":
    case "summary":
      return (
        <Panel icon={<CheckCircle2 className="h-[4cqw] w-[4cqw] text-ok" />} heading={scene.heading}>
          {scene.lines ? (
            <ol className="space-y-[1.6cqw]">
              {scene.lines.map((l, i) => (
                <li key={i} className="flex items-start gap-[1.6cqw] text-[max(13px,2.7cqw)]" style={{ opacity: between(p, i * 0.18, i * 0.18 + 0.15) }}>
                  <span className="grid h-[3.6cqw] w-[3.6cqw] shrink-0 place-items-center rounded-full bg-ok text-[max(11px,2cqw)] font-bold text-white">{i + 1}</span>
                  {l}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-[max(13px,2.8cqw)] leading-snug text-ink-soft" style={{ opacity: between(p, 0, 0.2) }}>{scene.caption}</p>
          )}
        </Panel>
      );

    case "source":
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-[2cqw] px-[8cqw] text-center">
          <ShieldCheck className="h-[7cqw] w-[7cqw] text-sky" style={{ opacity: between(p, 0, 0.2) }} />
          <p className="text-[3.2cqw] font-bold">{scene.heading}</p>
          <ul className="space-y-[0.6cqw] text-[max(12px,2.2cqw)] text-ink-soft">{scene.lines?.map((l, i) => <li key={i}>{l}</li>)}</ul>
        </div>
      );

    case "portal":
    case "browser":
    case "form":
      return <Device scene={scene} p={p} labels={labels} />;
  }
}

function Panel({ icon, heading, children, tone }: { icon: React.ReactNode; heading: string; children: React.ReactNode; tone?: "warn" }) {
  return (
    <div className="flex flex-1 items-center justify-center px-[6cqw] pt-[6cqw] pb-[3cqw]">
      <div className={`w-full rounded-[2cqw] border bg-white p-[4cqw] ${tone === "warn" ? "border-warn/30" : "border-paper-line"}`}>
        <div className="mb-[2.5cqw] flex items-center gap-[1.6cqw]">
          {icon}
          <h3 className="text-[3.6cqw] font-bold">{heading}</h3>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Simplified browser frame with a permanent "demo" label so it can never pass for the real portal. */
function Device({ scene, p, labels }: { scene: Scene; p: number; labels: SceneLabels }) {
  const d = scene.demo;
  const fields = d?.fields ?? [];
  const items = d?.items ?? [];
  const targetIsButton = d?.target === "button";
  const typed = (s: string, i: number) => {
    const start = 0.15 + (i * 0.45) / Math.max(1, fields.length);
    const span = 0.4 / Math.max(1, fields.length);
    const k = Math.round(s.length * between(p, start, start + span));
    return s.slice(0, k);
  };
  // Cursor travels in from the lower right and lands on its target, clicking at ~78%.
  const cp = between(p, 0.55, 0.78);
  const clicked = p > 0.78;
  const cursor = (
    <Cursor dx={(1 - cp) * 34} dy={(1 - cp) * 14} opacity={between(p, 0.45, 0.55)} ring={clicked && p < 0.9 ? 1 - (p - 0.78) * 8 : 0} />
  );
  const fieldTarget = typeof d?.target === "number" ? d.target : -1;

  return (
    <div className="flex flex-1 items-center justify-center px-[5cqw] pt-[7cqw] pb-[2cqw]">
      <div className="relative w-full overflow-hidden rounded-[1.6cqw] border border-paper-line bg-white shadow-card">
        {/* chrome */}
        <div className="flex items-center gap-[1.2cqw] border-b border-paper-line bg-[#F3F1ED] px-[2cqw] py-[1.2cqw]">
          <span className="flex gap-[0.7cqw]">
            {[0, 1, 2].map((i) => <span key={i} className="h-[1.2cqw] w-[1.2cqw] rounded-full bg-[#D8D3CA]" />)}
          </span>
          <span className="flex flex-1 items-center gap-[0.8cqw] rounded-full bg-white px-[1.6cqw] py-[0.5cqw] text-[max(11px,1.9cqw)] text-ink-soft">
            <Lock className="h-[1.8cqw] w-[1.8cqw] text-ok" />
            {d?.url ?? ""}
          </span>
          <span className="rounded bg-warn-tint px-[1cqw] py-[0.3cqw] text-[max(10px,1.6cqw)] font-bold text-warn">{labels.demo}</span>
        </div>
        {/* page */}
        <div className="relative min-h-[24cqw] px-[4cqw] py-[2cqw]">
          {scene.template === "portal" ? (
            <div className="flex flex-col items-center gap-[1.5cqw] py-[3cqw] text-center">
              <Globe className="h-[6cqw] w-[6cqw] text-sky" style={{ opacity: between(p, 0, 0.3) }} />
              <p className="text-[3.2cqw] font-bold">{d?.url}</p>
              <p className="text-[max(12px,2.2cqw)] text-ink-soft">{d?.heading}</p>
            </div>
          ) : (
            <>
              {d?.heading && <p className="mb-[1.2cqw] text-[max(13px,2.6cqw)] font-bold">{d.heading}</p>}
              <div className="space-y-[1cqw]">
                {fields.map((f, i) => {
                  const active = d?.target === i && p > 0.5;
                  return (
                    <div key={i}>
                      <span className="mb-[0.2cqw] block text-[max(11px,1.7cqw)] text-ink-soft">{f.label}</span>
                      <span className={`relative block rounded-[0.8cqw] border px-[1.4cqw] py-[0.6cqw] text-[max(12px,2cqw)] ${active ? "border-sky ring-[0.4cqw] ring-sky/20" : "border-paper-line"}`}>
                        {typed(f.sample ?? "", i)}
                        <span className="opacity-0">.</span>
                        {i === fieldTarget && cursor}
                      </span>
                    </div>
                  );
                })}
                {items.map((it, i) => (
                  <div key={i} className="flex items-center gap-[1.2cqw] rounded-[0.8cqw] border border-paper-line px-[1.4cqw] py-[0.9cqw] text-[max(12px,2.2cqw)]" style={{ opacity: between(p, i * 0.1, i * 0.1 + 0.2) }}>
                    <span className={`h-[1.8cqw] w-[1.8cqw] rounded-full border-[0.3cqw] ${i === 0 && p > 0.6 ? "border-brand bg-brand" : "border-ink-faint"}`} />
                    {it}
                  </div>
                ))}
              </div>
              {d?.button && (
                <span
                  className={`relative mt-[1.6cqw] inline-block rounded-[0.8cqw] px-[2.4cqw] py-[0.8cqw] text-[max(12px,2.2cqw)] font-semibold text-white transition-transform ${targetIsButton && p > 0.55 ? "ring-[0.6cqw] ring-brand/25" : ""}`}
                  style={{ background: "#B4232C", transform: targetIsButton && clicked && p < 0.85 ? "scale(0.96)" : "none" }}
                >
                  {d.button}
                  {targetIsButton && cursor}
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** Pointer drawn relative to its target element; dx/dy (cqw) shrink to 0 as it arrives. */
function Cursor({ dx, dy, opacity, ring }: { dx: number; dy: number; opacity: number; ring: number }) {
  return (
    <svg
      className="pointer-events-none absolute z-10 h-[4cqw] w-[4cqw] drop-shadow"
      style={{ left: `calc(55% + ${dx}cqw)`, top: `calc(45% + ${dy}cqw)`, opacity }}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M4 2v18l5-5 3.5 7 3-1.5L12 13.5h7z" fill="#1B2230" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
      {ring > 0 && <circle cx="4" cy="2" r="5" fill="none" stroke="#B4232C" strokeWidth="2" opacity={ring} />}
    </svg>
  );
}
