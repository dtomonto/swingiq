// ============================================================
// SwingIQ — Agent Layer: Public API (barrel)
// ------------------------------------------------------------
// The intelligent product layer. Deterministic by default,
// optionally enhanced by an LLM behind a feature flag. Import
// from '@/lib/agents' anywhere in the web app.
// ============================================================

export * from './types';
export { buildAgentContext } from './contextBuilder';
export { runOrchestrator } from './orchestrator';
export { getNextBestAction, buildResumeOptions, buildActionLibrary } from './scoring';
export { getSportAgentProfile, SPORT_AGENT_PROFILES } from './sportProfiles';
export { evaluateSafety, isYouthContext, isParentOrCoachContext, detectPainLanguage } from './guardrails';

// Workflows (call individually when a page wants a specific capability)
export { buildResumeState } from './workflows/resume';
export { computeProgressTrend, findRecurringPatterns } from './workflows/progressMemory';
export { buildDiagnosisConfidence } from './workflows/diagnosisConfidence';
export { buildPracticePlan } from './workflows/practicePlanner';
export { assessIntakeQuality } from './workflows/intakeQuality';
export { buildEquipmentFit } from './workflows/equipmentFit';
export { buildPreGamePlan } from './workflows/preGame';
export { buildReEngagement } from './workflows/retention';
export { getContextualHelp, hasContextualHelp } from './workflows/contextualHelp';
export { buildCoachShareSummary } from './workflows/coachSharing';
export { buildReport, type ReportKind } from './workflows/report';
export { buildProUpgradeSuggestion } from './workflows/proUpgrade';

// Providers (optional LLM enhancement)
export { localRuleProvider } from './providers/localRuleProvider';
export { llmProvider, getActiveProvider } from './providers/llmProvider';
export type { AgentProvider, EnhanceInput } from './providers/localRuleProvider';

// Cache utilities
export { clearAgentCache, getLastSnapshot } from './cache';
