// ============================================================
// SwingIQ — Agent Layer: Public API (barrel)
// ------------------------------------------------------------
// The intelligent product layer. Deterministic by default,
// optionally enhanced by an LLM behind a feature flag. Import
// from '@/lib/agents' anywhere in the web app.
// ============================================================

export * from './types';
export { buildAgentContext } from './context-builder';
export { runOrchestrator } from './orchestrator';
export { getNextBestAction, buildResumeOptions, buildActionLibrary } from './scoring';
export { getSportAgentProfile, SPORT_AGENT_PROFILES } from './sport-profiles';
export { evaluateSafety, isYouthContext, isParentOrCoachContext, detectPainLanguage } from './guardrails';

// Workflows (call individually when a page wants a specific capability)
export { buildResumeState } from './workflows/resume';
export { computeProgressTrend, findRecurringPatterns } from './workflows/progress-memory';
export { buildDiagnosisConfidence } from './workflows/diagnosis-confidence';
export { buildPracticePlan } from './workflows/practice-planner';
export { assessIntakeQuality } from './workflows/intake-quality';
export { buildEquipmentFit } from './workflows/equipment-fit';
export { buildPreGamePlan } from './workflows/pre-game';
export { buildReEngagement } from './workflows/retention';
export { getContextualHelp, hasContextualHelp } from './workflows/contextual-help';
export { buildCoachShareSummary } from './workflows/coach-sharing';
export { buildParentSummary } from './workflows/parent-sharing';
export { buildReport, type ReportKind } from './workflows/report';
export { buildProUpgradeSuggestion } from './workflows/pro-upgrade';

// Providers (optional LLM enhancement)
export { localRuleProvider } from './providers/local-rule-provider';
export { llmProvider, getActiveProvider } from './providers/llm-provider';
export type { AgentProvider, EnhanceInput } from './providers/local-rule-provider';

// Cache utilities
export { clearAgentCache, getLastSnapshot } from './cache';
