'use client';

// ============================================================
// SwingVantage — Progress Over Time
// ------------------------------------------------------------
// Turns the locally-saved analyses for one sport into a short
// coaching-journey view: a confidence trend across recent sessions
// and the mechanical priorities that keep recurring. Purely
// presentational — the parent passes the sport's saved history
// (newest first). Renders nothing until there are ≥2 sessions.
// ============================================================

import { TrendingUp, TrendingDown, Minus, Repeat } from 'lucide-react';
import type { SavedVideoAnalysis } from '@/lib/video/history';
import { cn } from '@/lib/utils';

const TREND_WINDOW = 8;

interface RecurringPriority {
  label: string;
  count: number;
}

/** Count how many distinct sessions each priority issue appears in. */
function recurringPriorities(history: SavedVideoAnalysis[]): RecurringPriority[] {
  const tally = new Map<string, { count: number; label: string }>();
  for (const record of history) {
    const seen = new Set<string>();
    for (const p of record.analysis.topPriorities ?? []) {
      const key = p.issue.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      const entry = tally.get(key);
      if (entry) entry.count += 1;
      else tally.set(key, { count: 1, label: p.issue.trim() });
    }
  }
  return [...tally.values()]
    .filter((e) => e.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .map((e) => ({ label: e.label, count: e.count }));
}

export function VideoProgress({
  history,
  className,
}: {
  history: SavedVideoAnalysis[];
  className?: string;
}) {
  if (history.length < 2) return null;

  // Oldest → newest for the trend; cap to a readable window.
  const chronological = [...history].reverse().slice(-TREND_WINDOW);
  const confidences = chronological.map((h) => h.overallConfidence);
  const first = confidences[0];
  const last = confidences[confidences.length - 1];
  const delta = last - first;
  const deltaPts = Math.round(delta * 100);

  const recurring = recurringPriorities(history);

  const TrendIcon = delta > 0.04 ? TrendingUp : delta < -0.04 ? TrendingDown : Minus;
  const trendClass =
    delta > 0.04 ? 'text-success' : delta < -0.04 ? 'text-error' : 'text-muted-foreground';
  const trendText =
    delta > 0.04
      ? `Confidence up ${deltaPts} pts`
      : delta < -0.04
        ? `Confidence down ${Math.abs(deltaPts)} pts`
        : 'Confidence holding steady';

  return (
    <div className={cn('rounded-xl border border-border bg-card p-4 space-y-4', className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-bold text-foreground">Your progress</p>
        <span className="text-xs text-muted-foreground">{history.length} analyses</span>
      </div>

      {/* Confidence trend */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <TrendIcon className={cn('w-4 h-4', trendClass)} />
          <span className={cn('text-xs font-semibold', trendClass)}>{trendText}</span>
          <span className="text-xs text-muted-foreground">· AI confidence per session</span>
        </div>
        <div className="flex items-end gap-1.5 h-16" aria-hidden>
          {chronological.map((h, i) => {
            const isLast = i === chronological.length - 1;
            return (
              <div
                key={h.id}
                className="flex-1 rounded-t-sm bg-primary/70 data-[last=true]:bg-primary transition-all"
                data-last={isLast}
                style={{ height: `${Math.max(6, Math.round(h.overallConfidence * 100))}%` }}
                title={`${Math.round(h.overallConfidence * 100)}% confidence`}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-3xs text-muted-foreground mt-1">
          <span>oldest</span>
          <span>latest</span>
        </div>
      </div>

      {/* Recurring priorities */}
      {recurring.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Repeat className="w-4 h-4 text-accent-secondary" />
            <span className="text-xs font-semibold text-foreground">Keeps coming up</span>
          </div>
          <ul className="space-y-1.5">
            {recurring.map((r) => (
              <li key={r.label} className="flex items-center justify-between gap-3">
                <span className="text-sm text-foreground truncate">{r.label}</span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {r.count} of {history.length} swings
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground mt-2">
            Recurring focus areas are worth dedicated practice — they haven&apos;t resolved across
            sessions yet.
          </p>
        </div>
      )}
    </div>
  );
}
