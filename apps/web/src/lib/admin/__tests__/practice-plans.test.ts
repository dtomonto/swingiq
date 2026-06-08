// Practice Plan samples — pure tests.
// Confirms the sample-context factory + the real planner produce valid,
// deterministic plans across sports and variants, with youth scaling.

import {
  buildSamplePlans,
  makeSampleContext,
  groupSamplesBySport,
  samplePlanSports,
  PLAN_VARIANTS,
} from '../practice-plans/samples';
import { buildPracticePlan } from '@/lib/agents/workflows/practice-planner';

describe('makeSampleContext', () => {
  it('builds a valid context the planner accepts', () => {
    const ctx = makeSampleContext('golf', 'beginner', 'adult');
    const plan = buildPracticePlan(ctx, 20);
    expect(plan.sport).toBe('golf');
    expect(plan.estimatedTimeMinutes).toBe(20);
    expect(plan.mainDrills.length).toBeGreaterThanOrEqual(2);
    expect(plan.practiceFocus.length).toBeGreaterThan(0);
  });
});

describe('buildSamplePlans', () => {
  const catalog = buildSamplePlans();

  it('covers every agent sport × every variant', () => {
    expect(catalog.stats.sports).toBe(samplePlanSports().length);
    expect(catalog.stats.variants).toBe(PLAN_VARIANTS.length);
    expect(catalog.samples.length).toBe(catalog.stats.sports * PLAN_VARIANTS.length);
  });

  it('every sample plan is well-formed', () => {
    for (const s of catalog.samples) {
      expect(s.plan.mainDrills.length).toBeGreaterThanOrEqual(2);
      expect(s.plan.warmup.length).toBeGreaterThan(0);
      expect(s.plan.pressureTest.length).toBeGreaterThan(0);
      expect(s.plan.successMetric.length).toBeGreaterThan(0);
      expect(s.plan.equipmentNeeded.length).toBeGreaterThan(0);
      for (const d of s.plan.mainDrills) {
        expect(d.name.length).toBeGreaterThan(0);
        expect(d.why.length).toBeGreaterThan(0);
      }
    }
  });

  it('advanced 45-minute plans get the extra variability drill', () => {
    const adv = catalog.samples.find((s) => s.variant === 'Advanced');
    expect(adv).toBeDefined();
    expect(adv!.plan.mainDrills.length).toBeGreaterThanOrEqual(3);
  });

  it('youth variants are capped to a shorter session', () => {
    const youths = catalog.samples.filter((s) => s.youth);
    expect(youths.length).toBeGreaterThan(0);
    for (const y of youths) expect(y.plan.estimatedTimeMinutes).toBeLessThanOrEqual(20);
  });

  it('is deterministic (stable generatedAt)', () => {
    expect(buildSamplePlans().generatedAt).toBe(catalog.generatedAt);
  });
});

describe('groupSamplesBySport', () => {
  it('groups without losing samples', () => {
    const catalog = buildSamplePlans();
    const groups = groupSamplesBySport(catalog);
    expect(groups.length).toBe(catalog.stats.sports);
    expect(groups.flatMap((g) => g.samples).length).toBe(catalog.samples.length);
    for (const g of groups) expect(g.samples.length).toBe(PLAN_VARIANTS.length);
  });
});
