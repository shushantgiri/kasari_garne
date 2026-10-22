"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BadgeCheck, Building2, ExternalLink, FileText, Flag, LayoutDashboard, Link2, LogOut, Menu, MessageSquarePlus, ThumbsUp, Video, X,
  type LucideIcon,
} from "lucide-react";
import { signOut } from "@/app/(admin)/admin/actions";
import type { AttentionCounts } from "@/lib/admin/attention";

interface Item { href: string; label: string; Icon: LucideIcon; badge?: number | null; badgeLabel?: string }

/** Small, quiet count. Hidden at zero; "9+" above nine. Visual only: no sound, no motion. */
function Badge({ n, label }: { n?: number | null; label?: string }) {
  if (!n) return null;
  return (
    <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-tint px-1.5 text-[11px] font-bold tabular-nums text-brand-dark" aria-label={`${n} ${label ?? ""}`.trim()}>
      {n > 9 ? "9+" : n}
    </span>
  );
}

export function AdminNav({ counts }: { counts: AttentionCounts | null }) {
  const path = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  if (path === "/admin/login") return null;

  const groups: { title: string; items: Item[] }[] = [
    { title: "Overview", items: [{ href: "/admin", label: "Dashboard", Icon: LayoutDashboard }] },
    {
      title: "Content",
      items: [
        { href: "/admin/guides", label: "Guides", Icon: FileText, badge: counts?.review, badgeLabel: "awaiting review" },
        { href: "/admin/verification", label: "Verification", Icon: BadgeCheck, badge: counts?.overdue, badgeLabel: "overdue" },
        { href: "/admin/videos", label: "Videos", Icon: Video, badge: counts?.videos, badgeLabel: "awaiting approval" },
        { href: "/admin/sources", label: "Official sources", Icon: Link2, badge: counts?.sources, badgeLabel: "guides with source problems" },
        { href: "/admin/departments", label: "Departments", Icon: Building2 },
      ],
    },
    {
      title: "Visitors",
      items: [
        { href: "/admin/reports", label: "Correction reports", Icon: Flag, badge: counts?.reports, badgeLabel: "new" },
        { href: "/admin/requests", label: "Guide requests", Icon: MessageSquarePlus, badge: counts?.requests, badgeLabel: "new" },
        { href: "/admin/feedback", label: "Ratings", Icon: ThumbsUp },
      ],
    },
  ];
  const isActive = (href: string) => (href === "/admin" ? path === href : path.startsWith(href));
  const current = groups.flatMap((g) => g.items).find((i) => isActive(i.href));
  const totalBadges = (counts?.review ?? 0) + (counts?.overdue ?? 0) + (counts?.reports ?? 0);
  const row = "flex min-h-[40px] items-center gap-2.5 rounded-lg px-3 text-sm transition-colors duration-150";

  const nav = (
    <nav aria-label="Admin" className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 pb-4">
      {groups.map((g) => (
        <div key={g.title}>
          <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">{g.title}</p>
          <ul className="space-y-0.5">
            {g.items.map(({ href, label, Icon, badge, badgeLabel }) => {
              const active = isActive(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`${row} relative ${active ? "bg-brand-tint/70 font-semibold text-brand-dark before:absolute before:inset-y-2 before:-left-3 before:w-[3px] before:rounded-r before:bg-brand" : "text-ink-soft hover:bg-paper-warm hover:text-ink"}`}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{label}</span>
                    <Badge n={badge} label={badgeLabel} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <div className="mt-auto space-y-0.5 border-t border-paper-line pt-3">
        <a href="/ne" className={`${row} text-ink-soft hover:bg-paper-warm hover:text-ink`} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="h-4 w-4" aria-hidden="true" /> View site
        </a>
        <form action={signOut}>
          <button className={`${row} w-full text-ink-soft hover:bg-paper-warm hover:text-ink`}>
            <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
          </button>
        </form>
      </div>
    </nav>
  );

  const brand = (
    <Link href="/admin" className="flex items-center gap-2">
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand text-xs font-bold text-white" aria-hidden="true">?</span>
      <span className="font-bold" lang="ne">कसरी गर्ने?</span>
      <span className="text-sm text-ink-faint">Admin</span>
    </Link>
  );

  return (
    <>
      {/* Phones and tablets: compact top bar with the current page, menu opens a drawer. */}
      <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-paper-line bg-white px-4 py-2.5 md:hidden">
        {brand}
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-controls="admin-drawer"
          className="relative inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-paper-line px-3 text-sm font-medium"
        >
          <Menu className="h-4 w-4" aria-hidden="true" />
          {current?.label ?? "Menu"}
          {totalBadges > 0 && <span className="h-2 w-2 rounded-full bg-brand" aria-label="Items need attention" />}
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
          <button type="button" className="absolute inset-0 animate-fade bg-ink/30" aria-label="Close menu" onClick={() => setOpen(false)} />
          <aside id="admin-drawer" className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] animate-step-back flex-col bg-white shadow-pop">
            <div className="flex items-center justify-between px-4 py-3">
              {brand}
              <button type="button" onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-lg hover:bg-paper-warm" aria-label="Close menu">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      )}

      {/* Desktop: fixed sidebar. */}
      <aside className="hidden border-r border-paper-line bg-white md:sticky md:top-0 md:flex md:h-screen md:w-60 md:shrink-0 md:flex-col">
        <div className="px-6 py-5">{brand}</div>
        {nav}
      </aside>
    </>
  );
}
