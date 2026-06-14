// ============================================================
// Tests for primary-athlete selection among multiple detected poses.
// ============================================================

import { selectPrimaryPose } from '../pose-detection';

type LM = { x: number; y: number; visibility?: number };

/** A rectangular "person" of `size`, centred at (cx, cy), all landmarks visible. */
function person(cx: number, cy: number, size: number, vis = 0.9): LM[] {
  const h = size / 2;
  return [
    { x: cx - h, y: cy - h, visibility: vis },
    { x: cx + h, y: cy - h, visibility: vis },
    { x: cx - h, y: cy + h, visibility: vis },
    { x: cx + h, y: cy + h, visibility: vis },
    { x: cx, y: cy, visibility: vis },
  ];
}

describe('selectPrimaryPose', () => {
  it('returns 0 for a single pose', () => {
    expect(selectPrimaryPose([person(0.5, 0.5, 0.4)])).toBe(0);
  });

  it('returns 0 for an empty list', () => {
    expect(selectPrimaryPose([])).toBe(0);
  });

  it('prefers the larger, more central athlete over a small bystander', () => {
    const poses = [
      person(0.1, 0.1, 0.12), // small, in the corner (a bystander)
      person(0.5, 0.5, 0.5), // large, centred (the athlete)
    ];
    expect(selectPrimaryPose(poses)).toBe(1);
  });

  it('prefers a confidently-tracked pose over a barely-visible one of equal size', () => {
    const poses = [
      person(0.5, 0.5, 0.4, 0.1), // ghostly / low visibility
      person(0.45, 0.5, 0.4, 0.9), // solidly tracked
    ];
    expect(selectPrimaryPose(poses)).toBe(1);
  });

  it('breaks ties toward the more central candidate', () => {
    const poses = [
      person(0.2, 0.2, 0.3), // off to one corner
      person(0.5, 0.5, 0.3), // centred
    ];
    expect(selectPrimaryPose(poses)).toBe(1);
  });
});
