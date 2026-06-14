// ============================================================
// SwingVantage — Motion Lab: public API (barrel)
// ============================================================

export * from './types';
export {
  SKILL_LEVELS,
  scoreMetric,
  metricTarget,
  skillLabel,
  type MotionSkillLevel,
} from './reference-ranges';
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
export { computeScoreboard, SCORE_COMPONENTS, type ScoreComponentSpec } from './scoring';
export {
  computeContinuousMovement,
  isContinuousSport,
  movementModelFor,
  movementModelLabel,
  type MovementModel,
  type ContinuousMovementSummary,
  type MovementCheckpoint,
  type MovementFocus,
  type ContactEvent,
  type CheckpointStatus,
} from './continuous-movement';
export { buildReport, keyFaultLine } from './reporting';
export { prescribeDrills, getCatalogDrill } from './drills';
export {
  assessQuality,
  assessVisionGate,
  type QualitySourceInput,
  type VisionGateDecision,
  type VisionGateSeverity,
} from './quality';
export {
  profileVideoQuality,
  type VideoQualityProfile,
  type VideoQualityTier,
  type VideoQualityIssue,
  type VideoQualityIssueCode,
  type IssueSeverity,
  type PreflightInput,
} from './preflight';
export {
  routePoseDetection,
  trackVisibility,
  aggregateStats,
  shouldAttemptRecovery,
  chooseBetterPass,
  detectedHasMultiplePeople,
  describeEnginePath,
  type PoseRouterResult,
} from './pose-router';
export {
  runMotionBenchmark,
  runFixture,
  buildDefaultFixtures,
  formatBenchmarkTable,
  benchmarkPassed,
  type BenchmarkFixture,
  type BenchmarkRow,
  type BenchmarkExpectation,
} from './motion-bench';
export { compareSessions } from './comparison';
export {
  runMotionAnalysis,
  runMultiViewMotionAnalysis,
  analyzePoseTrack,
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
} from './object-tracking';
export {
  computeKineticChain,
  type KineticChainScore,
  type SegmentTiming,
  type PowerLeakFlag,
  type ChainSegment,
} from './kinetic-chain';
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
} from './coach-narrative';
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
export {
  LM,
  OVERLAY_BONES,
  OVERLAY_JOINTS,
  frameIndexForTime,
  jointAngle2D,
  overlayJointAngles,
  balanceEstimate,
  balanceVerdict,
  stanceRead,
  leadSide,
  frameVisibility,
  expectsImplementOverlay,
  frameAt,
  type OverlayAngle,
  type BalanceEstimate,
  type StanceRead,
} from './overlay-geometry';
export {
  OVERLAY_LAYER_META,
  OVERLAY_DENSITY_PRESETS,
  OVERLAY_DENSITY_LABEL,
  OVERLAY_DENSITY_HINT,
  layersForDensity,
  densityForLayers,
  type OverlayLayerId,
  type OverlayDensity,
  type OverlayLayerState,
} from './overlay-density';
export {
  getRecordingGuide,
  recordingTipsFor,
  ANGLE_CHECKLIST,
  type SportRecordingGuide,
  type AngleCheckItem,
} from './recording-guidance';
export {
  SAMPLE_SPECS,
  generateSamplePoseTrack,
  buildSampleSession,
  isSampleSession,
  type SampleSpec,
} from './sample';
export {
  buildRetestProtocol,
  type RetestProtocol,
  type RetestCheckpoint,
} from './retest-protocols';
export { downloadSessionJson, downloadSessionCsv } from './export';
export { printSessionReport } from './print-report';
export { useMotionSessions } from './useMotionSessions';
