"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { AlertTriangle, ArrowLeft, CheckCircle2, Download, Eye, Save, Upload } from "lucide-react";
import type { Department, DemoScreen, DocumentItem, Fact, FAQ, Fee, Guide, GuideStep, IconName, Locale, Situation, Source } from "@/lib/content/types";
import { categories } from "@/lib/content/categories";
import { validateGuide, unconfirmedFacts } from "@/lib/admin/validate";
import { buildTutorial, toTranscript, toVtt } from "@/lib/video/script";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { saveGuide, decideVideo, type AdminResult } from "@/app/(admin)/admin/actions";
import { TutorialPlayer } from "@/components/video/TutorialPlayer";
import { Area, CheckSelect, Field, ListEditor, LocalizedInput, PurposePicker, SourcePicker, Text } from "./fields";

const TABS = ["Basic info", "Requirements", "Steps", "FAQ & mistakes", "Video", "Review & publish"] as const;
type Tab = (typeof TABS)[number];

const ICONS: IconName[] = ["car", "passport", "idcard", "receipt", "shield", "vote", "baby", "landmark", "briefcase", "graduation"];
const emptyL = () => ({ ne: "", en: "" });
const newFact = (): Fact => ({ text: emptyL(), check: "needs_review" });

export interface Revision {
  id: number;
  status: string;
  published: boolean;
  edited_at: string;
}

