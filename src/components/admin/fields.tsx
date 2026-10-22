"use client";

/** Small form building blocks for the guide editor. */
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import type { FactCheck, Localized, Situation, Source } from "@/lib/content/types";

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-faint">{hint}</span>}
    </label>
  );
}

export function Text({ value, onChange, placeholder, mono }: { value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean }) {
  return <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={`input min-h-[42px] ${mono ? "font-mono text-sm" : ""}`} />;
}

export function Area({ value, onChange, rows = 2, lang }: { value: string; onChange: (v: string) => void; rows?: number; lang?: string }) {
  return <textarea value={value} rows={rows} lang={lang} onChange={(e) => onChange(e.target.value)} className="input py-2.5" />;
}

/** Nepali + English side by side. Nepali is required; English falls back to Nepali on the site. */
export function LocalizedInput({ label, value, onChange, multiline, hint }: { label: string; value: Localized | undefined; onChange: (v: Localized) => void; multiline?: boolean; hint?: string }) {
  const v = value ?? { ne: "", en: "" };
  return (
    <fieldset className="space-y-1">
      <legend className="label">{label}</legend>
      <div className="grid gap-2 md:grid-cols-2">
        <div>
          <span className="mb-1 block text-xs font-semibold text-ink-faint">नेपाली *</span>
          {multiline ? <Area lang="ne" value={v.ne} onChange={(ne) => onChange({ ...v, ne })} rows={3} /> : <Text value={v.ne} onChange={(ne) => onChange({ ...v, ne })} />}
        </div>
        <div>
          <span className="mb-1 block text-xs font-semibold text-ink-faint">English</span>
          {multiline ? <Area value={v.en ?? ""} onChange={(en) => onChange({ ...v, en })} rows={3} /> : <Text value={v.en ?? ""} onChange={(en) => onChange({ ...v, en })} />}
        </div>
      </div>
      {hint && <p className="text-xs text-ink-faint">{hint}</p>}
    </fieldset>
  );
}

export function CheckSelect({ value, onChange }: { value: FactCheck; onChange: (v: FactCheck) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as FactCheck)} className={`input min-h-[38px] w-auto py-1 text-sm ${value === "official" ? "text-ok" : "text-warn"}`}>
      <option value="official">✓ Confirmed on an official page</option>
      <option value="needs_review">? Needs review (hidden or labelled on the site)</option>
    </select>
  );
}

export function SourcePicker({ sources, value, onChange }: { sources: Source[]; value: string[] | undefined; onChange: (v: string[]) => void }) {
  const sel = new Set(value ?? []);
  if (!sources.length) return <p className="text-xs text-ink-faint">Add sources in the “Review & publish” tab first.</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {sources.map((s) => (
        <label key={s.id} className={`cursor-pointer rounded-full border px-2.5 py-1 text-xs ${sel.has(s.id) ? "border-sky bg-sky-tint text-sky" : "border-paper-line text-ink-soft"}`} title={s.title}>
          <input
            type="checkbox"
            className="sr-only"
            checked={sel.has(s.id)}
            onChange={() => {
              const n = new Set(sel);
              if (n.has(s.id)) n.delete(s.id);
              else n.add(s.id);
              onChange([...n]);
            }}
          />
          {s.official ? "🏛 " : ""}{s.id}
        </label>
      ))}
    </div>
  );
}

/** Which purposes (new, renew…) an item applies to. Nothing selected = all purposes. */
export function PurposePicker({ situations, value, onChange }: { situations: Situation[]; value: string[] | undefined; onChange: (v: string[] | undefined) => void }) {
  if (!situations.length) return null;
  const sel = new Set(value ?? []);
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-xs font-semibold text-ink-soft">Applies to:</span>
      <span className={`rounded-full border px-2.5 py-1 text-xs ${sel.size === 0 ? "border-sky bg-sky-tint text-sky" : "border-paper-line text-ink-faint"}`}>All purposes</span>
      {situations.map((s) => (
        <label key={s.id} className={`cursor-pointer rounded-full border px-2.5 py-1 text-xs ${sel.has(s.id) ? "border-sky bg-sky-tint text-sky" : "border-paper-line text-ink-soft"}`}>
          <input
            type="checkbox"
            className="sr-only"
            checked={sel.has(s.id)}
            onChange={() => {
              const n = new Set(sel);
              if (n.has(s.id)) n.delete(s.id);
              else n.add(s.id);
              onChange(n.size ? [...n] : undefined);
            }}
          />
          {s.label.en || s.label.ne || s.id}
        </label>
      ))}
    </div>
  );
}

/** Generic list editor with add / remove / reorder. */
export function ListEditor<T>({
  items,
  onChange,
  make,
  render,
  addLabel,
  itemLabel,
}: {
  items: T[];
  onChange: (v: T[]) => void;
  make: () => T;
  render: (item: T, set: (v: T) => void, i: number) => React.ReactNode;
  addLabel: string;
  itemLabel: (i: number) => string;
}) {
  const move = (i: number, d: number) => {
    const n = [...items];
    const [x] = n.splice(i, 1);
    n.splice(i + d, 0, x);
    onChange(n);
  };
  return (
    <div className="space-y-3">
      {items.map((it, i) => (
        <div key={i} className="rounded-xl border border-paper-line bg-white p-3 sm:p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-ink-faint">{itemLabel(i)}</span>
            <span className="flex gap-1">
              <IconBtn label="Move up" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="h-4 w-4" /></IconBtn>
              <IconBtn label="Move down" disabled={i === items.length - 1} onClick={() => move(i, 1)}><ArrowDown className="h-4 w-4" /></IconBtn>
              <IconBtn label="Remove" onClick={() => confirm("Remove this item?") && onChange(items.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4 text-brand" /></IconBtn>
            </span>
          </div>
          {render(it, (v) => onChange(items.map((x, j) => (j === i ? v : x))), i)}
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, make()])} className="btn-secondary min-h-[40px] text-sm">
        <Plus className="h-4 w-4" /> {addLabel}
      </button>
    </div>
  );
}

function IconBtn({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} disabled={disabled} onClick={onClick} className="grid h-8 w-8 place-items-center rounded-lg hover:bg-paper-warm disabled:opacity-30">
      {children}
    </button>
  );
}
