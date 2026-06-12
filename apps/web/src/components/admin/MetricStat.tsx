// MetricCard — a single KPI tile. Server-safe. `value` accepts a node so honest
// non-numeric states ("—", "Not tracked") render cleanly. Optional trend +
// interpreted status tint (the L4 routine tile of the Admin OS severity scale).
//
// `MetricStat` is kept as a backward-compatible alias for existing callers.

import type { ReactNode } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Minus, ArrowUpRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { metricHref } from '@/lib/admin/metrics';

export interface MetricCardProps {
  label: string;
  value: ReactNode;
  /** Small unit rendered after the value (e.g. "%", "s", "★"). */
  unit?: string;
  hint?: string;
  icon?: LucideIcon;
  /** Subtle accent on the value (used when `status` is not set). */
  tone?: 'default' | 'success' | 'warning' | 'muted';
  /** Trend direction — renders an arrow before `trendLabel`. */
  trend?: 'up' | 'down' | 'neutral';
  /** Vs-what label next to the trend arrow ("+12% vs last Wed"). */
  trendLabel?: string;
  /** Interpreted status — tints the tile and the value. Only when earned. */
  status?: 'good' | 'warning' | 'critical';
  /** When set, the whole tile becomes a link to its explainer page
   *  (/admin/metrics/<metricId>) that defines the metric in depth. */
  metricId?: string;
  /** Optional plain-text value passed to the explainer so an uncurated
   *  metric can still show the number you clicked. */
  metricValueText?: string;
}

const VALUE_TONE: Record<NonNullable<MetricCardProps['tone']>, string> = {
  default: 'text-foreground',
  success: 'text-success-text',
  warning: 'text-link',
  muted: 'text-muted-foreground',
};

// Status drives the L4 flat-tile tint. `good` stays neutral (no tint) — colour
// is budgeted; a green tile is only earned when it genuinely matters.
const STATUS_TILE: Record<NonNullable<MetricCardProps['status']>, string> = {
  good: '',
  warning: 'border-warning/35 bg-warning/[0.05]',
  critical: 'border-error/35 bg-error/[0.04]',
};
const STATUS_VALUE: Record<NonNullable<MetricCardProps['status']>, string> = {
  good: 'text-success-text',
  warning: 'text-warning-text',
  critical: 'text-error-text',
};
const TREND_ICON = { up: TrendingUp, down: TrendingDown, neutral: Minus } as const;

export function MetricCard({
  label, value, unit, hint, icon: Icon, tone = 'default', trend, trendLabel, status,
  metricId, metricValueText,
}: MetricCardProps) {
  const valueColor = status ? STATUS_VALUE[status] : VALUE_TONE[tone];
  const tile = status ? STATUS_TILE[status] : '';
  const TrendIcon = trend ? TREND_ICON[trend] : null;
  const clickable = Boolean(metricId);
  return (
    <div
      className={`group relative rounded-xl border border-border bg-card p-4 ${tile} ${
        clickable ? 'transition-colors hover:border-primary/40' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        {clickable ? (
          <ArrowUpRight className="h-4 w-4 text-muted-foreground/40 transition-colors group-hover:text-link" aria-hidden />
        ) : (
          Icon && <Icon className="h-4 w-4 text-muted-foreground/70" />
        )}
      </div>
      <p className={`mt-2 text-2xl font-bold tabular-nums ${valueColor}`}>
        {value}
        {unit && <span className="ml-1 text-sm font-medium text-muted-foreground">{unit}</span>}
      </p>
      {(TrendIcon || trendLabel) && (
        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          {TrendIcon && <TrendIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />}
          {trendLabel}
        </p>
      )}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      {clickable && (
        // Full-tile overlay link — keeps the markup server-safe and the whole
        // card a single click target without nesting interactive elements.
        <Link
          href={metricHref(metricId!, metricValueText)}
          aria-label={`What is "${label}"? Open the metric explainer`}
          className="absolute inset-0 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      )}
    </div>
  );
}

/** Backward-compatible alias — existing callers import `MetricStat`. */
export const MetricStat = MetricCard;
export type MetricStatProps = MetricCardProps;
