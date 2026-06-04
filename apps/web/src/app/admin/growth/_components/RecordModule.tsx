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
import { Search, X, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { KpiCard, StatusBadge, DataSourceBadge, PriorityBadge, EmptyState, FieldRow, MockDataNote } from './ui';
import { formatDate } from '@/lib/growth/format';
import { MODULE_DEFINITIONS, type ColumnDef, type FieldDef } from './definitions';

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
            <span key={i} className="text-[11px] px-1.5 py-0.5 rounded bg-gray-800 border border-gray-700 text-gray-300">{c}</span>
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
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
            <KpiCard key={i} label={k.label} value={k.value} sublabel={k.sublabel} accent={k.accent ?? 'text-green-400'} />
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${def.itemNoun}…`}
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-hidden focus:ring-1 focus:ring-green-500"
          />
        </div>
        <p className="text-xs text-gray-500">{filtered.length} of {records.length} {def.itemNoun}</p>
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
                  ? 'bg-green-600 border-green-500 text-white'
                  : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700',
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
        <div className="rounded-xl border border-gray-800 bg-gray-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-800/30">
                  {def.columns.map((col) => (
                    <th key={col.key} className={cn('text-left px-4 py-2.5 text-xs font-medium text-gray-400', col.className)}>
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
                    className="border-b border-gray-800/60 last:border-0 hover:bg-gray-800/40 cursor-pointer transition-colors"
                  >
                    {def.columns.map((col, ci) => (
                      <td key={col.key} className={cn('px-4 py-3 align-top', ci === 0 ? 'text-gray-200 font-medium' : 'text-gray-400', col.className)}>
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
          <div className="absolute inset-0 bg-black/60" onClick={() => setSelectedId(null)} />
          <div className="relative w-full max-w-md bg-gray-950 border-l border-gray-800 h-full overflow-y-auto">
            <div className="sticky top-0 bg-gray-950/95 backdrop-blur border-b border-gray-800 px-5 py-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-100">{String(selected.name ?? 'Detail')}</p>
                <p className="text-xs text-gray-500 mt-0.5 capitalize">{def.itemNoun.replace(/s$/, '')}</p>
              </div>
              <button onClick={() => setSelectedId(null)} className="text-gray-500 hover:text-gray-300 shrink-0" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
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
    </div>
  );
}
