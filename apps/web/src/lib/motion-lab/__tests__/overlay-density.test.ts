import {
  OVERLAY_DENSITY_PRESETS,
  OVERLAY_LAYER_META,
  layersForDensity,
  densityForLayers,
  type OverlayLayerState,
} from '../overlay-density';

describe('overlay density presets', () => {
  it('defines simple, coach and lab presets over all seven layers', () => {
    for (const key of ['simple', 'coach', 'lab'] as const) {
      const preset = OVERLAY_DENSITY_PRESETS[key];
      expect(Object.keys(preset)).toHaveLength(OVERLAY_LAYER_META.length);
    }
  });

  it('orders presets by increasing detail (simple ⊂ coach ⊂ lab)', () => {
    const count = (s: OverlayLayerState) => OVERLAY_LAYER_META.filter((l) => s[l.id]).length;
    const simple = count(OVERLAY_DENSITY_PRESETS.simple);
    const coach = count(OVERLAY_DENSITY_PRESETS.coach);
    const lab = count(OVERLAY_DENSITY_PRESETS.lab);
    expect(simple).toBeLessThan(coach);
    expect(coach).toBeLessThan(lab);
    // Lab turns on every available layer.
    expect(lab).toBe(OVERLAY_LAYER_META.length);
  });

  it('simple mode keeps a key overlay, contact and phase', () => {
    const simple = OVERLAY_DENSITY_PRESETS.simple;
    expect(simple.skeleton).toBe(true);
    expect(simple.contact).toBe(true);
    expect(simple.phase).toBe(true);
    expect(simple.footwork).toBe(false);
  });
});

describe('density ↔ layers round-trip', () => {
  it('layersForDensity then densityForLayers recovers the preset', () => {
    for (const key of ['simple', 'coach', 'lab'] as const) {
      expect(densityForLayers(layersForDensity(key))).toBe(key);
    }
  });

  it('reports custom once a single layer is toggled off-preset', () => {
    const custom = { ...layersForDensity('simple'), footwork: true };
    expect(densityForLayers(custom)).toBe('custom');
  });

  it('returns independent copies so callers cannot mutate the preset', () => {
    const a = layersForDensity('coach');
    a.skeleton = false;
    expect(OVERLAY_DENSITY_PRESETS.coach.skeleton).toBe(true);
  });
});
