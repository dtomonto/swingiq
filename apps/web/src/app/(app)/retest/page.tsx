'use client';

// ============================================================
// SwingVantage — Retest Hub
// ------------------------------------------------------------
// The home of the improvement loop: findings that are due for a
// retest, and the directional results of retests already done.
// All data is derived from saved video history — nothing here is
// fabricated, and comparisons are clearly labelled directional.
// ============================================================

import { EmptyState } from '@/components/ui/EmptyState';
import { RotateCcw, ClipboardCheck } from 'lucide-react';
import { useRetests } from '@/lib/retest';
import { RetestReminderCard } from '@/components/retest/RetestReminderCard';
import { RetestResultCard } from '@/components/retest/RetestResultCard';

export default function RetestPage() {
  const { ready, targets, results, dismiss, acknowledge } = useRetests();
  const isEmpty = ready && targets.length === 0 && results.length === 0;

  return (
    <>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <RotateCcw size={22} className="text-accent-secondary" /> Retest
          </h1>
          <p className="text-muted-foreground text-sm mt-1 leading-relaxed">
            A diagnosis is a starting point, not a verdict. Work your drills, then retest under the
            same conditions so SwingVantage can show whether it actually changed.
          </p>
        </header>

        {!ready && (
          <p className="text-sm text-muted-foreground py-8 text-center">Checking your retests…</p>
        )}

        {isEmpty && (
          <EmptyState
            icon={ClipboardCheck}
            title="No retests yet"
            description="Analyze a swing video, complete the suggested drills, then come back here to prove you improved."
            action={{ label: 'Analyze a swing', href: '/video' }}
          />
        )}

        {ready && targets.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              Time to retest
            </h2>
            {targets.map((t) => (
              <RetestReminderCard key={t.id} target={t} onDismiss={dismiss} showExplanation />
            ))}
          </section>
        )}

        {ready && results.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              Your retest results
            </h2>
            {results.map((r) => (
              <RetestResultCard key={r.id} result={r} onAcknowledge={acknowledge} />
            ))}
            <p className="text-xs text-muted-foreground pt-1">
              Comparisons are directional reads from your videos, not measured biomechanics. For a
              precise result, retest with the same camera angle, distance, and equipment.
            </p>
          </section>
        )}
      </div>
    </>
  );
}
