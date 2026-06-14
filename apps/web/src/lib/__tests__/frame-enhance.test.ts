// ============================================================
// Tests for the frame-enhancement recovery layer (pure core).
// ============================================================

import { planEnhancement, buildToneLut, applyUnsharp, type GrayLumaStats } from '../frame-enhance';

const stats = (over: Partial<GrayLumaStats>): GrayLumaStats => ({
  brightness: 0.5,
  contrast: 0.25,
  sharpness: 0.4,
  ...over,
});

describe('planEnhancement', () => {
  it('leaves well-exposed, crisp frames untouched', () => {
    expect(planEnhancement(stats({}))).toBeNull();
  });

  it('brightens dark frames with gamma < 1', () => {
    const plan = planEnhancement(stats({ brightness: 0.15 }));
    expect(plan).not.toBeNull();
    expect(plan!.gamma).toBeLessThan(1);
    expect(plan!.gamma).toBeGreaterThanOrEqual(0.5);
    expect(plan!.reason).toMatch(/low light/i);
  });

  it('darker frames get a stronger (smaller) gamma than dimmer ones', () => {
    const veryDark = planEnhancement(stats({ brightness: 0.05 }))!;
    const dim = planEnhancement(stats({ brightness: 0.3 }))!;
    expect(veryDark.gamma).toBeLessThan(dim.gamma);
  });

  it('stretches a flat (low-contrast) histogram', () => {
    const plan = planEnhancement(stats({ contrast: 0.08 }));
    expect(plan).not.toBeNull();
    expect(plan!.whitePoint - plan!.blackPoint).toBeLessThan(255);
    expect(plan!.reason).toMatch(/contrast/i);
  });

  it('flags soft/blurred frames for sharpening', () => {
    const plan = planEnhancement(stats({ sharpness: 0.05 }));
    expect(plan).not.toBeNull();
    expect(plan!.sharpen).toBe(true);
  });

  it('does not flag sharpening on a crisp frame', () => {
    const plan = planEnhancement(stats({ brightness: 0.15 }))!; // dark, but crisp
    expect(plan.sharpen).toBe(false);
  });
});

describe('buildToneLut', () => {
  it('is a 256-entry, monotonic-non-decreasing mapping', () => {
    const lut = buildToneLut({ gamma: 0.6, blackPoint: 0, whitePoint: 255 });
    expect(lut).toHaveLength(256);
    for (let i = 1; i < lut.length; i++) expect(lut[i]).toBeGreaterThanOrEqual(lut[i - 1]);
  });

  it('gamma < 1 brightens midtones (output above input)', () => {
    const lut = buildToneLut({ gamma: 0.5, blackPoint: 0, whitePoint: 255 });
    expect(lut[128]).toBeGreaterThan(128);
  });

  it('identity plan is a no-op mapping', () => {
    const lut = buildToneLut({ gamma: 1, blackPoint: 0, whitePoint: 255 });
    expect(lut[0]).toBe(0);
    expect(lut[128]).toBe(128);
    expect(lut[255]).toBe(255);
  });

  it('contrast stretch maps the black/white points to the full range', () => {
    const lut = buildToneLut({ gamma: 1, blackPoint: 40, whitePoint: 200 });
    expect(lut[40]).toBe(0);
    expect(lut[200]).toBe(255);
    expect(lut[20]).toBe(0); // clamped below the black point
    expect(lut[230]).toBe(255); // clamped above the white point
  });
});

describe('applyUnsharp', () => {
  // Build a W×H RGBA buffer from a per-pixel gray value function.
  const make = (w: number, h: number, val: (x: number, y: number) => number): Uint8ClampedArray => {
    const data = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const v = val(x, y);
        data[i] = v;
        data[i + 1] = v;
        data[i + 2] = v;
        data[i + 3] = 255;
      }
    }
    return data;
  };

  it('leaves a uniform image unchanged (nothing to sharpen)', () => {
    const w = 5;
    const h = 5;
    const data = make(w, h, () => 120);
    const before = Uint8ClampedArray.from(data);
    applyUnsharp(data, w, h, 0.8);
    expect(Array.from(data)).toEqual(Array.from(before));
  });

  it('increases contrast across an edge (edge firming)', () => {
    const w = 6;
    const h = 6;
    // Left half dark (80), right half bright (160).
    const data = make(w, h, (x) => (x < 3 ? 80 : 160));
    const idx = (x: number, y: number) => (y * w + x) * 4;
    const edgeDiffBefore = data[idx(3, 2)] - data[idx(2, 2)];
    applyUnsharp(data, w, h, 1);
    const edgeDiffAfter = data[idx(3, 2)] - data[idx(2, 2)];
    expect(edgeDiffAfter).toBeGreaterThan(edgeDiffBefore);
  });

  it('is a no-op on tiny buffers or zero amount', () => {
    const tiny = make(2, 2, () => 100);
    const snap = Uint8ClampedArray.from(tiny);
    applyUnsharp(tiny, 2, 2, 1);
    expect(Array.from(tiny)).toEqual(Array.from(snap));

    const data = make(5, 5, (x) => (x < 3 ? 80 : 160));
    const snap2 = Uint8ClampedArray.from(data);
    applyUnsharp(data, 5, 5, 0);
    expect(Array.from(data)).toEqual(Array.from(snap2));
  });
});
