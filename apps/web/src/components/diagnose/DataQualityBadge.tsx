// ============================================================
// SwingVantage — Imported-session data-quality badge
// A small, honest chip showing how complete/trustworthy the session's data
// is (the LM-import equivalent of video's visibilityQuality). The band + its
// reasons come straight from the diagnostic engine's `quality` — and the same
// completeness factor has already been folded into every shown confidence.
// ============================================================

import { Database } from 'lucide-react';
import type { ImportDataQuality } from '@swingiq/core';

const TONE: Record<ImportDataQuality['band'], string> = {
  excellent: 'border-success/40 bg-success/10 text-success-text',
  good: 'border-success/30 bg-success/5 text-success-text',
  limited: 'border-warning/40 bg-warning/10 text-warning-text',
  poor: 'border-error/40 bg-error/10 text-error-text',
};

const LABEL: Record<ImportDataQuality['band'], string> = {
  excellent: 'Excellent data', good: 'Good data', limited: 'Limited data', poor: 'Thin data',
};

export function DataQualityBadge({ quality }: { quality: ImportDataQuality }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${TONE[quality.band]}`}
      title={`Data quality ${quality.score}/100 — ${quality.reasons.join(' ')}`}
    >
      <Database className="h-3.5 w-3.5" />
      {LABEL[quality.band]}
    </span>
  );
}
