// ============================================================
// SwingVantage — Video Studio: public surface
// ------------------------------------------------------------
// The "intelligent video department" in one import. See
// docs/VIDEO_STUDIO.md for the architecture and setup.
// ============================================================

export * from './types';
export { BRAND_VOICE, CTA_STYLE, vetClaims, isOnBrand, MAX_DURATION_BY_TYPE } from './brand';
export { APP_SURFACES, getSurface, type AppSurface, type SurfaceTraits } from './surfaces';
export {
  deriveSignals,
  priorityScore,
  confidenceFrom,
  riskFrom,
  requiresApproval,
  performanceScore,
  PRIORITY_WEIGHTS,
} from './scoring';
export {
  scanForOpportunities,
  assessSurface,
  topGap,
  type ScanOptions,
} from './opportunityEngine';
export { buildBrief, enhanceBrief, type BriefOverrides } from './briefGenerator';
export { runGenerationJob, pollGenerationJob, assembleAsset } from './jobs';
export { reassess, type ReassessInput } from './reassessment';
export {
  seedPlacements,
  mergePlacements,
  resolvePlacement,
  placementsForPage,
  type ResolveContext,
  type ResolvedPlacement,
} from './placements';
export {
  trackVideoStudio,
  aggregateEvents,
  deviceType,
  type VideoStudioEvent,
  type VideoStudioContext,
  type RecordedEvent,
} from './analytics';
export { makeAuditLog } from './audit';
export { getRepo, __setInMemoryRepoForTests, type VideoStudioRepo, type StoredEvent } from './repo';
export {
  getProviderConfigs,
  resolveProvider,
  getProviderById,
  providerSummary,
  globalMaxCostCents,
  type VideoProvider,
  type ProviderAssetParts,
} from './providers';
