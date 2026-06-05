// ============================================================
// SwingVantage — Video Studio: Scoring Model
// ------------------------------------------------------------
// IN PLAIN ENGLISH (start here):
//   Two deterministic scorers live here.
//
//   1) OPPORTUNITY scoring — turns a surface's honest traits into the 13
//      "would video help here?" signals, then blends them into a single
//      0–100 priority score, plus a confidence level, a risk level, and
//      whether a human must approve before we generate/publish.
//
//   2) PERFORMANCE scoring — turns a live video's analytics into six
//      scores (engagement, conversion, education, friction-reduction,
//      freshness, and a "needs attention" recommendation priority) that
//      the reassessment engine ranks on.
//
//   Deterministic on purpose: same inputs → same scores, fully testable,
//   no LLM required. Weights reflect the product's go-to-market priority
//   (grow free users first: activation, onboarding, support, retention,
//   conversion all weigh heavily).
// ============================================================

import type {
  OpportunitySignals,
  ConfidenceLevel,
  RiskLevel,
  VideoType,
  VideoPerformanceMetric,
  VideoPerformanceScore,
} from './types';
import { OPPORTUNITY_SIGNAL_KEYS } from './types';
import type { AppSurface, Level } from './surfaces';

const clamp = (n: number, lo = 0, hi = 100): number => Math.max(lo, Math.min(hi, Math.round(n)));
const safeDiv = (a: number, b: number): number => (b > 0 ? a / b : 0);

const LEVEL_VALUE: Record<Level, number> = { low: 25, medium: 55, high: 85 };

const FUNNEL_IMPORTANCE: Record<AppSurface['traits']['funnelStage'], number> = {
  top: 70,
  mid: 50,
  bottom: 85,
  activation: 90,
  retention: 65,
  internal: 20,
};

// ── 1) Opportunity signals ────────────────────────────────────

/**
 * Map a surface's intrinsic traits to the 13 opportunity signals. Each
 * signal answers "how much would video help here, for THIS reason?" 0–100.
 */
export function deriveSignals(surface: AppSurface): OpportunitySignals {
  const t = surface.traits;
  const cx = LEVEL_VALUE[t.complexity];

  return {
    userConfusionRisk: clamp(cx + (t.supportHot ? 20 : 0) + (t.errorProne ? 15 : 0)),
    featureComplexity: clamp(cx + (t.dataHeavy ? 10 : 0)),
    funnelImportance: clamp(FUNNEL_IMPORTANCE[t.funnelStage]),
    conversionOpportunity: clamp(
      (t.decisionMoment ? 85 : FUNNEL_IMPORTANCE[t.funnelStage] * 0.6) + (t.trustMoment ? 10 : 0),
    ),
    onboardingFriction: clamp(
      (t.firstRun ? 80 : t.funnelStage === 'activation' ? 55 : 25) + (t.supportHot ? 15 : 0),
    ),
    educationalDepth: clamp(cx * 0.8 + (t.dataHeavy ? 25 : 0)),
    supportBurden: clamp(t.supportHot ? 85 : t.errorProne ? 55 : 25),
    visualExplanationNeed: clamp(
      Math.max(cx, t.dataHeavy ? 75 : 0, t.sportSpecific ? 80 : 0),
    ),
    trustBuildingNeed: clamp(t.trustMoment ? 85 : t.decisionMoment ? 55 : 25),
    seoOpportunity: clamp((t.isPublic ? 80 : 10) + (t.sportSpecific ? 12 : 0)),
    accessibilityBenefit: clamp(40 + (t.dataHeavy ? 20 : 0) + (t.firstRun ? 15 : 0)),
    retentionValue: clamp(
      (t.retentionMoment ? 80 : t.funnelStage === 'retention' ? 75 : 30) + (t.firstRun ? 10 : 0),
    ),
    differentiationValue: clamp(
      (t.sportSpecific ? 70 : t.complexity === 'high' ? 60 : 35) + (t.dataHeavy ? 12 : 0),
    ),
  };
}

/**
 * Weights for blending signals into the priority score. Sums to 1.0.
 * Tuned for "grow free users first": activation/onboarding/support/
 * conversion/retention dominate; SEO matters; raw complexity barely moves it.
 */
export const PRIORITY_WEIGHTS: Record<keyof OpportunitySignals, number> = {
  funnelImportance: 0.14,
  onboardingFriction: 0.12,
  conversionOpportunity: 0.1,
  userConfusionRisk: 0.1,
  supportBurden: 0.1,
  retentionValue: 0.09,
  visualExplanationNeed: 0.08,
  educationalDepth: 0.07,
  seoOpportunity: 0.07,
  trustBuildingNeed: 0.06,
  accessibilityBenefit: 0.04,
  featureComplexity: 0.02,
  differentiationValue: 0.01,
};

