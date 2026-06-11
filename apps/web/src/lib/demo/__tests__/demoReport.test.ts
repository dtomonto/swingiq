import { buildDemoReport, DEMO_SPORT_IDS, sportForSlug, slugForSport } from '../demo-report';

describe('demo reports', () => {
  it('builds a coherent report for all 7 sports', () => {
    expect(DEMO_SPORT_IDS).toHaveLength(7);
    for (const id of DEMO_SPORT_IDS) {
      const r = buildDemoReport(id);
      expect(r.score).toBeGreaterThan(0);
      expect(r.score).toBeLessThanOrEqual(100);
      expect(r.primaryFix.title.length).toBeGreaterThan(0);
      expect(r.phases.length).toBeGreaterThan(2);
      expect(r.drills.length).toBeGreaterThan(0);
      expect(r.plan).toHaveLength(7);
      expect(r.profile.fields.length).toBeGreaterThan(0);
      expect(r.whatToDoNext.length).toBeGreaterThan(0);
    }
  });

  it('golf report is engine-derived (real diagnosis, sub-scores, shots)', () => {
    const r = buildDemoReport('golf');
    expect(r.subScores).toHaveLength(5);
    expect(r.shots && r.shots.length).toBeGreaterThan(0);
    expect(r.metrics && r.metrics.length).toBeGreaterThan(0);
    // The sample shots have an open face / push-fade pattern → a real diagnosis fires.
    expect(r.primaryFix.cause.length).toBeGreaterThan(0);
  });

  it('non-golf reports carry real benchmarks and no golf-only sections', () => {
    const r = buildDemoReport('tennis');
    expect(r.subScores).toBeUndefined();
    expect(r.shots).toBeUndefined();
    expect(r.benchmarks && r.benchmarks.length).toBeGreaterThan(0);
  });

  it('slug round-trips for every sport', () => {
    for (const id of DEMO_SPORT_IDS) {
      expect(sportForSlug(slugForSport(id))).toBe(id);
    }
  });
});
