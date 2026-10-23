"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FilePen, ImageUp, LayoutGrid, Search } from "lucide-react";
import type { Locale } from "@/lib/content/types";
import { dict } from "@/lib/i18n";
import { Logo } from "./Logo";
import { TextSizeButton } from "./TextSizeButton";

export function SiteHeader({ locale }: { locale: Locale }) {
  const t = dict(locale);
  const pathname = usePathname() ?? `/${locale}`;

  const other: Locale = locale === "ne" ? "en" : "ne";
  const switchHref = pathname.replace(/^\/(ne|en)(?=\/|$)/, `/${other}`);
  const browse = locale === "ne" ? "सेवाहरू" : "Services";
  const searchLabel = locale === "ne" ? "खोज्नुहोस्" : "Search";
  const photoLabel = locale === "ne" ? "फोटो साइज" : "Photo size";
  const lettersLabel = locale === "ne" ? "निवेदन" : "Application";
  const isActive = (seg: string) => pathname.startsWith(`/${locale}/${seg}`);
  const navCls = (seg: string) => `btn-ghost ${isActive(seg) ? "bg-paper-warm text-ink" : ""}`;

  return (
    <header className="sticky top-0 z-40 border-b border-paper-line bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-card">
        {t.skip}
      </a>
      <div className="container-page flex h-16 items-center justify-between gap-3">
        <Link href={`/${locale}`} aria-label={t.home}>
          <Logo locale={locale} />
        </Link>

        <nav aria-label={locale === "ne" ? "मुख्य मेनु" : "Main menu"} className="hidden items-center gap-1 sm:flex">
          <Link href={`/${locale}/search`} className={navCls("search")} aria-current={isActive("search") ? "page" : undefined}>
            <Search className="h-5 w-5" aria-hidden="true" />
            {searchLabel}
          </Link>
          <Link href={`/${locale}/guides`} className={navCls("guides")} aria-current={isActive("guides") ? "page" : undefined}>
            <LayoutGrid className="h-5 w-5" aria-hidden="true" />
            {browse}
          </Link>
          <Link href={`/${locale}/tools/letters`} className={navCls("tools/letters")} aria-current={isActive("tools/letters") ? "page" : undefined}>
            <FilePen className="h-5 w-5" aria-hidden="true" />
            {lettersLabel}
          </Link>
          <Link href={`/${locale}/tools/photo`} className={navCls("tools/photo")} aria-current={isActive("tools/photo") ? "page" : undefined}>
            <ImageUp className="h-5 w-5" aria-hidden="true" />
            {photoLabel}
          </Link>
          <TextSizeButton locale={locale} />
          <Link href={switchHref} hrefLang={other} lang={other} className="btn-secondary ml-1 min-h-[44px] px-3 text-sm">
            {t.switchLang}
          </Link>
        </nav>

        {/* Phones: just the language switch; the bottom tab bar holds the rest. */}
        <Link href={switchHref} hrefLang={other} lang={other} className="btn-secondary min-h-[40px] px-3 text-sm sm:hidden">
          {t.switchLang}
        </Link>
      </div>
    </header>
  );
}
