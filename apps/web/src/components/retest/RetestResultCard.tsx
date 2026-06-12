'use client';

// ============================================================
// SwingVantage — Retest Result Card
// ------------------------------------------------------------
// The "you retested — here's what changed" card. Shows the
// directional outcome of comparing the latest swing to the prior
// one, with explicit cautions and an always-on reminder that a
// video comparison is directional, not measured.
// ============================================================

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, TrendingUp, Minus, HelpCircle, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { track, ANALYTICS_EVENTS } from '@/lib/analytics';
import { Badge } from '@/components/ui/Badge';
import { format } from 'date-fns';
import type { RetestResult, RetestOutcome } from '@/lib/retest';

const OUTCOME_META: Record<
  RetestOutcome,
  { variant: 'success' | 'warning' | 'info' | 'danger'; ring: string; icon: typeof TrendingUp; label: string }
> = {
  improved: { variant: 'success', ring: 'border-l-primary', icon: TrendingUp, label: 'Improved' },
  persisting: { variant: 'warning', ring: 'border-l-warning', icon: Minus, label: 'Still present' },
  inconclusive: { variant: 'info', ring: 'border-l-blue-400', icon: HelpCircle, label: 'Inconclusive' },
  regressed: { variant: 'danger', ring: 'border-l-error', icon: AlertTriangle, label: 'Worse' },
};

export function RetestResultCard({
  result,
  onAcknowledge,
  trackOnMount = true,
  className,
}: {
  result: RetestResult;
  onAcknowledge?: (id: string) => void;
  /**
   * Fire the north-star RETEST_COMPLETED funnel event on mount. Defaults to
   * true (the Retest hub is the canonical firing surface). Secondary surfaces
   * that re-render this card on every visit (e.g. the dashboard nudge) pass
   * false so a single closed loop isn't counted once per page view.
   */
  trackOnMount?: boolean;
  className?: string;
}) {
  const [showWhy, setShowWhy] = useState(false);
  const { comparison } = result;
  const meta = OUTCOME_META[comparison.outcome] ?? OUTCOME_META.inconclusive;
  const Icon = meta.icon;

  // Funnel: the improvement loop has CLOSED — a completed retest result is on
  // screen. This is the north-star "Weekly Completed Improvement Loops" signal.
  // One event per surfaced result (a new result is a new mount via its key).
  useEffect(() => {
    if (!trackOnMount) return;
    track(ANALYTICS_EVENTS.RETEST_COMPLETED, {
      sport: result.sport,
      outcome: comparison.outcome,
      same_conditions: comparison.sameConditionsMet,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one event per surfaced result
  }, []);

  return (
    <div
      className={cn(
        'bg-card rounded-xl border border-border border-l-4 shadow-xs p-4',
        meta.ring,
        className,
      )}
      role="region"
      aria-label={`Retest result: ${comparison.headline}`}
    >
      <div className="flex items-start gap-3">
        <Icon size={18} className="mt-0.5 shrink-0 text-foreground" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-foreground text-sm">
              {result.emoji ? `${result.emoji} ` : ''}{comparison.headline}
            </p>
            {onAcknowledge && (
              <button
                onClick={() => onAcknowledge(result.id)}
                aria-label="Dismiss this result"
                className="text-muted-foreground hover:text-foreground -mt-0.5 -mr-1 p-1 rounded-sm focus:outline-hidden focus:ring-2 focus:ring-ring"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Badge variant={meta.variant}>{meta.label}</Badge>
            <span className="text-xs text-muted-foreground">
              {format(new Date(result.priorDate), 'MMM d')} → {format(new Date(result.currentDate), 'MMM d')}
            </span>
          </div>

          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{comparison.detail}</p>

          {comparison.cautions.length > 0 && (
            <ul className="mt-2 space-y-1">
              {comparison.cautions.map((c, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-warning">
                  <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          )}

          <button
            onClick={() => setShowWhy((v) => !v)}
            aria-expanded={showWhy}
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            {showWhy ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            What this is based on
          </button>

          {showWhy && (
            <div className="mt-2 text-xs text-muted-foreground bg-muted rounded-lg p-3">
              <p>{comparison.confidenceNote}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
