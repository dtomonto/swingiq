import {
  actionsForSport,
  getPreset,
  allPresets,
  RECORD_ASSIST_SPORTS,
} from '../engines/sport-preset-engine';

describe('SportPresetEngine', () => {
  it('exposes all six sports', () => {
    expect(RECORD_ASSIST_SPORTS).toEqual([
      'golf', 'tennis', 'baseball', 'softball', 'pickleball', 'padel',
    ]);
  });

  it('provides at least one action per sport', () => {
    for (const sport of RECORD_ASSIST_SPORTS) {
      expect(actionsForSport(sport).length).toBeGreaterThan(0);
    }
  });

  it('resolves a known preset', () => {
    const p = getPreset('golf', 'driver');
    expect(p?.sport).toBe('golf');
    expect(p?.action).toBe('driver');
    expect(p?.recommendedOrientation).toBe('landscape');
  });

  it('falls back to the first action for an unknown action', () => {
    const p = getPreset('golf', 'does_not_exist');
    expect(p).toBeDefined();
    expect(p?.sport).toBe('golf');
  });

  it('returns undefined for an unknown sport', () => {
    // @ts-expect-error — intentionally invalid sport
    expect(getPreset('cricket', 'bat')).toBeUndefined();
  });

  it('tennis serve recommends portrait with extra headroom', () => {
    const p = getPreset('tennis', 'serve');
    expect(p?.recommendedOrientation).toBe('portrait');
    expect(p?.headroomFraction).toBeGreaterThan(0.15);
  });

  it('padel smash needs the most headroom', () => {
    const smash = getPreset('padel', 'smash');
    const forehand = getPreset('padel', 'forehand');
    expect((smash?.headroomFraction ?? 0)).toBeGreaterThan(forehand?.headroomFraction ?? 0);
  });

  it('every preset has setup steps, required landmarks, and a why', () => {
    for (const p of allPresets()) {
      expect(p.setupSteps.length).toBeGreaterThan(0);
      expect(p.requiredLandmarks.length).toBeGreaterThan(0);
      expect(p.why.length).toBeGreaterThan(0);
      expect(p.label.length).toBeGreaterThan(0);
    }
  });

  it('baseball and softball share the hitting action', () => {
    expect(getPreset('baseball', 'hitting')?.label).toBe('Hitting');
    expect(getPreset('softball', 'hitting')?.label).toBe('Hitting');
  });
});
