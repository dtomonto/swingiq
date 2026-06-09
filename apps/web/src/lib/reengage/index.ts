// SwingVantage — Re-engagement / Outbound OS public surface.
export * from './types';
export { TRIGGERS, triggerById } from './triggers';
export { selectNudge, buildPayloads, inQuietHours, type SelectOptions } from './engine';
export { COHORTS } from './cohorts';
export {
  REENGAGE_KEY, DEFAULT_PREFS, DEFAULT_STATE,
  read, subscribe, setPrefs, markShown, dismiss, resetCaps,
} from './store';
export { useReengage, type UseReengage } from './useReengage';

// Drip-cycle analysis + strategy authoring (admin console surface).
export {
  buildCampaigns, analyzeStrategy, campaignPayloads, exportStrategyJson,
  DRIP_STAGES, DEFAULT_STRATEGY_SETTINGS, DEMO_SIGNAL,
  type DripCampaign, type DripStageId, type StrategyAnalysis, type StrategyHealth,
  type StrategyOverride, type StrategyOverrides, type StrategySettings, type AnalyzeContext,
} from './analysis';
export { useReengageStrategy, type UseReengageStrategy } from './useReengageStrategy';
