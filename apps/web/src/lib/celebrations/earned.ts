// ============================================================
// SwingVantage — Earn-Moment Celebration Signals
// ------------------------------------------------------------
// Pure helpers (no React) that turn the existing community
// achievement system into "celebration" view models. We reuse
// ACHIEVEMENTS as the single source of truth for what counts as an
// earned milestone (sessions, streaks, drills, diagnostics,
// challenges, multi-sport, …) so celebrations never drift from the
// Swing Passport / badges the user already sees.
// ============================================================

import { ACHIEVEMENTS, getAchievementById } from '@/lib/community/achievements';
import type { AchievementContext } from '@/lib/community/types';

export interface Celebration {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
}

/** IDs of every achievement currently earned for the given app state. */
export function earnedAchievementIds(ctx: AchievementContext): string[] {
  return ACHIEVEMENTS.filter((a) => a.isEarned(ctx)).map((a) => a.id);
}

/** Presentation-ready celebration for an achievement id (or null if unknown). */
export function celebrationFor(id: string): Celebration | null {
  const a = getAchievementById(id);
  if (!a) return null;
  return { id: a.id, emoji: a.icon, title: a.name, subtitle: a.description };
}
