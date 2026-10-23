import type { Locale } from "@/lib/content/types";
import { digits } from "@/lib/i18n";

/**
 * Section heading for a stage of a guide. Stages get a square number badge;
 * the steps inside carry round numbers, so the two never look alike.
 */
export function StageTitle({ n, id, locale = "ne", children }: { n?: number; id: string; locale?: Locale; children: React.ReactNode }) {
  return (
    <h2 id={id} className="section-title flex items-center gap-3">
      {n != null && (
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink text-[0.95rem] font-bold text-white" aria-hidden="true">
          {digits(n, locale)}
        </span>
      )}
      <span className="min-w-0">{children}</span>
    </h2>
  );
}
