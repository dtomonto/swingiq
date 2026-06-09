'use client';

// ============================================================
// SwingVantage — Re-engagement OS: strategy console hook
// ------------------------------------------------------------
// Binds the local-first strategy-store to React (useSyncExternalStore),
// builds the live campaigns with overrides applied, and runs the strategy
// analysis. The admin DripConsole reads everything from here.
// ============================================================

import { useMemo, useSyncExternalStore } from 'react';
import * as strategyStore from './strategy-store';
import {
  analyzeStrategy,
  buildCampaigns,
  type AnalyzeContext,
  type DripCampaign,
  type StrategyAnalysis,
  type StrategyOverride,
  type StrategySettings,
} from './analysis';
import type { TriggerId } from './types';

export interface UseReengageStrategy {
  settings: StrategySettings;
  overrides: strategyStore.StrategyState['overrides'];
  campaigns: DripCampaign[];
  analysis: StrategyAnalysis;
  customizedCount: number;
  setOverride: (id: TriggerId, patch: StrategyOverride) => void;
  resetOverride: (id: TriggerId) => void;
  setSettings: (patch: Partial<StrategySettings>) => void;
  resetAll: () => void;
}

export function useReengageStrategy(ctx: AnalyzeContext = {}): UseReengageStrategy {
  const state = useSyncExternalStore(
    strategyStore.subscribe,
    strategyStore.read,
    () => strategyStore.DEFAULT_STRATEGY_STATE,
  );

  const campaigns = useMemo(() => buildCampaigns(state.overrides), [state.overrides]);
  const analysis = useMemo(
    () => analyzeStrategy(campaigns, state.settings, ctx),
    [campaigns, state.settings, ctx],
  );
  const customizedCount = useMemo(() => Object.keys(state.overrides).length, [state.overrides]);

  return {
    settings: state.settings,
    overrides: state.overrides,
    campaigns,
    analysis,
    customizedCount,
    setOverride: strategyStore.setOverride,
    resetOverride: strategyStore.resetOverride,
    setSettings: strategyStore.setSettings,
    resetAll: strategyStore.resetAll,
  };
}
