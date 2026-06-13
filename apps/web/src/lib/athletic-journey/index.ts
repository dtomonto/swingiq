// ============================================================
// SwingVantage — Athletic Journey Engine: public API (barrel)
// ------------------------------------------------------------
// One config-driven player-development intelligence layer. Golf +
// Tennis ship now; Baseball / Fast-Pitch / Slow-Pitch are visibly
// "In Development". Import from '@/lib/athletic-journey'.
// ============================================================

export * from './types';

export {
  buildJourneyDashboard,
  type BuildOptions,
} from './engine';
export { diagnosisToSkillCategory } from './diagnosis-focus';

export {
  classifyPlayerStage,
  calculateStageConfidence,
  scoreAllCategories,
  type ClassificationResult,
} from './classify';

export { calculateJourneyMomentum, isRegressionRisk } from './momentum';

export {
  compareRatingAlignment,
  normalizeRatingValue,
  RATING_TYPE_LABEL,
  RATING_SOURCE_LABEL,
} from './rating';

export { getMissingDataRecommendations, missingDataConfidenceNote } from './missing-data';
export { computeMilestones } from './milestones';
export { generatePracticePrescription } from './prescription';
export { buildJourneyNarrative, validateNarrative, type NarrativeInput } from './narrative';

export {
  // config + lookups
  getSportConfig,
  getStages,
  getStageByCode,
  getStageByOrder,
  // availability
  SPORT_AVAILABILITY,
  AVAILABLE_SPORTS,
  IN_DEVELOPMENT_SPORTS,
  JOURNEY_SPORTS,
  getSportAvailability,
  isJourneyLive,
  SPORT_AVAILABILITY_MESSAGE,
  // sport configs
  GOLF_CONFIG,
  TENNIS_CONFIG,
  // tuning
  JOURNEY_THRESHOLDS,
  JOURNEY_VERSION,
  JOURNEY_DISCLAIMER,
} from './config';
