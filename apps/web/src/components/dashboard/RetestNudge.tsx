'use client';

// ============================================================
// SwingVantage — Dashboard Retest Nudge
// ------------------------------------------------------------
// Surfaces the improvement loop where it gets seen: the dashboard.
// Shows the user's newest completed retest result (what changed)
// and the single most-urgent due/overdue retest reminder, reusing
// the canonical retest cards. Self-hiding: renders nothing until
// localStorage is read and there is at least one thing to show.
//
// Discoverability fix for "One fix. One plan. One retest." — the
// retest infra already existed only on the /retest hub; this puts
// it in front of the user on their home surface.
// ============================================================

import Link from 'next/link';
import { RotateCcw, ChevronRight } from 'lucide-react';
import { useRetests } from '@/lib/retest';
import { RetestReminderCard } from '@/components/retest/RetestReminderCard';
import { RetestResultCard } from '@/components/retest/RetestResultCard';

export function RetestNudge({ className }: { className?: string }) {
  const { ready, targets, results, topTarget, dismiss, acknowledge } = useRetests();

  // Newest completed retest result (already filtered for acknowledged + sorted
  // newest-first by the hook).
  const newestResult = results[0] ?? null;

  // Nothing to surface until hydration completes and there's a result or a
  // due/overdue reminder. Keeps the dashboard quiet for users mid-window.
  if (!ready || (!newestResult && !topTarget)) return null;

  // Is there more on the hub than the one-of-each we show here?
  const hasMore = targets.length > 1 || results.length > 1;

  return (
    <section
      className={className}
      aria-label="Retest your progress"
    >
      <div className="mb-2 flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <RotateCcw size={15} className="text-accent-secondary" aria-hidden="true" />
          Improvement loop
        </h2>
        <Link
          href="/retest"
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          {hasMore ? 'See all retests' : 'Open Retest'} <ChevronRight size={12} />
        </Link>
      </div>

      <div className="space-y-3">
        {/* The loop CLOSED — show the directional outcome first. trackOnMount is
            false here so the north-star funnel fires only from the /retest hub. */}
        {newestResult && (
          <RetestResultCard
            result={newestResult}
            onAcknowledge={acknowledge}
            trackOnMount={false}
          />
        )}

        {/* The single most-urgent due/overdue finding to go retest. */}
        {topTarget && <RetestReminderCard target={topTarget} onDismiss={dismiss} />}
      </div>
    </section>
  );
}
