// ============================================================
// SwingIQ — Motion Lab: public API (barrel)
// ============================================================

export * from './types';
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
export { detectPhases } from './phases';
export { computeScoreboard } from './scoring';
export { buildReport, keyFaultLine } from './reporting';
export { prescribeDrills, getCatalogDrill } from './drills';
export { assessQuality, type QualitySourceInput } from './quality';
export { compareSessions } from './comparison';
export {
  runMotionAnalysis,
  ANALYSIS_VERSION,
  MODEL_VERSION,
  type MotionStage,
  type PipelineOptions,
} from './pipeline';
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
export { useMotionSessions } from './useMotionSessions';
