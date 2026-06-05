// ============================================================
// SwingVantage — DrillMatch + Fix Stack: Public API (barrel)
// ------------------------------------------------------------
// One closed improvement loop built ON TOP of existing systems:
//   fault ontology  +  per-sport drill libraries  +  feedback
//   →  ranked DrillMatch  →  a 3-part Fix Stack  →  retest.
// Import from '@/lib/drillmatch'.
// ============================================================

export * from './types';
export {
  ALL_DRILL_CANDIDATES,
  getCandidatesForSport,
  getCandidatesForFault,
  getDrillCandidateById,
  estimateMinutes,
  isAssumedEquipment,
} from './catalog';
export {
  scoreDrill,
  rankDrills,
  displayScore,
  normalizeMatchInput,
  type ScoredDrill,
} from './scoring';
export { buildFixStack } from './fix-stack';
export {
  localDrillFeedbackRepo,
  recordDrillFeedback,
  latestFeedbackValue,
  FEEDBACK_WEIGHTS,
} from './feedback';
