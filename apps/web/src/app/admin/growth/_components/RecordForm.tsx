'use client';

// ============================================================
// GrowthOS — Generic record form (create / edit)
// ------------------------------------------------------------
// Renders an editable form for ANY record module from its derived form
// fields, and persists via /api/growth/records. If the write API requires
// an admin secret (production), it prompts once and remembers it for the
// session. Used by RecordModule's New / Edit actions.
// ============================================================

import { useState } from 'react';
import { X, Loader2, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MODULE_DEFINITIONS, deriveFormFields, type FormFieldDef } from './definitions';
import type { PriorityInputs, Scale } from '@/lib/growth/types';

type AnyRecord = Record<string, unknown> & { id: string };
const SECRET_KEY = 'growthos.adminSecret';
const SCALES: Scale[] = ['low', 'medium', 'high'];

function defaultValue(input: FormFieldDef['input']): unknown {
  switch (input) {
    case 'tags': return [];
    case 'checkbox': return false;
    case 'number': return null;
    case 'priority': return { impact: 'medium', confidence: 'medium', effort: 'medium' } as PriorityInputs;
    default: return '';
  }
}

export function RecordForm({
  definitionId, kind, record, onClose, onSaved,
}: {
  definitionId: string;
  kind: string;
  record?: AnyRecord | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const def = MODULE_DEFINITIONS[definitionId];
  const fields = deriveFormFields(def);
  const isEdit = !!record;

  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const init: Record<string, unknown> = {};
    for (const f of fields) {
      init[f.key] = record && record[f.key] !== undefined ? record[f.key] : defaultValue(f.input);
    }
    return init;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: string, v: unknown) => setValues((prev) => ({ ...prev, [key]: v }));

  async function submit(retrySecret?: string) {
    setSaving(true);
    setError(null);
    const secret = retrySecret ?? (typeof window !== 'undefined' ? window.sessionStorage.getItem(SECRET_KEY) : null);
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (secret) headers['x-admin-secret'] = secret;

    const body = isEdit
      ? { kind, id: record!.id, patch: values }
      : { kind, record: values };

    try {
      const res = await fetch('/api/growth/records', {
        method: isEdit ? 'PATCH' : 'POST',
        headers,
        body: JSON.stringify(body),
      });
      if (res.status === 401) {
        const entered = typeof window !== 'undefined' ? window.prompt('Enter ADMIN_SECRET to save (required in production):') : null;
        if (entered) {
          window.sessionStorage.setItem(SECRET_KEY, entered);
          setSaving(false);
          return submit(entered);
        }
        throw new Error('Admin authorization required.');
      }
      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: 'Save failed.' }));
        throw new Error(j.error ?? `Server returned ${res.status}`);
      }
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <button type="button" aria-label="Close" tabIndex={-1} className="absolute inset-0 bg-black/60 cursor-default" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[88vh] overflow-y-auto bg-gray-950 border border-gray-800 rounded-2xl shadow-2xl">
        <div className="sticky top-0 bg-gray-950/95 backdrop-blur border-b border-gray-800 px-5 py-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-100">{isEdit ? 'Edit' : 'New'} {def.itemNoun.replace(/s$/, '')}</p>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300" aria-label="Close"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-4">
          {fields.map((f) => (
            <Field key={f.key} field={f} value={values[f.key]} onChange={(v) => set(f.key, v)} />
          ))}

          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-300">{error}</div>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-950/95 backdrop-blur border-t border-gray-800 px-5 py-3 flex justify-end gap-2">
          <button onClick={onClose} className="text-xs px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:border-gray-600">Cancel</button>
          <button
            onClick={() => submit()}
            disabled={saving || !String(values.name ?? '').trim()}
            className={cn('text-xs px-4 py-2 rounded-lg font-semibold flex items-center gap-1.5', saving || !String(values.name ?? '').trim() ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500 text-white')}
          >
            {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</> : <><Save className="w-3.5 h-3.5" /> {isEdit ? 'Save changes' : 'Create'}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputCls = 'w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-hidden focus:ring-1 focus:ring-green-500';

function Field({ field, value, onChange }: { field: FormFieldDef; value: unknown; onChange: (v: unknown) => void }) {
  const label = <label className="text-xs font-medium text-gray-400 mb-1 block">{field.label}{field.key === 'name' ? ' *' : ''}</label>;

  if (field.input === 'priority') {
    const p = (value as PriorityInputs) ?? { impact: 'medium', confidence: 'medium', effort: 'medium' };
    return (
      <div>
        {label}
        <div className="grid grid-cols-3 gap-2">
          {(['impact', 'confidence', 'effort'] as const).map((dim) => (
            <div key={dim}>
              <p className="text-[10px] uppercase tracking-wide text-gray-600 mb-1">{dim}</p>
              <select value={p[dim]} onChange={(e) => onChange({ ...p, [dim]: e.target.value })} className={inputCls}>
                {SCALES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (field.input === 'checkbox') {
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 rounded border-gray-700 bg-gray-900 accent-green-500" />
        <span className="text-xs text-gray-300">{field.label}</span>
      </label>
    );
  }

  if (field.input === 'textarea') {
    return (
      <div>
        {label}
        <textarea value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} rows={3} className={cn(inputCls, 'resize-y')} />
      </div>
    );
  }

  if (field.input === 'tags') {
    const arr = Array.isArray(value) ? (value as string[]) : [];
    return (
      <div>
        {label}
        <input
          value={arr.join(', ')}
          onChange={(e) => onChange(e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
          placeholder="Comma-separated"
          className={inputCls}
        />
      </div>
    );
  }

  if (field.input === 'number') {
    return (
      <div>
        {label}
        <input
          type="number"
          value={value === null || value === undefined ? '' : String(value)}
          onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
          className={inputCls}
        />
      </div>
    );
  }

  if (field.input === 'date') {
    const v = value ? String(value).slice(0, 10) : '';
    return (
      <div>
        {label}
        <input type="date" value={v} onChange={(e) => onChange(e.target.value || null)} className={inputCls} />
      </div>
    );
  }

  // text
  return (
    <div>
      {label}
      <input value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} className={inputCls} />
    </div>
  );
}
