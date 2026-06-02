'use client';

// ============================================================
// SwingIQ — Foundations Board (smart wrapper)
// ------------------------------------------------------------
// Wires the existing client data (agent context, retests, progress
// memory, the DrillMatch feedback loop) into the five moat
// foundations: Readiness/Game-Ready, Player Model (Training Twin),
// Skill Transfer Map, Performance Graph, Benchmark Mirror.
// ============================================================

import { useMemo } from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { useAgentContext } from '@/hooks/useAgentContext';
import { useRetests } from '@/lib/retest';
import { computeProgressTrend } from '@/lib/agents';
import { localDrillFeedbackRepo, getDrillCandidateById } from '@/lib/drillmatch';
import { computeReadiness, computeGameReady, type ConfidenceLevel, type PerformanceSignals } from '@/lib/readiness';
import { buildPlayerModel } from '@/lib/playerModel';
import { getSkillTransfers, SKILL_TRANSFER_MAP } from '@/lib/skillTransfer';
import { buildPerformanceGraph, summarizeGraph } from '@/lib/performanceGraph';
import { buildBenchmarkMirror } from '@/lib/benchmarkMirror';
import type { SportId } from '@swingiq/core';
import { ReadinessCard } from './ReadinessCard';
import { PlayerModelCard } from './PlayerModelCard';
import { SkillTransferCard } from './SkillTransferCard';
import { PerformanceGraphCard } from './PerformanceGraphCard';
import { BenchmarkMirrorCard } from './BenchmarkMirrorCard';

function confFromFocus(c: number | null | undefined): ConfidenceLevel | null {
  if (c == null) return null;
  if (c >= 67) return 'high';
  if (c >= 34) return 'medium';
  return 'low';
}

function Skeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((i) => (
        <Card key={i} className="border-border">
          <CardBody>
            <div className="animate-pulse space-y-3">
              <div className="h-4 w-32 bg-muted rounded" />
              <div className="h-16 bg-muted rounded" />
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

export function FoundationsBoard() {
  const { ready, ctx } = useAgentContext();
  const retests = useRetests();

  const built = useMemo(() => {
    if (!ctx) return null;
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

    const readiness = computeReadiness(signals);
    const gameReady = computeGameReady(signals);

    const helped = feedback.filter((f) => f.value === 'helped');
    const drillsThatHelped = [
      ...new Set(helped.map((f) => getDrillCandidateById(f.drillId)?.name).filter(Boolean) as string[]),
    ];

    const model = buildPlayerModel({
      sport,
      sportLabel: ctx.sportLabel,
      skillLevel: ctx.profile.skillLevel,
      goal: ctx.profile.goal,
      constraints: [],
      equipmentCompleteness: ctx.equipment.completeness,
      sessionsLogged: ctx.sportSessions.length,
      trendDirection: progress.direction,
      recurringFaults: progress.recurringPatterns,
      drillsThatHelped,
      nextBestAction: progress.nextBestAction,
    });

    // Skill transfer: primary sport → other sports the user has sessions in.
    const otherSports = [...new Set(ctx.sessions.map((s) => s.sport))].filter((s) => s !== sport) as SportId[];
    const transfers = getSkillTransfers(sport, otherSports);
    const principles = SKILL_TRANSFER_MAP.filter((p) => p.expressions[sport]);

    // Performance graph from the user's data.
    const graph = buildPerformanceGraph({
      userId: 'me',
      sports: [...new Set(ctx.sessions.map((s) => s.sport))] as SportId[],
      sessions: ctx.sessions.map((s) => ({ id: s.id, sport: s.sport, focus: s.primaryFocus })),
      helpedDrills: helped.map((f) => ({
        drillId: f.drillId,
        drillName: getDrillCandidateById(f.drillId)?.name ?? 'Drill',
        faultId: f.faultId,
        faultName: f.faultId,
        sport: f.sport,
      })),
      retests: sportResults.map((r) => ({ id: r.id, sport: r.sport, focus: r.priorFocus })),
    });
    const graphSummary = summarizeGraph(graph);

    const mirror = buildBenchmarkMirror(sport, ctx.profile.skillLevel ?? 'beginner');

    return { readiness, gameReady, model, transfers, principles, graphSummary, mirror, sportLabel: ctx.sportLabel };
  }, [ctx, retests]);

  if (!ready || !built) return <Skeleton />;

  return (
    <div className="space-y-4">
      <ReadinessCard readiness={built.readiness} gameReady={built.gameReady} />
      <PlayerModelCard model={built.model} />
      <SkillTransferCard primaryLabel={built.sportLabel} transfers={built.transfers} principles={built.principles} />
      <PerformanceGraphCard summary={built.graphSummary} />
      <BenchmarkMirrorCard mirror={built.mirror} />
    </div>
  );
}