/** Weighted 0–100 priority score for an opportunity. */
export function priorityScore(signals: OpportunitySignals): number {
  let total = 0;
  for (const key of OPPORTUNITY_SIGNAL_KEYS) {
    total += signals[key] * PRIORITY_WEIGHTS[key];
  }
  return clamp(total);
}

/**
 * Confidence that an opportunity is real and worth acting on. More signals
 * pointing the same way → higher confidence. Returns a 0–100 score and level.
 */
export function confidenceFrom(signals: OpportunitySignals): {
  score: number;
  level: ConfidenceLevel;
} {
  const strong = OPPORTUNITY_SIGNAL_KEYS.filter((k) => signals[k] >= 60).length;
  const score = clamp(38 + strong * 7);
  const level: ConfidenceLevel = score >= 70 ? 'high' : score >= 48 ? 'medium' : 'low';
  return { score, level };
}

/**
 * Risk level for producing/publishing this video. Public, claim-sensitive,
 * and conversion/trust content carries more risk → more human oversight.
 */
export function riskFrom(surface: AppSurface, type: VideoType): RiskLevel {
  const t = surface.traits;
  const highTypes: VideoType[] = ['trust_safety', 'conversion_upgrade'];
  if (highTypes.includes(type) || (t.isPublic && (t.trustMoment || t.decisionMoment))) {
    return 'high';
  }
  const mediumTypes: VideoType[] = ['results_explainer', 'sport_instructional', 'comparison'];
  if (mediumTypes.includes(type) || t.isPublic || t.sportSpecific) {
    return 'medium';
  }
  return 'low';
}

/**
 * Approval policy: auto-generate only when confidence is HIGH and risk is
 * LOW. Anything medium/high risk, or low confidence, needs a human. This is
 * the switch the spec asks for (auto when confident, human when risky).
 */
export function requiresApproval(risk: RiskLevel, confidence: ConfidenceLevel): boolean {
  return risk !== 'low' || confidence === 'low';
}

// ── 2) Performance scoring ────────────────────────────────────

const FRESHNESS_HALFLIFE_DAYS = 200; // ~half freshness after this many days

/**
 * Score a live video from its analytics window + its age. All six scores are
 * 0–100. `recommendationPriority` is inverted — HIGH means "this video most
 * needs attention" (low engagement, stale, high drop-off / confusion).
 */
export function performanceScore(
  metric: VideoPerformanceMetric,
  assetAgeDays: number,
): VideoPerformanceScore {
  const playRate = safeDiv(metric.plays, metric.impressions); // 0–1
  const completionRate = safeDiv(metric.completions, metric.plays); // 0–1
  const ctaRate = safeDiv(metric.ctaClicks, metric.plays); // 0–1
  const downstreamRate = safeDiv(metric.downstreamConversions, metric.impressions);
  const replayRate = safeDiv(metric.replays, metric.plays);
  // A high replay rate combined with low completion suggests confusion, not love.
  const replayConfusion = clamp(replayRate * 100 * (1 - metric.avgCompletion), 0, 100);

  const engagement = clamp(
    100 * (0.45 * metric.avgCompletion + 0.35 * Math.min(1, playRate) + 0.2 * completionRate),
  );

  const conversionContribution = clamp(100 * (0.6 * Math.min(1, ctaRate) + 0.4 * Math.min(1, downstreamRate * 20)));

  const education = clamp(100 * (0.6 * metric.avgCompletion + 0.4 * completionRate) - replayConfusion * 0.3);

  // Friction-reduction proxy: viewers who finish and don't bail early are
  // getting unstuck. (A true measure also needs support-deflection data.)
  const frictionReduction = clamp(100 * (0.5 * metric.avgCompletion + 0.5 * (1 - metric.dropOffPoint)));

  const freshness = clamp(100 * Math.pow(0.5, assetAgeDays / FRESHNESS_HALFLIFE_DAYS));

  const recommendationPriority = clamp(
    100 -
      0.45 * engagement -
      0.25 * freshness +
      0.2 * replayConfusion +
      0.1 * (metric.dropOffPoint * 100),
  );

  return {
    assetId: metric.assetId,
    engagement,
    conversionContribution,
    education,
    frictionReduction,
    freshness,
    recommendationPriority,
  };
}
