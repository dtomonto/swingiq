// ============================================================
// SwingVantage — First-Party Intelligence OS · public surface
// ------------------------------------------------------------
// Barrel for the intelligence layer. Existing AI features adopt it by
// importing { resolveWithFirstPartyIntelligence } and (optionally) the
// gateway adapter — gradual adoption, nothing is rewritten.
// ============================================================

export * from './types';
export * from './config';
export * from './fingerprint';
export * from './router';
export { gatewayCallThirdParty } from './provider-adapter';
export {
  getIntelligenceOverview, getSavingsBreakdown,
  type IntelligenceOverview, type OverviewMetrics, type SavingsBreakdown,
} from './dashboard';
export {
  activityRepo, knowledgeRepo, canonicalRepo, patternRepo, cacheRepo, evaluationRepo, savingsRepo,
  getSettings, saveSettings, isIntelligencePersistent, __resetIntelligenceStoreForTests,
} from './store';
export * from './service';
