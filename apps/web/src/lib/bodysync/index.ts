// SwingVantage — BodySync public surface.
export * from './types';
export {
  NON_MEDICAL_DISCLAIMER, SHORT_DISCLAIMER, SAFE_LANGUAGE, CATEGORY_META,
  BODY_REGIONS, ZONE_META, DEFAULT_BODYSYNC_STATE, DEFAULT_PERMISSIONS,
} from './constants';
export {
  assessReadiness, recoveryScore, readinessScore, trainingLoadScore,
  performanceOpportunityScore, injuryRisk, zoneFor, computeBaselines,
} from './scoring';
export { buildRecommendation, regionsToAvoid } from './coaching';
export { generateInsights, type PerformancePoint } from './insights';
export {
  PROVIDER_CATALOG, getProvider, activeProviders, providersByMethod,
  registerAdapter, getAdapter, type HealthProviderAdapter,
} from './providers/registry';
export {
  read, subscribe, todayKey, saveCheckin, deleteCheckin, setPermissions,
  setSettings, consent, setBaselines, upsertConnection, disconnectProvider,
  clearAllHealthData, exportBodySync, BODYSYNC_KEY,
} from './store';
export { useBodySync, type UseBodySync } from './useBodySync';
