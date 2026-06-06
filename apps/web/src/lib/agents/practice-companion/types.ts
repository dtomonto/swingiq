// ============================================================
// SwingVantage — Agent: Live Practice Companion — Types
// ------------------------------------------------------------
// The in-session coach. Where the practice-planner builds a static
// plan, this agent coaches the actual reps: one cue at a time, it
// tracks results, judges each drill, and adapts the next one
// (level up / repeat / move on). Pure data shapes; no React, DOM,
// or AI — the engine is a deterministic reducer.
// ============================================================

import type { SportId } from '@swingiq/core';

/** One drill the companion will run, with its own difficulty + success bar. */
export interface CompanionDrill {
  name: string;
  /** The single "what to feel" cue surfaced during the drill. */
  cue: string;
  /** How many reps make up one round of this drill. */
  repsTarget: number;
  /** Success rate (0–1) needed to count the drill as progressing. */
  successThreshold: number;
  /** 1-based difficulty; level-ups bump it as the user masters drills. */
  level: number;
}

export interface CompanionPlan {
  sport: SportId;
  focus: string;
  drills: CompanionDrill[];
}

export interface RepResult {
  success: boolean;
}

export type DrillVerdict = 'mastered' | 'progressing' | 'struggled';

/** The recorded outcome of a finished drill round. */
export interface DrillOutcome {
  name: string;
  attempts: number;
  successes: number;
  successRate: number;
  verdict: DrillVerdict;
  level: number;
}

export type CompanionStatus = 'idle' | 'active' | 'complete';

/** The full, serializable in-session state (safe to persist). */
export interface CompanionState {
  sport: SportId;
  focus: string;
  drills: CompanionDrill[];
  index: number;
  status: CompanionStatus;
  /** Reps recorded for the CURRENT drill round. */
  reps: RepResult[];
  /** Outcomes of completed drill rounds. */
  history: DrillOutcome[];
  startedAt: string | null;
  endedAt: string | null;
}

export type CompanionPhase = 'intro' | 'in_drill' | 'drill_complete' | 'summary';

/** What the user can/should do next — drives which control the UI shows. */
export type CompanionAction = 'start' | 'rep' | 'next' | 'repeat' | 'finish';

/** A summary surfaced when the session completes. */
export interface CompanionSummary {
  totalReps: number;
  totalSuccesses: number;
  overallSuccessRate: number;
  drillsMastered: number;
  drillsRun: number;
  durationMinutes: number | null;
  /** A grounded prompt to re-test and lock in the gains. */
  retestPrompt: string;
}

/** The render-ready guidance for the current state. One cue at a time. */
export interface CompanionGuidance {
  phase: CompanionPhase;
  drillName: string | null;
  drillIndex: number;
  totalDrills: number;
  /** The single cue to show right now. */
  cue: string;
  /** Plain instruction ("Rep 3 of 6"). */
  instruction: string;
  repsDone: number;
  repsTarget: number;
  /** Set when a drill round just finished. */
  verdict: DrillVerdict | null;
  /** The recommended next control to surface. */
  recommendedAction: CompanionAction;
  encouragement: string;
  /** Present only in the 'summary' phase. */
  summary: CompanionSummary | null;
}
