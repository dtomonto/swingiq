'use client';

// ============================================================
// GrowthOS — Generic record module engine
// ------------------------------------------------------------
// One client component renders ANY record-based module — KPI row, filter
// tabs, search, a sortable table, and a detail slide-over — driven by a
// declarative ModuleDefinition. Server pages pass only serializable data
// (records + a definitionId string); the definition (with its render
// functions) is looked up here on the client, so nothing un-serializable
// crosses the server/client boundary.
// ============================================================

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Inbox, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { KpiCard, StatusBadge, DataSourceBadge, PriorityBadge, EmptyState, FieldRow, MockDataNote } from './ui';
import { formatDate } from '@/lib/growth/format';
import { MODULE_DEFINITIONS, DEFINITION_KIND, type ColumnDef, type FieldDef } from './definitions';
import { RecordForm } from './RecordForm';
import { CopyForClaude, CopyForClaudeBundle } from '@/components/admin/CopyForClaude';
import { fromRecordFields, type ClaudeFixInput } from '@/lib/admin/claude-handoff';

const SECRET_KEY = 'growthos.adminSecret';

type AnyRecord = Record<string, unknown> & { id: string };

function valueOf(record: AnyRecord, def: ColumnDef | FieldDef): unknown {
  return def.accessor ? def.accessor(record) : record[def.key as string];
}

function renderValue(record: AnyRecord, def: ColumnDef | FieldDef): React.ReactNode {
  const v = valueOf(record, def);
  switch (def.type) {
    case 'status':
      return v ? <StatusBadge status={String(v)} /> : '—';
    case 'dataSource':
      return v ? <DataSourceBadge source={v as never} /> : '—';
    case 'priority':
      return v ? <PriorityBadge priority={v as never} /> : '—';
    case 'date':
      return formatDate(v as string | null);
    case 'list': {
      const arr = Array.isArray(v) ? (v as string[]) : [];
      if (arr.length === 0) return '—';
      return arr.join(', ');
    }
    case 'chips': {
      const arr = Array.isArray(v) ? (v as string[]) : [];
      if (arr.length === 0) return '—';
      return (
        <span className="flex flex-wrap gap-1">
          {arr.map((c, i) => (
            <span key={i} className="text-[11px] px-1.5 py-0.5 rounded bg-muted border border-border text-foreground">{c}</span>
          ))}
        </span>
      );
    }
    case 'number':
      return v === null || v === undefined ? '—' : String(v);
    default:
      return v === null || v === undefined || v === '' ? '—' : String(v);
  }
}

/** Flatten a record field to plain text for the Claude Code prompt. */
function plainValue(record: AnyRecord, def: ColumnDef | FieldDef): string {
  const v = valueOf(record, def);
  if (v === null || v === undefined || v === '') return '';
  if (Array.isArray(v)) return (v as unknown[]).map((x) => String(x)).join(', ');
  return String(v);
}

/** Turn one record into a ready-to-paste Claude Code fix prompt input,
 *  using the module's declared detail fields (so it works for any module). */
function buildRecordFix(
  record: AnyRecord,
  fields: FieldDef[],
  itemNoun: string,
  definitionId: string,
): ClaudeFixInput {
  const fixFields = fields
    .map((f) => ({ label: f.label, value: plainValue(record, f) }))
    .filter((f) => f.value && f.value !== '—');
  const title =
    String(record.name ?? record.title ?? '').trim() || `${itemNoun.replace(/s$/, '')} ${record.id}`;
  const affected: string[] = [];
  for (const key of ['pageUrl', 'url', 'sourceUrl', 'destinationUrl']) {
    const val = record[key];
    if (typeof val === 'string' && val.trim()) affected.push(val.trim());
  }
  const input = fromRecordFields({
    title,
    source: `GrowthOS · ${definitionId.replace(/[-_]/g, ' ')}`,
    fields: fixFields,
  });
  if (affected.length) input.affected = affected;
  return input;
}

