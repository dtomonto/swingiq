'use client';

// ============================================================
// SwingVantage — SwingLab 2.0: personalization hook (Phase 2b/2c)
// ------------------------------------------------------------
// Client hook that turns the user's normalized AgentContext into the
// lab map's personalization. Reuses the proven Next-Best-Action engine
// and the hydration-safe useAgentContext hook — no new store
// subscription (so it can't introduce a render loop). Returns the
// honest PREVIEW payload until the store has hydrated.
// ============================================================

import { useMemo } from 'react';
import { useAgentContext } from '@/hooks/useAgentContext';
import { getNextBestAction } from '@/lib/agents';
import { PREVIEW_PERSONALIZATION, type LabPersonalization } from './types';
import {
  actionToStation,
  buildGuidedPath,
  buildLabPersonalization,
  type GuidedStep,
  type LabSignals,
} from './lab-state';
import { buildLabSystems, type LabSystemsModel } from './lab-systems';

export function useLabPersonalization(): {
  ready: boolean;
  personalization: LabPersonalization;
  guidedPath: GuidedStep[];
  labSystems: LabSystemsModel | null;
} {
  const { ready, ctx } = useAgentContext();

  return useMemo(() => {
    if (!ctx) return { ready, personalization: PREVIEW_PERSONALIZATION, guidedPath: [], labSystems: null };
    const signals: LabSignals = {
      hasProfile: ctx.hasGolfProfile || ctx.hasSportProfile,
      captures: ctx.sessions.length,
      planStatus: ctx.planStatus,
      clubCount: ctx.clubCount,
      lastActivityAt: ctx.lastActivityAt,
    };
    const nba = getNextBestAction(ctx);
    const recommendedStationId = actionToStation(nba);
    return {
      ready,
      personalization: buildLabPersonalization(recommendedStationId, signals),
      guidedPath: buildGuidedPath(signals),
      labSystems: buildLabSystems(signals, recommendedStationId),
    };
  }, [ready, ctx]);
}
