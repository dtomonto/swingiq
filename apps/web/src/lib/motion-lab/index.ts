// ============================================================
// SwingIQ — Motion Lab: public API (barrel)
// ============================================================

export * from './types';
export {
  SKILL_LEVELS,
  scoreMetric,
  metricTarget,
  skillLabel,
  type MotionSkillLevel,
} from './referenceRanges';
export {
  MOTION_SPORTS,
  getSport,
  getMotion,
  getPhaseTemplate,
  isRotationalMotion,
  type MotionTypeConfig,
  type SportConfigLite,
  type PhaseTemplate,
} from './taxonomy';
export { computeSeries, computeMetrics, type MotionSeries } from './biomechanics';
export {
  headingDeg,
  unwrapDeg,
  depthReliability,
  detectTopFrame,
  angularVelocityDeg,
} from './kinematics3d';
export { detectPhases } from './phases';
export { computeScoreboard } from './scoring';
export { buildReport, keyFaultLine } from './reporting';
export { prescribeDrills, getCatalogDrill } from './drills';
export { assessQuality, type QualitySourceInput } from './quality';
export { compareSessions } from './comparison';
export {
  runMotionAnalysis,
  runMultiViewMotionAnalysis,
  ANALYSIS_VERSION,
  MODEL_VERSION,
  type MotionStage,
  type PipelineOptions,
  type PoseModelQuality,
  type MultiViewOptions,
  type RigPreset,
} from './pipeline';
export { buildMultiViewTrack, type ViewLandmarks } from './multiview';
export {
  estimateImplementPath,
  implementForSport,
  getActiveObjectTrackingProvider,
  heuristicForearmProvider,
  mockObjectTrackingProvider,
  type ImplementType,
  type ImplementPathPoint,
  type ImplementPathTrace,
  type ContactZoneEstimate,
  type SwingPathEstimate,
  type ObjectTrackingResult,
  type ObjectTrackingProvider,
  type ObjectTrackingInput,
  type ImplementManualHints,
} from './objectTracking';
export {
  computeKineticChain,
  type KineticChainScore,
  type SegmentTiming,
  type PowerLeakFlag,
  type ChainSegment,
} from './kineticChain';
export {
  computeTemporal,
  type TemporalIntelligence,
  type PhaseDuration,
  type TemporalFlag,
} from './temporal';
export {
  computeRepeatability,
  MIN_SESSIONS_FOR_REPEATABILITY,
  type RepeatabilityResult,
  type MetricConsistency,
} from './repeatability';
export {
  buildMotionCoachNarrative,
  narrateMotionSession,
  type MotionCoachNarrative,
  type CoachNarrativeTone,
} from './coachNarrative';
export {
  summarizeAthlete,
  buildCoachView,
  loadCoachView,
  loadAthletes,
  addAthlete,
  updateAthlete,
  deleteAthlete,
  type Athlete,
  type AthleteSummary,
  type TeamReport,
  type CoachView,
  type FaultCount,
} from './roster';
export {
  loadSessions,
  saveSession,
  getSession,
  deleteSession,
  clearSessions,
  updateSessionMeta,
  toSummary,
  sessionsFor,
  buildProfile,
  compactTrack,
  newSessionId,
  subscribeMotionSessions,
  getMotionStoreVersion,
  type MotionProfile,
} from './persistence';
export { downloadSessionJson, downloadSessionCsv } from './export';
export { printSessionReport } from './printReport';
export { useMotionSessions } from './useMotionSessions';
