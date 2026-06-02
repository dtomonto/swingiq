// ============================================================
// SwingIQ — Retest Engine: Pure Logic
// ------------------------------------------------------------
// No storage, no React — just deterministic functions over
// plain inputs so the rules are fully unit-testable. Storage and
// React wiring live in store.ts / targets.ts / useRetests.ts.
// ============================================================

import type { SavedVideoAnalysis } from '@/lib/video/history';
import type { RetestComparison, RetestOutcome, RetestStatusInfo, RetestWindow } from './types';

const MS_PER_DAY = 86_400_000;

/** Whole days between two instants (b - a), floored, never negative-rounded. */
export function daysBetween(a: Date | string, b: Date | string): number {
  const t1 = new Date(a).getTime();
  const t2 = new Date(b).getTime();
  return Math.floor((t2 - t1) / MS_PER_DAY);
}

/** Build the active window for a finding. */
export function buildWindow(diagnosedAt: string, activeWindowDays: number): RetestWindow {
  const start = new Date(diagnosedAt).getTime();
  const retestBy = new Date(start + activeWindowDays * MS_PER_DAY).toISOString();
  return { diagnosedAt, activeWindowDays, retestBy };
}

/** Resolve where `now` sits in the window, with user-facing copy. */
export function statusFor(window: RetestWindow, now: Date = new Date()): RetestStatusInfo {
  const daysSinceDiagnosis = Math.max(0, daysBetween(window.diagnosedAt, now));
  const daysUntilDue = window.activeWindowDays - daysSinceDiagnosis;

  let status: RetestStatusInfo['status'];
  let label: string;

  if (daysUntilDue >= 3) {
    status = 'active';
    label = `Active for ${daysUntilDue} more day${daysUntilDue === 1 ? '' : 's'}`;
  } else if (daysUntilDue >= 0) {
    status = 'due';
    label = daysUntilDue === 0 ? 'Retest recommended today' : `Retest recommended in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}`;
  } else {
    status = 'overdue';
    const over = -daysUntilDue;
    label = `Retest is ${over} day${over === 1 ? '' : 's'} overdue`;
  }

  return { status, daysSinceDiagnosis, daysUntilDue, label };
}

// ──────────────────────────────────────────────────────────────
// Comparison
// ──────────────────────────────────────────────────────────────

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
}

/** True when two focus strings refer to the same issue (fuzzy, both-ways). */
function focusMatches(a: string, b: string): boolean {
  const na = norm(a);
  const nb = norm(b);
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}

/** Index of the prior focus within the current priority list, or -1. */
function indexOfFocus(priorities: string[], focus: string): number {
  return priorities.findIndex((p) => focusMatches(p, focus));
}

const DIRECTIONAL_NOTE =
  'This is a directional read from your videos — not a measured result. For a precise comparison, retest with the same angle, distance, and equipment.';

/**
 * Compare a fresh analysis (`current`) to the one that produced the finding
 * (`previous`). Conservative and honest: it will not claim improvement when
 * the two swings were filmed under different conditions or confidence is low.
 */
export function compareAnalyses(
  previous: SavedVideoAnalysis,
  current: SavedVideoAnalysis,
): RetestComparison {
  const priorFocus = previous.topFocus;
  const currentPriorities = current.analysis.topPriorities.map((p) => p.issue);
  const idx = indexOfFocus(currentPriorities, priorFocus);

  // Same-condition assessment from declared camera angle (only signal we have).
  let sameConditionsMet: boolean | null;
  if (!previous.declaredCameraAngle || !current.declaredCameraAngle) {
    sameConditionsMet = null;
  } else {
    sameConditionsMet = previous.declaredCameraAngle === current.declaredCameraAngle;
  }

  const cautions: string[] = [];
  if (sameConditionsMet === false) {
    cautions.push('You filmed from a different camera angle, so this comparison is unreliable.');
  } else if (sameConditionsMet === null) {
    cautions.push('Camera angle was not recorded for one of the swings — compare with care.');
  }

  const lowConfidence =
    current.analysis.visibilityQuality === 'poor' || current.analysis.overallConfidence < 0.4;
  if (lowConfidence) {
    cautions.push('The latest video was hard to read clearly, which limits this comparison.');
  }

  // Decide outcome — conservatively.
  let outcome: RetestOutcome;
  let headline: string;
  let detail: string;

  if (lowConfidence) {
    outcome = 'inconclusive';
    headline = 'Too hard to tell this time';
    detail = `The latest video wasn't clear enough to judge whether "${priorFocus}" changed. Re-film in better conditions to get a real read.`;
  } else if (idx === -1) {
    // Prior focus is no longer a listed priority.
    if (sameConditionsMet === false) {
      outcome = 'inconclusive';
      headline = 'Possible progress — but conditions differed';
      detail = `"${priorFocus}" didn't surface this time, but the camera angle changed, so treat this as a lead rather than proof. Re-film from the same angle to confirm.`;
    } else {
      outcome = 'improved';
      headline = 'Looks like progress';
      detail = `"${priorFocus}" was your top focus last time and didn't surface as a priority this time. Keep reinforcing it before moving on.`;
    }
  } else if (idx === 0) {
    outcome = 'persisting';
    headline = 'Still your top priority';
    detail = `"${priorFocus}" is still showing up first. That's normal — give the drills more reps, then retest again.`;
  } else {
    // Present but demoted in the list.
    if (sameConditionsMet === false) {
      outcome = 'inconclusive';
      headline = 'Mixed signal';
      detail = `"${priorFocus}" dropped down the list, but the camera angle changed — confirm with a same-angle retest.`;
    } else {
      outcome = 'improved';
      headline = 'Trending the right way';
      detail = `"${priorFocus}" dropped from your #1 priority to lower on the list. Encouraging — keep at it and retest again.`;
    }
  }

  return {
    outcome,
    headline,
    detail,
    sameConditionsMet,
    cautions,
    confidenceNote: DIRECTIONAL_NOTE,
  };
}
