"use client";

import { useTransition } from "react";
import { flagForUpdate } from "@/app/(admin)/admin/actions";

/** One click to warn visitors when a portal has changed. */
export function FlagButton({ slug, label = "Flag" }: { slug: string; label?: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className="w-full text-left font-medium text-warn"
      onClick={() =>
        start(async () => {
          if (!confirm("Mark this guide as 'Needs update'? Visitors will see a warning until it is re-checked.")) return;
          const r = await flagForUpdate(slug);
          alert(r.ok ? r.message : r.errors.join("\n"));
        })
      }
    >
      {pending ? "Flagging…" : label}
    </button>
  );
}
