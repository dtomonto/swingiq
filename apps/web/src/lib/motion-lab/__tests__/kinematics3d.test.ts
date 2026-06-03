// ============================================================
// SwingIQ — Motion Lab: 3D kinematics unit tests
// ------------------------------------------------------------
// Pure-math guarantees for the depth-aware rotation helpers.
// ============================================================

import {
  headingDeg,
  unwrapDeg,
  span,
  depthReliability,
  blendByReliability,
  detectTopFrame,
  angularVelocityDeg,
  argmax,
} from '../kinematics3d';

describe('kinematics3d', () => {
  it('headingDeg reads the horizontal-plane (x,z) angle', () => {
    expect(headingDeg(1, 0)).toBeCloseTo(0);
    expect(headingDeg(0, 1)).toBeCloseTo(90);
    expect(headingDeg(1, 1)).toBeCloseTo(45);
    expect(Math.abs(headingDeg(-1, 0))).toBeCloseTo(180);
  });

  it('unwrapDeg removes ±180 sawtooth jumps', () => {
    const unwrapped = unwrapDeg([170, -170, 170]);
    // 170 → 190 → 170 (continuous), not 170 → -170 → 170
    expect(unwrapped[0]).toBeCloseTo(170);
    expect(unwrapped[1]).toBeCloseTo(190);
    expect(unwrapped[2]).toBeCloseTo(170);
    expect(span(unwrapped)).toBeLessThan(25); // small real motion, no fake 340° swing
  });

  it('span is the max−min of a series', () => {
    expect(span([1, 5, 3])).toBe(4);
    expect(span([])).toBe(0);
    expect(span([7, 7, 7])).toBe(0);
  });

  it('depthReliability ramps from flat (0) to a full turn (1)', () => {
    expect(depthReliability(0, 0.2)).toBe(0);
    expect(depthReliability(0.2, 0.2)).toBe(1); // depth swings ~one segment width
    expect(depthReliability(0.05, 0.2)).toBeGreaterThan(0);
    expect(depthReliability(0.05, 0.2)).toBeLessThan(1);
    expect(depthReliability(0.3, 0)).toBe(0); // no width → can't trust
  });

  it('blendByReliability trusts 3D when reliable, 2D when not', () => {
    expect(blendByReliability(80, 0, 1)).toBe(80);
    expect(blendByReliability(80, 0, 0)).toBe(0);
    expect(blendByReliability(80, 20, 0.5)).toBe(50);
  });

  it('detectTopFrame finds the lead-hand apex before the strike', () => {
    // y is image-down, so the apex (top of backswing) is the smallest y.
    expect(detectTopFrame([0.5, 0.4, 0.3, 0.25, 0.4, 0.6], 5)).toBe(3);
    // flat motion → no real reversal
    expect(detectTopFrame([0.5, 0.5, 0.5, 0.5], 3)).toBe(-1);
  });

  it('angularVelocityDeg differentiates a heading series', () => {
    const v = angularVelocityDeg([0, 10, 30], [0, 100, 200]);
    expect(v[1]).toBeCloseTo(100); // 10°/0.1s
    expect(v[2]).toBeCloseTo(200); // 20°/0.1s
    expect(v[0]).toBeCloseTo(v[1]); // seeded from frame 1
  });

  it('argmax returns the index of the peak', () => {
    expect(argmax([1, 9, 3])).toBe(1);
    expect(argmax([])).toBe(0);
  });
});
