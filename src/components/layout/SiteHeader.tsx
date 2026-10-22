"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutGrid, Menu, MessageSquarePlus, Search, X } from "lucide-react";
import type { Locale } from "@/lib/content/types";
import { dict } from "@/lib/i18n";
import { Logo } from "./Logo";
import { TextSizeButton } from "./TextSizeButton";

export function SiteHeader({ locale }: { locale: Locale }) {
  const t = dict(locale);
  const pathname = usePathname() ?? `/${locale}`;
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const other: Locale = locale === "ne" ? "en" : "ne";
  const switchHref = pathname.replace(/^\/(ne|en)(?=\/|$)/, `/${other}`);
  const browse = locale === "ne" ? "सेवाहरू" : "Services";
  const searchLabel = locale === "ne" ? "खोज्नुहोस्" : "Search";
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
          <TextSizeButton locale={locale} />
          <Link href={switchHref} hrefLang={other} lang={other} className="btn-secondary ml-1 min-h-[44px] px-3 text-sm">
            {t.switchLang}
          </Link>
        </nav>

        <div className="flex items-center gap-1 sm:hidden">
          <Link href={`/${locale}/search`} className="btn-ghost" aria-label={searchLabel}>
            <Search className="h-6 w-6" aria-hidden="true" />
          </Link>
          <button
            type="button"
            className="btn-ghost"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? t.close : locale === "ne" ? "मेनु" : "Menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-menu" className="animate-pop origin-top border-t border-paper-line bg-white sm:hidden" aria-label={locale === "ne" ? "मोबाइल मेनु" : "Mobile menu"}>
          <ul className="container-page flex flex-col divide-y divide-paper-line py-1">
            <li><Link className="flex min-h-[52px] items-center gap-3 text-[1.05rem] font-medium" href={`/${locale}/guides`}><LayoutGrid className="h-5 w-5 text-ink-faint" aria-hidden="true" />{browse}</Link></li>
            <li><Link className="flex min-h-[52px] items-center gap-3 text-[1.05rem] font-medium" href={`/${locale}/request`}><MessageSquarePlus className="h-5 w-5 text-ink-faint" aria-hidden="true" />{t.requestGuide}</Link></li>
            <li className="flex items-center justify-between py-3">
              <TextSizeButton locale={locale} className="-ml-3" />
              <Link href={switchHref} hrefLang={other} lang={other} className="btn-secondary min-h-[44px] text-sm">{t.switchLang}</Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
