// ============================================================
// SwingIQ — Next Badge selection (pure, testable)
// ------------------------------------------------------------
// Picks the single closest-to-earned achievement (highest progress
// percent that is started but not yet complete) so the dashboard
// can show a goal-gradient "almost there" nudge. Pure — no React —
// so it can be unit-tested and reused.
// ============================================================

import { ACHIEVEMENTS, computeAchievementProgress } from './achievements';
import type { AchievementContext } from './types';

export interface NextBadge {
  name: string;
  icon: string;
  progress: number;
  max: number;
  percent: number;
}

/**
 * The unearned achievement with the highest completion percent (and
 * at least some progress). Returns null when nothing is started yet.
 */
export function pickNextBadge(ctx: AchievementContext): NextBadge | null {
  let best: NextBadge | null = null;
  for (const a of ACHIEVEMENTS) {
    const { progress, percent, isEarned } = computeAchievementProgress(a, ctx);
    if (isEarned || percent <= 0) continue;
    if (!best || percent > best.percent) {
      best = { name: a.name, icon: a.icon, progress, max: a.maxProgress, percent };
    }
  }
  return best;
}
