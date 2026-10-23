"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FilePen, Home, ImageUp, LayoutGrid, Search } from "lucide-react";
import type { Locale } from "@/lib/content/types";

/**
 * App-style tab bar fixed to the bottom of the screen on phones: the five places people go most.
 * The current one is red with a small pill behind its icon. Hidden on wider screens, where the
 * header carries the same links. It leaves room for the phone's home bar (safe-area inset).
 */
export function MobileTabBar({ locale }: { locale: Locale }) {
  const ne = locale === "ne";
  const pathname = usePathname() ?? `/${locale}`;
  const tabs = [
    { href: `/${locale}`, label: ne ? "गृहपृष्ठ" : "Home", Icon: Home, active: pathname === `/${locale}` },
    { href: `/${locale}/guides`, label: ne ? "सेवाहरू" : "Services", Icon: LayoutGrid, active: /\/(guides|guide)\b/.test(pathname) },
    { href: `/${locale}/tools/letters`, label: ne ? "निवेदन" : "Application", Icon: FilePen, active: pathname.startsWith(`/${locale}/tools/letters`) },
    { href: `/${locale}/tools/photo`, label: ne ? "फोटो" : "Photo", Icon: ImageUp, active: pathname.startsWith(`/${locale}/tools/photo`) },
    { href: `/${locale}/search`, label: ne ? "खोज" : "Search", Icon: Search, active: pathname.startsWith(`/${locale}/search`) },
  ];

  return (
    <nav
      aria-label={ne ? "मुख्य मेनु" : "Main menu"}
      className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-paper-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-[backdrop-filter]:bg-white/85 sm:hidden"
    >
      <ul className="mx-auto flex max-w-md">
        {tabs.map(({ href, label, Icon, active }) => (
          <li key={href} className="flex-1">
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex h-16 flex-col items-center justify-center gap-0.5 text-[0.7rem] font-semibold transition-colors ${active ? "text-brand" : "text-ink-faint active:text-ink"}`}
            >
              <span className={`grid h-7 w-12 place-items-center rounded-full transition-colors duration-200 ${active ? "bg-brand-tint" : ""}`}>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
