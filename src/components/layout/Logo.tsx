import type { Locale } from "@/lib/content/types";

export function Logo({ locale }: { locale: Locale }) {
  return (
    <span className="flex items-center gap-2.5">
      <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true" className="shrink-0">
        <rect width="34" height="34" rx="10" fill="#B4232C" />
        <path d="M11 12.5a6 6 0 1 1 8.4 5.5c-1.5.7-2.4 1.6-2.4 3.2v.8" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="17" cy="26" r="1.8" fill="#fff" />
      </svg>
      <span className="leading-tight">
        <span className="block text-[1.05rem] font-bold text-ink" lang="ne">कसरी गर्ने?</span>
        <span className="latin block text-[0.68rem] font-medium uppercase tracking-[0.08em] text-ink-faint">
          {locale === "ne" ? "Kasari Garne" : "Government services, simply"}
        </span>
      </span>
    </span>
  );
}
