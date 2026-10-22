import type { Locale } from "../content/types";
import { tr } from "../i18n";
import { detectPurpose } from "./search";
import type { GuideTeaser } from "./teaser";

/** Where a guide link should go, with the purpose already chosen when the words name one. */
export function guideHref(locale: Locale, g: Pick<GuideTeaser, "slug" | "published" | "title" | "situations">, q: string): string {
  if (!g.published) return `/${locale}/request?service=${encodeURIComponent(tr(g.title, locale))}`;
  const p = detectPurpose(q, g.situations?.map((x) => x.id));
  return `/${locale}/guide/${g.slug}${p.id ? `?for=${p.id}` : ""}`;
}
