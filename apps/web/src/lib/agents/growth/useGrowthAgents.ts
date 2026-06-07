'use client';

// ============================================================
// SwingVantage — Agent: Growth Coordinator — React hook
// ------------------------------------------------------------
// The single hook a page uses to access all seven growth agents.
// It reads the persisted store + active sport, builds the agent
// context, AUTO-DERIVES churn signals from Daily Notes, defaults
// the invite origin to the current site, and runs the coordinator.
//
// Hydration-safe: ready=false until mounted so SSR and the first
// client render match (mirrors useAgentInsights).
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import { useSwingVantageStore } from '@/store';
import { useSport } from '@/contexts/SportContext';
import { buildAgentContext } from '@/lib/agents';
import { summarizeNoteSignals } from '../churn/engine';
import { runGrowthAgents } from './orchestrator';
import type { GrowthAgentsResult, GrowthInputs } from './types';

export interface UseGrowthAgents {
  ready: boolean;
  result: GrowthAgentsResult | null;
}

/**
 * `inputs` lets a caller supply things the store cannot carry (dispatch policy
 * + send history, the referral code/pending tiers, account age). Churn signals
 * and invite origin are derived automatically but can be overridden.
 */
export function useGrowthAgents(inputs: GrowthInputs = {}): UseGrowthAgents {
  const state = useSwingVantageStore();
  const { activeSport } = useSport();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const result = useMemo(() => {
    if (!mounted) return null;
    const ctx = buildAgentContext(state, activeSport);

    // Auto-derive churn sentiment from Daily Notes unless the caller overrides.
    const churnSignals =
      inputs.churnSignals ?? summarizeNoteSignals(state.dailyNotes ?? [], activeSport);

    // Default the invite origin to the live site so links are never broken.
    const origin =
      inputs.referral?.origin ??
      (typeof window !== 'undefined' ? window.location.origin : '');

    return runGrowthAgents(ctx, {
      ...inputs,
      churnSignals,
      referral: { ...inputs.referral, origin },
    });
  }, [mounted, state, activeSport, inputs]);

  return { ready: mounted, result };
}
