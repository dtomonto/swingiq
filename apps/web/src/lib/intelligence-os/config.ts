// ============================================================
// SwingVantage — First-Party Intelligence OS · config & defaults
// ------------------------------------------------------------
// Constants and the default settings singleton. Privacy/safety rules
// live here so the router and admin share one source of truth.
// ============================================================

import type { IntelligenceSettings, SafetyFlag } from './types';

export const INTELLIGENCE_SETTINGS_ID = 'intelligence-os-settings' as const;

/** Record `kind` keys for the shared growth_records JSONB table. */
export const KINDS = {
  activity: 'io-ai-activity',
  knowledge: 'io-knowledge',
  canonical: 'io-canonical-answer',
  pattern: 'io-pattern-memory',
  cache: 'io-answer-cache',
  evaluation: 'io-evaluation',
  savings: 'io-token-savings',
  task: 'io-action-task',
  report: 'io-action-report',
  settings: 'io-settings',
} as const;

/**
 * Phrases that, if present in a request, flag it as privacy/safety-sensitive.
 * Such answers require stricter review and are never globally cached/reused.
 */
export const DEFAULT_PRIVACY_EXCLUSION_KEYWORDS = [
  'my name', 'my email', 'my phone', 'my address', 'password', 'credit card',
  'social security', 'medical', 'injury', 'diagnosis', 'medication', 'minor',
  'under 13', 'under 18', 'my child', 'my kid',
];

/** Topic markers → safety flags, used to gate global reuse. */
export const SAFETY_KEYWORDS: Record<SafetyFlag, string[]> = {
  youth: ['minor', 'under 13', 'under 18', 'my child', 'my kid', 'youth', 'junior'],
  medical: ['medical', 'injury', 'pain', 'diagnosis', 'medication', 'rehab', 'surgery'],
  legal: ['lawsuit', 'legal', 'liability', 'gdpr', 'ccpa', 'contract'],
  privacy: ['my name', 'my email', 'my phone', 'my address', 'password', 'ssn', 'social security'],
  personalized: ['my swing', 'my last session', 'my video', 'my profile', 'for me specifically'],
  safety: ['unsafe', 'dangerous', 'hurt myself'],
};

export const DEFAULT_SETTINGS: IntelligenceSettings = {
  id: INTELLIGENCE_SETTINGS_ID,
  autoServeConfidenceThreshold: 0.85,
  semanticMatchThreshold: 0.8,
  knowledgePromotionThreshold: 0.7,
  cacheTtlHours: 24 * 30, // 30 days
  requireReviewBeforeAutoServe: true,
  reviewRequiredSafetyFlags: ['youth', 'medical', 'legal', 'privacy', 'safety'],
  privacyExclusionKeywords: DEFAULT_PRIVACY_EXCLUSION_KEYWORDS,
  dailyTokenBudgetAlertCents: 0,
  maxCostPerFeatureCents: 0,
  rawEventRetentionDays: 90,
  lowValueArchiveDays: 180,
  updatedAt: '1970-01-01T00:00:00.000Z',
  updatedBy: null,
};

/**
 * Rough per-1K-token cost in cents, used ONLY to estimate avoided cost when a
 * real per-call cost is unknown. Conservative, clearly an estimate (the ledger
 * labels these rows `estimated`).
 */
export const ESTIMATED_COST_PER_1K_TOKENS_CENTS: Record<string, { input: number; output: number }> = {
  anthropic: { input: 0.3, output: 1.5 },
  openai: { input: 0.25, output: 1.0 },
  gemini: { input: 0.1, output: 0.4 },
  other: { input: 0.3, output: 1.5 },
};

/** Confidence score below which a diagnosis/answer is treated as untrustworthy. */
export const MIN_TRUSTWORTHY_CONFIDENCE = 0.4;
