'use client';

// ============================================================
// SearchIntelligenceOS — Site Explorer table (client)
// ------------------------------------------------------------
// Filterable/sortable URL inventory. Receives serializable rows (depth is
// pre-sanitized server-side: orphans = null, never Infinity). Each row links
// to the Page Intelligence deep-dive.
// ============================================================

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, ExternalLink } from 'lucide-react';
import { humanize } from '@/lib/growth/format';
import { DataSourceBadge } from '../../_components/ui';
import { accent } from '../_ui';
import { ExportCsvButton } from '../ExportCsvButton';
import type { DataSource, CsvValue } from '@/lib/growth/search-intelligence';

export interface ExplorerRow {
  url: string;
  title: string;
  pageType: string;
  sport: string;
  source: string;
  indexable: boolean;
  inSitemap: boolean;
  schemaCount: number;
  wordCount: number | null;
  internalLinksIn: number;
  internalLinksOut: number;
  depth: number | null;
  isOrphan: boolean;
  qualityScore: number;
  priorityScore: number;
  publishStatus: string;
  dataSource: DataSource;
  keyword?: string;
}

type SortKey = 'priorityScore' | 'qualityScore' | 'internalLinksIn' | 'wordCount';

const BASE = '/admin/growth/search';

export function SiteExplorerTable({ rows }: { rows: ExplorerRow[] }) {
  const [q, setQ] = useState('');
  const [type, setType] = useState('all');
  const [source, setSource] = useState('all');
  const [sort, setSort] = useState<SortKey>('priorityScore');

  const pageTypes = useMemo(() => ['all', ...Array.from(new Set(rows.map((r) => r.pageType))).sort()], [rows]);
  const sources = useMemo(() => ['all', ...Array.from(new Set(rows.map((r) => r.source))).sort()], [rows]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows
      .filter((r) => (type === 'all' || r.pageType === type))
      .filter((r) => (source === 'all' || r.source === source))
      .filter((r) => !needle || r.url.toLowerCase().includes(needle) || r.title.toLowerCase().includes(needle) || (r.keyword ?? '').toLowerCase().includes(needle))
      .sort((a, b) => (b[sort] ?? -1) - (a[sort] ?? -1));
  }, [rows, q, type, source, sort]);

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-gray-600 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter by URL, title, or keyword…"
            className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-8 pr-2 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-hidden focus:ring-1 focus:ring-green-500"
          />
        </div>
        <Select value={type} onChange={setType} options={pageTypes} label="Type" />
        <Select value={source} onChange={setSource} options={sources} label="Source" />
        <Select value={sort} onChange={(v) => setSort(v as SortKey)} options={['priorityScore', 'qualityScore', 'internalLinksIn', 'wordCount']} label="Sort" />
        <span className="text-[11px] text-gray-500 ml-auto">{filtered.length} / {rows.length} pages</span>
        <ExportCsvButton rows={filtered as unknown as Record<string, CsvValue>[]} filename="swingvantage-site-explorer.csv" />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-gray-800/50 text-gray-500">
            <tr>
              <th className="px-3 py-2 font-medium">URL</th>
              <th className="px-3 py-2 font-medium">Type</th>
              <th className="px-3 py-2 font-medium text-center">Index</th>
              <th className="px-3 py-2 font-medium text-center">Sitemap</th>
              <th className="px-3 py-2 font-medium text-center">Schema</th>
              <th className="px-3 py-2 font-medium text-right">Words</th>
              <th className="px-3 py-2 font-medium text-right">In·Out</th>
              <th className="px-3 py-2 font-medium text-right">Depth</th>
              <th className="px-3 py-2 font-medium text-right">Quality</th>
              <th className="px-3 py-2 font-medium text-right">Priority</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filtered.map((r) => (
              <tr key={r.url} className="hover:bg-gray-800/30">
                <td className="px-3 py-2 max-w-[260px]">
                  <Link href={`${BASE}/page-intel?url=${encodeURIComponent(r.url)}`} className="text-gray-200 hover:text-green-300 truncate block font-mono">{r.url}</Link>
                  <span className="text-[10px] text-gray-600 truncate block">{r.title}</span>
                </td>
                <td className="px-3 py-2 text-gray-400 whitespace-nowrap">{humanize(r.pageType)}</td>
                <td className="px-3 py-2 text-center">{r.indexable ? <Dot ok /> : <Dot />}</td>
                <td className="px-3 py-2 text-center">{r.inSitemap ? <Dot ok /> : <Dot warn />}</td>
                <td className="px-3 py-2 text-center text-gray-400">{r.schemaCount || '—'}</td>
                <td className="px-3 py-2 text-right text-gray-400 tabular-nums">{r.wordCount ?? '—'}</td>
                <td className="px-3 py-2 text-right text-gray-400 tabular-nums">{r.internalLinksIn}·{r.internalLinksOut}</td>
                <td className="px-3 py-2 text-right tabular-nums">{r.isOrphan ? <span className="text-red-400">orphan</span> : r.depth}</td>
                <td className={`px-3 py-2 text-right tabular-nums font-semibold ${accent(r.qualityScore)}`}>{r.qualityScore}</td>
                <td className={`px-3 py-2 text-right tabular-nums font-semibold ${accent(r.priorityScore)}`}>{r.priorityScore}</td>
                <td className="px-3 py-2">
                  <a href={r.url} target="_blank" rel="noreferrer" className="text-gray-600 hover:text-gray-300"><ExternalLink className="w-3.5 h-3.5" /></a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 ? <p className="text-sm text-gray-500 text-center py-6">No pages match these filters.</p> : null}
      <div className="flex justify-end"><DataSourceBadge source="real" /></div>
    </div>
  );
}

function Select({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: string[]; label: string }) {
  return (
    <label className="flex items-center gap-1 text-[11px] text-gray-500">
      <span className="hidden sm:inline">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-gray-900 border border-gray-800 rounded-lg px-2 py-1.5 text-xs text-gray-200 focus:outline-hidden focus:ring-1 focus:ring-green-500"
      >
        {options.map((o) => <option key={o} value={o}>{o === 'all' ? `All ${label.toLowerCase()}s` : humanize(o)}</option>)}
      </select>
    </label>
  );
}

function Dot({ ok, warn }: { ok?: boolean; warn?: boolean }) {
  const cls = ok ? 'bg-green-500' : warn ? 'bg-amber-500' : 'bg-gray-600';
  return <span className={`inline-block h-2 w-2 rounded-full ${cls}`} />;
}
