'use client';

// ============================================================
// SwingIQ — useAgentInsights
// ------------------------------------------------------------
// The single hook the UI uses to access the intelligent product
// layer. It reads the persisted store + active sport, builds the
// agent context, runs the (deterministic, synchronous)
// orchestrator, and manages dismissals.
//
// Hydration-safe: returns ready=false until mounted so the
// server and first client render match.
//
// Dismissals live in the store (so they travel with a profile
// backup) and are keyed by a context hash, so a dismissed card
// automatically reappears once the user has new data worth
// reacting to — and never nags about stale state.
// ============================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSwingIQStore } from '@/store';
import { useSport } from '@/contexts/SportContext';
import {
  buildAgentContext,
  runOrchestrator,
  type AgentInsight,
  type AgentWorkflowResult,
  type AgentAction,
  type ResumeState,
  type SafetyFlag,
} from '@/lib/agents';
import { contextHash } from '@/lib/agents/cache';

export interface UseAgentInsights {
  /** True once the store has hydrated on the client. */
  ready: boolean;
  result: AgentWorkflowResult | null;
  resume: ResumeState | null;
  nextBestAction: AgentAction | null;
  /** Insights with dismissed ones already filtered out. */
  insights: AgentInsight[];
  safetyFlags: SafetyFlag[];
  welcomeBackDismissed: boolean;
  dismissWelcomeBack: () => void;
  dismissInsight: (id: string) => void;
}

export function useAgentInsights(): UseAgentInsights {
  const state = useSwingIQStore();
  const setWelcomeBackDismissed = useSwingIQStore((s) => s.setWelcomeBackDismissed);
  const dismissAgentInsight = useSwingIQStore((s) => s.dismissAgentInsight);
  const { activeSport } = useSport();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const ctx = useMemo(
    () => (mounted ? buildAgentContext(state, activeSport) : null),
    [mounted, state, activeSport],
  );

  const hash = useMemo(() => (ctx ? contextHash(ctx) : ''), [ctx]);

  const result = useMemo(() => (ctx ? runOrchestrator(ctx, 'dashboard_load') : null), [ctx]);

  const welcomeBackDismissed =
    mounted && !!hash && state.agent.welcomeBackDismissedHash === hash;

  const dismissedKeys = useMemo(
    () => new Set(state.agent.dismissedKeys),
    [state.agent.dismissedKeys],
  );

  const visibleInsights = useMemo(() => {
    if (!result) return [];
    return result.insights.filter((i) => !dismissedKeys.has(`${hash}:${i.id}`));
  }, [result, dismissedKeys, hash]);

  const dismissWelcomeBack = useCallback(() => {
    if (hash) setWelcomeBackDismissed(hash);
  }, [hash, setWelcomeBackDismissed]);

  const dismissInsight = useCallback(
    (id: string) => {
      if (hash) dismissAgentInsight(`${hash}:${id}`);
    },
    [hash, dismissAgentInsight],
  );

  return {
    ready: mounted,
    result,
    resume: result?.resume ?? null,
    nextBestAction: result?.nextBestAction ?? null,
    insights: visibleInsights,
    safetyFlags: result?.safetyFlags ?? [],
    welcomeBackDismissed,
    dismissWelcomeBack,
    dismissInsight,
  };
}
