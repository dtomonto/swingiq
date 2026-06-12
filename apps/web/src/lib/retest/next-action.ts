// ============================================================
// SwingVantage — Retest Engine: Result → Next Action
// ------------------------------------------------------------
// A completed retest should never be a dead end. Given the
// directional outcome of a comparison, this maps to the single
// honest next move that keeps the improvement loop turning:
//   improved     → lock it in, then find the next priority
//   persisting   → more reps on the same focus before retesting
//   regressed    → step back to fundamentals (measured paths only)
//   inconclusive → re-film under the same conditions
//
// Pure + deterministic (no React, no storage) so it's fully
// unit-testable and reusable on the hub and the dashboard nudge.
// ============================================================

import type { RetestOutcome, RetestResult } from './types';

/** Tone of the suggested next move — drives the card's accent. */
export type RetestNextTone = 'progress' | 'persist' | 'recover' | 'reconfirm';

/** The single honest next step after a retest result. */
export interface RetestNextAction {
  tone: RetestNextTone;
  /** Short label, e.g. "Keep the momentum". */
  title: string;
  /** One sentence of plain guidance. */
  message: string;
  /** A real in-app destination (never fabricated). */
  cta: { label: string; href: string };
}

const BY_OUTCOME: Record<RetestOutcome, Omit<RetestNextAction, 'message'> & { message: (focus: string) => string }> = {
  improved: {
    tone: 'progress',
    title: 'Keep the momentum',
    message: () =>
      'Nice direction. Reinforce it with a few more reps, then analyze a fresh swing to find your next priority.',
    cta: { label: 'Find your next focus', href: '/video' },
  },
  persisting: {
    tone: 'persist',
    title: 'Give it more reps',
    message: (focus) =>
      `"${focus}" is still your top priority — that's normal. Work the drills a bit longer, then retest.`,
    cta: { label: 'Open your drills', href: '/drills' },
  },
  regressed: {
    tone: 'recover',
    title: 'Back to fundamentals',
    message: (focus) =>
      `"${focus}" slipped this time. Step back to the basics for this move before pushing pace again.`,
    cta: { label: 'Review the fundamentals', href: '/learn' },
  },
  inconclusive: {
    tone: 'reconfirm',
    title: 'Get a clean read',
    message: () =>
      'This comparison was too uncertain to judge. Re-film under the same angle, distance, and equipment for a reliable retest.',
    cta: { label: 'Retest your swing', href: '/video' },
  },
};

/**
 * The honest next move for a completed retest. Always returns guidance — every
 * outcome has a productive next step, so the loop never dead-ends.
 */
export function nextActionFor(result: RetestResult): RetestNextAction {
  const spec = BY_OUTCOME[result.comparison.outcome] ?? BY_OUTCOME.inconclusive;
  return {
    tone: spec.tone,
    title: spec.title,
    message: spec.message(result.priorFocus),
    cta: spec.cta,
  };
}
