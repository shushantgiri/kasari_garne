import type { Locale } from "@/lib/content/types";

/**
 * Section heading for a stage of a guide. Deliberately plain: the steps inside
 * "What to do" carry the numbers, so stages don't compete with a second numbering.
 */
export function StageTitle({ id, children }: { n?: number; id: string; locale?: Locale; children: React.ReactNode }) {
  return <h2 id={id} className="section-title">{children}</h2>;
}
