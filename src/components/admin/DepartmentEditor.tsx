"use client";

import { useState, useTransition } from "react";
import type { Department } from "@/lib/content/types";
import { saveDepartment } from "@/app/(admin)/admin/actions";
import { LocalizedInput, Field, Text } from "./fields";

export function DepartmentEditor({ departments }: { departments: Department[] }) {
  const [list, setList] = useState(departments);
  const [msg, setMsg] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const update = (i: number, d: Department) => setList((l) => l.map((x, j) => (j === i ? d : x)));
  return (
    <div className="space-y-3">
      {list.map((d, i) => (
        <div key={i} className="card space-y-3 p-4">
          <div className="grid gap-3 md:grid-cols-[160px_1fr]">
            <Field label="Id"><Text mono value={d.id} onChange={(id) => update(i, { ...d, id })} /></Field>
            <Field label="Official website"><Text mono value={d.url} onChange={(url) => update(i, { ...d, url })} /></Field>
          </div>
          <LocalizedInput label="Full name" value={d.name} onChange={(name) => update(i, { ...d, name })} />
          <LocalizedInput label="Short name" value={d.short} onChange={(short) => update(i, { ...d, short })} />
          <div className="flex items-center gap-3">
            <button type="button" disabled={pending} className="btn-primary min-h-[40px] text-sm" onClick={() => start(async () => { const r = await saveDepartment(d); setMsg((m) => ({ ...m, [i]: r.ok ? r.message ?? "Saved" : r.errors.join(" ") })); })}>Save</button>
            {msg[i] && <span className="text-sm text-ink-soft" role="status">{msg[i]}</span>}
          </div>
        </div>
      ))}
      <button type="button" className="btn-secondary min-h-[40px] text-sm" onClick={() => setList((l) => [...l, { id: "", name: { ne: "", en: "" }, short: { ne: "", en: "" }, url: "https://" }])}>Add department</button>
    </div>
  );
}
