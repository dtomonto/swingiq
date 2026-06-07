import { classifyPlayerStage } from '../classify';
import { GOLF_CONFIG, TENNIS_CONFIG } from '../config';
import { makeSignals, metric, recentIso } from './helpers';

describe('classifyPlayerStage — golf', () => {
  it('classifies a brand-new athlete with no data as provisional foundation', () => {
    const r = classifyPlayerStage(makeSignals('golf'), GOLF_CONFIG);
    expect(r.currentStage.order).toBeLessThanOrEqual(2);
    expect(r.confidence).toBe('provisional');
    expect(r.presentSources).toHaveLength(0);
  });

  it('uses a handicap as ONE guidepost, not the only signal', () => {
    const r = classifyPlayerStage(
      makeSignals('golf', {
        rating: { sport: 'golf', ratingType: 'golf_handicap', value: 14, source: 'self_reported', dateRecorded: recentIso() },
        profile: { selfRatedSkill: 'intermediate' },
      }),
      GOLF_CONFIG,
    );
    // Handicap 14 → ~G4; blended with self-report stays in the competent band.
    expect(r.currentStage.code).toMatch(/^G[34]$/);
    expect(r.presentSources).toContain('rating');
    expect(r.ratingImpliedOrder).toBe(4);
  });

  it('does NOT promote to elite/pro from self-report alone (guardrail)', () => {
    const r = classifyPlayerStage(
      makeSignals('golf', { profile: { selfRatedSkill: 'elite' } }),
      GOLF_CONFIG,
    );
    expect(r.currentStage.order).toBeLessThanOrEqual(8);
    expect(r.currentStage.tier).not.toBe('professional');
  });

  it('raises confidence and order with corroborating performance data', () => {
    const r = classifyPlayerStage(
      makeSignals('golf', {
        rating: { sport: 'golf', ratingType: 'golf_handicap', value: 6, source: 'imported', dateRecorded: recentIso() },
        profile: { selfRatedSkill: 'advanced', competitionLevel: 'club' },
        metrics: [
          metric({ metricName: 'swing_quality', category: 'technique', value: 78, score: 78 }),
          metric({ metricName: 'average_score', category: 'scoring', value: 80, score: 80, basis: 'self_reported' }),
        ],
        activity: { practiceSessions: 6, videoUploads: 3, lastActiveAt: recentIso(2) },
      }),
      GOLF_CONFIG,
    );
    expect(r.currentStage.order).toBeGreaterThanOrEqual(5);
    expect(['low', 'medium', 'high']).toContain(r.confidence);
    expect(r.categoryScores.find((c) => c.category === 'technique')?.score).toBe(78);
  });

  it('redistributes weight when categories are missing', () => {
    const r = classifyPlayerStage(
      makeSignals('golf', {
        metrics: [metric({ metricName: 'swing_quality', category: 'technique', value: 60, score: 60 })],
      }),
      GOLF_CONFIG,
    );
    expect(r.redistributedWeight).toBe(true);
  });
});

describe('classifyPlayerStage — tennis', () => {
  it('maps a UTR to the expected stage band', () => {
    const r = classifyPlayerStage(
      makeSignals('tennis', {
        rating: { sport: 'tennis', ratingType: 'utr', value: 6.0, source: 'imported', dateRecorded: recentIso() },
      }),
      TENNIS_CONFIG,
    );
    expect(r.ratingImpliedOrder).toBe(4); // UTR 6.0 → T4
  });

  it('maps an NTRP rating to the expected stage band', () => {
    const r = classifyPlayerStage(
      makeSignals('tennis', {
        rating: { sport: 'tennis', ratingType: 'ntrp', value: 4.0, source: 'self_reported', dateRecorded: recentIso() },
      }),
      TENNIS_CONFIG,
    );
    expect(r.ratingImpliedOrder).toBe(5); // NTRP 4.0 → T5
  });

  it('works with no rating at all (estimates from other signals)', () => {
    const r = classifyPlayerStage(
      makeSignals('tennis', {
        profile: { selfRatedSkill: 'intermediate', competitionLevel: 'club' },
        metrics: [metric({ metricName: 'swing_quality', category: 'technique', value: 55, score: 55 })],
        activity: { practiceSessions: 3, lastActiveAt: recentIso(3) },
      }),
      TENNIS_CONFIG,
    );
    expect(r.currentStage.code).toMatch(/^T\d+$/);
    expect(r.ratingImpliedOrder).toBeNull();
  });
});
