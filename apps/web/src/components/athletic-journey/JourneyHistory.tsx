'use client';

// ============================================================
// SwingVantage — Athletic Journey: history timeline
// ------------------------------------------------------------
// Shows how the athlete's stage, momentum, and confidence have moved
// over time from the locally-recorded daily snapshots.
// ============================================================

import { cn } from '@/lib/utils';
import { TrendingUp, Minus } from 'lucide-react';
import type { SportId } from '@swingiq/core';
import { useJourneyStoreData } from '@/lib/athletic-journey/store';

export function JourneyHistory({ sport }: { sport: SportId }) {
  const store = useJourneyStoreData();
  const history = (store.history[sport] ?? []).slice(-10).reverse();

  if (history.length < 2) {
    return (
      <p className="text-sm text-muted-foreground">
        Your timeline builds itself as you keep using SwingVantage — check back after a few more
        sessions to see your stage and momentum trend.
      </p>
    );
  }

  const first = history[history.length - 1];
  const latest = history[0];
  const stageMoved = latest.stageOrder - first.stageOrder;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        {stageMoved > 0 ? (
          <>
            <TrendingUp size={16} className="text-success" aria-hidden="true" />
            <span className="text-foreground">You&apos;ve climbed since {first.date}.</span>
          </>
        ) : (
          <>
            <Minus size={16} className="text-muted-foreground" aria-hidden="true" />
            <span className="text-muted-foreground">Holding steady — keep stacking evidence.</span>
          </>
        )}
      </div>

      <ul className="space-y-1.5">
        {history.map((snap) => (
          <li key={snap.date} className="flex items-center gap-3 text-xs">
            <span className="w-20 shrink-0 text-muted-foreground tabular-nums">{snap.date}</span>
            <span className="w-12 shrink-0 font-mono font-semibold text-foreground">{snap.stageCode}</span>
            <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
              <div
                className={cn('h-full rounded-full', snap.momentum >= 60 ? 'bg-success' : snap.momentum >= 40 ? 'bg-warning' : 'bg-error')}
                style={{ width: `${snap.momentum}%` }}
              />
            </div>
            <span className="w-8 shrink-0 text-right text-muted-foreground tabular-nums">{snap.momentum}</span>
          </li>
        ))}
      </ul>
      <p className="text-3xs text-muted-foreground">Bars show your Journey Momentum on each day recorded.</p>
    </div>
  );
}
