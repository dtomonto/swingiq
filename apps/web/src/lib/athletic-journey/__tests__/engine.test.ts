import { buildJourneyDashboard } from '../engine';
import { computeMilestones } from '../milestones';
import { getStageByCode } from '../config';
import { makeSignals, metric, recentIso } from './helpers';

describe('buildJourneyDashboard — end to end', () => {
  it('produces a complete, honest golf dashboard with no rating', () => {
    const d = buildJourneyDashboard(
      makeSignals('golf', {
        profile: { selfRatedSkill: 'intermediate' },
        metrics: [metric({ metricName: 'swing_quality', category: 'technique', value: 62, score: 62 })],
        activity: { practiceSessions: 4, videoUploads: 2, lastActiveAt: recentIso(1) },
      }),
    );
    expect(d.currentStage.code).toMatch(/^G\d+$/);
    expect(d.nextStage).not.toBeNull();
    expect(d.prescription.blocks.length).toBeGreaterThan(0);
    expect(d.momentum.score).toBeGreaterThan(0);
    expect(d.ratingAlignment.alignment).toBe('unknown');
    expect(d.missingData.some((m) => m.id === 'golf_handicap')).toBe(true);
    expect(d.narrative.enhanced).toBe(false);
    expect(d.disclaimer).toMatch(/not a verified ranking/i);
  });

  it('produces a complete tennis dashboard from a UTR', () => {
    const d = buildJourneyDashboard(
      makeSignals('tennis', {
        rating: { sport: 'tennis', ratingType: 'utr', value: 6.0, source: 'imported', dateRecorded: recentIso() },
      }),
    );
    expect(d.currentStage.code).toMatch(/^T\d+$/);
    expect(d.ratingAlignment.ratingType).toBe('utr');
  });

  it('never emits forbidden hype/guarantee language in the narrative', () => {
    const d = buildJourneyDashboard(makeSignals('golf', { profile: { selfRatedSkill: 'elite' } }));
    const blob = JSON.stringify(d.narrative).toLowerCase();
    for (const bad of ['guarantee', 'will go pro', 'pro-ready', "can't-miss"]) {
      expect(blob).not.toContain(bad);
    }
  });

  it('adds an injury-aware safety note when an injury is on file', () => {
    const d = buildJourneyDashboard(
      makeSignals('golf', { profile: { injuries: 'lower back tightness' } }),
    );
    expect(d.prescription.safetyNote).toMatch(/not medical advice/i);
  });

  it('refuses to build a journey for an in-development sport', () => {
    expect(() => buildJourneyDashboard(makeSignals('baseball'))).toThrow();
  });
});

describe('computeMilestones', () => {
  it('auto-completes a measurable milestone when the target is met', () => {
    const stage = getStageByCode('golf', 'G1')!;
    const sig = makeSignals('golf', { activity: { loggedCompetitions: 3 } });
    const ms = computeMilestones(sig, stage);
    const logged = ms.find((m) => m.id === 'g1_log_3_rounds');
    expect(logged?.status).toBe('completed');
    expect(logged?.progress).toBe(1);
  });

  it('honors explicitly completed (non-measurable) milestones', () => {
    const stage = getStageByCode('golf', 'G1')!;
    const ms = computeMilestones(makeSignals('golf'), stage, new Set(['g1_putting_bench']));
    expect(ms.find((m) => m.id === 'g1_putting_bench')?.status).toBe('completed');
  });

  it('reports partial progress toward a measurable milestone', () => {
    const stage = getStageByCode('golf', 'G1')!;
    const sig = makeSignals('golf', { activity: { loggedCompetitions: 1 } });
    const logged = computeMilestones(sig, stage).find((m) => m.id === 'g1_log_3_rounds');
    expect(logged?.status).toBe('in_progress');
    expect(logged?.progress).toBeCloseTo(1 / 3, 2);
  });
});
