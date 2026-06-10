// ============================================================
// SwingVantage — Motion Lab: Retest Protocols
// ------------------------------------------------------------
// "One fix. One plan. One retest." The retest closes the loop: it tells
// the athlete exactly how to re-film and re-measure the SAME motion so a
// change is comparable, not guesswork. It reuses the session's own phase
// markers (the windows the lab already detected) so the retest watches
// the same moments, and it targets the single prioritized fix.
//
// Pure + deterministic — derived entirely from an existing MotionSession,
// so it never invents numbers. For rally sports it also folds in the
// continuous-movement focus (did recovery / next-ready improve?).
// ============================================================

import type { MotionSession, MotionBasis } from './types';

export interface RetestCheckpoint {
  /** The phase key this checkpoint reuses (same marker the lab detected). */
  phaseKey: string;
  label: string;
  /** What to watch in this phase on the retest. */
  watchFor: string;
}

export interface RetestProtocol {
  title: string;
  /** The single prioritized thing being retested. */
  focus: string;
  /** Suggested days of practice before re-filming. */
  timeframeDays: number;
  /** How to reproduce the SAME capture so the comparison is fair. */
  reproduce: string[];
  /** Phases to re-watch — reuses the session's own markers. */
  checkpoints: RetestCheckpoint[];
  /** The measurable bar that says the fix worked. */
  successCriterion: string;
  /** Rally-sport movement check (recovery / next-ready), or null. */
  movementCheck: string | null;
  basis: MotionBasis;
}

const VIEW_LABEL: Record<string, string> = {
  face_on: 'face-on',
  down_the_line: 'down-the-line',
  side: 'from the side',
  rear: 'from behind',
  unknown: 'from the same angle',
};

const MOVEMENT_FOCUS_CHECK: Record<string, string> = {
  readiness: 'Confirm you start in a more balanced, athletic ready position.',
  spacing: 'Confirm you meet the ball with cleaner spacing, on balance.',
  recovery: 'Confirm you decelerate under control and finish balanced after contact.',
  recentering: 'Confirm you take a recovery step back toward a usable next-ready position.',
};

/** Build the retest protocol for a completed analysis. */
export function buildRetestProtocol(session: MotionSession): RetestProtocol {
  const topFix = session.report.topFixes[0] ?? null;
  const focus = topFix?.title ?? session.keyFault ?? 'your priority fix';

  // The weakest scored metric drives the measurable success bar.
  const weakest = session.metrics
    .filter((m) => m.normalizedScore != null)
    .sort((a, b) => (a.normalizedScore ?? 100) - (b.normalizedScore ?? 100))[0];

  // ── Reproduce the capture (so before/after is comparable) ─────
  const reproduce = [
    `Film the same ${session.motionLabel.toLowerCase()} ${VIEW_LABEL[session.capture.view] ?? 'from the same angle'}, full body in frame.`,
    'Use the same lighting and roughly the same distance so the body fills the frame the same way.',
    'Capture the whole rep — from setup through the finish — so every phase marker lines up.',
  ];

  // ── Checkpoints: reuse the session's own phase markers ────────
  const phases = session.phases;
  const picked: typeof phases = [];
  const pushPhase = (key: string | undefined) => {
    if (!key) return;
    const p = phases.find((x) => x.key === key);
    if (p && !picked.some((q) => q.key === p.key)) picked.push(p);
  };
  // 1) the phase the fix lives in, 2) the contact/impact moment, 3) the finish.
  pushPhase(topFix?.phase);
  pushPhase(phases.find((p) => /contact|impact|release/.test(p.key))?.key);
  pushPhase(phases[phases.length - 1]?.key);
  // Fall back to the first three detected phases if nothing matched.
  if (picked.length === 0) picked.push(...phases.slice(0, 3));

  const checkpoints: RetestCheckpoint[] = picked.slice(0, 3).map((p) => ({
    phaseKey: p.key,
    label: p.label,
    watchFor: p.interpretation || `Re-watch your ${p.label.toLowerCase()} and compare it to last time.`,
  }));

  // ── Success criterion (measurable, honest) ────────────────────
  const successCriterion = weakest
    ? `Re-score the same motion: the goal is to move "${weakest.name}" up from ${weakest.normalizedScore}/100${weakest.target ? ` toward its target (${weakest.target})` : ''}, without losing your strengths.`
    : 'Re-score the same motion and confirm your overall Motion Score improved without losing a strength.';

  const movementCheck = session.continuousMovement
    ? MOVEMENT_FOCUS_CHECK[session.continuousMovement.primaryFocus] ?? null
    : null;

  return {
    title: `Retest your ${session.motionLabel.toLowerCase()}`,
    focus,
    timeframeDays: 14,
    reproduce,
    checkpoints,
    successCriterion,
    movementCheck,
    basis: session.scoreboard.basis,
  };
}
