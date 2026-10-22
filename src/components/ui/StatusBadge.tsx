import { CircleCheck, CircleDashed, Clock, TriangleAlert, Archive } from "lucide-react";
import type { GuideStatus, Locale } from "@/lib/content/types";
import { dict } from "@/lib/i18n";

const STYLE: Record<GuideStatus, { cls: string; Icon: typeof Clock }> = {
  verified: { cls: "bg-ok-tint text-ok", Icon: CircleCheck },
  under_review: { cls: "bg-sky-tint text-sky", Icon: Clock },
  needs_update: { cls: "bg-warn-tint text-warn", Icon: TriangleAlert },
  draft: { cls: "bg-paper-warm text-ink-soft", Icon: CircleDashed },
  archived: { cls: "bg-paper-warm text-ink-faint", Icon: Archive },
};

export function StatusBadge({ status, locale }: { status: GuideStatus; locale: Locale }) {
  const { cls, Icon } = STYLE[status];
  return (
    <span className={`chip ${cls}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {dict(locale).status[status]}
    </span>
  );
}
