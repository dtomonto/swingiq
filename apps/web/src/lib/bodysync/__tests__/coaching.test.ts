// BodySync — coaching engine tests
import { assessReadiness } from '../scoring';
import { buildRecommendation, regionsToAvoid } from '../coaching';
import type { ManualCheckin, HealthBaselines } from '../types';

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
