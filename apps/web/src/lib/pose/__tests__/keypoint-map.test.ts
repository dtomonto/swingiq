// ============================================================
// Tests for the MoveNet-17 → MediaPipe-33 keypoint mapping.
// ============================================================

import { movenetTo33, MOVENET_TO_MP33, SHARED_MP_INDICES, type MoveNetKeypoint } from '../keypoint-map';

describe('movenetTo33', () => {
  it('produces a 33-length landmark array', () => {
    const out = movenetTo33([]);
    expect(out).toHaveLength(33);
    expect(out.every((l) => l.visibility === 0)).toBe(true);
  });

  it('maps each MoveNet keypoint to the right MediaPipe index', () => {
    // 17 keypoints, each tagged with a unique x so we can trace where it lands.
    const kp: MoveNetKeypoint[] = MOVENET_TO_MP33.map((_, i) => ({ x: (i + 1) / 100, y: 0.5, score: 0.9 }));
    const out = movenetTo33(kp);
    MOVENET_TO_MP33.forEach((mpIndex, moveNetIndex) => {
      expect(out[mpIndex].x).toBeCloseTo((moveNetIndex + 1) / 100, 6);
      expect(out[mpIndex].visibility).toBe(0.9);
    });
  });

  it('places the nose, shoulders and wrists at the canonical MP indices', () => {
    const kp: MoveNetKeypoint[] = Array.from({ length: 17 }, () => ({ x: 0, y: 0, score: 0 }));
    kp[0] = { x: 0.5, y: 0.1, score: 0.8 }; // nose
    kp[5] = { x: 0.4, y: 0.3, score: 0.8 }; // left_shoulder
    kp[9] = { x: 0.3, y: 0.5, score: 0.8 }; // left_wrist
    const out = movenetTo33(kp);
    expect(out[0].y).toBeCloseTo(0.1); // MP nose
    expect(out[11].x).toBeCloseTo(0.4); // MP left_shoulder
    expect(out[15].y).toBeCloseTo(0.5); // MP left_wrist
  });

  it('exposes the 17 shared indices in sorted order', () => {
    expect(SHARED_MP_INDICES).toEqual([...SHARED_MP_INDICES].sort((a, b) => a - b));
    expect(SHARED_MP_INDICES).toHaveLength(17);
    expect(SHARED_MP_INDICES).toContain(11); // shoulder
    expect(SHARED_MP_INDICES).not.toContain(17); // a hand joint MoveNet lacks
  });
});
