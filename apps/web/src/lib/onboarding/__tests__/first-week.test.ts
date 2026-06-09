import { buildFirstWeekPlan, type FirstWeekSignals } from '../first-week';

const base: FirstWeekSignals = {
  firstSeenAt: null,
  hasProfile: false,
  analysesCount: 0,
  sessionsCount: 0,
};

describe('buildFirstWeekPlan', () => {
  it('a brand-new athlete starts on day 1 with nothing done', () => {
    const p = buildFirstWeekPlan(base);
    expect(p.currentDay).toBe(1);
    expect(p.completedCount).toBe(0);
    expect(p.graduated).toBe(false);
    expect(p.days).toHaveLength(7);
  });

  it('a first analysis completes day 1 (and day 2 follows from it)', () => {
    const p = buildFirstWeekPlan({ ...base, analysesCount: 1 });
    expect(p.days[0].done).toBe(true);
    expect(p.days[1].done).toBe(true); // "see your fix" follows from having a read
    expect(p.currentDay).toBe(3); // first not-done
  });

  it('logging a session unblocks the drill day (day 3 proxy)', () => {
    const p = buildFirstWeekPlan({ ...base, analysesCount: 1, sessionsCount: 1 });
    expect(p.days[2].done).toBe(true);
    expect(p.days[3].done).toBe(true);
  });

  it('graduates when every step is done', () => {
    const p = buildFirstWeekPlan({
      firstSeenAt: new Date().toISOString(),
      hasProfile: true,
      analysesCount: 2,
      sessionsCount: 2,
      retestCompleted: true,
    });
    expect(p.completedCount).toBe(7);
    expect(p.graduated).toBe(true);
  });

  it('graduates (retires) once past day 7 even if incomplete', () => {
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    const p = buildFirstWeekPlan({ ...base, firstSeenAt: eightDaysAgo });
    expect(p.graduated).toBe(true);
  });

  it('currentDay never exceeds 7 and focuses the earliest unfinished step', () => {
    const p = buildFirstWeekPlan({ ...base, analysesCount: 2, hasProfile: true });
    expect(p.currentDay).toBeLessThanOrEqual(7);
    expect(p.currentDay).toBeGreaterThanOrEqual(1);
  });
});
