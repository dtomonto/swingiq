import { getAllDrills, getDrillBySlug, getRelatedDrills } from '../catalog';

describe('drill catalog', () => {
  const all = getAllDrills();

  it('exposes a non-trivial catalog spanning multiple sports', () => {
    expect(all.length).toBeGreaterThan(50);
    const sports = new Set(all.map((d) => d.sport));
    expect(sports.has('golf')).toBe(true);
    expect(sports.has('tennis')).toBe(true);
    expect(sports.has('baseball')).toBe(true);
    expect(sports.size).toBeGreaterThanOrEqual(4);
  });

  it('gives every drill a unique, url-safe slug', () => {
    const slugs = all.map((d) => d.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) {
      expect(s).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it('resolves a drill by slug and returns undefined for unknown slugs', () => {
    const first = all[0];
    expect(getDrillBySlug(first.slug)).toEqual(first);
    expect(getDrillBySlug('does-not-exist')).toBeUndefined();
  });

  it('enriches golf drills that have a DRILLS_CONTENT twin with full steps + tips', () => {
    const gate = all.find((d) => d.sport === 'golf' && d.name === 'Gate Drill');
    expect(gate).toBeDefined();
    expect(gate!.steps.length).toBeGreaterThan(0);
    expect(gate!.tips.length).toBeGreaterThan(0);
    expect(gate!.targetFault).toBeTruthy();
    // Description should be the richer copy, not just the one-line goal.
    expect(gate!.description.length).toBeGreaterThan(gate!.goal.length);
  });

  it('every golf drill opens into a comprehensive page (has a walkthrough)', () => {
    for (const d of all.filter((x) => x.sport === 'golf')) {
      expect(d.steps.length).toBeGreaterThan(0);
      expect(d.tips.length).toBeGreaterThan(0);
      expect(d.targetFault).toBeTruthy();
    }
  });

  it('carries core sport drills with their steps and focus-feel cue', () => {
    const tennis = all.filter((d) => d.sport === 'tennis');
    expect(tennis.length).toBeGreaterThan(0);
    const withSteps = tennis.filter((d) => d.steps.length > 0);
    expect(withSteps.length).toBe(tennis.length);
    // focus_feel becomes a coaching tip on the detail page.
    expect(tennis.some((d) => d.tips.length > 0)).toBe(true);
  });

  it('returns same-sport related drills excluding the drill itself', () => {
    const tennis = all.find((d) => d.sport === 'tennis')!;
    const related = getRelatedDrills(tennis, 3);
    expect(related.length).toBeLessThanOrEqual(3);
    expect(related.every((r) => r.sport === 'tennis')).toBe(true);
    expect(related.every((r) => r.slug !== tennis.slug)).toBe(true);
  });

  it('is deterministic — repeated calls yield identical slugs', () => {
    const a = getAllDrills().map((d) => d.slug);
    const b = getAllDrills().map((d) => d.slug);
    expect(a).toEqual(b);
  });
});
