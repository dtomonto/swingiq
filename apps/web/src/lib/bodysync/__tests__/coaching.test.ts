// BodySync — coaching engine tests
import { assessReadiness } from '../scoring';
import { buildRecommendation, regionsToAvoid, motionLabCoachingNudge } from '../coaching';
import type { ManualCheckin, HealthBaselines } from '../types';
import type { RepeatabilityResult } from '@/lib/motion-lab';

function rep(over: Partial<RepeatabilityResult>): RepeatabilityResult {
  return {
    available: true, sessionCount: 5, score: 80, perMetric: [],
    mostConsistent: null, leastConsistent: null,
    summary: '', basis: 'estimated', confidence: 60, ...over,
  };
}
const metric = (name: string, consistency: number) =>
  ({ id: name.toLowerCase(), name, cv: 0.1, consistency, n: 5 });

const baselines: HealthBaselines = { restingHr: null, hrv: null, sleepHours: 7.5, updatedAt: null };
function checkin(over: Partial<ManualCheckin>): ManualCheckin {
  return {
    id: 'c', date: '2026-06-06', createdAt: '2026-06-06T08:00:00Z',
    sleepHours: null, sleepQuality: null, energy: null, soreness: null, pain: null,
    painAreas: [], stress: null, hydration: null, mentalFocus: null, warmupQuality: null,
    practiceIntensity: null, illness: false, travelFatigue: false, alcohol: false, notes: '',
    ...over,
  };
}
const assess = (c: ManualCheckin, h: ManualCheckin[] = []) =>
  assessReadiness({ today: c, history: h, samples: [], baselines }, '2026-06-06');

describe('buildRecommendation', () => {
  it('greenlights high-intensity work on a fresh day', () => {
    const a = assess(checkin({ sleepHours: 8, sleepQuality: 5, energy: 5, soreness: 1, stress: 1, pain: 1 }));
    const rec = buildRecommendation(a, 'golf', null);
    expect(['speed_power', 'performance']).toContain(rec.sessionType);
    expect(rec.intensityCap).toBeGreaterThanOrEqual(90);
    expect(rec.restRecommended).toBe(false);
  });

  it('recommends recovery + rest on a red day', () => {
    const a = assess(checkin({ sleepHours: 4, sleepQuality: 1, energy: 1, soreness: 5, illness: true }));
    const rec = buildRecommendation(a, 'golf', null);
    expect(rec.sessionType).toBe('recovery');
    expect(rec.restRecommended).toBe(true);
    expect(rec.intensityCap).toBeLessThanOrEqual(40);
  });

  it('adds an injury note that respects the painful region', () => {
    const today = checkin({ pain: 4, painAreas: ['shoulder'], sleepHours: 7 });
    const a = assess(today);
    const rec = buildRecommendation(a, 'tennis', today);
    expect(rec.injuryNote).toMatch(/shoulder/i);
    expect(rec.injuryNote).toMatch(/overhead|rotational/i);
  });

  it('gives sport-specific cues', () => {
    const a = assess(checkin({ sleepHours: 7, energy: 3 }));
    expect(buildRecommendation(a, 'golf', null).sportNotes.join(' ')).toMatch(/rotational|back|walking/i);
    expect(buildRecommendation(a, 'tennis', null).sportNotes.join(' ')).toMatch(/change-of-direction|shoulder|footwork/i);
  });
});

describe('regionsToAvoid', () => {
  it('returns painful regions only when pain is meaningful', () => {
    expect(regionsToAvoid(checkin({ pain: 4, painAreas: ['elbow'] }))).toEqual(['elbow']);
    expect(regionsToAvoid(checkin({ pain: 1, painAreas: ['elbow'] }))).toEqual([]);
    expect(regionsToAvoid(null)).toEqual([]);
  });
});

describe('motionLabCoachingNudge (P11)', () => {
  it('nudges on a shaky least-consistent metric, naming it + labelling it an estimate', () => {
    const nudge = motionLabCoachingNudge(rep({ score: 78, leastConsistent: metric('Balance', 45) }));
    expect(nudge).not.toBeNull();
    expect(nudge!.toLowerCase()).toContain('balance');
    expect(nudge!.toLowerCase()).toContain('estimated');
  });

  it('nudges when overall repeatability is low', () => {
    expect(motionLabCoachingNudge(rep({ score: 55, leastConsistent: metric('Tempo', 70) }))).not.toBeNull();
  });

  it('stays quiet when the motion is already solid', () => {
    expect(motionLabCoachingNudge(rep({ score: 88, leastConsistent: metric('Balance', 80) }))).toBeNull();
  });

  it('stays quiet with no / insufficient motion data', () => {
    expect(motionLabCoachingNudge(null)).toBeNull();
    expect(motionLabCoachingNudge(rep({ available: false, score: null }))).toBeNull();
    expect(motionLabCoachingNudge(rep({ score: null }))).toBeNull();
  });

  it('flows into buildRecommendation.motionEmphasis + explanation', () => {
    const a = assess(checkin({ sleepHours: 8, sleepQuality: 5, energy: 5, soreness: 1, stress: 1, pain: 1 }));
    const rec = buildRecommendation(a, 'golf', null, rep({ score: 60, leastConsistent: metric('Balance', 40) }));
    expect(rec.motionEmphasis).not.toBeNull();
    expect(rec.explanation.join(' ').toLowerCase()).toContain('balance');
    // No motion data → no emphasis, prior behaviour intact.
    expect(buildRecommendation(a, 'golf', null).motionEmphasis).toBeNull();
  });
});
