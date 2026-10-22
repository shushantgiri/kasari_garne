/**
 * Turns a guide into a tutorial "script": an ordered list of scenes built from
 * reusable templates, with timing, captions/narration text and chapters.
 *
 * The same script drives:
 *   - the in-browser animated player (components/video/LiveTutorial.tsx)
 *   - the Remotion MP4 renderer (video/src/Tutorial.tsx)
 *   - WebVTT caption export (scripts/export-subtitles.ts)
 *
 * Pure TypeScript — no React, no Node APIs — so it runs everywhere.
 */
import type { DemoScreen, Guide, Locale, Localized } from "../content/types";

export type SceneTemplate =
  | "title" // Opening title
  | "checklist" // Document checklist
  | "portal" // Official portal introduction
  | "browser" // Browser walkthrough
  | "form" // Form-field demonstration
  | "warning" // Warning or correction
  | "progress" // Progress update / what happens next
  | "summary" // Final summary
  | "source"; // Official source and verification date

export interface Scene {
  id: string;
  template: SceneTemplate;
  /** Milliseconds at 1× speed. */
  duration: number;
  /** Caption shown on screen; also the narration line. */
  caption: string;
  /** Large heading inside the scene. */
  heading: string;
  /** Bullet lines for checklist / warning / summary scenes. */
  lines?: string[];
  /** Step number shown in the badge (1-based) for step scenes. */
  stepNumber?: number;
  stepId?: string;
  /** "needs_review" steps get a visible label inside the video too. */
  unconfirmed?: boolean;
  demo?: ResolvedDemo;
  chapter: number;
}

export interface ResolvedDemo {
  kind: DemoScreen["kind"];
  url?: string;
  heading?: string;
  fields?: { label: string; sample?: string }[];
  button?: string;
  items?: string[];
  /** What the animated cursor points at: field index, or "button". */
  target: number | "button" | null;
}

export interface Chapter {
  index: number;
  title: string;
  stepId?: string;
  start: number; // ms
}

export interface TutorialScript {
  slug: string;
  locale: Locale;
  title: string;
  scenes: (Scene & { start: number })[];
  chapters: Chapter[];
  totalMs: number;
}

const t = (l: Localized | undefined, locale: Locale) => (l ? (locale === "en" ? l.en : l.ne) || l.ne : "");

/** Reading-speed based timing: long enough to read the caption twice on a small phone. */
export function durationFor(text: string, min = 3500, max = 11000) {
  return Math.max(min, Math.min(max, 1600 + text.length * 70));
}

const L = {
  ne: {
    learn: "यो भिडियोमा सिक्नुहोस्",
    start: "सुरु गर्नुहोस्",
    prep: "यी कागजात तयार राख्नुहोस्",
    portal: "आधिकारिक वेबसाइट",
    portalCaption: (u: string) => `आवेदन सधैँ आधिकारिक वेबसाइट ${u} मा मात्र दिनुहोस्।`,
    step: "चरण",
    warnings: "ध्यान दिनुहोस्",
    next: "त्यसपछि के हुन्छ?",
    summary: "सारांश",
    finalChapter: "अन्तिम चरण",
    summaryLines: ["कागजात तयार राख्नुहोस्।", "विवरण कागजातअनुसार भर्नुहोस्।", "पेस गर्नुअघि सबै जाँच्नुहोस्।"],
    end: "पेस गर्नुअघि सबै विवरण फेरि जाँच्नुहोस्।",
    source: "स्रोत जाँचिएको मिति",
    unconfirmed: "पुष्टि हुन बाँकी",
  },
  en: {
    learn: "In this video",
    start: "Getting started",
    prep: "Have these documents ready",
    portal: "Official website",
    portalCaption: (u: string) => `Always apply only on the official website ${u}.`,
    step: "Step",
    warnings: "Watch out",
    next: "What happens next?",
    summary: "Summary",
    finalChapter: "Final step",
    summaryLines: ["Get your documents ready.", "Fill in details exactly as on your documents.", "Check everything before you submit."],
    end: "Check every detail again before you submit.",
    source: "Sources checked on",
    unconfirmed: "Not yet confirmed",
  },
};

function resolveDemo(d: DemoScreen | undefined, locale: Locale): ResolvedDemo | undefined {
  if (!d) return undefined;
  return {
    kind: d.kind,
    url: d.url,
    heading: t(d.heading, locale),
    fields: d.fields?.map((f) => ({ label: t(f.label, locale), sample: f.sample })),
    button: t(d.button, locale) || undefined,
    items: d.items?.map((i) => t(i, locale)),
    target: d.focusField ?? (d.button ? "button" : d.fields?.length ? 0 : null),
  };
}

