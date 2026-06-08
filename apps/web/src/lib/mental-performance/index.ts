// ============================================================
// SwingVantage — Mental Performance: public barrel
// ------------------------------------------------------------
// The emotion-management / mistake-recovery pillar. Local-first, keyless,
// consent-gated. Import from here:
//   import { buildCoachResponse, getRoutine } from '@/lib/mental-performance';
//
// Layout:
//   types.ts        — data shapes
//   constants.ts    — disclaimers, crisis resources, catalogs, defaults
//   routines.ts     — seeded routine library + resolvers
//   coach.ts        — deterministic, keyless coach
//   crisis.ts       — safety screen (crisis + medical), never therapy
//   plans.ts        — training-plan templates
//   journal.ts      — journal insights (pure)
//   intelligence.ts — CentralIntelligenceOS layer (insights + recs)
//   growth.ts       — GrowthOS opportunities
//   ai.ts           — optional AI-rewrite seam (default OFF, passthrough)
//   store.ts        — client local-first store (own key, doc-synced)
//   useMentalPerformance.ts — React hook
// ============================================================

export * from './types';
export {
  NON_MEDICAL_DISCLAIMER, SHORT_DISCLAIMER, PROFESSIONAL_NOTE, CRISIS_NOTE,
  SUPPORTIVE_LANGUAGE, CRISIS_RESOURCES, CRISIS_HEADING, CRISIS_MESSAGE,
  MEDICAL_HEADING, MEDICAL_MESSAGE, EMOTIONAL_STATES, emotionMeta,
  MISTAKE_CATEGORIES, mistakeMeta, sportFamilyFor, TONE_LABELS,
  DEFAULT_PROFILE, DEFAULT_SETTINGS, DEFAULT_MENTAL_STATE,
  SECTION_FLAG_ENV, AI_FLAG_ENV,
} from './constants';
export type { EmotionMeta, MistakeMeta, SportFamily } from './constants';
export {
  MENTAL_ROUTINES, getRoutine, getRoutines, getRoutinesForSport,
  getUniversalRoutines, routineForContext, getAllSituationParams,
} from './routines';
export type { RoutineQuery } from './routines';
export { buildCoachResponse } from './coach';
export { screenForCrisis, isMedicalAdviceRequest, medicalRedirect } from './crisis';
export { buildPlan, planCatalog, PLAN_TYPES } from './plans';
export { generateJournalInsights } from './journal';
export {
  generateMentalInsights, generateMentalRecommendations,
  sampleMentalSignals, aggregateMentalSignals, setMentalSource, getMentalSignals, MENTAL_K,
} from './intelligence';
export type { MentalAggregateSource } from './intelligence';
export { generateMeditationScript, generateRoutineVideoBrief } from './scripts';
export type { MeditationScript, ScriptLine, RoutineVideoBrief } from './scripts';
export { generateMentalOpportunities, routineCoverageGaps } from './growth';
export {
  isMentalAiEnabled, registerMentalAiEnhancer, maybeEnhance,
} from './ai';
export type { MentalAiEnhancer } from './ai';
export {
  MENTAL_KEY, read, subscribe, setSettings, consent, setStoreLogs, setProfile,
  saveLog, deleteLog, clearAllLogs, assignPlan, advancePlanDay, abandonPlan,
  exportMental, clearAllMentalData,
} from './store';
export { useMentalPerformance, type UseMentalPerformance } from './useMentalPerformance';
