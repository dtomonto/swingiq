// ============================================================
// Deterministic practice-plan generator tests
// ============================================================

import { generateDeterministicPlan } from './plan';
import { analyzeDeterministicSession } from './diagnose';
import { getRecommendationLimit } from './symptom-rules';

describe('generateDeterministicPlan', () => {
  it('produces a complete, structured plan', () => {
    const d = analyzeDeterministicSession({ sport: 'golf', issue: 'slice', skillLevel: 'intermediate' });
    const plan = generateDeterministicPlan(d);
    expect(plan.focus).toMatch(/slice/i);
    expect(plan.warmup).toBeTruthy();
    expect(plan.drills.length).toBeGreaterThanOrEqual(2);
    for (const dr of plan.drills) expect(dr.prescription).toBeTruthy();
    expect(plan.successCriteria).toBeTruthy();
    expect(plan.failureSignals).toBeTruthy();
    expect(plan.retest).toMatch(/days/);
    expect(plan.progression && plan.regression).toBeTruthy();
    expect(plan.shortForm.length).toBeGreaterThanOrEqual(3);
    expect(plan.longForm.length).toBeGreaterThan(plan.shortForm.length);
    expect(plan.estimatedMinutes).toBeGreaterThan(0);
  });

  it('respects the per-skill recommendation limit for drill count', () => {
    const d = analyzeDeterministicSession({ sport: 'golf', issue: 'fat' });
    const beginner = generateDeterministicPlan(d, { skillLevel: 'beginner' });
    const advanced = generateDeterministicPlan(d, { skillLevel: 'advanced' });
    const bLimit = getRecommendationLimit('golf', 'beginner');
    const aLimit = getRecommendationLimit('golf', 'advanced');
    expect(beginner.drills.length).toBeLessThanOrEqual(Math.max(2, bLimit.primary + bLimit.optional));
    expect(advanced.drills.length).toBeGreaterThanOrEqual(beginner.drills.length);
  });

  it('scales prescriptions and warm-up with skill', () => {
    const d = analyzeDeterministicSession({ sport: 'tennis', issue: 'net_errors' });
    const beginner = generateDeterministicPlan(d, { skillLevel: 'beginner' });
    const advanced = generateDeterministicPlan(d, { skillLevel: 'advanced' });
    expect(beginner.warmup).not.toBe(advanced.warmup);
    expect(beginner.drills[0].prescription).not.toBe(advanced.drills[0].prescription);
  });
});
