import { calculateJourneyMomentum, isRegressionRisk } from '../momentum';
import { emptyActivity, recentIso } from './helpers';

describe('calculateJourneyMomentum', () => {
  it('reports inactive for an empty activity profile', () => {
    const m = calculateJourneyMomentum(emptyActivity());
    expect(m.band).toBe('inactive');
    expect(m.score).toBeLessThanOrEqual(20);
  });

  it('lets a beginner earn strong momentum from activity alone', () => {
    const m = calculateJourneyMomentum({
      ...emptyActivity(),
      practiceSessions: 10,
      videoUploads: 6,
      drillsCompleted: 12,
      currentStreakDays: 10,
      recommendationsCompleted: 4,
      lastActiveAt: recentIso(0),
      recentTrend: 0.6,
    });
    expect(m.score).toBeGreaterThanOrEqual(60);
    expect(['strong', 'accelerated']).toContain(m.band);
    expect(m.drivers.length).toBeGreaterThan(0);
  });

  it('decays when the athlete has gone quiet', () => {
    const m = calculateJourneyMomentum({
      ...emptyActivity(),
      practiceSessions: 8,
      lastActiveAt: recentIso(40),
    });
    // No recency credit; momentum is suppressed.
    expect(m.score).toBeLessThan(60);
  });
});

describe('isRegressionRisk', () => {
  it('flags a previously-active athlete who has gone quiet', () => {
    expect(isRegressionRisk({ ...emptyActivity(), practiceSessions: 5, lastActiveAt: recentIso(30) })).toBe(true);
  });

  it('does not flag a recently-active athlete', () => {
    expect(isRegressionRisk({ ...emptyActivity(), practiceSessions: 5, lastActiveAt: recentIso(2) })).toBe(false);
  });

  it('does not flag a brand-new athlete with no history', () => {
    expect(isRegressionRisk(emptyActivity())).toBe(false);
  });
});
