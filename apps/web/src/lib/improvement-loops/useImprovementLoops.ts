'use client';

// ============================================================
// SwingVantage — useImprovementLoops
// ------------------------------------------------------------
// Reactive view of the issue → drill → outcome moat record, assembled from the
// live local signals: drill feedback (lib/drillmatch), retests (lib/retest),
// and the athlete's skill level (store). Pure join logic lives in build.ts.
// ============================================================
import { useMemo } from 'react';
import { localDrillFeedbackRepo } from '@/lib/drillmatch';
import { resolveFault } from '@/lib/faults';
import { useRetests } from '@/lib/retest';
import { useSwingVantageStore } from '@/store';
import type { SkillLevel } from '@swingiq/core';
import { buildImprovementLoops, aggregateDrillEffectiveness } from './build';
import type { ImprovementLoop, DrillEffectiveness } from './types';

export interface ImprovementLoopsView {
  /** True once the reactive retest view has hydrated on the client. */
  ready: boolean;
  /** Linked loops, newest activity first. */
  loops: ImprovementLoop[];
  /** Per-(sport, fault, drill) effectiveness — the benchmark seed. */
  effectiveness: DrillEffectiveness[];
  /** How many loops have reached a retest. */
  retestedCount: number;
}

const resolveFaultName = (id: string): string => resolveFault(id).name;

export function useImprovementLoops(): ImprovementLoopsView {
  const retest = useRetests();
  const skillLevel = useSwingVantageStore(
    (s) => (s.profile?.skill_level ?? null) as SkillLevel | null,
  );

  // Drill feedback has its own localStorage namespace (capped at 200) and isn't
  // a subscribable store, so we read it each render (cheap) and let a content
  // signature + the reactive retest view drive memo recomputation.
  const feedback = localDrillFeedbackRepo.all();
  const feedbackSig = `${feedback.length}:${feedback[feedback.length - 1]?.recordedAt ?? ''}`;

  const loops = useMemo(
    () => buildImprovementLoops({ feedback, retests: retest.results, skillLevel, resolveFaultName }),
    // feedbackSig stands in for the feedback array's identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [feedbackSig, retest.results, skillLevel],
  );

  const effectiveness = useMemo(
    () => aggregateDrillEffectiveness(feedback, resolveFaultName),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [feedbackSig],
  );

  return {
    ready: retest.ready,
    loops,
    effectiveness,
    retestedCount: loops.filter((l) => l.stage === 'retested').length,
  };
}
