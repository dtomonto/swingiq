'use client';

// DataTable — the reusable admin table: client-side search, sort,
// pagination, optional row links and bulk actions, with first-class
// empty / loading states. Generic over the row type.

import { useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
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
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder={searchPlaceholder}
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-none focus:border-ring"
          />
        </div>
      )}

      {/* Bulk action bar */}
      {hasBulk && selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary/[0.06] px-3 py-2 text-sm">
          <span className="text-foreground">{selectedIds.length} selected</span>
          <div className="flex flex-wrap gap-2">
            {bulkActions!.map((a) => (
              <button
                key={a.label}
                onClick={() => a.onRun(selectedIds)}
                className={`rounded-md px-2 py-1 text-xs font-medium ${
                  a.danger
                    ? 'bg-error/80 text-white hover:bg-error'
                    : 'bg-muted text-foreground hover:bg-muted'
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
          <button onClick={() => setSelected(new Set())} className="ml-auto text-xs text-muted-foreground hover:text-foreground">
            Clear
          </button>
        </div>
      )}

      {/* Table — tablet / desktop (≥640px). On phones the card list below
          replaces it so columns never crush or force horizontal scrolling. */}
      <div className="hidden overflow-x-auto rounded-xl border border-border sm:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-card/80 text-2xs uppercase tracking-wide text-muted-foreground">
            <tr>
              {hasBulk && (
                <th className="w-10 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={toggleSelectAllOnPage}
                    className="accent-primary"
                    aria-label="Select all on page"
                  />
                </th>
              )}
              {columns.map((c) => (
                <th key={c.key} className={`px-3 py-2 font-medium ${c.headerClassName ?? ''}`}>
                  {c.sortValue ? (
                    <button
                      onClick={() => toggleSort(c.key)}
                      className="inline-flex items-center gap-1 hover:text-foreground"
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
          <tbody className="divide-y divide-border text-foreground">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={columns.length + (hasBulk ? 1 : 0)} className="px-3 py-3">
                    <div className="h-4 w-full animate-pulse rounded bg-muted" />
                  </td>
                </tr>
              ))
            ) : pageRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (hasBulk ? 1 : 0)} className="px-3 py-10 text-center text-muted-foreground">
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
                    className={href ? 'cursor-pointer hover:bg-card/60' : 'hover:bg-card/40'}
                    onClick={href ? () => router.push(href) : undefined}
                  >
                    {hasBulk && (
                      <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selected.has(id)}
                          onChange={() => toggleRow(id)}
                          className="accent-primary"
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

      {/* Cards — phones (<640px). Same rows, sort, search and pagination as
          the table; each row becomes a stacked card with the first column as
          the title and the rest as label/value pairs (reusing each column's
          render fn). The whole card is a real link when rowHref is set. */}
      <div className="space-y-2 sm:hidden">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border p-3">
              <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
              <div className="mt-2 h-3 w-full animate-pulse rounded bg-muted/70" />
            </div>
          ))
        ) : pageRows.length === 0 ? (
          <div className="rounded-xl border border-border px-3 py-10 text-center text-muted-foreground">
            {emptyState ?? 'No records found.'}
          </div>
        ) : (
          pageRows.map((row) => {
            const id = getRowId(row);
            const href = rowHref?.(row);
            const [primary, ...rest] = columns;
            const renderCell = (c: Column<T>): ReactNode =>
              c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? '');
            return (
              <div key={id} className="rounded-xl border border-border bg-card/40 p-3">
                <div className="flex items-start gap-2">
                  {hasBulk && (
                    <input
                      type="checkbox"
                      checked={selected.has(id)}
                      onChange={() => toggleRow(id)}
                      className="mt-1 accent-primary"
                      aria-label="Select row"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    {href ? (
                      <Link
                        href={href}
                        className="block rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {renderCell(primary)}
                      </Link>
                    ) : (
                      renderCell(primary)
                    )}
                  </div>
                </div>
                {rest.length > 0 && (
                  <div className="mt-2.5 space-y-1.5 border-t border-border/70 pt-2.5">
                    {rest.map((c) => (
                      <div key={c.key} className="flex items-start justify-between gap-3 text-sm">
                        <span className="shrink-0 text-2xs font-medium uppercase tracking-wide text-muted-foreground">
                          {c.header}
                        </span>
                        <span className="min-w-0 text-right text-foreground">{renderCell(c)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {sorted.length > pageSize && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, sorted.length)} of {sorted.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="tap-target rounded hover:bg-muted disabled:opacity-30"
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
              className="tap-target rounded hover:bg-muted disabled:opacity-30"
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