export function GuideEditor({
  initial,
  departments,
  isNew,
  canReview,
  live,
  revisions,
  initialTab,
}: {
  initial: Guide;
  departments: Department[];
  isNew: boolean;
  canReview: boolean;
  live: boolean;
  revisions: Revision[];
  /** Open on a given tab, e.g. from the Videos or Sources page. */
  initialTab?: string;
}) {
  const [g, setG] = useState<Guide>(initial);
  const [tab, setTab] = useState<Tab>((TABS as readonly string[]).includes(initialTab ?? "") ? (initialTab as Tab) : "Basic info");
  const [result, setResult] = useState<AdminResult | null>(null);
  const [pending, start] = useTransition();
  const [previewLocale, setPreviewLocale] = useState<Locale>("ne");
  const set = <K extends keyof Guide>(k: K, v: Guide[K]) => setG((x) => ({ ...x, [k]: v }));

  const [savedJson, setSavedJson] = useState(() => JSON.stringify(initial));
  const dirty = useMemo(() => JSON.stringify(g) !== savedJson, [g, savedJson]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const check = useMemo(() => validateGuide(g), [g]);
  const open = useMemo(() => unconfirmedFacts(g), [g]);
  const script = useMemo(() => buildTutorial(g, previewLocale), [g, previewLocale]);

  const save = () =>
    start(async () => {
      const r = await saveGuide(g);
      setResult(r);
      if (r.ok) setSavedJson(JSON.stringify(g));
    });

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(g, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${g.slug || "guide"}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div>
      <a href="/admin/guides" className="inline-flex min-h-[36px] items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Guides</a>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">{g.title.en || g.title.ne || "Untitled guide"}</h1>
          <p className="text-sm text-ink-faint">{isNew ? "New guide" : `/${g.slug}`}{g.title.en && g.title.ne ? ` · ${g.title.ne}` : ""}</p>
        </div>
        {!isNew && g.published && (
          <a href={`/ne/guide/${g.slug}`} target="_blank" rel="noopener noreferrer" className="btn-secondary min-h-[40px] text-sm"><Eye className="h-4 w-4" aria-hidden="true" /> View live page</a>
        )}
      </div>

      <div role="tablist" className="mt-5 flex gap-1 overflow-x-auto border-b border-paper-line">
        {TABS.map((t) => (
          <button key={t} type="button" role="tab" id={`tab-${t}`} aria-controls="editor-panel" aria-selected={tab === t} onClick={() => setTab(t)} className={`min-h-[44px] shrink-0 border-b-2 px-3 text-sm font-semibold ${tab === t ? "border-brand text-brand" : "border-transparent text-ink-soft hover:text-ink"}`}>
            {t}
            {t === "Review & publish" && check.errors.length > 0 && <span className="ml-1.5 rounded-full bg-brand px-1.5 text-xs text-white">{check.errors.length}</span>}
          </button>
        ))}
      </div>

      <div id="editor-panel" className="mt-5 space-y-6" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === "Basic info" && (
          <>
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Slug (URL)" hint="Lowercase, hyphens. Can't change after the first save.">
                <Text mono value={g.slug} onChange={(v) => isNew && set("slug", v.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} />
              </Field>
              <Field label="Department">
                <select className="input min-h-[42px]" value={g.departmentId} onChange={(e) => set("departmentId", e.target.value)}>
                  <option value="">—</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name.en ?? d.name.ne}</option>)}
                </select>
              </Field>
              <Field label="Category">
                <select className="input min-h-[42px]" value={g.category} onChange={(e) => set("category", e.target.value as Guide["category"])}>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name.en}</option>)}
                </select>
              </Field>
              <Field label="Icon">
                <select className="input min-h-[42px]" value={g.icon} onChange={(e) => set("icon", e.target.value as IconName)}>
                  {ICONS.map((i) => <option key={i}>{i}</option>)}
                </select>
              </Field>
              <Field label="Process" hint="Shown at the top of the guide.">
                <select className="input min-h-[42px]" value={g.mode} onChange={(e) => set("mode", e.target.value as Guide["mode"])}>
                  <option value="online">Fully online</option>
                  <option value="partly_online">Partly online + office visit</option>
                  <option value="in_person">In person only</option>
                  <option value="awaiting_verification">Awaiting verification</option>
                </select>
              </Field>
              <label className="flex items-center gap-2 pt-7 text-sm">
                <input type="checkbox" checked={!!g.popular} onChange={(e) => set("popular", e.target.checked)} className="h-5 w-5" /> Show on homepage as a popular service
              </label>
            </div>
            <LocalizedInput label="Service name" value={g.title} onChange={(v) => set("title", v)} />
            <LocalizedInput label="Question (page heading)" value={g.question} onChange={(v) => set("question", v)} hint="How people ask it: “Driving Licence को फाराम कसरी भर्ने?”" />
            <LocalizedInput label="One-line summary (cards)" value={g.summary} onChange={(v) => set("summary", v)} />
            <LocalizedInput label="Introduction (1–2 short sentences)" value={g.intro} onChange={(v) => set("intro", v)} multiline />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 rounded-xl border border-paper-line bg-white p-4">
                <Field label="Official portal URL"><Text mono value={g.officialPortal?.url ?? ""} onChange={(url) => set("officialPortal", { label: g.officialPortal?.label ?? emptyL(), url, sourceIds: g.officialPortal?.sourceIds })} placeholder="https://….gov.np" /></Field>
                <LocalizedInput label="Portal label" value={g.officialPortal?.label} onChange={(label) => set("officialPortal", { url: g.officialPortal?.url ?? "", label, sourceIds: g.officialPortal?.sourceIds })} />
              </div>
              <div className="space-y-2 rounded-xl border border-paper-line bg-white p-4">
                <Field label="Status-check URL (optional)"><Text mono value={g.statusCheck?.url ?? ""} onChange={(url) => set("statusCheck", url ? { label: g.statusCheck?.label ?? emptyL(), url } : undefined)} /></Field>
                <LocalizedInput label="Status-check label" value={g.statusCheck?.label} onChange={(label) => g.statusCheck && set("statusCheck", { ...g.statusCheck, label })} />
              </div>
            </div>
            <Field label="Search aliases" hint="Comma-separated: informal spellings, Romanized Nepali, English. e.g. laisens, लाईसेन्स, license">
              <Area value={g.keywords.join(", ")} onChange={(v) => set("keywords", v.split(",").map((s) => s.trim()).filter(Boolean))} />
            </Field>
            <Field label="Related guides (slugs, comma-separated)"><Text mono value={g.related.join(", ")} onChange={(v) => set("related", v.split(",").map((s) => s.trim()).filter(Boolean))} /></Field>
            <Section title="Purposes (optional)">
              <Hint>Visitors pick one, e.g. “Renew my passport”, and then see only the documents and steps for it. Add only purposes the official sources describe. Leave empty for a single process.</Hint>
              <div className="mt-3">
                <ListEditor<Situation>
                  items={g.situations ?? []}
                  onChange={(v) => set("situations", v.length ? v : undefined)}
                  make={() => ({ id: "", label: emptyL(), check: "needs_review" })}
                  addLabel="Add purpose"
                  itemLabel={(i) => `Purpose ${i + 1}`}
                  render={(x, s) => (
                    <div className="space-y-2">
                      <div className="grid gap-3 md:grid-cols-[180px_1fr]">
                        <Field label="Purpose id" hint="e.g. first, renew, replace"><Text mono value={x.id} onChange={(id) => s({ ...x, id: id.toLowerCase().replace(/[^a-z0-9-]/g, "") })} /></Field>
                        <div className="flex flex-wrap items-end gap-3"><CheckSelect value={x.check} onChange={(check) => s({ ...x, check })} /><SourcePicker sources={g.sources} value={x.sourceIds} onChange={(sourceIds) => s({ ...x, sourceIds })} /></div>
                      </div>
                      <LocalizedInput label="Button label" value={x.label} onChange={(label) => s({ ...x, label })} hint="Short and plain: “Renew my passport”." />
                      <LocalizedInput label="“Help me choose” line (optional)" value={x.hint} onChange={(hint) => s({ ...x, hint: hint.ne || hint.en ? hint : undefined })} />
                      <label className="flex items-start gap-2 text-sm">
                        <input type="checkbox" checked={!!x.pending} onChange={(e) => s({ ...x, pending: e.target.checked || undefined })} className="mt-0.5 h-5 w-5" />
                        <span><strong>Coming soon</strong>: shown as a choice, but visitors see “not ready yet” instead of steps. Untick once the steps are verified.</span>
                      </label>
                    </div>
                  )}
                />
              </div>
              {(g.situations?.length ?? 0) > 0 && (
                <div className="mt-3">
                  <LocalizedInput label="Purposes not covered yet (optional)" value={g.situationsGap} onChange={(v) => set("situationsGap", v.ne || v.en ? v : undefined)} hint="e.g. “Renewal guide isn't ready yet.” Shown under the choices with a request link." />
                </div>
              )}
            </Section>
          </>
        )}

        {tab === "Requirements" && (
          <>
            <Hint>Items marked “Needs review” are <strong>not shown</strong> as requirements on the site — visitors see a “not yet confirmed, check the official site” notice instead.</Hint>
            <Section title="Eligibility">
              <ListEditor items={g.eligibility} onChange={(v) => set("eligibility", v)} make={newFact} addLabel="Add eligibility rule" itemLabel={(i) => `Rule ${i + 1}`} render={(f, s) => <FactFields f={f} s={s} sources={g.sources} />} />
            </Section>
            <Section title="Documents (Before you start checklist)">
              <ListEditor<DocumentItem>
                items={g.documents}
                onChange={(v) => set("documents", v)}
                make={newFact}
                addLabel="Add document"
                itemLabel={(i) => `Document ${i + 1}`}
                render={(d, s) => (
                  <div className="space-y-2">
                    <FactFields f={d} s={s} sources={g.sources} />
                    <PurposePicker situations={g.situations ?? []} value={d.for} onChange={(v) => s({ ...d, for: v })} />
                    <LocalizedInput label="Only when… (optional)" value={d.when} onChange={(when) => s({ ...d, when })} />
                    <LocalizedInput label="Note (optional)" value={d.note} onChange={(note) => s({ ...d, note })} />
                  </div>
                )}
              />
            </Section>
            <Section title="Fees">
              <ListEditor<Fee>
                items={g.fees}
                onChange={(v) => set("fees", v)}
                make={() => ({ label: emptyL(), amount: null, check: "needs_review" })}
                addLabel="Add fee"
                itemLabel={(i) => `Fee ${i + 1}`}
                render={(f, s) => (
                  <div className="space-y-2">
                    <LocalizedInput label="What the fee is for" value={f.label} onChange={(label) => s({ ...f, label })} />
                    <LocalizedInput label="Amount (leave empty if not confirmed)" value={f.amount ?? undefined} onChange={(a) => s({ ...f, amount: a.ne || a.en ? a : null })} />
                    <div className="flex flex-wrap items-center gap-3"><CheckSelect value={f.check} onChange={(check) => s({ ...f, check })} /><SourcePicker sources={g.sources} value={f.sourceIds} onChange={(sourceIds) => s({ ...f, sourceIds })} /></div>
                  </div>
                )}
              />
            </Section>
            <Section title="Processing time (optional)">
              {g.estimatedTime ? (
                <div className="space-y-2 rounded-xl border border-paper-line bg-white p-4">
                  <FactFields f={g.estimatedTime} s={(v) => set("estimatedTime", v)} sources={g.sources} withNote />
                  <button type="button" className="text-sm text-brand underline" onClick={() => set("estimatedTime", undefined)}>Remove</button>
                </div>
              ) : (
                <button type="button" className="btn-secondary min-h-[40px] text-sm" onClick={() => set("estimatedTime", newFact())}>Add processing time</button>
              )}
            </Section>
            <Section title="Office visit">
              {g.visit ? <div className="rounded-xl border border-paper-line bg-white p-4"><FactFields f={g.visit} s={(v) => set("visit", v)} sources={g.sources} /></div> : <button type="button" className="btn-secondary min-h-[40px] text-sm" onClick={() => set("visit", newFact())}>Add office-visit note</button>}
            </Section>
            <Section title="What happens next">
              <ListEditor items={g.whatNext ?? []} onChange={(v) => set("whatNext", v)} make={newFact} addLabel="Add next step" itemLabel={(i) => `Next ${i + 1}`} render={(f, s) => <FactFields f={f} s={s} sources={g.sources} />} />
            </Section>
          </>
        )}

        {tab === "Steps" && (
          <>
            <Hint>One action per step. Steps marked “Needs review” stay visible but carry a “Not yet confirmed” label in the guide and in the video. Use fictional sample values only in demo screens.</Hint>
            <ListEditor<GuideStep>
              items={g.steps}
              onChange={(v) => set("steps", v)}
              make={() => ({ id: `step-${g.steps.length + 1}`, title: emptyL(), body: emptyL(), check: "needs_review" })}
              addLabel="Add step"
              itemLabel={(i) => `Step ${i + 1}`}
              render={(st, s) => (
                <div className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-[180px_1fr]">
                    <Field label="Step id"><Text mono value={st.id} onChange={(id) => s({ ...st, id: id.replace(/[^a-z0-9-]/g, "") })} /></Field>
                    <div className="flex flex-wrap items-end gap-3"><CheckSelect value={st.check} onChange={(check) => s({ ...st, check })} /><SourcePicker sources={g.sources} value={st.sourceIds} onChange={(sourceIds) => s({ ...st, sourceIds })} /></div>
                  </div>
                  <LocalizedInput label="Heading" value={st.title} onChange={(title) => s({ ...st, title })} />
                  <LocalizedInput label="Instruction (one or two sentences)" value={st.body} onChange={(body) => s({ ...st, body })} multiline />
                  <PurposePicker situations={g.situations ?? []} value={st.for} onChange={(v) => s({ ...st, for: v })} />
                  {(g.situations?.length ?? 0) > 0 && (
                    <details className="rounded-lg bg-paper-warm p-3">
                      <summary className="cursor-pointer text-sm font-semibold">Wording per purpose (optional)</summary>
                      <p className="mt-2 text-xs text-ink-faint">Replaces the instruction above for that purpose. Use the same sources. Leave empty to use the instruction above.</p>
                      <div className="mt-3 space-y-3">
                        {(g.situations ?? []).filter((x) => x.id).map((x) => (
                          <LocalizedInput
                            key={x.id}
                            label={x.label.en || x.label.ne || x.id}
                            value={st.bodyFor?.[x.id]}
                            multiline
                            onChange={(v) => {
                              const next = { ...(st.bodyFor ?? {}) };
                              if (v.ne || v.en) next[x.id] = v;
                              else delete next[x.id];
                              s({ ...st, bodyFor: Object.keys(next).length ? next : undefined });
                            }}
                          />
                        ))}
                      </div>
                    </details>
                  )}
                  <details className="rounded-lg bg-paper-warm p-3">
                    <summary className="cursor-pointer text-sm font-semibold">“यो बुझिनँ” help, warning, video timing</summary>
                    <div className="mt-3 space-y-3">
                      <LocalizedInput label="Simpler explanation" value={st.help?.simpler} onChange={(simpler) => s({ ...st, help: { ...st.help, simpler } })} multiline />
                      <LocalizedInput label="Example with fictional details" value={st.help?.example} onChange={(example) => s({ ...st, help: { simpler: st.help?.simpler ?? emptyL(), example } })} />
                      <LocalizedInput label="Warning for this step (optional)" value={st.warning} onChange={(warning) => s({ ...st, warning: warning.ne ? warning : undefined })} />
                      <Field label="Starts at (seconds) in an uploaded MP4" hint="Creates the chapter marker for this step.">
                        <input type="number" min={0} className="input min-h-[42px] w-40" value={st.videoAt ?? ""} onChange={(e) => s({ ...st, videoAt: e.target.value === "" ? undefined : Number(e.target.value) })} />
                      </Field>
                    </div>
                  </details>
                  <DemoEditor demo={st.demo} onChange={(demo) => s({ ...st, demo })} />
                </div>
              )}
            />
          </>
        )}

        {tab === "FAQ & mistakes" && (
          <>
            <Section title="Common mistakes (service-specific)">
              <ListEditor items={g.mistakes} onChange={(v) => set("mistakes", v)} make={newFact} addLabel="Add mistake" itemLabel={(i) => `Mistake ${i + 1}`} render={(f, s) => <FactFields f={f} s={s} sources={g.sources} multiline />} />
            </Section>
            <Section title="FAQ">
              <ListEditor<FAQ>
                items={g.faqs}
                onChange={(v) => set("faqs", v)}
                make={() => ({ q: emptyL(), a: emptyL(), check: "needs_review" })}
                addLabel="Add question"
                itemLabel={(i) => `Question ${i + 1}`}
                render={(f, s) => (
                  <div className="space-y-2">
                    <LocalizedInput label="Question" value={f.q} onChange={(q) => s({ ...f, q })} />
                    <LocalizedInput label="Answer" value={f.a} onChange={(a) => s({ ...f, a })} multiline />
                    <div className="flex flex-wrap items-center gap-3"><CheckSelect value={f.check} onChange={(check) => s({ ...f, check })} /><SourcePicker sources={g.sources} value={f.sourceIds} onChange={(sourceIds) => s({ ...f, sourceIds })} /></div>
                  </div>
                )}
              />
            </Section>
          </>
        )}

        {tab === "Video" && <VideoTab g={g} set={set} script={script} previewLocale={previewLocale} setPreviewLocale={setPreviewLocale} canReview={canReview} live={live} />}

        {tab === "Review & publish" && (
          <>
            <Section title="Sources">
              <ListEditor<Source>
                items={g.sources}
                onChange={(v) => set("sources", v)}
                make={() => ({ id: `src-${g.sources.length + 1}`, title: "", url: "https://", official: true, checkedOn: new Date().toISOString().slice(0, 10) })}
                addLabel="Add source"
                itemLabel={(i) => `Source ${i + 1}`}
                render={(s, setS) => (
                  <div className="grid gap-2 md:grid-cols-[160px_1fr]">
                    <Field label="Id"><Text mono value={s.id} onChange={(id) => setS({ ...s, id })} /></Field>
                    <Field label="Title"><Text value={s.title} onChange={(title) => setS({ ...s, title })} /></Field>
                    <Field label="Checked on"><input type="date" className="input min-h-[42px]" value={s.checkedOn} onChange={(e) => setS({ ...s, checkedOn: e.target.value })} /></Field>
                    <Field label="URL"><Text mono value={s.url} onChange={(url) => setS({ ...s, url })} /></Field>
                    <label className="flex items-center gap-2 text-sm md:col-span-2"><input type="checkbox" checked={s.official} onChange={(e) => setS({ ...s, official: e.target.checked })} className="h-5 w-5" /> Official government page (gov.np / Nepali mission)</label>
                  </div>
                )}
              />
            </Section>

            <Section title="Verification & publication">
              <div className="grid gap-4 rounded-xl border border-paper-line bg-white p-4 md:grid-cols-3">
                <Field label="Verification status" hint="Publishing does not mark a guide as verified.">
                  <select className="input min-h-[42px]" value={g.status} onChange={(e) => set("status", e.target.value as Guide["status"])}>
                    <option value="draft">Draft</option>
                    <option value="under_review">Under review</option>
                    <option value="verified" disabled={!canReview}>Verified{canReview ? "" : " (reviewers only)"}</option>
                    <option value="needs_update">Needs update</option>
                    <option value="archived">Archived</option>
                  </select>
                </Field>
                <Field label="Sources last checked"><input type="date" className="input min-h-[42px]" value={g.lastChecked} onChange={(e) => set("lastChecked", e.target.value)} /></Field>
                <Field label="Re-check by"><input type="date" className="input min-h-[42px]" value={g.recheckBy ?? ""} onChange={(e) => set("recheckBy", e.target.value || undefined)} /></Field>
                <Field label="Checked by"><Text value={g.checkedBy ?? ""} onChange={(v) => set("checkedBy", v)} /></Field>
                <Field label="Assigned reviewer"><Text value={g.reviewer ?? ""} onChange={(v) => set("reviewer", v || undefined)} /></Field>
                <label className="flex items-center gap-2 pt-7 text-sm"><input type="checkbox" checked={g.published} onChange={(e) => set("published", e.target.checked)} className="h-5 w-5" /> Published (visible on the site)</label>
                <div className="md:col-span-3">
                  <Field label="Review notes (admin only)"><Area rows={3} value={g.reviewNotes ?? ""} onChange={(v) => set("reviewNotes", v)} /></Field>
                </div>
              </div>
            </Section>

            <Section title={`Still unconfirmed (${open.length})`}>
              {open.length ? <ul className="flex flex-wrap gap-1.5">{open.map((o) => <li key={o} className="chip bg-warn-tint text-warn">{o}</li>)}</ul> : <p className="text-sm text-ok">Everything is marked as confirmed on an official page.</p>}
            </Section>

            {revisions.length > 0 && (
              <Section title="History">
                <ul className="divide-y divide-paper-line rounded-xl border border-paper-line bg-white text-sm">
                  {revisions.map((r) => (
                    <li key={r.id} className="flex justify-between gap-3 px-3 py-2"><span>{new Date(r.edited_at).toLocaleString()}</span><span className="text-ink-soft">{r.status}{r.published ? " · published" : ""}</span></li>
                  ))}
                </ul>
              </Section>
            )}
          </>
        )}
      </div>

      {/* Save bar: stays in view at the bottom of the content column. */}
      <div className="sticky bottom-0 z-20 -mx-4 mt-8 border-t border-paper-line bg-white/95 backdrop-blur sm:-mx-6 lg:-mx-8">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="min-w-0 flex-1 text-sm">
            {check.errors.length > 0 ? (
              <p className="flex items-start gap-1.5 text-brand-dark"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {check.errors[0]}{check.errors.length > 1 && ` (+${check.errors.length - 1} more)`}</p>
            ) : check.warnings.length > 0 ? (
              <p className="flex items-start gap-1.5 text-warn"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {check.warnings[0]}</p>
            ) : (
              <p className="flex items-center gap-1.5 text-ok"><CheckCircle2 className="h-4 w-4" /> Ready to save</p>
            )}
            {result && !dirty ? (
              <p role="status" className={result.ok ? "text-ok" : "text-brand-dark"}>{result.ok ? result.message : result.errors.join(" · ")}</p>
            ) : result && !result.ok ? (
              <p role="status" className="text-brand-dark">{result.errors.join(" · ")}</p>
            ) : dirty ? (
              <p className="text-ink-soft">Unsaved changes</p>
            ) : null}
          </div>
          <button type="button" onClick={exportJson} className="btn-ghost min-h-[42px] text-sm" title="Download this guide as JSON"><Download className="h-4 w-4" aria-hidden="true" /> <span className="hidden sm:inline">Export JSON</span><span className="sr-only sm:hidden">Export JSON</span></button>
          <button type="button" onClick={save} disabled={pending || check.errors.length > 0} className="btn-primary min-h-[42px]"><Save className="h-4 w-4" aria-hidden="true" /> {pending ? "Saving…" : "Save"}</button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 font-bold">{title}</h2>
      {children}
    </section>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl bg-sky-tint px-4 py-3 text-sm text-sky">{children}</p>;
}

