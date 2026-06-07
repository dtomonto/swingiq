'use client';

// DataTable — the reusable admin table: client-side search, sort,
// pagination, optional row links and bulk actions, with first-class
// empty / loading states. Generic over the row type.

import { useMemo, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowUpDown, ArrowUp, ArrowDown, Search, ChevronLeft, ChevronRight,
} from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  /** Value used for sorting this column (enables the sort toggle). */
  sortValue?: (row: T) => string | number;
  className?: string;
  headerClassName?: string;
}

export interface BulkAction {
  label: string;
  onRun: (ids: string[]) => void;
  danger?: boolean;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  /** Returns the searchable text for a row (enables the search box). */
  searchText?: (row: T) => string;
  searchPlaceholder?: string;
  pageSize?: number;
  rowHref?: (row: T) => string | undefined;
  bulkActions?: BulkAction[];
  emptyState?: ReactNode;
  loading?: boolean;
  initialSortKey?: string;
}

type SortDir = 'asc' | 'desc';

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  searchText,
  searchPlaceholder = 'Search…',
  pageSize = 20,
  rowHref,
  bulkActions,
  emptyState,
  loading = false,
  initialSortKey,
}: DataTableProps<T>) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<string | undefined>(initialSortKey);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    if (!query.trim() || !searchText) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) => searchText(r).toLowerCase().includes(q));
  }, [rows, query, searchText]);

  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return filtered;
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  }, [filtered, columns, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = sorted.slice(safePage * pageSize, safePage * pageSize + pageSize);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const allOnPageSelected = pageRows.length > 0 && pageRows.every((r) => selected.has(getRowId(r)));
  const toggleSelectAllOnPage = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) pageRows.forEach((r) => next.delete(getRowId(r)));
      else pageRows.forEach((r) => next.add(getRowId(r)));
      return next;
    });
  };
  const toggleRow = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const hasBulk = Boolean(bulkActions && bulkActions.length > 0);
  const selectedIds = [...selected];

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      {searchText && (
        <div className="relative max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder={searchPlaceholder}
            className="w-full rounded-lg border border-gray-700 bg-gray-950 py-2 pl-9 pr-3 text-sm text-gray-100 outline-none focus:border-amber-500"
          />
        </div>
      )}

      {/* Bulk action bar */}
      {hasBulk && selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/[0.06] px-3 py-2 text-sm">
          <span className="text-gray-300">{selectedIds.length} selected</span>
          <div className="flex flex-wrap gap-2">
            {bulkActions!.map((a) => (
              <button
                key={a.label}
                onClick={() => a.onRun(selectedIds)}
                className={`rounded-md px-2 py-1 text-xs font-medium ${
                  a.danger
                    ? 'bg-red-600/80 text-white hover:bg-red-500'
                    : 'bg-gray-800 text-gray-200 hover:bg-gray-700'
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-xs text-gray-500 hover:text-gray-300">
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-900/80 text-[11px] uppercase tracking-wide text-gray-500">
            <tr>
              {hasBulk && (
                <th className="w-10 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={toggleSelectAllOnPage}
                    className="accent-amber-500"
                    aria-label="Select all on page"
                  />
                </th>
              )}
              {columns.map((c) => (
                <th key={c.key} className={`px-3 py-2 font-medium ${c.headerClassName ?? ''}`}>
                  {c.sortValue ? (
                    <button
                      onClick={() => toggleSort(c.key)}
                      className="inline-flex items-center gap-1 hover:text-gray-300"
                    >
                      {c.header}
                      {sortKey === c.key ? (
                        sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-40" />
                      )}
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800 text-gray-300">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={columns.length + (hasBulk ? 1 : 0)} className="px-3 py-3">
                    <div className="h-4 w-full animate-pulse rounded bg-gray-800" />
                  </td>
                </tr>
              ))
            ) : pageRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (hasBulk ? 1 : 0)} className="px-3 py-10 text-center text-gray-500">
                  {emptyState ?? 'No records found.'}
                </td>
              </tr>
            ) : (
              pageRows.map((row) => {
                const id = getRowId(row);
                const href = rowHref?.(row);
                return (
                  <tr
                    key={id}
                    className={href ? 'cursor-pointer hover:bg-gray-900/60' : 'hover:bg-gray-900/40'}
                    onClick={href ? () => router.push(href) : undefined}
                  >
                    {hasBulk && (
                      <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.has(id)}
                          onChange={() => toggleRow(id)}
                          className="accent-amber-500"
                          aria-label="Select row"
                        />
                      </td>
                    )}
                    {columns.map((c) => (
                      <td key={c.key} className={`px-3 py-2 align-middle ${c.className ?? ''}`}>
                        {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? '')}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {sorted.length > pageSize && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, sorted.length)} of {sorted.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="rounded p-1 hover:bg-gray-800 disabled:opacity-30"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-1">
              {safePage + 1} / {pageCount}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              disabled={safePage >= pageCount - 1}
              className="rounded p-1 hover:bg-gray-800 disabled:opacity-30"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
