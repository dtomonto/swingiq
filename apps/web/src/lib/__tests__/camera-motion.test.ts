// ============================================================
// Tests for the camera-motion estimator (pure block-matching).
// ============================================================

import { estimateShift, cameraMotionProfile } from '../camera-motion';

const W = 8;
const H = 8;

/** A horizontal ramp (value rises with x) — a strong vertical edge to track. */
function rampX(): number[] {
  const out: number[] = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) out.push(Math.round((x / (W - 1)) * 255));
  return out;
}

/** Shift content to the right by `dx` (and down by `dy`), zero-filling vacated cells. */
function shift(src: number[], dx: number, dy: number): number[] {
  const out = new Array(W * H).fill(0);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const sx = x - dx;
      const sy = y - dy;
      if (sx >= 0 && sx < W && sy >= 0 && sy < H) out[y * W + x] = src[sy * W + sx];
    }
  }
  return out;
}

describe('estimateShift', () => {
  it('reports zero shift for identical frames', () => {
    const g = rampX();
    expect(estimateShift(g, g, W, H)).toEqual({ dx: 0, dy: 0, magnitude: 0 });
  });

  it('detects a one-cell horizontal pan', () => {
    const g = rampX();
    const m = estimateShift(g, shift(g, 1, 0), W, H);
    expect(m.dx).toBe(1);
    expect(m.dy).toBe(0);
    expect(m.magnitude).toBeCloseTo(1, 5);
  });

  it('is safe on empty input', () => {
    expect(estimateShift([], [], 0, 0)).toEqual({ dx: 0, dy: 0, magnitude: 0 });
  });
});

describe('cameraMotionProfile', () => {
  it('reads a static clip as rock steady', () => {
    const g = rampX();
    const p = cameraMotionProfile([g, g, g], W, H);
    expect(p.meanMagnitude).toBe(0);
    expect(p.stabilityScore).toBe(1);
    expect(p.shakeScore).toBe(0);
    expect(p.dominantAxis).toBe('none');
    expect(p.perFrame[0]).toEqual({ dx: 0, dy: 0, magnitude: 0 });
  });

  it('classifies a steady horizontal pan', () => {
    const g = rampX();
    const seq = [g, shift(g, 1, 0), shift(g, 2, 0), shift(g, 3, 0)];
    const p = cameraMotionProfile(seq, W, H);
    expect(p.dominantAxis).toBe('horizontal');
    expect(p.meanMagnitude).toBeGreaterThan(0);
    expect(p.stabilityScore).toBeLessThan(1);
  });

  it('reads erratic shake as far less stable than a static clip', () => {
    const g = rampX();
    const shaky = [g, shift(g, 2, 1), g, shift(g, 2, -1), g];
    const steady = cameraMotionProfile([g, g, g, g, g], W, H);
    const p = cameraMotionProfile(shaky, W, H);
    expect(p.stabilityScore).toBeLessThan(steady.stabilityScore);
    expect(p.shakeScore).toBeGreaterThan(0);
  });
});
