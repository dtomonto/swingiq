'use client';

// ============================================================
// Plan Template Editor — client manager
// ------------------------------------------------------------
// Edits a LOCAL-FIRST overlay on the planner-seeded templates: override,
// create, retire, delete (with confirm) and export-to-commit. Never
// writes to live data.
// ============================================================

import { useMemo, useState } from 'react';
import {
  Plus, Download, RotateCcw, SquarePen, Trash2, Save, X, Check, AlertTriangle, Database,
} from 'lucide-react';
import { SectionCard } from '@/components/admin/SectionCard';
import { MetricStat } from '@/components/admin/MetricStat';
import { StatusBadge, type BadgeTone } from '@/components/admin/StatusBadge';
import { usePlanEditor } from '@/lib/admin/plan-editor/store';
import {
  applyPlanEdits, planEditStats, exportPlanEdits, validatePlanEdit,
  parseDrillLines, formatDrillLines,
  type BasePlanTemplate, type PlanEdit, type PlanStatus, type EffectivePlan,
} from '@/lib/admin/plan-editor/merge';

const STATUSES: PlanStatus[] = ['draft', 'active', 'retired'];
const STATUS_TONE: Record<PlanStatus, BadgeTone> = { active: 'success', draft: 'warning', retired: 'neutral' };

interface FormState {
  id: string; kind: 'override' | 'custom'; baseId?: string;
  name: string; sport: string; level: string; focus: string; minutes: number;
  warmup: string; drillsText: string; pressureTest: string; successMetric: string; status: PlanStatus;
}

function toForm(p: EffectivePlan, kind: 'override' | 'custom'): FormState {
  return {
    id: kind === 'override' ? `ovr:${p.id}` : p.id, kind, baseId: kind === 'override' ? p.id : undefined,
    name: p.name, sport: p.sport, level: p.level, focus: p.focus, minutes: p.minutes,
    warmup: p.warmup, drillsText: formatDrillLines(p.drills), pressureTest: p.pressureTest,
    successMetric: p.successMetric, status: p.status,
  };
}
function toEdit(f: FormState): PlanEdit {
  return {
    id: f.id, kind: f.kind, baseId: f.baseId, name: f.name, sport: f.sport, level: f.level,
    focus: f.focus, minutes: Number(f.minutes) || 0, warmup: f.warmup, drills: parseDrillLines(f.drillsText),
    pressureTest: f.pressureTest, successMetric: f.successMetric, status: f.status,
    updatedAt: new Date().toISOString(), updatedBy: 'admin',
  };
}

