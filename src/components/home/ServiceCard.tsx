import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Guide, Locale } from "@/lib/content/types";
import { dict, tr } from "@/lib/i18n";
import { ServiceIcon } from "@/components/ui/ServiceIcon";

/**
 * One service as a short row card: icon, name, and whether the guide is ready. Guides not yet published
 * are quieter and lead to the request form.
 */
export function ServiceCard({ guide, locale }: { guide: Guide; locale: Locale }) {
  const t = dict(locale);
  const ne = locale === "ne";
  const available = guide.published && guide.status !== "archived";
  const href = available
    ? `/${locale}/guide/${guide.slug}`
    : `/${locale}/request?service=${encodeURIComponent(tr(guide.title, locale))}`;
  return (
    <Link
      href={href}
      className={`group flex h-full items-center gap-3.5 rounded-2xl p-3.5 ring-1 transition-[box-shadow,transform,background-color] duration-300 ease-soft active:scale-[.99] sm:p-4 ${
        available
          ? "bg-white shadow-[0_1px_2px_rgba(27,34,48,.04),0_8px_24px_-18px_rgba(27,34,48,.3)] ring-paper-line hover:-translate-y-0.5 hover:shadow-[0_16px_34px_-22px_rgba(27,34,48,.45)]"
          : "bg-paper-warm/60 ring-paper-line/70 hover:bg-white"
      }`}
    >
      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${available ? "bg-[#F6E5E2] text-[#9E3326]" : "bg-white text-ink-faint ring-1 ring-paper-line"}`}>
        <ServiceIcon name={guide.icon} className="h-6 w-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block font-bold leading-snug ${available ? "text-ink" : "text-ink-soft"}`}>{tr(guide.title, locale)}</span>
        {available ? (
          <span className="mt-1 inline-flex items-center gap-1.5 text-[0.8rem] font-semibold text-ok">
            <span className="h-1.5 w-1.5 rounded-full bg-ok" />
            {ne ? "पूरा निर्देशिका तयार" : "Full guide ready"}
          </span>
        ) : (
          <span className="mt-1 block text-[0.8rem] text-ink-faint">
            {t.comingSoon} · <span className="font-semibold text-ink-soft">{t.requestThis}</span>
          </span>
        )}
      </span>
      <ChevronRight className={`h-5 w-5 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 ${available ? "text-ink-soft" : "text-ink-faint"}`} aria-hidden="true" />
    </Link>
  );
}
