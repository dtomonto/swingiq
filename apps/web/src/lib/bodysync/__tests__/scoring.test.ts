// BodySync — scoring engine tests
import {
  assessReadiness, recoveryScore, trainingLoadScore, injuryRisk, trainingLoadScore as _tl,
} from '../scoring';
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

const input = (today: ManualCheckin | null, history: ManualCheckin[] = []) =>
  ({ today, history, samples: [], baselines });

describe('recoveryScore', () => {
  it('rewards good sleep + low soreness', () => {
    const good = recoveryScore(input(checkin({ sleepHours: 8.5, sleepQuality: 5, soreness: 1 })));
    const poor = recoveryScore(input(checkin({ sleepHours: 4, sleepQuality: 1, soreness: 5, illness: true })));
    expect(good.score).toBeGreaterThan(poor.score);
    expect(good.score).toBeGreaterThanOrEqual(70);
    expect(poor.score).toBeLessThan(45);
  });

  it('reports low confidence with only one subjective field', () => {
    expect(recoveryScore(input(checkin({ energy: 3 }))).confidence).toBe('low');
  });
});

describe('trainingLoadScore', () => {
  it('rises with repeated hard practice days', () => {
    const hard = trainingLoadScore(input(
      checkin({ practiceIntensity: 5 }),
      [checkin({ practiceIntensity: 5 }), checkin({ practiceIntensity: 4 })],
    ));
    const easy = trainingLoadScore(input(checkin({ practiceIntensity: 1 })));
    expect(hard.score).toBeGreaterThan(easy.score);
  });
});

describe('assessReadiness — zone classification', () => {
  it('classifies a fresh, well-recovered day GREEN', () => {
    const a = assessReadiness(input(
      checkin({ sleepHours: 8, sleepQuality: 5, energy: 5, soreness: 1, stress: 1, pain: 1, practiceIntensity: 1 }),
    ), '2026-06-06');
    expect(a.zone).toBe('green');
    expect(a.readiness.score).toBeGreaterThanOrEqual(70);
  });

  it('classifies an exhausted, sore, ill day RED', () => {
    const a = assessReadiness(input(
      checkin({ sleepHours: 4, sleepQuality: 1, energy: 1, soreness: 5, stress: 5, illness: true }),
    ), '2026-06-06');
    expect(a.zone).toBe('red');
  });

  it('forces RED when significant pain is reported', () => {
    const a = assessReadiness(input(
      checkin({ sleepHours: 8, sleepQuality: 5, energy: 5, pain: 4, painAreas: ['lower_back'] }),
    ), '2026-06-06');
    expect(a.zone).toBe('red');
    expect(a.injuryRisk.level).toBe('elevated');
    expect(a.injuryRisk.regions).toContain('lower_back');
  });
});

describe('injuryRisk', () => {
  it('flags elevated risk on a load spike + low recovery', () => {
    const today = checkin({ practiceIntensity: 5, soreness: 5, sleepHours: 4, energy: 1 });
    const hist = [checkin({ practiceIntensity: 1 }), checkin({ practiceIntensity: 1 })];
    const rec = recoveryScore(input(today, hist));
    const load = trainingLoadScore(input(today, hist));
    const flag = injuryRisk(input(today, hist), rec, load);
    expect(['watch', 'elevated']).toContain(flag.level);
    expect(flag.reasons.length).toBeGreaterThan(0);
  });
});

it('keeps the load alias export wired', () => {
  expect(typeof _tl).toBe('function');
});