export function PlanManager({ baseTemplates }: { baseTemplates: BasePlanTemplate[] }) {
  const { edits, upsert, remove, resetAll } = usePlanEditor();
  const [form, setForm] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [filter, setFilter] = useState('');
  const [exported, setExported] = useState(false);

  const effective = useMemo(() => applyPlanEdits(baseTemplates, edits), [baseTemplates, edits]);
  const stats = useMemo(() => planEditStats(effective), [effective]);
  const editCount = Object.keys(edits).length;

  const visible = effective.filter((p) => {
    const q = filter.trim().toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || p.sport.toLowerCase().includes(q) || p.focus.toLowerCase().includes(q);
  });

  function startNew() {
    setErrors([]);
    setForm({ id: `custom:${Date.now().toString(36)}`, kind: 'custom', name: '', sport: 'golf', level: 'Custom', focus: '', minutes: 20, warmup: '', drillsText: '', pressureTest: '', successMetric: '', status: 'draft' });
  }
  function save() {
    if (!form) return;
    const edit = toEdit(form);
    const errs = validatePlanEdit(edit);
    if (errs.length) { setErrors(errs); return; }
    upsert(edit);
    setForm(null);
  }
  function quickStatus(p: EffectivePlan, status: PlanStatus) {
    if (p.custom) { const e = edits[p.id]; if (e) upsert({ ...e, status }); }
    else upsert({ ...toEdit(toForm(p, 'override')), status });
  }
  function revert(p: EffectivePlan) {
    if (p.custom) { if (confirm(`Delete custom template "${p.name}"?`)) remove(p.id); }
    else if (p.edited) { if (confirm(`Revert "${p.name}" to the planner default?`)) remove(`ovr:${p.id}`); }
  }
  function doReset() { if (editCount && confirm(`Discard all ${editCount} local template edit(s)?`)) resetAll(); }
  function doExport() {
    const json = exportPlanEdits(edits);
    try { navigator.clipboard?.writeText(json); } catch { /* ignore */ }
    try {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'plan-overrides.json'; a.click();
      URL.revokeObjectURL(url);
    } catch { /* ignore */ }
    setExported(true); setTimeout(() => setExported(false), 2500);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-link/90">
        <span className="inline-flex items-center gap-1.5"><Database className="h-4 w-4" /> Preview overlay — saved in this browser only.</span>
        <span className="text-link/70">Nothing is written to live data. Use <strong>Export JSON</strong> to commit changes for everyone.</span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <MetricStat label="Templates" value={String(stats.total)} hint="effective" />
        <MetricStat label="Active" value={String(stats.active)} hint="published" />
        <MetricStat label="Draft" value={String(stats.draft)} hint="unreviewed" />
        <MetricStat label="Retired" value={String(stats.retired)} hint="phased out" />
        <MetricStat label="Custom" value={String(stats.custom)} hint="created here" />
        <MetricStat label="Edited" value={String(stats.edited)} hint="overridden" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={startNew} className="inline-flex items-center gap-1.5 rounded-lg bg-warning px-3 py-1.5 text-sm font-semibold text-foreground hover:bg-warning"><Plus className="h-4 w-4" /> New template</button>
        <button onClick={doExport} disabled={editCount === 0} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-1.5 text-sm text-foreground hover:border-primary/50 disabled:opacity-40">
          {exported ? <Check className="h-4 w-4 text-success-text" /> : <Download className="h-4 w-4" />} {exported ? 'Exported' : 'Export JSON'}
        </button>
        <button onClick={doReset} disabled={editCount === 0} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-1.5 text-sm text-foreground hover:border-error/50 hover:text-error-text disabled:opacity-40"><RotateCcw className="h-4 w-4" /> Reset all ({editCount})</button>
        <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter templates…" className="ml-auto w-44 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary/60" />
      </div>

      {form && (
        <SectionCard title={form.kind === 'custom' && form.name === '' ? 'New template' : `Editing: ${form.name || '(unnamed)'}`}>
          {errors.length > 0 && (
            <ul className="mb-3 space-y-1 rounded-lg bg-error/5 p-2 text-xs text-error-text ring-1 ring-error/20">
              {errors.map((e, i) => <li key={i} className="flex items-center gap-1.5"><AlertTriangle className="h-3 w-3" />{e}</li>)}
            </ul>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Sport"><input className={inputCls} value={form.sport} onChange={(e) => setForm({ ...form, sport: e.target.value })} /></Field>
            <Field label="Level"><input className={inputCls} value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} /></Field>
            <Field label="Focus"><input className={inputCls} value={form.focus} onChange={(e) => setForm({ ...form, focus: e.target.value })} /></Field>
            <Field label="Minutes"><input type="number" min={5} max={120} className={inputCls} value={form.minutes} onChange={(e) => setForm({ ...form, minutes: Number(e.target.value) })} /></Field>
            <Field label="Status">
              <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as PlanStatus })}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Warm-up"><textarea rows={2} className={inputCls} value={form.warmup} onChange={(e) => setForm({ ...form, warmup: e.target.value })} /></Field>
            <Field label="Drills (one per line, “Name — detail”)"><textarea rows={3} className={inputCls} value={form.drillsText} onChange={(e) => setForm({ ...form, drillsText: e.target.value })} /></Field>
            <Field label="Pressure test"><textarea rows={2} className={inputCls} value={form.pressureTest} onChange={(e) => setForm({ ...form, pressureTest: e.target.value })} /></Field>
            <Field label="Success metric"><textarea rows={2} className={inputCls} value={form.successMetric} onChange={(e) => setForm({ ...form, successMetric: e.target.value })} /></Field>
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={save} className="inline-flex items-center gap-1.5 rounded-lg bg-warning px-3 py-1.5 text-sm font-semibold text-foreground hover:bg-warning"><Save className="h-4 w-4" /> Save</button>
            <button onClick={() => { setForm(null); setErrors([]); }} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-1.5 text-sm text-foreground"><X className="h-4 w-4" /> Cancel</button>
          </div>
        </SectionCard>
      )}

      <SectionCard title={`Templates (${visible.length})`} description="Override a planner default, retire it, or create custom templates. Edits stay local until exported.">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr><th className="pb-2 pr-3">Template</th><th className="pb-2 pr-3">Sport</th><th className="pb-2 pr-3">Focus</th><th className="pb-2 pr-3">Min</th><th className="pb-2 pr-3">Status</th><th className="pb-2">Actions</th></tr>
            </thead>
            <tbody className="text-foreground">
              {visible.map((p) => (
                <tr key={`${p.custom ? 'c' : 'b'}:${p.id}`} className="border-t border-border">
                  <td className="py-2 pr-3">
                    <span className="font-medium text-foreground">{p.name}</span>
                    {p.custom && <StatusBadge tone="accent">custom</StatusBadge>}
                    {p.edited && !p.custom && <StatusBadge tone="info">edited</StatusBadge>}
                  </td>
                  <td className="py-2 pr-3 text-muted-foreground">{p.sport}</td>
                  <td className="max-w-[16rem] truncate py-2 pr-3 text-muted-foreground">{p.focus}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{p.minutes}</td>
                  <td className="py-2 pr-3">
                    <select value={p.status} onChange={(e) => quickStatus(p, e.target.value as PlanStatus)} className="rounded border border-border bg-card px-1.5 py-0.5 text-xs text-foreground" aria-label={`Status for ${p.name}`}>
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="py-2">
                    <div className="flex items-center gap-1">
                      <StatusBadge tone={STATUS_TONE[p.status]}>{p.status}</StatusBadge>
                      <button onClick={() => setForm(toForm(p, p.custom ? 'custom' : 'override'))} title="Edit" className="rounded p-1 text-muted-foreground hover:text-link"><SquarePen className="h-4 w-4" /></button>
                      {(p.custom || p.edited) && (
                        <button onClick={() => revert(p)} title={p.custom ? 'Delete' : 'Revert'} className="rounded p-1 text-muted-foreground hover:text-error-text">
                          {p.custom ? <Trash2 className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}

const inputCls = 'w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary/60';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
