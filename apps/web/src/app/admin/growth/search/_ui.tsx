// ============================================================
// SearchIntelligenceOS — shared presentational helpers (server-safe)
// ------------------------------------------------------------
// Small bits reused across the Command Center + sub-pages. No client hooks,
// so server components can import freely. Matches the GrowthOS dark palette.
// ============================================================

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '../_components/ui';
import type { ScoreBreakdown, IssueSeverity, ActionBand } from '@/lib/growth/search-intelligence';

/** 0..100 score → traffic-light text colour. */
export function accent(score: number): string {
  if (score >= 70) return 'text-green-400';
  if (score >= 45) return 'text-amber-400';
  return 'text-red-400';
}

export function barColor(score: number): string {
  if (score >= 70) return 'bg-green-500/70';
  if (score >= 45) return 'bg-amber-500/70';
  return 'bg-red-500/70';
}

/** Compact score tile with an explainable first factor underneath. */
export function ScoreTile({ label, breakdown }: { label: string; breakdown: ScoreBreakdown }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-3.5" title={breakdown.factors.join('\n')}>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs text-gray-400">{label}</p>
        <p className={cn('text-xl font-bold leading-none tabular-nums', accent(breakdown.score))}>{breakdown.score}</p>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-800">
        <div className={cn('h-full rounded-full', barColor(breakdown.score))} style={{ width: `${breakdown.score}%` }} />
      </div>
      {breakdown.factors[0] ? (
        <p className="mt-1.5 text-[10px] text-gray-600 leading-snug line-clamp-2">{breakdown.factors[0]}</p>
      ) : null}
    </div>
  );
}

const SEVERITY_CLASS: Record<IssueSeverity, string> = {
  critical: 'text-red-400 bg-red-400/10 border-red-400/30',
  high: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
  medium: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  low: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  informational: 'text-gray-400 bg-gray-400/10 border-gray-500/30',
};

export function SeverityBadge({ severity }: { severity: IssueSeverity }) {
  return <Badge className={SEVERITY_CLASS[severity]}>{severity}</Badge>;
}

const BAND_CLASS: Record<ActionBand, string> = {
  critical: 'text-red-400 bg-red-400/10 border-red-400/30',
  high: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  medium: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  low: 'text-gray-400 bg-gray-400/10 border-gray-500/30',
};

export function BandBadge({ band, score }: { band: ActionBand; score: number }) {
  return <Badge className={BAND_CLASS[band]}>{band} · {score}</Badge>;
}

export function Pill({ children, tone = 'gray' }: { children: ReactNode; tone?: 'gray' | 'green' | 'amber' }) {
  const cls = tone === 'green'
    ? 'text-green-400 bg-green-400/10 border-green-400/30'
    : tone === 'amber'
      ? 'text-amber-400 bg-amber-400/10 border-amber-400/30'
      : 'text-gray-400 bg-gray-800 border-gray-700';
  return <span className={cn('inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border', cls)}>{children}</span>;
}
