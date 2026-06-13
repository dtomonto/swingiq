// ============================================================
// SwingVantage — Deterministic Diagnosis Engine: Types
// ------------------------------------------------------------
// The vocabulary for the token-free, weighted symptom→cause layer that
// turns athlete-reported miss patterns (plus optional profile/history
// signals) into a RANKED, explainable diagnosis — no external AI call.
//
// It composes the existing multi-sport fault ontology (lib/faults) and
// returns evidence, missing data, confidence + the reason for it, and an
// explicit AI-escalation recommendation. Pure types — safe to import
// anywhere (client or server).
// ============================================================

import type { SportId } from '@swingiq/core';
import type { FaultSeverity } from '@/lib/faults/types';
import type { ConfidenceLabel } from './types';

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'elite';

/** How pressing the fix is, derived from severity + history signals. */
export type DiagnosisUrgency = 'low' | 'medium' | 'high';

/** A retest outcome that can feed back into a fresh diagnosis. */
export type RetestOutcomeSignal = 'improved' | 'persisting' | 'regressed' | 'inconclusive';

/** The structured input the deterministic engine consumes. No I/O, no AI. */
export interface DiagnosisInput {
  sport: SportId;
  /** The primary reported miss / issue (curated id or free text). */
  issue: string;
  /** Optional finer reported symptoms (curated ids or free text). */
  symptoms?: string[];
  skillLevel?: SkillLevel;
  /** Plain-language athlete goals (used for limits / copy tuning). */
  goals?: string[];
  handedness?: 'left' | 'right';
  /** True when a swing video is available for deeper (AI) analysis. */
  videoAvailable?: boolean;
  /** How many times the same fix has already been tried without success. */
  priorFailedAttempts?: number;
  /** Latest retest outcome on this issue, if any. */
  lastRetestOutcome?: RetestOutcomeSignal;
}

/** One ranked likely cause. */
export interface DiagnosisCandidate {
  faultId: string;
  name: string;
  /** Raw accumulated weight from the rule evaluation (higher = stronger). */
  score: number;
  /** This candidate's share of total score, 0..1 (a relative likelihood). */
  share: number;
  severity: FaultSeverity;
  /** Reported symptoms + observable evidence that support this cause. */
  supporting: string[];
  /** True when the underlying fault entry was synthesized, not curated. */
  generated: boolean;
  /** Drill families that address this cause. */
  drillFamilies: string[];
}

/** One row of the admin/debug rule trace. */
export interface TriggeredRule {
  /** The matched symptom id that fired. */
  symptom: string;
  /** The candidate fault it contributed to. */
  faultId: string;
  /** Base weight of the symptom→fault link. */
  weight: number;
  /** Final contribution after reinforcement/contradiction adjustments. */
  contribution: number;
}

/** The full deterministic diagnosis result. */
export interface DeterministicDiagnosis {
  engineVersion: string;
  ruleVersion: string;
  sport: SportId;
  skillLevel: SkillLevel;
  issue: string;
  /** The most likely cause. Always present (honest fallback if needed). */
  primary: DiagnosisCandidate;
  /** The next most likely cause, when one stands apart. */
  secondary?: DiagnosisCandidate;
  /** All candidates, ranked high→low. */
  ranked: DiagnosisCandidate[];
  /** 0..100 confidence in the primary diagnosis. */
  confidence: number;
  confidenceLabel: ConfidenceLabel;
  /** Plain-language reason the confidence is high or low. */
  confidenceReason: string;
  severity: FaultSeverity;
  urgency: DiagnosisUrgency;
  /** Evidence supporting the primary diagnosis. */
  supportingEvidence: string[];
  /** Evidence that argues against the primary diagnosis. */
  contradictingEvidence: string[];
  /** High-value data we don't have that would sharpen the picture. */
  missingData: string[];
  /** Questions to ask the athlete to fill the most valuable gaps. */
  missingDataPrompts: string[];
  /** What would change the diagnosis (plain language). */
  whatWouldChangeIt: string[];
  /** Whether escalating to AI / deeper analysis is recommended, and why. */
  escalateToAI: boolean;
  escalationReasons: string[];
  /** Whether a swing video would meaningfully sharpen the diagnosis. */
  recommendVideo: boolean;
  /** Admin/debug trace of which rules fired. */
  ruleTrace: TriggeredRule[];
  /** Honest one-liner about what this analysis is (and is not). */
  disclaimer: string;
}