export function buildTutorial(guide: Guide, locale: Locale, opts: { checkedOnLabel?: string } = {}): TutorialScript {
  const l = L[locale];
  const scenes: Scene[] = [];
  const chapters: Omit<Chapter, "start">[] = [{ index: 0, title: l.start }];

  // 1. Introduction
  const titleText = t(guide.question, locale);
  scenes.push({
    id: "title",
    template: "title",
    heading: titleText,
    caption: `${t(guide.title, locale)}। ${t(guide.intro, locale)}`,
    lines: [`${l.learn}:`, ...guide.steps.slice(0, 4).map((s) => t(s.title, locale))],
    duration: 0,
    chapter: 0,
  });

  // 2. Preparation — only officially sourced documents appear in videos.
  const docs = guide.documents.filter((d) => d.check === "official");
  if (docs.length) {
    const lines = docs.slice(0, 5).map((d) => t(d.text, locale));
    scenes.push({ id: "prep", template: "checklist", heading: l.prep, caption: lines.join("। "), lines, duration: 0, chapter: 0 });
  }

  // 3. Portal
  if (guide.officialPortal) {
    const host = guide.officialPortal.url.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    scenes.push({
      id: "portal",
      template: "portal",
      heading: l.portal,
      caption: l.portalCaption(host),
      demo: { kind: "browser", url: host, heading: t(guide.officialPortal.label, locale), target: null },
      duration: 0,
      chapter: 0,
    });
  }

  // 4. Demonstration — one scene per step, one chapter per step.
  guide.steps.forEach((s, i) => {
    const chapter = chapters.length;
    chapters.push({ index: chapter, title: `${l.step} ${i + 1}: ${t(s.title, locale)}`, stepId: s.id });
    const demo = resolveDemo(s.demo, locale);
    scenes.push({
      id: `step-${s.id}`,
      template: demo ? (demo.kind === "form" ? "form" : "browser") : "progress",
      heading: t(s.title, locale),
      caption: t(s.body, locale),
      stepNumber: i + 1,
      stepId: s.id,
      unconfirmed: s.check !== "official",
      demo,
      duration: 0,
      chapter,
    });
  });

  // 5–7. Warnings, next steps, summary + source.
  const finalChapter = chapters.length;
  chapters.push({ index: finalChapter, title: l.finalChapter });
  const warnings = guide.mistakes.filter((m) => m.check === "official").slice(0, 3).map((m) => t(m.text, locale));
  if (warnings.length) {
    scenes.push({ id: "warnings", template: "warning", heading: l.warnings, caption: warnings.join(" "), lines: warnings, duration: 0, chapter: finalChapter });
  }
  const next = (guide.whatNext ?? []).filter((n) => n.check === "official").map((n) => t(n.text, locale));
  if (next.length) {
    scenes.push({ id: "next", template: "progress", heading: l.next, caption: next.join(" "), lines: next, duration: 0, chapter: finalChapter });
  }
  scenes.push({ id: "summary", template: "summary", heading: l.summary, caption: l.end, lines: l.summaryLines, duration: 0, chapter: finalChapter });
  if (guide.lastChecked) {
    const officialSources = guide.sources.filter((s) => s.official).slice(0, 2);
    scenes.push({
      id: "source",
      template: "source",
      heading: `${l.source}: ${opts.checkedOnLabel ?? guide.lastChecked}`,
      caption: officialSources.map((s) => s.url.replace(/^https?:\/\//, "")).join(" · "),
      lines: officialSources.map((s) => s.title),
      duration: 0,
      chapter: finalChapter,
    });
  }

  let cursor = 0;
  const timed = scenes.map((s) => {
    const extra = s.lines ? s.lines.join(" ").length * 25 : 0;
    const duration = durationFor(s.caption) + Math.min(extra, 3000);
    const out = { ...s, duration, start: cursor };
    cursor += duration;
    return out;
  });

  return {
    slug: guide.slug,
    locale,
    title: titleText,
    scenes: timed,
    chapters: chapters.map((c) => ({ ...c, start: timed.find((s) => s.chapter === c.index)?.start ?? 0 })),
    totalMs: cursor,
  };
}

export function sceneAt(script: TutorialScript, ms: number) {
  let idx = script.scenes.findIndex((s) => ms < s.start + s.duration);
  if (idx === -1) idx = script.scenes.length - 1;
  const scene = script.scenes[idx];
  return { scene, index: idx, progress: Math.min(1, Math.max(0, (ms - scene.start) / scene.duration)) };
}

function vttTime(ms: number) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const x = Math.floor(ms % 1000);
  const p = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${p(h)}:${p(m)}:${p(s)}.${p(x, 3)}`;
}

/** WebVTT captions for a rendered tutorial, plus a chapters track. */
export function toVtt(script: TutorialScript): { captions: string; chapters: string } {
  const captions = ["WEBVTT", ""];
  script.scenes.forEach((s, i) => {
    captions.push(String(i + 1), `${vttTime(s.start)} --> ${vttTime(s.start + s.duration)}`, s.caption, "");
  });
  const chapters = ["WEBVTT", ""];
  script.chapters.forEach((c, i) => {
    const end = script.chapters[i + 1]?.start ?? script.totalMs;
    chapters.push(`${vttTime(c.start)} --> ${vttTime(end)}`, c.title, "");
  });
  return { captions: captions.join("\n"), chapters: chapters.join("\n") };
}

/** Plain transcript (narration script) for review and for screen readers. */
export function toTranscript(script: TutorialScript): string {
  return script.scenes.map((s) => (s.stepNumber ? `${s.stepNumber}. ${s.heading}\n${s.caption}` : `${s.heading}\n${s.caption}`)).join("\n\n");
}
