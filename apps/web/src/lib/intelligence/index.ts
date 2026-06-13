// ============================================================
// SwingVantage — GAI Intelligence layer: public surface
// ------------------------------------------------------------
// The General Athlete Intelligence (GAI) routing layer. Import the pieces you
// need from here. The pure decision logic (`decideRoute`, `buildDecisionInput`)
// and the heuristic engine (`runHeuristicEstimate`) are I/O-free and safe to use
// anywhere server-side; the rest touch live stores.
// ============================================================

export * from './types';
export { DEFAULT_TIER_CONFIGS, TIER_OP, tierConfig } from './tiers';
export { decideRoute, buildDecisionInput, routeAnalysis } from './router';
export type { RouteContext, RouteAnalysisDeps } from './router';
export { runHeuristicEstimate } from './heuristic';
export {
  analyzeDeterministicSession,
  calculateConfidence,
  shouldEscalateToAI,
  getTriggeredRuleTrace,
  runDeterministicScenarioTest,
} from './diagnose';
export type {
  ConfidenceResult,
  EscalationResult,
  ScenarioExpectation,
  DiagnosisScenario,
  ScenarioResult,
} from './diagnose';
export type {
  DiagnosisInput,
  DiagnosisCandidate,
  DeterministicDiagnosis,
  TriggeredRule,
  SkillLevel,
  DiagnosisUrgency,
  RetestOutcomeSignal,
} from './diagnose-types';
export {
  listDiagnosisSports,
  getSportDiagnosisConfig,
  getSymptomsForSport,
} from './symptom-rules';
export type { SymptomRule, SportDiagnosisConfig } from './symptom-rules';
export { GOLDEN_SCENARIOS } from './golden-scenarios';
export { getDeterministicEngineStatus, runGoldenScenarios } from './coverage';
export type { EngineStatus, SportCoverage, ScenarioSummary, ScenarioRow } from './coverage';
export { diagnosisToActionCandidate } from './next-action';
export type { DiagnosisActionOptions } from './next-action';
export { deriveRetestSignals } from './retest-feedback';
export type { RetestSignals } from './retest-feedback';
export { resolveRouteContext } from './context';
export { analyze } from './service';
export type { AnalyzeOptions } from './service';
export {
  getOperatingMode,
  getOperatingModeState,
  setOperatingModeState,
  operatingModeStoreSource,
  getTierAvailability,
  isTierActive,
} from './operating-mode';
export type { OperatingModeState, OperatingModePatch } from './operating-mode';
export {
  joinTierWaitlist,
  getJoinedTiers,
  getTierWaitlistCounts,
  isWaitlistTier,
  WAITLIST_TIERS,
} from './waitlist';
export type { TierWaitlistCounts } from './waitlist';
export { logAnalysis, getIntelligenceObservability } from './log';
export type { IntelligenceObservability } from './log';
export { gateVideoAnalysis } from './video-gate';
export type { VideoGateInput, VideoGateResult } from './video-gate';
export { resolveProviderHealth } from './health';
export {
  getCachedResult,
  putCachedResult,
  isCacheableResult,
  cacheKey,
  cacheStoreSource,
} from './cache';
export {
  getPlacementState,
  setPlacementState,
  placementStoreSource,
  PLACEMENT_SLOTS,
} from './placements';
export type {
  PlacementState,
  PlacementPatch,
  PlacementSetting,
  PlacementSlotId,
  PlacementSlotDef,
  WaitlistTier,
} from './placements';
