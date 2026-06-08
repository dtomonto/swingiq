// ============================================================
// SwingVantage — Improvement Loops (the issue → drill → outcome moat)
// ------------------------------------------------------------
// The plan's durable advantage isn't the model — it's the structured record
// of "for THIS athlete type, with THIS issue, THIS drill produced THIS
// outcome." The raw signals already exist and are captured locally:
//   • drill feedback  (lib/drillmatch) — issue + drill + verdict
//   • retests         (lib/retest)     — issue + re-film outcome
//   • profile         (store)          — athlete context
// They were just never JOINED into one queryable unit. This module is that
// join (a pure derivation, like lib/agi / lib/timeline) — no new write path,
// no fabrication. An outcome is only present when a real retest matches.
// ============================================================
import type { SportId, SkillLevel } from '@swingiq/core';
import type { DrillFeedbackValue } from '@/lib/drillmatch';
import type { RetestOutcome } from '@/lib/retest';

/** The athlete context a loop was recorded under (the "for this athlete type" axis). */
export interface LoopAthleteContext {
  sport: SportId;
  skillLevel: SkillLevel | null;
}

/** One drill the athlete actually tried for a fault, with their own verdict. */
export interface LoopDrillAttempt {
  drillId: string;
  drillName: string;
  /** Most recent verdict for this drill + fault. */
  verdict: DrillFeedbackValue;
  /** How many verdicts were recorded for this drill + fault. */
  attempts: number;
  /** ISO of the most recent verdict. */
  lastRecordedAt: string;
  notes?: string;
}

/** Where a loop sits in the diagnose → practice → retest cycle. */
export type LoopStage = 'practicing' | 'retested';

/**
 * One linked improvement loop for a single (sport, fault): the issue, the drills
 * actually tried and how they landed, and the measured-by-retest outcome when one
 * exists. This is the moat unit. Built purely from already-captured local data.
 */
export interface ImprovementLoop {
  /** Stable key: `${sport}:${faultId}`. */
  id: string;
  context: LoopAthleteContext;
  faultId: string;
  faultName: string;
  stage: LoopStage;
  /** Drills tried for this fault, most-recently-used first. */
  drills: LoopDrillAttempt[];
  /** Objective re-film outcome, when a retest for this fault was found; else null. */
  retestOutcome: RetestOutcome | null;
  /** Honest, plain-English outcome summary — never claims more than the data shows. */
  outcomeLabel: string;
  /** ISO of the earliest signal in this loop. */
  startedAt: string;
  /** ISO of the most recent signal. */
  updatedAt: string;
}

/**
 * Anonymized effectiveness row — the defensible benchmark seed: for a given
 * (sport, fault, drill), how the athlete's verdicts landed. Cross-user
 * aggregation can layer on later; today it's an honest PERSONAL record, labelled
 * as such in the UI.
 */
export interface DrillEffectiveness {
  sport: SportId;
  faultId: string;
  faultName: string;
  drillId: string;
  drillName: string;
  helped: number;
  noChange: number;
  hurt: number;
  total: number;
  /** helped / total, 0–1. */
  helpRate: number;
}
