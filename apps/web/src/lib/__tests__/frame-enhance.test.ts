// ============================================================
// Tests for the frame-enhancement recovery layer (pure core).
// ============================================================

import { planEnhancement, buildToneLut, type GrayLumaStats } from '../frame-enhance';

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
