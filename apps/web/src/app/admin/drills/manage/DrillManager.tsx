'use client';

// ============================================================
// Drill Editor — client manager
// ------------------------------------------------------------
// Edits a LOCAL-FIRST overlay on the code drills: override, create, retire,
// delete (with confirm) and export-to-commit. Never writes to live data.
// ============================================================

import { useMemo, useState } from 'react';
import {
  Plus, Download, RotateCcw, SquarePen, Trash2, Save, X, Check, AlertTriangle, Database,
} from 'lucide-react';
import { SectionCard } from '@/components/admin/SectionCard';
import { MetricStat } from '@/components/admin/MetricStat';
import { StatusBadge, type BadgeTone } from '@/components/admin/StatusBadge';
import { useDrillEditor } from '@/lib/admin/drill-editor/store';
import {
  applyDrillEdits, drillEditStats, exportDrillEdits, validateDrillEdit,
  type BaseDrillLike, type DrillEdit, type DrillDifficulty, type DrillStatus, type EffectiveDrill,
} from '@/lib/admin/drill-editor/merge';

const DIFFICULTIES: DrillDifficulty[] = ['beginner', 'intermediate', 'advanced'];
const STATUSES: DrillStatus[] = ['draft', 'active', 'retired'];
const STATUS_TONE: Record<DrillStatus, BadgeTone> = { active: 'success', draft: 'warning', retired: 'neutral' };

type FormState = Omit<DrillEdit, 'updatedAt' | 'updatedBy'>;

