'use client';

// ============================================================
// SwingIQ — Progress Intelligence (smart wrapper)
// ------------------------------------------------------------
// Wires the existing data sources — agent context, progress-memory
// workflow, the retest engine, and the DrillMatch feedback loop —
// into the three longitudinal summaries: Player Arc, Flaw
// Fingerprint, Training Receipt. Honest first-run: with no data it
// points the user to a real analysis instead of inventing progress.
// ============================================================

import { useMemo } from 'react';
import Link from 'next/link';
import { Route, Sparkles } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAgentContext } from '@/hooks/useAgentContext';
import { useRetests } from '@/lib/retest';
import { computeProgressTrend } from '@/lib/agents';
import { matchFaultId } from '@/lib/faults';
import { localDrillFeedbackRepo, getDrillCandidateById } from '@/lib/drillmatch';
import {
  buildPlayerArc,
  buildFlawFingerprint,
  buildTrainingReceipt,
  type DrillVerdict,
} from '@/lib/progress';
import { PlayerArcCard } from './PlayerArcCard';
import { FlawFingerprintCard } from './FlawFingerprintCard';
import { TrainingReceiptCard } from './TrainingReceiptCard';

function Skeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((i) => (
        <Card key={i} className="border-border">
          <CardBody>
            <div className="animate-pulse space-y-3">
              <div className="h-4 w-28 bg-muted rounded" />
              <div className="h-16 bg-muted rounded" />
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardBody className="space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wide">
          <Route size={13} /> Player Arc
        </div>
        <p className="text-sm text-foreground">
          This is where your improvement story builds over time — your recurring patterns,
          the drills that actually work for you, and proof of what each retest changed.
        </p>
        <p className="text-xs text-muted-foreground">
          You don&apos;t have any sessions yet, so there&apos;s no arc to show. Run your first
          analysis and this fills in automatically.
        </p>
        <div className="pt-1">
          <Link href="/start">
            <Button size="sm">
              <Sparkles size={14} /> Start my first analysis
            </Button>
          </Link>
        </div>
      </CardBody>
    </Card>
  );
}

export function ProgressIntelligence() {
  const { ready, ctx } = useAgentContext();
  const retests = useRetests();

  const built = useMemo(() => {
    if (!ctx) return null;
    const sport = ctx.activeSport;
    const feedback = localDrillFeedbackRepo.all();

    const sportResults = retests.results.filter((r) => r.sport === sport);
    const sportTargets = retests.targets.filter((t) => t.sport === sport);

    const progress = computeProgressTrend(ctx);

    const arc = buildPlayerArc({
      sport,
      sportLabel: ctx.sportLabel,
      skillLevel: ctx.profile.skillLevel,
      goal: ctx.profile.goal,
      sessions: ctx.sportSessions,
      streakDays: ctx.streakDays,
      planStatus: ctx.planStatus,
      daysSinceLastActivity: ctx.daysSinceLastActivity,
      progress,
      retestResults: sportResults,
      retestTargets: sportTargets,
    });

    const fingerprint = buildFlawFingerprint({
      sport,
      allSessions: ctx.sessions,
      sportSessions: ctx.sportSessions,
      drillFeedback: feedback,
    });

    const latestResult = sportResults[0] ?? null;
    let drillFeedbackForFault = feedback;
    let drillsTried: DrillVerdict[] = [];
    if (latestResult) {
      const faultId = matchFaultId(latestResult.priorFocus, sport) ?? latestResult.priorFocus;
      drillFeedbackForFault = feedback.filter(
        (r) => r.faultId === faultId || r.faultId === latestResult.priorFocus,
      );
      const seen = new Set<string>();
      for (const r of drillFeedbackForFault) {
        if (seen.has(r.drillId)) continue;
        seen.add(r.drillId);
        drillsTried.push({ drillId: r.drillId, name: getDrillCandidateById(r.drillId)?.name ?? 'A drill you tried' });
      }
    }
    const receipt = buildTrainingReceipt({ sport, latestResult, drillFeedbackForFault, drillsTried });

    const hasAnything =
      ctx.sessions.length > 0 || retests.results.length > 0 || feedback.length > 0;

    return { arc, fingerprint, receipt, hasAnything };
    // retests is referentially stable from useSyncExternalStore.
  }, [ctx, retests]);

  if (!ready || !built) return <Skeleton />;
  if (!built.hasAnything) return <EmptyState />;

  return (
    <div className="space-y-4">
      <PlayerArcCard arc={built.arc} />
      <FlawFingerprintCard fingerprint={built.fingerprint} />
      <TrainingReceiptCard receipt={built.receipt} />
    </div>
  );
}
