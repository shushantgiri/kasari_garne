/** Shared building blocks so every admin screen uses the same title, empty state and status labels. */
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { Guide } from "@/lib/content/types";

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-ink-soft">{subtitle}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: { href: string; label: string } }) {
  return (
    <div className="rounded-2xl border border-dashed border-paper-line bg-white px-6 py-10 text-center">
      <p className="font-semibold">{title}</p>
      {hint && <p className="mt-1 text-sm text-ink-soft">{hint}</p>}
      {action && <Link href={action.href} className="btn-secondary mt-4 min-h-[40px] text-sm">{action.label}</Link>}
    </div>
  );
}

export function StatCard({ label, value, Icon, href, tone = "default" }: { label: string; value: number | string; Icon: LucideIcon; href?: string; tone?: "default" | "attention" }) {
  const body = (
    <>
      <span className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-ink-soft">{label}</span>
        <Icon className={`h-4 w-4 ${tone === "attention" ? "text-warn" : "text-ink-faint"}`} aria-hidden="true" />
      </span>
      <span className="mt-2 block text-2xl font-bold tabular-nums">{value}</span>
    </>
  );
  const cls = `card block p-4 ${tone === "attention" && value ? "border-warn/30" : ""}`;
  return href ? <Link href={href} className={`${cls} hover:border-ink-faint/50`}>{body}</Link> : <div className={cls}>{body}</div>;
}

/** Publication is shown separately from verification: a published guide is not automatically verified. */
export function PublishBadge({ g }: { g: Guide }) {
  if (g.published) return <span className="chip bg-ok-tint text-ok">Published</span>;
  if (g.status === "draft") return <span className="chip bg-paper-warm text-ink-soft">Coming soon</span>;
  return <span className="chip bg-paper-warm text-ink-soft">Hidden</span>;
}

/** A recorded video only counts as live after a reviewer approves it. */
export function VideoBadge({ g }: { g: Guide }) {
  if (!g.video.src) return <span className="text-sm text-ink-faint">Animation</span>;
  const r = g.video.review ?? "pending";
  const cls = r === "approved" ? "bg-ok-tint text-ok" : r === "rejected" ? "bg-brand-tint text-brand-dark" : "bg-warn-tint text-warn";
  const label = r === "approved" ? "MP4 approved" : r === "rejected" ? "MP4 rejected" : "MP4 pending review";
  return <span className={`chip ${cls}`}>{label}</span>;
}

export function DemoNotice({ what }: { what: string }) {
  return <EmptyState title={`${what} appear here once Supabase is connected`} hint="Demo mode shows bundled content only." />;
}