function FactFields<T extends Fact>({ f, s, sources, withNote, multiline }: { f: T; s: (v: T) => void; sources: Source[]; withNote?: boolean; multiline?: boolean }) {
  return (
    <div className="space-y-2">
      <LocalizedInput label="Text" value={f.text} onChange={(text) => s({ ...f, text })} multiline={multiline} />
      {withNote && <LocalizedInput label="Note" value={f.note} onChange={(note) => s({ ...f, note })} />}
      <div className="flex flex-wrap items-center gap-3">
        <CheckSelect value={f.check} onChange={(check) => s({ ...f, check })} />
        <SourcePicker sources={sources} value={f.sourceIds} onChange={(sourceIds) => s({ ...f, sourceIds })} />
      </div>
    </div>
  );
}

/** Demo-screen editor: describes the simplified mockup the tutorial animates. */
function DemoEditor({ demo, onChange }: { demo?: DemoScreen; onChange: (d: DemoScreen | undefined) => void }) {
  if (!demo) {
    return <button type="button" className="text-sm font-semibold text-sky underline" onClick={() => onChange({ kind: "form", fields: [] })}>+ Add a demo screen for the video</button>;
  }
  const fieldsText = (demo.fields ?? []).map((f) => `${f.label.ne} | ${f.label.en ?? ""} | ${f.sample ?? ""}`).join("\n");
  const itemsText = (demo.items ?? []).map((i) => `${i.ne} | ${i.en ?? ""}`).join("\n");
  return (
    <div className="space-y-3 rounded-lg border border-dashed border-paper-line p-3">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Demo screen">
          <select className="input min-h-[40px] w-auto" value={demo.kind} onChange={(e) => onChange({ ...demo, kind: e.target.value as DemoScreen["kind"] })}>
            <option value="browser">Browser page</option>
            <option value="form">Form</option>
            <option value="list">Options list</option>
            <option value="message">Confirmation</option>
          </select>
        </Field>
        <Field label="Address bar (domain only)"><Text mono value={demo.url ?? ""} onChange={(url) => onChange({ ...demo, url: url || undefined })} /></Field>
        <Field label="Cursor target" hint="Field number from 0, or empty for the button">
          <input type="number" min={0} className="input min-h-[40px] w-28" value={demo.focusField ?? ""} onChange={(e) => onChange({ ...demo, focusField: e.target.value === "" ? undefined : Number(e.target.value) })} />
        </Field>
        <button type="button" className="pb-2 text-sm text-brand underline" onClick={() => onChange(undefined)}>Remove screen</button>
      </div>
      <LocalizedInput label="Screen heading" value={demo.heading} onChange={(heading) => onChange({ ...demo, heading })} />
      <LocalizedInput label="Button label" value={demo.button} onChange={(button) => onChange({ ...demo, button: button.ne ? button : undefined })} />
      {demo.kind === "form" && (
        <Field label="Fields — one per line: नेपाली label | English label | fictional sample" hint="Never use real personal data. e.g. मोबाइल नम्बर | Mobile number | 98XXXXXXXX">
          <Area
            rows={3}
            value={fieldsText}
            onChange={(v) =>
              onChange({
                ...demo,
                fields: v.split("\n").filter((l) => l.trim()).map((l) => {
                  const [ne, en, sample] = l.split("|").map((x) => x.trim());
                  return { label: { ne: ne ?? "", en: en || undefined }, sample: sample || undefined };
                }),
              })
            }
          />
        </Field>
      )}
      {demo.kind === "list" && (
        <Field label="Options — one per line: नेपाली | English">
          <Area rows={3} value={itemsText} onChange={(v) => onChange({ ...demo, items: v.split("\n").filter((l) => l.trim()).map((l) => { const [ne, en] = l.split("|").map((x) => x.trim()); return { ne: ne ?? "", en: en || undefined }; }) })} />
        </Field>
      )}
    </div>
  );
}

