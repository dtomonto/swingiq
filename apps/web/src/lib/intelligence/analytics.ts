// ============================================================
// SwingVantage — Deterministic Diagnosis: Analytics
// ------------------------------------------------------------
// Thin, client-side emitter for the deterministic engine's analytics events.
// Kept OUT of the pure engine (diagnose.ts stays side-effect-free) — UI call
// sites invoke this once a diagnosis is shown.
//
// PRIVACY: only non-PII engine metadata is sent — sport, skill level, the fault
// id, confidence, rule/missing-data counts, and the escalation decision. Never
// any athlete identity, free-text, video, or biometric data (brief §19/§20).
// ============================================================

import { track, ANALYTICS_EVENTS } from '@/lib/analytics';
import type { DeterministicDiagnosis } from './diagnose-types';
import type { DeterministicPlan } from './plan';

/**
 * Emit `deterministic_analysis_completed` plus exactly one escalation event
 * (recommended | skipped) for a shown diagnosis. `extra` lets the call site add
 * non-PII context (e.g. the surface the result was shown on).
 */
export function trackDeterministicAnalysis(
  d: DeterministicDiagnosis,
  extra?: Record<string, string | number | boolean | null>,
): void {
  track(ANALYTICS_EVENTS.DETERMINISTIC_ANALYSIS_COMPLETED, {
    sport: d.sport,
    skill_level: d.skillLevel,
    diagnosis: d.primary.faultId,
    confidence_score: d.confidence,
    confidence_label: d.confidenceLabel,
    rule_count_triggered: d.ruleTrace.length,
    missing_data_count: d.missingData.length,
    escalation_recommended: d.escalateToAI,
    engine_version: d.engineVersion,
    ...extra,
  });

  if (d.escalateToAI) {
    track(ANALYTICS_EVENTS.DETERMINISTIC_AI_ESCALATION_RECOMMENDED, {
      sport: d.sport,
      diagnosis: d.primary.faultId,
      confidence_score: d.confidence,
      reason: d.escalationReasons[0] ?? null,
      ...extra,
    });
  } else {
    track(ANALYTICS_EVENTS.DETERMINISTIC_AI_ESCALATION_SKIPPED, {
      sport: d.sport,
      diagnosis: d.primary.faultId,
      confidence_score: d.confidence,
      ...extra,
    });
  }
}

/** Emit when a deterministic practice plan is generated/shown. */
export function trackDeterministicPlan(
  d: DeterministicDiagnosis,
  plan: DeterministicPlan,
  extra?: Record<string, string | number | boolean | null>,
): void {
  track(ANALYTICS_EVENTS.DETERMINISTIC_PLAN_GENERATED, {
    sport: d.sport,
    diagnosis: d.primary.faultId,
    skill_level: plan.skillLevel,
    drill_count: plan.drills.length,
    estimated_minutes: plan.estimatedMinutes,
    ...extra,
  });
}

/** Emit when the athlete rates a deterministic read helpful / not helpful. */
export function trackDeterministicFeedback(
  d: DeterministicDiagnosis,
  helpful: boolean,
  extra?: Record<string, string | number | boolean | null>,
): void {
  track(ANALYTICS_EVENTS.DETERMINISTIC_USER_FEEDBACK_SUBMITTED, {
    sport: d.sport,
    diagnosis: d.primary.faultId,
    helpful,
    ...extra,
  });
}

/**
 * Emit a retest verdict on a prior deterministic diagnosis: an `improved`
 * retest confirms it, a `regressed` one rejects it. Other outcomes are no-ops.
 */
export function trackDeterministicRetestVerdict(
  sport: DeterministicDiagnosis['sport'],
  faultId: string,
  outcome: 'improved' | 'persisting' | 'regressed' | 'inconclusive',
): void {
  if (outcome === 'improved') {
    track(ANALYTICS_EVENTS.DETERMINISTIC_DIAGNOSIS_CONFIRMED, { sport, diagnosis: faultId, outcome });
  } else if (outcome === 'regressed') {
    track(ANALYTICS_EVENTS.DETERMINISTIC_DIAGNOSIS_REJECTED, { sport, diagnosis: faultId, outcome });
  }
}

/** Emit when an athlete answers a deterministic intake question (pre-AI). */
export function trackDeterministicIntake(
  sport: DeterministicDiagnosis['sport'],
  questionId: string,
  answered: boolean,
  confidenceDelta: number,
): void {
  track(ANALYTICS_EVENTS.DETERMINISTIC_INTAKE_ANSWERED, {
    sport,
    question_id: questionId,
    answered,
    confidence_delta: confidenceDelta,
  });
}
