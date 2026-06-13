// ============================================================
// SwingVantage — GAI Intelligence Tier configuration
// ------------------------------------------------------------
// The three user-facing analysis products and their default routing posture.
// These are DEFAULTS; an admin can adjust enablement / caps from the dashboard
// (persisted via the operating-mode store pattern). Per-analysis cost caps reuse
// the existing AI_OP_COST_CENTS convention (lib/ai-budget).
//
// Copy here is the source of truth for premium, GAI-branded product language —
// never "cheap mode" / "deterministic fallback" toward users.
// ============================================================

import type { IntelligenceTier, TierConfig } from './types';

export const DEFAULT_TIER_CONFIGS: Record<IntelligenceTier, TierConfig> = {
  INSTANT_ESTIMATE: {
    tier: 'INSTANT_ESTIMATE',
    name: 'Instant Estimate',
    description:
      'A fast, structured GAI-powered estimate based on your sport, miss pattern, skill level, and goals.',
    enabled: true,
    usesVideo: false,
    usesAI: false,
    usesHeuristic: true,
    usesCache: true,
    allowedPlans: [], // all plans, including free + anonymous
    maxCostCents: 0, // no paid AI by design
    maxLatencyMs: 1_500,
    upgradeCTA:
      'Upload a swing video for Deep AI Analysis to confirm the root cause and personalize your plan.',
  },
  AI_SWING_REPORT: {
    tier: 'AI_SWING_REPORT',
    name: 'AI Swing Report',
    description:
      'A personalized AI Swing Report with deeper diagnosis, prioritized fixes, drills, and a retest plan.',
    enabled: true,
    usesVideo: true,
    usesAI: true,
    usesHeuristic: true,
    usesCache: true,
    allowedPlans: [],
    maxCostCents: 8,
    maxLatencyMs: 30_000,
    upgradeCTA:
      'Unlock a Premium Retest Plan for video-backed evidence, measurement context, and progress comparison.',
  },
  PREMIUM_RETEST_PLAN: {
    tier: 'PREMIUM_RETEST_PLAN',
    name: 'Premium Retest Plan',
    description:
      'A premium video-backed retest plan with deeper swing evidence, measurement context, coaching explanation, and before/after progress comparison.',
    enabled: true,
    usesVideo: true,
    usesAI: true,
    usesHeuristic: true,
    usesCache: true,
    allowedPlans: ['pro', 'team'],
    maxCostCents: 20,
    maxLatencyMs: 120_000,
    upgradeCTA: '',
  },
};

/** The metered operation id (lib/ai-budget) a tier's AI work maps onto. */
export const TIER_OP: Record<IntelligenceTier, string> = {
  INSTANT_ESTIMATE: 'ai-coach',
  AI_SWING_REPORT: 'video-analysis',
  PREMIUM_RETEST_PLAN: 'video-vision',
};

export function tierConfig(tier: IntelligenceTier): TierConfig {
  return DEFAULT_TIER_CONFIGS[tier];
}
