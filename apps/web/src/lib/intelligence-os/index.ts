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
  captureAiInteraction, recordFirstPartyRecommendation, coerceSport,
  type CaptureInput, type RecordRecommendationInput,
} from './capture';
export {
  isEmbeddingsConfigured, embedText, cosineSimilarity, semanticSimilarityHybrid,
  similarityWithVectors, similarityBackend,
} from './embeddings';
export { runRetentionSweep, type RetentionReport } from './retention';
export {
  getIntelligenceOverview, getSavingsBreakdown,
  type IntelligenceOverview, type OverviewMetrics, type SavingsBreakdown,
} from './dashboard';
export {
  activityRepo, knowledgeRepo, canonicalRepo, patternRepo, cacheRepo, evaluationRepo, savingsRepo,
  taskRepo, reportRepo,
  getSettings, saveSettings, isIntelligencePersistent, __resetIntelligenceStoreForTests,
} from './store';
export * from './service';
export * from './tasks';
export * from './reports';
