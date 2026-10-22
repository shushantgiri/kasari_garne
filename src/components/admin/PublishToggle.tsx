"use client";

import { useState, useTransition } from "react";
import { setPublished } from "@/app/(admin)/admin/actions";

/**
 * Publish / unpublish from the list. Reports only what the server confirmed;
 * validation errors (e.g. "Move the guide out of Draft") are shown as they come back.
 */
export function PublishToggle({ slug, published, disabled }: { slug: string; published: boolean; disabled?: boolean }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const label = published ? "Unpublish" : "Publish";
  return (
    <span className="inline-flex flex-col items-end">
      <button
        type="button"
        disabled={pending || disabled}
        title={disabled ? "Drafts can't be published. Move the guide to Under review first." : undefined}
        onClick={() =>
          start(async () => {
            if (published && !confirm("Unpublish this guide? Visitors will no longer see it.")) return;
            setMsg(null);
            const r = await setPublished(slug, !published).catch(() => ({ ok: false as const, errors: ["Couldn't reach the server. Try again."] }));
            setMsg(r.ok ? { ok: true, text: published ? "Unpublished" : "Published" } : { ok: false, text: r.errors.join(" ") });
          })
        }
        className={`btn min-h-[34px] rounded-lg px-2.5 text-sm ${published ? "text-ink-soft hover:bg-paper-warm" : "border border-paper-line bg-white text-ink hover:border-ink-faint"}`}
      >
        {pending ? (published ? "Unpublishing…" : "Publishing…") : label}
      </button>
      {msg && <span role="status" className={`mt-0.5 max-w-[14rem] text-right text-xs ${msg.ok ? "text-ok" : "text-brand-dark"}`}>{msg.text}</span>}
    </span>
  );
}
