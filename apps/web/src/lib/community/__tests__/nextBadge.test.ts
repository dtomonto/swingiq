import { ACHIEVEMENTS, computeAchievementProgress } from '../achievements';
import { pickNextBadge } from '../next-badge';
import type { AchievementContext } from '../types';

// Minimal context builder — achievements only read a handful of fields,
// so we cast narrow stand-ins rather than constructing full store records.
function ctxOf(partial: Partial<AchievementContext>): AchievementContext {
  return {
    sessions: [],
    videoAnalyses: [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    training: { streak_days: 0, drills_completed: {} } as any,
    lastExportAt: null,
    exportCount: 0,
    challengesCompleted: [],
    ...partial,
  } as AchievementContext;
}

describe('pickNextBadge', () => {
  it('returns null when nothing has been started', () => {
    expect(pickNextBadge(ctxOf({}))).toBeNull();
  });

  it('returns the highest-percent unearned achievement (started, not complete)', () => {
    // One golf session gives several achievements partial progress.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ctx = ctxOf({ sessions: [{ sport: 'golf', diagnoses: [], shots: [] }] as any });
    const result = pickNextBadge(ctx);

    const unearned = ACHIEVEMENTS
      .map((a) => computeAchievementProgress(a, ctx))
      .filter((p) => !p.isEarned && p.percent > 0);
    const maxPercent = Math.max(...unearned.map((p) => p.percent));

    expect(result).not.toBeNull();
    expect(result!.percent).toBe(maxPercent);
    expect(result!.percent).toBeGreaterThan(0);
    expect(result!.percent).toBeLessThan(100);
    expect(result!.max - result!.progress).toBeGreaterThan(0);
  });
});
