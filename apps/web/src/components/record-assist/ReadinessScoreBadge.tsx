'use client';

import { cn } from '@/lib/utils';
import type { ReadinessScore, ReadinessState, KineticConfidenceLevel } from '@/lib/record-assist/types';

const STATE_META: Record<ReadinessState, { label: string; ring: string; text: string; chip: string }> = {
  not_usable: { label: 'Not usable', ring: 'stroke-error', text: 'text-error', chip: 'bg-error/15 text-error' },
  needs_adjustment: { label: 'Needs adjustment', ring: 'stroke-warning', text: 'text-warning', chip: 'bg-warning/15 text-warning' },
  usable: { label: 'Usable', ring: 'stroke-success', text: 'text-success', chip: 'bg-success/15 text-success' },
  excellent: { label: 'Excellent', ring: 'stroke-success', text: 'text-success', chip: 'bg-success/15 text-success' },
};

const CONFIDENCE_LABEL: Record<KineticConfidenceLevel, string> = {
  high: 'Confidence: High',
  medium: 'Confidence: Medium',
  low: 'Confidence: Low',
  insufficient: 'Not enough data',
};

export interface ReadinessScoreBadgeProps {
  readiness: ReadinessScore | null;
  /** Compact ring-only mode for the live overlay corner. */
  compact?: boolean;
  className?: string;
}

/**
 * The Frame Readiness Score meter (0–100) with an honest state label and a
 * confidence chip. Never overclaims — shows "Not enough data" when the model
 * could not see enough to judge.
 */
export function ReadinessScoreBadge({ readiness, compact, className }: ReadinessScoreBadgeProps) {
  const score = readiness?.score ?? 0;
  const state = readiness?.state ?? 'not_usable';
  const meta = STATE_META[state];
  const r = 26;
  const c = 2 * Math.PI * r;
  const dash = readiness ? (score / 100) * c : 0;

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border border-border bg-card/90 p-2 backdrop-blur-sm',
        compact && 'p-1.5',
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={`Frame readiness ${score} out of 100, ${meta.label}`}
    >
      <div className="relative shrink-0">
        <svg width={compact ? 48 : 64} height={compact ? 48 : 64} viewBox="0 0 64 64" className="-rotate-90">
          <circle cx="32" cy="32" r={r} className="stroke-muted" strokeWidth="6" fill="none" />
          <circle
            cx="32" cy="32" r={r}
            className={cn(meta.ring, 'transition-[stroke-dasharray] duration-300')}
            strokeWidth="6" fill="none" strokeLinecap="round"
            strokeDasharray={`${dash} ${c}`}
          />
        </svg>
        <span
          className={cn(
            'absolute inset-0 flex items-center justify-center font-bold tabular-nums',
            compact ? 'text-sm' : 'text-lg',
            meta.text,
          )}
        >
          {readiness ? score : '—'}
        </span>
      </div>
      {!compact && (
        <div className="min-w-0">
          <p className={cn('text-sm font-semibold', meta.text)}>{meta.label}</p>
          <span className={cn('mt-0.5 inline-block rounded px-1.5 py-0.5 text-2xs font-medium', meta.chip)}>
            {CONFIDENCE_LABEL[readiness?.confidence ?? 'insufficient']}
          </span>
        </div>
      )}
    </div>
  );
}
