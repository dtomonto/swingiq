// ============================================================
// SwingIQ — Progress Intelligence: Shared Types
// ------------------------------------------------------------
// Three honest, longitudinal summaries built ON TOP of existing
// systems (agent progress memory + retest engine + drill feedback):
//   - Player Arc:        the story of your improvement so far
//   - Flaw Fingerprint:  the pattern behind your recurring issues
//   - Training Receipt:  proof of what a practice→retest cycle did
//
// All three are pure view-models: they take plain data and return
// UI-ready structures, so they are fully unit-testable and never
// fabricate progress that the data doesn't support.
// ============================================================

import type { SportId, SkillLevel } from '@swingiq/core';
import type { TrendDirection, ProgressMemory, SessionSummary, PlanStatus } from '@/lib/agents';
import type { RetestResult, RetestTarget, RetestOutcome } from '@/lib/retest';
import type { DrillFeedbackRecord } from '@/lib/drillmatch';

// ── Player Arc ────────────────────────────────────────────────

export interface PlayerArcInput {
  sport: SportId;
  sportLabel: string;
  skillLevel?: SkillLevel | null;
  goal?: string | null;
  /** Active-sport sessions, newest first. */
  sessions: SessionSummary[];
  streakDays: number;
  planStatus: PlanStatus;
  daysSinceLastActivity: number | null;
  /** Output of the agent progress-memory workflow. */
  progress: ProgressMemory;
  retestResults: RetestResult[];
  retestTargets: RetestTarget[];
}

export interface PlayerArc {
  sport: SportId;
  hasData: boolean;
  /** "Your mission: lock in a fix for <focus>." */
  mission: string;
  /** Where the journey started. */
  baseline: string;
  trendDirection: TrendDirection;
  trendSummary: string;
  /** Foci that keep recurring (2+ sessions). */
  recurringFlaws: string[];
  /** Foci that used to show up but aren't your current top issue. */
  movedPastFlaws: string[];
  streakDays: number;
  sessionsLogged: number;
  retestsCompleted: number;
  /** The single best next move (from progress memory). */
  nextBestAction: string;
  /** Small, honestly-earned milestones. */
  milestones: string[];
}

// ── Flaw Fingerprint ──────────────────────────────────────────

export interface FlawFingerprintInput {
  sport: SportId;
  /** Sessions across ALL sports (newest first) so cross-sport patterns surface. */
  allSessions: SessionSummary[];
  /** Active-sport sessions, newest first. */
  sportSessions: SessionSummary[];
  drillFeedback: DrillFeedbackRecord[];
}

export interface DrillVerdict {
  drillId: string;
  name: string;
}

export interface FlawFingerprint {
  hasData: boolean;
  mostCommonFlaw: string | null;
  occurrences: number;
  relatedFlaws: string[];
  sportsAffected: SportId[];
  /** Plain-language likely cause, from the fault ontology. */
  patternExplanation: string;
  drillsThatHelped: DrillVerdict[];
  drillsThatDidNot: DrillVerdict[];
  nextIntervention: string;
}

// ── Training Receipt ──────────────────────────────────────────

export interface TrainingReceiptInput {
  sport: SportId;
  /** Most recent completed retest for the sport, if any. */
  latestResult: RetestResult | null;
  /** Drill feedback tied to the retested fault. */
  drillFeedbackForFault: DrillFeedbackRecord[];
  /** Distinct drills the user marked feedback on for this fault. */
  drillsTried: DrillVerdict[];
}

export interface TrainingReceipt {
  available: boolean;
  diagnosed: string;
  practiced: string;
  whatChanged: string;
  drillEffectiveness: string;
  outcome: RetestOutcome | null;
  nextRecommendation: string;
  /** Always present — a video retest is directional, not measured. */
  confidenceNote: string;
}
