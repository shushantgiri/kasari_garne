import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Guide, Locale } from "@/lib/content/types";
import { dict, tr } from "@/lib/i18n";
import { ServiceIcon } from "@/components/ui/ServiceIcon";

/** One icon, one name, one action. Guides not yet published lead to the request form. */
export function ServiceCard({ guide, locale }: { guide: Guide; locale: Locale }) {
  const t = dict(locale);
  const available = guide.published && guide.status !== "archived";
  const href = available
    ? `/${locale}/guide/${guide.slug}`
    : `/${locale}/request?service=${encodeURIComponent(tr(guide.title, locale))}`;
  return (
    <Link
      href={href}
      className="panel lift group flex h-full items-center gap-4 p-4 focus-visible:border-sky sm:flex-col sm:items-start sm:p-5"
    >
      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${available ? "bg-brand-tint text-brand" : "bg-paper-warm text-ink-faint"}`}>
        <ServiceIcon name={guide.icon} className="h-6 w-6" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col sm:w-full">
        <span className="text-[1.05rem] font-bold leading-snug text-ink">{tr(guide.title, locale)}</span>
        {!available && <span className="text-xs text-ink-faint">{t.comingSoon}</span>}
        <span className={`mt-1 inline-flex items-center gap-1.5 text-sm font-semibold sm:mt-3 ${available ? "text-brand" : "text-ink-soft"}`}>
          {available ? t.viewGuide : t.requestThis}
          <ArrowRight className="h-4 w-4 transition-transform duration-200 ease-soft group-hover:translate-x-0.5" aria-hidden="true" />
        </span>
      </span>
    </Link>
  );
}
