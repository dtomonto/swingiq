import { computePoseMetrics, summarizePoseMetrics } from '../pose-metrics';
import type { PoseFrame, PoseLandmark } from '../pose-detection';

const NOSE = 0;
const L_SHOULDER = 11;
const R_SHOULDER = 12;
const L_HIP = 23;
const R_HIP = 24;

function lm(x: number, y: number): PoseLandmark {
  return { x, y, z: 0, visibility: 1 };
}

function makeFrame(
  t: number,
  pts: { nose: [number, number]; ls: [number, number]; rs: [number, number]; lh: [number, number]; rh: [number, number] },
  size = 33,
): PoseFrame {
  const landmarks: PoseLandmark[] = Array.from({ length: size }, () => lm(0, 0));
  landmarks[NOSE] = lm(...pts.nose);
  landmarks[L_SHOULDER] = lm(...pts.ls);
  landmarks[R_SHOULDER] = lm(...pts.rs);
  landmarks[L_HIP] = lm(...pts.lh);
  landmarks[R_HIP] = lm(...pts.rh);
  return { timestampSeconds: t, landmarks };
}

describe('computePoseMetrics', () => {
  test('returns null with fewer than 2 usable frames', () => {
    expect(computePoseMetrics([])).toBeNull();
    const one = makeFrame(0, {
      nose: [0.5, 0.2],
      ls: [0.4, 0.3],
      rs: [0.6, 0.3],
      lh: [0.45, 0.5],
      rh: [0.55, 0.5],
    });
    expect(computePoseMetrics([one])).toBeNull();
  });

  test('ignores frames without enough landmarks', () => {
    const tiny: PoseFrame = { timestampSeconds: 0, landmarks: [lm(0.5, 0.5)] };
    expect(computePoseMetrics([tiny, tiny])).toBeNull();
  });

  test('computes rotation, posture, head and hip ranges', () => {
    const f1 = makeFrame(0, {
      nose: [0.5, 0.2],
      ls: [0.4, 0.3],
      rs: [0.6, 0.3], // level shoulders → 0°
      lh: [0.45, 0.5],
      rh: [0.55, 0.5], // hip mid x = 0.5
    });
    const f2 = makeFrame(1, {
      nose: [0.55, 0.2], // head moved +0.05
      ls: [0.4, 0.3],
      rs: [0.6, 0.35], // tilted shoulders
      lh: [0.5, 0.5],
      rh: [0.6, 0.5], // hip mid x = 0.55 (sway +0.05)
    });
    const m = computePoseMetrics([f1, f2])!;
    expect(m.framesWithPose).toBe(2);
    expect(m.shoulderTurnRangeDeg).toBe(14);
    expect(m.spineAngleRangeDeg).toBe(16);
    expect(m.headSwayPct).toBe(5);
    expect(m.hipSwayPct).toBe(5);
  });
});

describe('summarizePoseMetrics', () => {
  test('renders the measured numbers in plain text', () => {
    const text = summarizePoseMetrics({
      framesWithPose: 8,
      shoulderTurnRangeDeg: 42,
      spineAngleRangeDeg: 9,
      headSwayPct: 6,
      hipSwayPct: 11,
    });
    expect(text).toContain('8 frames');
    expect(text).toContain('42°');
    expect(text).toContain('6%');
    expect(text).toContain('11%');
  });
});
