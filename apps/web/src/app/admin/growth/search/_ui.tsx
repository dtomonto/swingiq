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
  if (score >= 70) return 'text-success-text';
  if (score >= 45) return 'text-link';
  return 'text-error-text';
}

export function barColor(score: number): string {
  if (score >= 70) return 'bg-success/70';
  if (score >= 45) return 'bg-primary/70';
  return 'bg-error/70';
}

/** Compact score tile with an explainable first factor underneath. */
export function ScoreTile({ label, breakdown }: { label: string; breakdown: ScoreBreakdown }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3.5" title={breakdown.factors.join('\n')}>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn('text-xl font-bold leading-none tabular-nums', accent(breakdown.score))}>{breakdown.score}</p>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full', barColor(breakdown.score))} style={{ width: `${breakdown.score}%` }} />
      </div>
      {breakdown.factors[0] ? (
        <p className="mt-1.5 text-[10px] text-muted-foreground/70 leading-snug line-clamp-2">{breakdown.factors[0]}</p>
      ) : null}
    </div>
  );
}

const SEVERITY_CLASS: Record<IssueSeverity, string> = {
  critical: 'text-error-text bg-error/10 border-error/30',
  high: 'text-warning-text bg-warning/10 border-warning/30',
  medium: 'text-link bg-primary/10 border-primary/30',
  low: 'text-link bg-primary/10 border-primary/30',
  informational: 'text-muted-foreground bg-muted/10 border-border/30',
};

export function SeverityBadge({ severity }: { severity: IssueSeverity }) {
  return <Badge className={SEVERITY_CLASS[severity]}>{severity}</Badge>;
}

const BAND_CLASS: Record<ActionBand, string> = {
  critical: 'text-error-text bg-error/10 border-error/30',
  high: 'text-link bg-primary/10 border-primary/30',
  medium: 'text-link bg-primary/10 border-primary/30',
  low: 'text-muted-foreground bg-muted/10 border-border/30',
};

export function BandBadge({ band, score }: { band: ActionBand; score: number }) {
  return <Badge className={BAND_CLASS[band]}>{band} · {score}</Badge>;
}

export function Pill({ children, tone = 'gray' }: { children: ReactNode; tone?: 'gray' | 'green' | 'amber' }) {
  const cls = tone === 'green'
    ? 'text-success-text bg-success/10 border-success/30'
    : tone === 'amber'
      ? 'text-link bg-primary/10 border-primary/30'
      : 'text-muted-foreground bg-muted border-border';
  return <span className={cn('inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border', cls)}>{children}</span>;
}