function VideoTab({
  g,
  set,
  script,
  previewLocale,
  setPreviewLocale,
  canReview,
  live,
}: {
  g: Guide;
  set: <K extends keyof Guide>(k: K, v: Guide[K]) => void;
  script: ReturnType<typeof buildTutorial>;
  previewLocale: Locale;
  setPreviewLocale: (l: Locale) => void;
  canReview: boolean;
  live: boolean;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const v = g.video;
  const setV = (patch: Partial<typeof v>) => set("video", { ...v, ...patch });

  const upload = async (file: File, apply: (url: string) => void) => {
    const db = supabaseBrowser();
    if (!db) return setMsg("Uploads need Supabase. In demo mode, put files in /public and paste their path.");
    setBusy(file.name);
    const path = `${g.slug}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error } = await db.storage.from("tutorials").upload(path, file, { cacheControl: "31536000", upsert: false });
    setBusy(null);
    if (error) return setMsg(error.message);
    apply(db.storage.from("tutorials").getPublicUrl(path).data.publicUrl);
    setMsg(`Uploaded ${file.name}. Remember to Save.`);
  };

  const download = (name: string, text: string, type = "text/vtt") => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name;
    a.click();
  };

  const FileInput = ({ label, accept, onFile, current }: { label: string; accept: string; onFile: (f: File) => void; current?: string }) => (
    <div className="rounded-xl border border-paper-line bg-white p-3">
      <span className="label">{label}</span>
      {current && <p className="mb-2 truncate font-mono text-xs text-ink-soft">{current}</p>}
      <label className="btn-secondary min-h-[38px] cursor-pointer text-sm">
        <Upload className="h-4 w-4" /> Choose file
        <input type="file" accept={accept} className="sr-only" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
      </label>
    </div>
  );

  return (
    <div className="space-y-5">
      <Hint>
        Every guide gets a <strong>live animated tutorial</strong> built from its steps and demo screens — no rendering needed, and it updates the moment you save.
        For an MP4, either render one with the Remotion project in <code>/video</code> (same templates, same data) or upload a screen recording.
        An MP4 replaces the animation <strong>only after a reviewer approves it</strong>.
      </Hint>

      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">Preview language:</span>
        {(["ne", "en"] as Locale[]).map((l) => (
          <button key={l} type="button" onClick={() => setPreviewLocale(l)} className={`rounded-full px-3 py-1 text-sm ${previewLocale === l ? "bg-ink text-white" : "border border-paper-line"}`}>{l === "ne" ? "नेपाली" : "English"}</button>
        ))}
        <span className="text-sm text-ink-faint">· {Math.round(script.totalMs / 1000)}s · {script.chapters.length} chapters</span>
      </div>
      <div className="max-w-2xl">
        {v.src && v.review !== "approved" && <p className="mb-2 text-sm text-warn">Admin preview: this MP4 is not yet visible to the public.</p>}
        <TutorialPlayer key={previewLocale + JSON.stringify(v)} locale={previewLocale} script={script} video={{ ...v, review: v.src ? "approved" : v.review }} />
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-secondary min-h-[40px] text-sm" onClick={() => download(`${g.slug}.${previewLocale}.vtt`, toVtt(script).captions)}><Download className="h-4 w-4" /> Captions (.vtt) for the generated video</button>
        <button type="button" className="btn-secondary min-h-[40px] text-sm" onClick={() => download(`${g.slug}.${previewLocale}.chapters.vtt`, toVtt(script).chapters)}><Download className="h-4 w-4" /> Chapters (.vtt)</button>
        <button type="button" className="btn-secondary min-h-[40px] text-sm" onClick={() => download(`${g.slug}.${previewLocale}.narration.txt`, toTranscript(script), "text/plain")}><Download className="h-4 w-4" /> Narration script</button>
      </div>

      {/* Thumbnail: shown on the guide page before the video plays (animation or MP4). */}
      <div className="flex flex-col gap-4 rounded-xl border border-paper-line bg-white p-4 sm:flex-row sm:items-start">
        <div className="aspect-video w-full shrink-0 overflow-hidden rounded-lg border border-paper-line bg-paper-warm sm:w-56">
          {v.poster ? (
            // eslint-disable-next-line @next/next/no-img-element -- preview of an admin-provided URL
            <img src={v.poster} alt="Thumbnail preview" className="h-full w-full object-cover" />
          ) : (
            <span className="grid h-full place-items-center text-xs text-ink-faint">No thumbnail</span>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="font-semibold">Thumbnail</p>
            <p className="text-xs text-ink-faint">Shown before the video plays. 16:9 image (e.g. 1280×720), PNG, JPG or WebP. Don't use photos of real documents or people's details.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="btn-secondary min-h-[38px] cursor-pointer text-sm">
              <Upload className="h-4 w-4" aria-hidden="true" /> Upload image
              <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], (poster) => setV({ poster }))} />
            </label>
            {v.poster && (
              <button type="button" className="btn-ghost min-h-[38px] text-sm text-brand" onClick={() => setV({ poster: undefined })}>Remove</button>
            )}
          </div>
          <Field label="Or image URL"><Text mono value={v.poster ?? ""} onChange={(poster) => setV({ poster: poster || undefined })} placeholder="https://… or /images/thumbnail.webp" /></Field>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Video type">
          <select className="input min-h-[42px]" value={v.kind} onChange={(e) => setV({ kind: e.target.value as typeof v.kind })}>
            <option value="live">Live animation only</option>
            <option value="generated">Rendered MP4 (Remotion)</option>
            <option value="uploaded">Uploaded recording</option>
          </select>
        </Field>
        <Field label="MP4 URL (or upload below)"><Text mono value={v.src ?? ""} onChange={(src) => setV({ src: src || undefined, review: "pending" })} /></Field>
        <FileInput label="MP4 — normal quality" accept="video/mp4" current={v.src} onFile={(f) => upload(f, (src) => setV({ src, review: "pending" }))} />
        <FileInput label="MP4 — low data (e.g. 360p)" accept="video/mp4" current={v.lowSrc} onFile={(f) => upload(f, (lowSrc) => setV({ lowSrc }))} />
        <FileInput label="Captions — नेपाली (.vtt)" accept=".vtt,text/vtt" current={v.subtitles?.ne} onFile={(f) => upload(f, (url) => setV({ subtitles: { ...v.subtitles, ne: url } }))} />
        <FileInput label="Captions — English (.vtt)" accept=".vtt,text/vtt" current={v.subtitles?.en} onFile={(f) => upload(f, (url) => setV({ subtitles: { ...v.subtitles, en: url } }))} />
        <FileInput label="Recorded narration — नेपाली (for the live animation)" accept="audio/*" current={v.narrationAudio?.ne} onFile={(f) => upload(f, (url) => setV({ narrationAudio: { ...v.narrationAudio, ne: url } }))} />
      </div>
      {busy && <p className="text-sm text-ink-soft">Uploading {busy}…</p>}
      {msg && <p role="status" className="text-sm text-sky">{msg}</p>}

      {v.src && (
        <div className="rounded-xl border border-paper-line bg-white p-4">
          <p className="font-semibold">MP4 review: <span className={v.review === "approved" ? "text-ok" : v.review === "rejected" ? "text-brand" : "text-warn"}>{v.review ?? "pending"}</span>{v.approvedBy && <span className="text-sm font-normal text-ink-soft"> · {v.approvedBy}, {v.approvedOn}</span>}</p>
          <p className="mt-1 text-sm text-ink-soft">Before approving: watch it through, check captions and narration, confirm no real personal data appears, and that every demo screen is labelled as a demo.</p>
          {canReview ? (
            <div className="mt-3 flex gap-2">
              <button type="button" disabled={pending || !live} className="btn-primary min-h-[40px] text-sm" onClick={() => start(async () => { const r = await decideVideo(g.slug, "approved"); setMsg(r.ok ? r.message ?? "" : r.errors.join(" ")); if (r.ok) setV({ review: "approved" }); })}>Approve & publish video</button>
              <button type="button" disabled={pending || !live} className="btn-secondary min-h-[40px] text-sm" onClick={() => start(async () => { const r = await decideVideo(g.slug, "rejected"); setMsg(r.ok ? r.message ?? "" : r.errors.join(" ")); if (r.ok) setV({ review: "rejected" }); })}>Reject</button>
            </div>
          ) : (
            <p className="mt-2 text-sm text-ink-faint">A reviewer must approve this video.</p>
          )}
        </div>
      )}
    </div>
  );
}
