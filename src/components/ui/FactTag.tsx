import { CircleHelp } from "lucide-react";
import type { FactCheck, Locale } from "@/lib/content/types";
import { dict } from "@/lib/i18n";

/** Small label shown next to anything not yet confirmed on an official page. */
export function FactTag({ check, locale }: { check: FactCheck; locale: Locale }) {
  if (check === "official") return null;
  const t = dict(locale);
  return (
    <span className="chip bg-warn-tint text-warn" title={t.needsReviewHint}>
      <CircleHelp className="h-3.5 w-3.5" aria-hidden="true" />
      {t.needsReview}
    </span>
  );
}
