"use client";

import { useState, useTransition } from "react";
import { setReportState, setRequestState, flagForUpdate } from "@/app/(admin)/admin/actions";

export function ReportRow({ id, state, note, guide }: { id: string; state: string; note: string | null; guide: string | null }) {
  const [s, setS] = useState(state);
  const [n, setN] = useState(note ?? "");
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <select value={s} onChange={(e) => setS(e.target.value)} className="input min-h-[38px] w-auto py-1 text-sm" aria-label="Report state">
        <option value="new">New</option>
        <option value="in_progress">In progress</option>
        <option value="resolved">Resolved</option>
        <option value="rejected">Rejected</option>
      </select>
      <input value={n} onChange={(e) => setN(e.target.value)} placeholder="Note (what was changed)" className="input min-h-[38px] min-w-0 flex-1 text-sm" aria-label="Admin note" />
      <button type="button" disabled={pending} className="btn-primary min-h-[38px] text-sm" onClick={() => start(async () => { const r = await setReportState(id, s, n); setMsg(r.ok ? "Saved" : r.errors.join(" ")); })}>Save</button>
      {guide && (
        <button type="button" disabled={pending} className="btn-secondary min-h-[38px] text-sm" onClick={() => start(async () => { const r = await flagForUpdate(guide); setMsg(r.ok ? r.message ?? "" : r.errors.join(" ")); })}>Flag guide “Needs update”</button>
      )}
      {msg && <span className="text-sm text-ink-soft" role="status">{msg}</span>}
    </div>
  );
}

export function RequestRow({ id, state }: { id: string; state: string }) {
  const [pending, start] = useTransition();
  const [s, setS] = useState(state);
  return (
    <select
      value={s}
      disabled={pending}
      aria-label="Request state"
      onChange={(e) => {
        const v = e.target.value;
        setS(v);
        start(async () => { await setRequestState(id, v); });
      }}
      className="input min-h-[38px] w-auto py-1 text-sm"
    >
      <option value="new">New</option>
      <option value="planned">Planned</option>
      <option value="done">Done</option>
      <option value="rejected">Rejected</option>
    </select>
  );
}
