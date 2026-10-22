/**
 * Content model for Kasari Garne.
 *
 * Every user-facing string is Localized (Nepali first, English optional).
 * Every procedural fact can point at a source and carry its own
 * verification flag, so a guide can be honest about which parts were
 * checked against an official page and which still need review.
 */

export type Locale = "ne" | "en";
export const LOCALES: Locale[] = ["ne", "en"];

export interface Localized {
  ne: string;
  /** Optional: falls back to Nepali when missing. */
  en?: string;
}

export type GuideStatus = "draft" | "under_review" | "verified" | "needs_update" | "archived";

/** How much of the process can be done online. */
export type ProcessMode = "online" | "partly_online" | "in_person" | "awaiting_verification";

/** How sure we are about one fact. */
export type FactCheck =
  /** Read on an official government page (sourceId points at it). */
  | "official"
  /** Seen only in non-official sources; must be confirmed before publishing as fact. */
  | "needs_review";

export interface Source {
  id: string;
  title: string;
  url: string;
  /** true for *.gov.np pages and Nepali missions abroad. */
  official: boolean;
  /** ISO date the page was last read. */
  checkedOn: string;
}

export interface Fact {
  text: Localized;
  check: FactCheck;
  sourceIds?: string[];
  /** Short extra hint shown under the item. */
  note?: Localized;
}

export interface DocumentItem extends Fact {
  /** "always" or a condition such as "if you already have a passport". */
  when?: Localized;
  /** Situation ids this item applies to. Omitted = every situation. */
  for?: string[];
}

/**
 * One purpose a visitor can pick at the top of a guide, e.g. "Renew my passport".
 * Only add situations the official sources actually describe.
 */
export interface Situation {
  id: string;
  label: Localized;
  /** One line for "Help me choose". */
  hint?: Localized;
  check: FactCheck;
  sourceIds?: string[];
  /**
   * A purpose people need but whose process isn't verified yet. It is offered as a choice
   * (so visitors recognise their situation) and leads to an honest "not ready" message, never to steps.
   */
  pending?: boolean;
}

export interface Fee {
  label: Localized;
  /** null when the amount could not be verified — UI shows "check official site". */
  amount: Localized | null;
  check: FactCheck;
  sourceIds?: string[];
}

export interface GuideStep {
  id: string;
  title: Localized;
  body: Localized;
  check: FactCheck;
  sourceIds?: string[];
  /** What the demo screen in the tutorial should highlight. */
  demo?: DemoScreen;
  /** Where this step starts in an uploaded MP4 (seconds). */
  videoAt?: number;
  /** "यो बुझिनँ" help: a simpler wording and a worked example with fictional data. */
  help?: { simpler: Localized; example?: Localized };
  /** A warning tied to this specific step. */
  warning?: Localized;
  /** Situation ids this step applies to. Omitted = every situation. */
  for?: string[];
  /** Situation-specific wording of `body`, keyed by situation id. Same sources as the step. */
  bodyFor?: Record<string, Localized>;
}

/** Description of a simplified, clearly-labelled demo screen. */
export interface DemoScreen {
  kind: "browser" | "form" | "list" | "message";
  /** Index of the field the cursor targets (form screens); defaults to the button. */
  focusField?: number;
  /** Address bar text, e.g. the official portal's domain. */
  url?: string;
  heading?: Localized;
  fields?: { label: Localized; sample?: string }[];
  /** Label of the button the cursor should click. */
  button?: Localized;
  /** Bullet items for "list" screens. */
  items?: Localized[];
}

export interface FAQ {
  q: Localized;
  a: Localized;
  check: FactCheck;
  sourceIds?: string[];
}

export interface VideoAsset {
  /** "uploaded" = MP4 file; "generated" = rendered from guide data; "live" = animated in the browser from guide data. */
  kind: "uploaded" | "generated" | "live";
  src?: string;
  /** Smaller rendition for slow connections. */
  lowSrc?: string;
  poster?: string;
  /** WebVTT caption files per language. */
  subtitles?: Partial<Record<Locale, string>>;
  /** Recorded human narration (optional) for generated videos. */
  narrationAudio?: Partial<Record<Locale, string>>;
  durationSec?: number;
  /** Chapter markers for uploaded MP4s; generated tutorials derive them from steps. */
  chapters?: { at: number; title: Localized; stepId?: string }[];
  /** An MP4 is shown to the public only after an admin approves it. */
  review?: "pending" | "approved" | "rejected";
  approvedBy?: string;
  approvedOn?: string;
}

export interface Department {
  id: string;
  name: Localized;
  short: Localized;
  url: string;
}

export interface Guide {
  slug: string;
  icon: IconName;
  departmentId: string;
  status: GuideStatus;
  published: boolean;
  popular?: boolean;

  title: Localized;
  /** The question form: "Driving Licence कसरी भर्ने?" */
  question: Localized;
  intro: Localized;
  /** One line shown on cards. */
  summary: Localized;
  category: CategoryId;
  mode: ProcessMode;
  /** Whether an office visit is needed, and why. */
  visit?: Fact;
  /** What happens after submitting. */
  whatNext?: Fact[];
  /** Shown only when verified; otherwise omitted. */
  estimatedTime?: Fact;

  officialPortal?: { label: Localized; url: string; sourceIds?: string[] };
  statusCheck?: { label: Localized; url: string; sourceIds?: string[] };

  /** Optional purposes to choose from (new, renew, replace…). Empty or missing = one process. */
  situations?: Situation[];
  /** Short note for purposes the guide does not cover yet, e.g. "Renewing? Not covered yet." */
  situationsGap?: Localized;

  eligibility: Fact[];
  documents: DocumentItem[];
  fees: Fee[];
  steps: GuideStep[];
  mistakes: Fact[];
  faqs: FAQ[];

  sources: Source[];
  /** ISO date of the latest source check. */
  lastChecked: string;
  /** Who did the check (shown in admin only). */
  checkedBy?: string;
  /** Reviewer assigned to the next check. */
  reviewer?: string;
  /** ISO date by which the guide should be re-checked. */
  recheckBy?: string;
  /** Plain words in admin about what still needs confirming. */
  reviewNotes?: string;

  video: VideoAsset;
  /** Search aliases: informal spellings, Romanized Nepali, English. */
  keywords: string[];
  related: string[];
  updatedAt: string;
  views?: number;
}

export type CategoryId = "identity" | "transport" | "tax" | "police" | "education" | "civic";

export interface Category {
  id: CategoryId;
  icon: IconName;
  name: Localized;
}

export type IconName =
  | "car"
  | "passport"
  | "idcard"
  | "receipt"
  | "shield"
  | "vote"
  | "baby"
  | "landmark"
  | "briefcase"
  | "graduation";
