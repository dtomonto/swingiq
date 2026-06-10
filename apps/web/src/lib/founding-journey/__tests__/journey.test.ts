import { computeJourney, FOUNDING_JOURNEY_STEPS, type JourneySignals } from '../journey';
import { FOUNDING_REQUIRED_SESSIONS } from '@/lib/central-intelligence/config';

const base: JourneySignals = {
  authed: false,
  profileComplete: false,
  profilePercent: 0,
  validSessionCount: 0,
  distinctSports: 0,
  hasDiagnosis: false,
  hasEquipment: false,
  hasReadiness: false,
};

describe('founding-journey', () => {
  it('nothing done → 0% and not ready', () => {
    const r = computeJourney(base);
    expect(r.completed).toBe(0);
    expect(r.percent).toBe(0);
    expect(r.ready).toBe(false);
  });

  it('marks each step from real signals', () => {
    const r = computeJourney({
      ...base,
      authed: true,
      profileComplete: true,
      validSessionCount: 1,
      distinctSports: 2,
      hasDiagnosis: true,
      hasEquipment: true,
      hasReadiness: true,
    });
    const done = (id: string) => r.steps.find((s) => s.def.id === id)?.done;
    expect(done('account')).toBe(true);
    expect(done('profile')).toBe(true);
    expect(done('first-analysis')).toBe(true);
    expect(done('diagnosis')).toBe(true);
    expect(done('equipment')).toBe(true);
    expect(done('readiness')).toBe(true);
    expect(done('multi-sport')).toBe(true);
    expect(done('ten-sessions')).toBe(false); // only 1 session
  });

  it('ready requires every REQUIRED step (profile + 10 sessions + account + first analysis)', () => {
    // All recommended done but missing sessions → not ready.
    const notReady = computeJourney({
      ...base, authed: true, profileComplete: true, validSessionCount: 1,
      distinctSports: 2, hasDiagnosis: true, hasEquipment: true, hasReadiness: true,
    });
    expect(notReady.ready).toBe(false);

    // Required only → ready (recommended can be incomplete).
    const ready = computeJourney({
      ...base, authed: true, profileComplete: true, validSessionCount: FOUNDING_REQUIRED_SESSIONS,
    });
    expect(ready.ready).toBe(true);
    expect(ready.requiredCompleted).toBe(ready.requiredTotal);
  });

  it('the sessions step carries an X / N progress label', () => {
    const r = computeJourney({ ...base, validSessionCount: 7 });
    const step = r.steps.find((s) => s.def.id === 'ten-sessions');
    expect(step?.progressLabel).toBe(`7 / ${FOUNDING_REQUIRED_SESSIONS}`);
    expect(step?.done).toBe(false);
  });

  it('every step has a CTA and the required set is the founding gate', () => {
    expect(FOUNDING_JOURNEY_STEPS.every((s) => s.cta.href && s.cta.label)).toBe(true);
    const requiredIds = FOUNDING_JOURNEY_STEPS.filter((s) => s.required).map((s) => s.id).sort();
    expect(requiredIds).toEqual(['account', 'first-analysis', 'profile', 'ten-sessions']);
  });
});
