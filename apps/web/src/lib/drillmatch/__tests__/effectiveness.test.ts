// ============================================================
// Drill outcome-weighted effectiveness (intelligence upgrade Sprint 5, #24)
// ============================================================

import { drillEffectiveness } from '../effectiveness';
import { FEEDBACK_WEIGHTS } from '../feedback';
import type { DrillFeedbackRecord, DrillFeedbackValue } from '../types';

let t = 0;
function rec(value: DrillFeedbackValue): DrillFeedbackRecord {
  // Increasing timestamps so call order = chronological (last call = newest).
  t += 1000;
  return { drillId: 'd1', faultId: 'slice', sport: 'golf', value, recordedAt: new Date(t).toISOString() };
}

describe('#24 drillEffectiveness', () => {
  it('is empty with no history', () => {
    expect(drillEffectiveness([]).n).toBe(0);
    expect(drillEffectiveness([]).nudge).toBe(0);
  });

  it('reproduces the old fixed nudge exactly for a single record (parity)', () => {
    expect(drillEffectiveness([rec('helped')]).nudge).toBe(FEEDBACK_WEIGHTS.helped);
    expect(drillEffectiveness([rec('no_change')]).nudge).toBe(FEEDBACK_WEIGHTS.no_change);
    expect(drillEffectiveness([rec('hurt')]).nudge).toBe(FEEDBACK_WEIGHTS.hurt);
  });

  it('amplifies a consistent positive history above a single "helped"', () => {
    const many = drillEffectiveness([rec('helped'), rec('helped'), rec('helped'), rec('helped'), rec('helped')]);
    expect(many.nudge).toBeGreaterThan(FEEDBACK_WEIGHTS.helped);
    expect(many.dominant).toBe('helped');
    expect(many.effectiveness).toBeCloseTo(1, 5);
    expect(many.n).toBe(5);
    expect(many.helped).toBe(5);
  });

  it('lets a recent "hurt" pull a previously-helpful drill down', () => {
    // older helps, newest is hurt
    const recs = [rec('helped'), rec('helped'), rec('hurt')];
    const eff = drillEffectiveness(recs);
    expect(eff.nudge).toBeLessThan(0);
    expect(eff.effectiveness).toBeLessThan(1);
  });

  it('counts verdicts and picks the dominant one', () => {
    const eff = drillEffectiveness([rec('helped'), rec('no_change'), rec('helped')]);
    expect(eff.helped).toBe(2);
    expect(eff.noChange).toBe(1);
    expect(eff.dominant).toBe('helped');
  });
});
