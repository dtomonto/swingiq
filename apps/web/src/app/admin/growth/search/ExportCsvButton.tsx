'use client';

// ============================================================
// SearchIntelligenceOS — reusable "Export CSV" button (client)
// ------------------------------------------------------------
// Takes already-flattened rows and downloads them as a CSV using the pure
// `toCsv` serializer. Used on every table (keywords, explorer, audit,
// opportunities, sitemap).
// ============================================================

import { Download } from 'lucide-react';
import { toCsv, type CsvValue } from '@/lib/growth/search-intelligence/csv';

export function ExportCsvButton({
  rows, filename, label = 'Export CSV',
}: {
  rows: Record<string, CsvValue>[];
  filename: string;
  label?: string;
}) {
  function download() {
    if (rows.length === 0) return;
    const csv = toCsv(rows);
    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={download}
      disabled={rows.length === 0}
      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-800/60 hover:bg-gray-700/60 disabled:opacity-50 text-gray-200 text-xs font-medium px-2.5 py-1.5"
      title={rows.length === 0 ? 'Nothing to export' : `Export ${rows.length} rows`}
    >
      <Download className="w-3.5 h-3.5" /> {label}
    </button>
  );
}