export function DrillManager({ baseDrills }: { baseDrills: BaseDrillLike[] }) {
  const { edits, upsert, remove, resetAll } = useDrillEditor();
  const [form, setForm] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [filter, setFilter] = useState('');
  const [exported, setExported] = useState(false);

  const effective = useMemo(() => applyDrillEdits(baseDrills, edits), [baseDrills, edits]);
  const stats = useMemo(() => drillEditStats(effective), [effective]);
  const editCount = Object.keys(edits).length;

  const visible = effective.filter((d) => {
    const q = filter.trim().toLowerCase();
    return !q || d.name.toLowerCase().includes(q) || d.sport.toLowerCase().includes(q) || d.category.toLowerCase().includes(q);
  });

  function startBaseEdit(d: EffectiveDrill) {
    setErrors([]);
    setForm({ id: `ovr:${d.id}`, kind: 'override', baseId: d.id, name: d.name, sport: d.sport, category: d.category, difficulty: d.difficulty, targetFault: d.targetFault, duration: d.duration, status: d.status });
  }
  function startCustomEdit(d: EffectiveDrill) {
    setErrors([]);
    setForm({ id: d.id, kind: 'custom', name: d.name, sport: d.sport, category: d.category, difficulty: d.difficulty, targetFault: d.targetFault, duration: d.duration, status: d.status });
  }
  function startNew() {
    setErrors([]);
    setForm({ id: `custom:${Date.now().toString(36)}`, kind: 'custom', name: '', sport: 'golf', category: '', difficulty: 'beginner', targetFault: '', duration: '', status: 'draft' });
  }
  function save() {
    if (!form) return;
    const errs = validateDrillEdit(form);
    if (errs.length) { setErrors(errs); return; }
    upsert({ ...form, updatedAt: new Date().toISOString(), updatedBy: 'admin' });
    setForm(null);
  }
  function quickStatus(d: EffectiveDrill, status: DrillStatus) {
    if (d.custom) {
      const e = edits[d.id];
      if (e) upsert({ ...e, status });
    } else {
      upsert({ id: `ovr:${d.id}`, kind: 'override', baseId: d.id, name: d.name, sport: d.sport, category: d.category, difficulty: d.difficulty, targetFault: d.targetFault, duration: d.duration, status, updatedAt: new Date().toISOString(), updatedBy: 'admin' });
    }
  }
  function revert(d: EffectiveDrill) {
    if (d.custom) {
      if (confirm(`Delete custom drill "${d.name}"? This removes it from your overlay.`)) remove(d.id);
    } else if (d.edited) {
      if (confirm(`Revert "${d.name}" to the original code drill?`)) remove(`ovr:${d.id}`);
    }
  }
  function doReset() {
    if (editCount === 0) return;
    if (confirm(`Discard all ${editCount} local drill edit(s)? This cannot be undone.`)) resetAll();
  }
  function doExport() {
    const json = exportDrillEdits(edits);
    try { navigator.clipboard?.writeText(json); } catch { /* ignore */ }
    try {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'drill-overrides.json'; a.click();
      URL.revokeObjectURL(url);
    } catch { /* ignore */ }
    setExported(true);
    setTimeout(() => setExported(false), 2500);
  }

  return (
    <div className="space-y-4">
      {/* Local-only banner */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-link/90">
        <span className="inline-flex items-center gap-1.5"><Database className="h-4 w-4" /> Preview overlay — saved in this browser only.</span>
        <span className="text-link/70">Nothing is written to live data. Use <strong>Export JSON</strong> to commit changes for everyone.</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <MetricStat label="Drills" value={String(stats.total)} hint="effective" />
        <MetricStat label="Active" value={String(stats.active)} hint="published" />
        <MetricStat label="Draft" value={String(stats.draft)} hint="unreviewed" />
        <MetricStat label="Retired" value={String(stats.retired)} hint="phased out" />
        <MetricStat label="Custom" value={String(stats.custom)} hint="created here" />
        <MetricStat label="Edited" value={String(stats.edited)} hint="overridden" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={startNew} className="inline-flex items-center gap-1.5 rounded-lg bg-warning px-3 py-1.5 text-sm font-semibold text-foreground hover:bg-warning">
          <Plus className="h-4 w-4" /> New custom drill
        </button>
        <button onClick={doExport} disabled={editCount === 0} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-1.5 text-sm text-foreground hover:border-primary/50 disabled:opacity-40">
          {exported ? <Check className="h-4 w-4 text-success-text" /> : <Download className="h-4 w-4" />} {exported ? 'Exported' : 'Export JSON'}
        </button>
        <button onClick={doReset} disabled={editCount === 0} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-1.5 text-sm text-foreground hover:border-error/50 hover:text-error-text disabled:opacity-40">
          <RotateCcw className="h-4 w-4" /> Reset all ({editCount})
        </button>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter drills…"
          className="ml-auto w-44 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary/60"
        />
      </div>

      {/* Edit form */}
      {form && (
        <SectionCard title={form.kind === 'custom' && form.name === '' ? 'New custom drill' : `Editing: ${form.name || '(unnamed)'}`}>
          {errors.length > 0 && (
            <ul className="mb-3 space-y-1 rounded-lg bg-error/5 p-2 text-xs text-error-text ring-1 ring-error/20">
              {errors.map((e, i) => <li key={i} className="flex items-center gap-1.5"><AlertTriangle className="h-3 w-3" />{e}</li>)}
            </ul>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Sport"><input className={inputCls} value={form.sport} onChange={(e) => setForm({ ...form, sport: e.target.value })} /></Field>
            <Field label="Category"><input className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></Field>
            <Field label="Target fault"><input className={inputCls} value={form.targetFault} onChange={(e) => setForm({ ...form, targetFault: e.target.value })} /></Field>
            <Field label="Duration"><input className={inputCls} value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} /></Field>
            <Field label="Difficulty">
              <select className={inputCls} value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value as DrillDifficulty })}>
                {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as DrillStatus })}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={save} className="inline-flex items-center gap-1.5 rounded-lg bg-warning px-3 py-1.5 text-sm font-semibold text-foreground hover:bg-warning"><Save className="h-4 w-4" /> Save</button>
            <button onClick={() => { setForm(null); setErrors([]); }} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-1.5 text-sm text-foreground"><X className="h-4 w-4" /> Cancel</button>
          </div>
        </SectionCard>
      )}

      {/* Table */}
      <SectionCard title={`Drills (${visible.length})`} description="Override a code drill, retire it, or create custom ones. Edits stay local until exported.">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="pb-2 pr-3">Drill</th><th className="pb-2 pr-3">Sport</th><th className="pb-2 pr-3">Category</th>
                <th className="pb-2 pr-3">Level</th><th className="pb-2 pr-3">Status</th><th className="pb-2 pr-3">Source</th><th className="pb-2">Actions</th>
              </tr>
            </thead>
            <tbody className="text-foreground">
              {visible.map((d) => (
                <tr key={`${d.custom ? 'c' : 'b'}:${d.id}`} className="border-t border-border">
                  <td className="py-2 pr-3">
                    <span className="font-medium text-foreground">{d.name}</span>
                    {d.custom && <StatusBadge tone="accent">custom</StatusBadge>}
                    {d.edited && !d.custom && <StatusBadge tone="info">edited</StatusBadge>}
                  </td>
                  <td className="py-2 pr-3 text-muted-foreground">{d.sport}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{d.category}</td>
                  <td className="py-2 pr-3 text-muted-foreground">{d.difficulty}</td>
                  <td className="py-2 pr-3">
                    <select
                      value={d.status}
                      onChange={(e) => quickStatus(d, e.target.value as DrillStatus)}
                      className="rounded border border-border bg-card px-1.5 py-0.5 text-xs text-foreground"
                      aria-label={`Status for ${d.name}`}
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="py-2 pr-3 text-muted-foreground">{d.sourceLabel}</td>
                  <td className="py-2">
                    <div className="flex items-center gap-1">
                      <StatusBadge tone={STATUS_TONE[d.status]}>{d.status}</StatusBadge>
                      <button onClick={() => (d.custom ? startCustomEdit(d) : startBaseEdit(d))} title="Edit" className="rounded p-1 text-muted-foreground hover:text-link"><SquarePen className="h-4 w-4" /></button>
                      {(d.custom || d.edited) && (
                        <button onClick={() => revert(d)} title={d.custom ? 'Delete' : 'Revert'} className="rounded p-1 text-muted-foreground hover:text-error-text">
                          {d.custom ? <Trash2 className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
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
