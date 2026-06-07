// ============================================================
// SwingVantage — Athletic Journey UI: shared presentational bits
// ------------------------------------------------------------
// Small, theme-token-driven helpers reused across the journey
// panels so colors, confidence chips, score bars, and the momentum
// gauge stay consistent. No data logic lives here.
// ============================================================

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import type { ConfidenceLevel, MomentumBand } from '@/lib/athletic-journey';

export function scoreTextClass(score: number | null): string {
  if (score === null) return 'text-muted-foreground';
  if (score < 45) return 'text-error';
  if (score < 65) return 'text-warning';
  return 'text-success';
}

export function scoreBarClass(score: number | null): string {
  if (score === null) return 'bg-muted';
  if (score < 45) return 'bg-error';
  if (score < 65) return 'bg-warning';
  return 'bg-success';
}

export const CONFIDENCE_META: Record<
  ConfidenceLevel,
  { label: string; variant: Parameters<typeof Badge>[0]['variant']; blurb: string }
> = {
  high: { label: 'High confidence', variant: 'success', blurb: 'Multiple recent, consistent data sources.' },
  medium: { label: 'Solid confidence', variant: 'info', blurb: 'Several useful signals with a few gaps.' },
  low: { label: 'Early read', variant: 'warning', blurb: 'Limited data so far — keep adding evidence.' },
  provisional: { label: 'Provisional', variant: 'medium', blurb: 'Not enough data yet to be sure.' },
};

export const MOMENTUM_META: Record<MomentumBand, { label: string; bar: string; text: string }> = {
  inactive: { label: 'Inactive', bar: 'bg-error', text: 'text-error' },
  low: { label: 'Low momentum', bar: 'bg-warning', text: 'text-warning' },
  building: { label: 'Building', bar: 'bg-warning', text: 'text-warning' },
  strong: { label: 'Strong', bar: 'bg-success', text: 'text-success' },
  accelerated: { label: 'Accelerated', bar: 'bg-success', text: 'text-success' },
};

export function ScoreBar({ score, className }: { score: number | null; className?: string }) {
  const observed = score !== null;
  return (
    <div className={cn('h-2 rounded-full bg-muted overflow-hidden', className)}>
      <div
        className={cn('h-full rounded-full transition-all', scoreBarClass(score))}
        style={{ width: observed ? `${score}%` : '0%' }}
      />
    </div>
  );
}

export function ConfidenceChip({ level }: { level: ConfidenceLevel }) {
  const m = CONFIDENCE_META[level];
  return <Badge variant={m.variant}>{m.label}</Badge>;
}

/** Compact momentum gauge: big number + banded bar + label. */
export function MomentumGauge({ score, band }: { score: number; band: MomentumBand }) {
  const m = MOMENTUM_META[band];
  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className={cn('text-3xl font-bold tabular-nums', m.text)}>{score}</span>
        <span className="text-xs text-muted-foreground">/100</span>
        <span className={cn('ml-auto text-sm font-semibold', m.text)}>{m.label}</span>
      </div>
      <div className="mt-2 h-2.5 rounded-full bg-muted overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', m.bar)} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}
