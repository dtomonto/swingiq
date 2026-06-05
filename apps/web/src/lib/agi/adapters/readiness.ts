'use client';

// ============================================================
// SwingIQ — AGI: Readiness hook
// ------------------------------------------------------------
// Builds a "today's form" snapshot for the engine. It assembles the same
// PerformanceSignals the Foundations board already uses (agent context,
// progress trend, retests, drill-feedback) and runs the existing readiness
// engine — the AGI layer adds NO new readiness math, it just consumes the
// result. All of this is the only readiness coupling in the AGI layer; if the
// readiness inputs change, only this file follows.
// ============================================================

import { useMemo } from 'react';
import { useAgentContext } from '@/hooks/useAgentContext';
import { useRetests } from '@/lib/retest';
import { computeProgressTrend } from '@/lib/agents';
import { localDrillFeedbackRepo } from '@/lib/drillmatch';
import { computeReadiness, type ConfidenceLevel, type PerformanceSignals } from '@/lib/readiness';
import { readinessFromScore } from './readiness-map';
import type { ReadinessSnapshot } from '../types';

function confFromFocus(c: number | null | undefined): ConfidenceLevel | null {
  if (c == null) return null;
  if (c >= 67) return 'high';
  if (c >= 34) return 'medium';
  return 'low';
}

/** Today's-form snapshot for the active sport, or undefined until ready. */
export function useReadinessSnapshot(): ReadinessSnapshot | undefined {
  const { ctx } = useAgentContext();
  const retests = useRetests();

  return useMemo(() => {
    if (!ctx) return undefined;
    const sport = ctx.activeSport;
    const feedback = localDrillFeedbackRepo.all();
    const progress = computeProgressTrend(ctx);
    const sportResults = retests.results.filter((r) => r.sport === sport);

    const signals: PerformanceSignals = {
      practiceStreakDays: ctx.streakDays,
      sessionsLogged: ctx.sportSessions.length,
      hasActivePlan: ctx.hasActivePlan,
      planCompleted: ctx.planStatus === 'completed',
      daysSinceLastActivity: ctx.daysSinceLastActivity,
      analysisConfidence: confFromFocus(ctx.latestDiagnosedSession?.focusConfidence),
      trendDirection: progress.direction,
      latestRetestOutcome: sportResults[0]?.comparison.outcome ?? null,
      painFlag: feedback.some((f) => f.value === 'hurt'),
      recurringFaultCount: progress.recurringPatterns.length,
    };

    return readinessFromScore(computeReadiness(signals));
  }, [ctx, retests]);
}