export function RecordModule({
  definitionId,
  records: recordsProp,
  hideNote,
}: {
  definitionId: string;
  // Loose at the boundary so any concrete record type (which lacks an index
  // signature) can be passed; we treat them as AnyRecord internally.
  records: ReadonlyArray<{ id: string }>;
  hideNote?: boolean;
}) {
  const records = recordsProp as unknown as AnyRecord[];
  const def = MODULE_DEFINITIONS[definitionId];
  const kind = DEFINITION_KIND[definitionId];
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<{ mode: 'create' | 'edit'; record?: AnyRecord } | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function deleteRecord(record: AnyRecord, retrySecret?: string): Promise<void> {
    if (!kind) return;
    if (!retrySecret && !window.confirm(`Delete "${String(record.name ?? 'this record')}"? This can't be undone.`)) return;
    setDeleting(true);
    const secret = retrySecret ?? window.sessionStorage.getItem(SECRET_KEY);
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (secret) headers['x-admin-secret'] = secret;
    try {
      const res = await fetch('/api/growth/records', {
        method: 'DELETE', headers, body: JSON.stringify({ kind, id: record.id }),
      });
      if (res.status === 401) {
        const entered = window.prompt('Enter ADMIN_SECRET to delete (required in production):');
        if (entered) { window.sessionStorage.setItem(SECRET_KEY, entered); setDeleting(false); return deleteRecord(record, entered); }
        throw new Error('unauthorized');
      }
      setSelectedId(null);
      router.refresh();
    } catch {
      /* swallow — UI stays; user can retry */
    } finally {
      setDeleting(false);
    }
  }

  const filterValues = useMemo(() => {
    if (!def?.filterKey) return [];
    const set = new Set<string>();
    for (const r of records) {
      const val = r[def.filterKey as string];
      if (val) set.add(String(val));
    }
    return Array.from(set).sort();
  }, [def, records]);

  const filtered = useMemo(() => {
    if (!def) return [];
    return records.filter((r) => {
      if (filter !== 'all' && def.filterKey && String(r[def.filterKey as string]) !== filter) return false;
      if (query.trim()) {
        const hay = `${r.name ?? ''} ${JSON.stringify(r)}`.toLowerCase();
        if (!hay.includes(query.toLowerCase())) return false;
      }
      return true;
    });
  }, [def, records, filter, query]);

  if (!def) {
    return <EmptyState icon={Inbox} title="Module not configured" description={`No definition found for "${definitionId}".`} />;
  }

  const kpis = def.kpis ? def.kpis(records) : [];
  const selected = selectedId ? records.find((r) => r.id === selectedId) ?? null : null;

  return (
    <div className="space-y-5">
      {/* KPI row */}
      {kpis.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis.map((k, i) => (
            <KpiCard key={i} label={k.label} value={k.value} sublabel={k.sublabel} accent={k.accent ?? 'text-success-text'} />
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${def.itemNoun}…`}
            className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder-muted-foreground/70 focus:outline-hidden focus:ring-1 focus:ring-success"
          />
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs text-muted-foreground">{filtered.length} of {records.length} {def.itemNoun}</p>
          <CopyForClaudeBundle
            items={filtered.map((r) => buildRecordFix(r, def.detailFields, def.itemNoun, definitionId))}
            title={`${def.itemNoun} — ${definitionId.replace(/[-_]/g, ' ')}`}
            label={`Copy all for Claude Code (${filtered.length})`}
          />
          {kind && (
            <button
              onClick={() => setForm({ mode: 'create' })}
              className="text-xs px-3 py-2 rounded-lg bg-success hover:bg-success text-white font-semibold flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> New
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      {filterValues.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          {['all', ...filterValues].map((val) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={cn(
                'text-xs px-2.5 py-1 rounded-lg border transition-colors capitalize',
                filter === val
                  ? 'bg-success border-success text-white'
                  : 'bg-card border-border text-muted-foreground hover:border-border',
              )}
            >
              {val.replace(/[-_]/g, ' ')}
            </button>
          ))}
        </div>
      )}

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState icon={Inbox} title={`No ${def.itemNoun} match`} description="Try clearing the search or filter." />
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {def.columns.map((col) => (
                    <th key={col.key} className={cn('text-left px-4 py-2.5 text-xs font-medium text-muted-foreground', col.className)}>
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedId(r.id)}
                    className="border-b border-border/60 last:border-0 hover:bg-muted/40 cursor-pointer transition-colors"
                  >
                    {def.columns.map((col, ci) => (
                      <td key={col.key} className={cn('px-4 py-3 align-top', ci === 0 ? 'text-foreground font-medium' : 'text-muted-foreground', col.className)}>
                        {renderValue(r, col)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!hideNote && <MockDataNote />}

      {/* Detail slide-over */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
          <button type="button" aria-label="Close" tabIndex={-1} className="absolute inset-0 bg-foreground/60 cursor-default" onClick={() => setSelectedId(null)} />
          <div className="relative w-full max-w-md bg-background border-l border-border h-full overflow-y-auto">
            <div className="sticky top-0 bg-background/95 backdrop-blur border-b border-border px-5 py-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{String(selected.name ?? 'Detail')}</p>
                <p className="text-xs text-muted-foreground mt-0.5 capitalize">{def.itemNoun.replace(/s$/, '')}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <CopyForClaude
                  input={buildRecordFix(selected, def.detailFields, def.itemNoun, definitionId)}
                  label="Copy for Claude"
                />
                {kind && (
                  <>
                    <button
                      onClick={() => setForm({ mode: 'edit', record: selected })}
                      className="text-xs px-2 py-1.5 rounded-lg bg-muted border border-border text-foreground hover:border-border flex items-center gap-1"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => deleteRecord(selected)}
                      disabled={deleting}
                      className="text-xs px-2 py-1.5 rounded-lg bg-error/15 border border-error/30 text-error-text hover:bg-error/25 flex items-center gap-1 disabled:opacity-50"
                      aria-label="Delete"
                    >
                      {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </>
                )}
                <button onClick={() => setSelectedId(null)} className="text-muted-foreground hover:text-foreground px-1" aria-label="Close">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-5">
              <dl>
                {def.detailFields.map((f, i) => (
                  <FieldRow key={i} label={f.label}>{renderValue(selected, f)}</FieldRow>
                ))}
              </dl>
            </div>
          </div>
        </div>
      )}

      {/* Create / edit form */}
      {form && kind && (
        <RecordForm
          definitionId={definitionId}
          kind={kind}
          record={form.mode === 'edit' ? form.record : null}
          onClose={() => setForm(null)}
          onSaved={() => { setSelectedId(null); router.refresh(); }}
        />
      )}
    </div>
  );
}
