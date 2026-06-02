// ============================================================
// SwingIQ — Retest Engine: Types
// ------------------------------------------------------------
// Turns a one-time diagnosis into an improvement loop. Every
// finding gets an "active until / retest by" window; once the
// user records a fresh swing under the same conditions, the
// engine compares it to the prior one and labels the change.
//
// HONESTY: video-based comparisons are DIRECTIONAL, not measured.
// The engine says so in plain language and refuses to claim
// improvement when the conditions don't support it.
// ============================================================

import type { SportId } from '@swingiq/core';

/** Where an open finding sits in its retest window. */
export type RetestStatus = 'active' | 'due' | 'overdue';

/**
 * The result of comparing a fresh swing to the prior one.
 *  - improved:     the prior top focus is gone or demoted (directional)
 *  - persisting:   the same focus is still the top priority
 *  - inconclusive: conditions differed or confidence was too low to judge
 *  - regressed:    reserved for MEASURED comparisons; the estimated-vision
 *                  path does not assert regression from a single re-film.
 */
export type RetestOutcome = 'improved' | 'persisting' | 'inconclusive' | 'regressed';

/** The dated window a finding stays active for. */
export interface RetestWindow {
  /** ISO timestamp the finding was made (the source analysis date). */
  diagnosedAt: string;
  /** Days the finding stays active before a retest is recommended. */
  activeWindowDays: number;
  /** ISO timestamp a retest is recommended by (diagnosedAt + window). */
  retestBy: string;
}

/** Where "now" sits relative to a window, with user-facing copy. */
export interface RetestStatusInfo {
  status: RetestStatus;
  daysSinceDiagnosis: number;
  /** Days until the retest is due; negative when overdue. */
  daysUntilDue: number;
  /** Plain-language status, e.g. "Active for 3 more days". */
  label: string;
}

/**
 * An OPEN finding the user is being asked to retest. Derived from the most
 * recent saved analysis for a sport plus the fault ontology's retest rules.
 */
export interface RetestTarget {
  /** Stable id of the source analysis this finding came from. */
  id: string;
  sport: SportId;
  sportLabel: string;
  emoji?: string;
  /** Resolved fault id (may be a `generated` ontology id for free-text foci). */
  faultId: string;
  faultName: string;
  /** The user-facing focus text from the analysis. */
  focus: string;
  declaredCameraAngle?: string;
  window: RetestWindow;
  status: RetestStatusInfo;
  /** Same-condition requirements for a fair retest (from the ontology). */
  sameConditions: string[];
  /** What to look at again (from the ontology). */
  whatToReassess: string;
}

/** The outcome of comparing the latest swing to the previous one. */
export interface RetestComparison {
  outcome: RetestOutcome;
  /** Short, honest headline, e.g. "Looks like progress". */
  headline: string;
  /** A sentence explaining what changed and what it does (and doesn't) mean. */
  detail: string;
  /** Whether the two swings were captured under comparable conditions. */
  sameConditionsMet: boolean | null;
  cautions: string[];
  /** Always present — reminds the user a video comparison is directional. */
  confidenceNote: string;
}

/**
 * A completed retest: a prior finding compared against a newer swing.
 * Derived from two consecutive saved analyses for the same sport.
 */
export interface RetestResult {
  /** Stable id for the result (the newer analysis id). */
  id: string;
  sport: SportId;
  sportLabel: string;
  emoji?: string;
  priorFocus: string;
  priorDate: string;
  currentDate: string;
  comparison: RetestComparison;
}

/** Persisted, minimal client state (own localStorage key). */
export interface RetestStoreState {
  version: 1;
  /** Open-target ids the user dismissed (hides the reminder). */
  dismissedTargetIds: string[];
  /** Result ids the user acknowledged (hides the result card). */
  acknowledgedResultIds: string[];
}
