import {
  GOLF_MOBILITY_AREAS,
  GOLF_DYNAMIC_WARMUP,
  READINESS_SAFETY,
  readinessSeverity,
  readinessHeadline,
  mayBeReadinessDriven,
} from '../golf-mobility';

describe('golf mobility data', () => {
  it('covers the key golf mobility areas with a reason each', () => {
    expect(GOLF_MOBILITY_AREAS.length).toBeGreaterThanOrEqual(8);
    for (const a of GOLF_MOBILITY_AREAS) {
      expect(a.name.length).toBeGreaterThan(0);
      expect(a.why.length).toBeGreaterThan(0);
    }
    const ids = GOLF_MOBILITY_AREAS.map((a) => a.id);
    expect(ids).toEqual(expect.arrayContaining(['thoracic_rotation', 'hip_rotation', 'lead_knee']));
  });

  it('has a non-trivial dynamic warm-up and a safety disclaimer', () => {
    expect(GOLF_DYNAMIC_WARMUP.length).toBeGreaterThanOrEqual(5);
    expect(READINESS_SAFETY).toMatch(/not medical advice/i);
    expect(READINESS_SAFETY).toMatch(/pain/i);
  });
});

describe('readiness helpers', () => {
  it('maps zones to severity (green = not a priority)', () => {
    expect(readinessSeverity('red')).toBe('high');
    expect(readinessSeverity('orange')).toBe('medium');
    expect(readinessSeverity('yellow')).toBe('low');
    expect(readinessSeverity('green')).toBeNull();
  });

  it('flags possible mobility-driven faults only when readiness is low', () => {
    expect(mayBeReadinessDriven('red')).toBe(true);
    expect(mayBeReadinessDriven('orange')).toBe(true);
    expect(mayBeReadinessDriven('yellow')).toBe(false);
    expect(mayBeReadinessDriven('green')).toBe(false);
  });

  it('gives a headline for every zone', () => {
    for (const z of ['green', 'yellow', 'orange', 'red'] as const) {
      expect(readinessHeadline(z).length).toBeGreaterThan(0);
    }
  });
});
