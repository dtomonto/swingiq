// ============================================================
// SwingIQ — Motion Lab: 3D biomechanics integration tests
// ------------------------------------------------------------
// Proves the headline fix: on a FACE-ON capture the shoulder turn lives
// almost entirely in the DEPTH axis (the image-plane tilt barely moves).
// The old 2D engine read ~0° turn here; the 3D engine must read the real
// coil. Also proves the honest 2D fallback when depth is flat.
// ============================================================

import { computeSeries, computeMetrics } from '../biomechanics';
import { detectPhases } from '../phases';
import type { MotionPoseTrack, CaptureContext } from '../types';

const capture: CaptureContext = {
  sport: 'golf',
  motionType: 'driver',
  view: 'face_on',
  handedness: 'right',
  heightCm: null,
  implement: null,
};

/** Sigmoid centred at `c` (steepness `k`). */
function sig(i: number, c: number, k: number): number {
  return 1 / (1 + Math.exp(-(i - c) / k));
}

/**
 * Build a FACE-ON golf swing: shoulders/hips rotate about the vertical axis, so
 * the turn shows up in z (depth) while the image-plane shoulder line stays flat
 * (dy = 0). `withDepth=false` zeroes z to simulate a depth-less 2D pose.
 */
function faceOnTrack(withDepth: boolean): MotionPoseTrack {
  const N = 24;
  const topI = 11; // top of backswing
  const frames = Array.from({ length: N }, (_, i) => {
    // shoulder coil: 0 → ~85° at the top → unwind through to about −25°.
    const aDeg = i <= topI ? (i / topI) * 85 : 85 - ((i - topI) / (N - 1 - topI)) * 110;
    const a = (aDeg * Math.PI) / 180;
    const b = a * 0.5; // hips turn about half as much → real separation
    const z = (v: number) => (withDepth ? v : 0);
    const r = 0.1; // half shoulder width
    const rh = 0.07; // half hip width

    const lm = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, v: 0.85 }));
    lm[0] = { x: 0.5, y: 0.2, z: 0, v: 0.9 }; // nose
    // shoulders rotate in the x–z plane; y is identical L/R (face-on, no tilt)
    lm[11] = { x: 0.5 - r * Math.cos(a), y: 0.34, z: z(-r * Math.sin(a)), v: 0.92 };
    lm[12] = { x: 0.5 + r * Math.cos(a), y: 0.34, z: z(r * Math.sin(a)), v: 0.92 };
    lm[23] = { x: 0.5 - rh * Math.cos(b), y: 0.6, z: z(-rh * Math.sin(b)), v: 0.9 };
    lm[24] = { x: 0.5 + rh * Math.cos(b), y: 0.6, z: z(rh * Math.sin(b)), v: 0.9 };
    // lead wrist (L=15): rises to an apex at the top, then sweeps fast at impact
    const rise = 0.22 * Math.exp(-((i - topI) ** 2) / (2 * 3 ** 2));
    lm[15] = { x: 0.35 + 0.45 * sig(i, 15, 1.2), y: 0.5 - rise, z: 0, v: 0.8 };
    lm[16] = { x: 0.66, y: 0.5, z: 0, v: 0.8 };
    lm[25] = { x: 0.45, y: 0.75, z: 0, v: 0.7 };
    lm[26] = { x: 0.55, y: 0.75, z: 0, v: 0.7 };
    lm[27] = { x: 0.45, y: 0.92, z: 0, v: 0.6 };
    lm[28] = { x: 0.55, y: 0.92, z: 0, v: 0.6 };
    return { tMs: i * 33, landmarks: lm };
  });
  return {
    schema: 'mediapipe_pose_33',
    fps: 30,
    frames,
    attemptedFrames: N,
    trackingConfidence: 0.85,
    basis: 'estimated',
  };
}

describe('3D biomechanics (face-on, depth-driven rotation)', () => {
  it('reads a real shoulder turn from depth that the 2D image plane cannot see', () => {
    const track = faceOnTrack(true);
    const series = computeSeries(track, capture)!;
    expect(series).not.toBeNull();

    // The image-plane shoulder line never tilts (dy = 0) — a pure 2D engine
    // would report essentially no turn here.
    const image2dTurn = Math.max(...series.shoulderLineDeg) - Math.min(...series.shoulderLineDeg);
    expect(image2dTurn).toBeLessThan(5);

    // The depth-aware engine recovers the real coil.
    expect(series.depthReliability).toBeGreaterThan(0.8);
    expect(series.shoulderTurnDeg).toBeGreaterThan(60);
    expect(series.hipTurnDeg).toBeGreaterThan(25);
    expect(series.xFactorDeg).toBeGreaterThan(15);

    const phases = detectPhases(track, capture, series);
    const metrics = computeMetrics(track, capture, series, phases);
    const shoulder = metrics.find((m) => m.id === 'shoulder_turn')!;
    expect(shoulder.value).toBeGreaterThan(60);
    expect(shoulder.confidence).toBeGreaterThan(0.6);
    // a true rotation read should describe itself as such
    expect(metrics.find((m) => m.id === 'rotation_quality')).toBeTruthy();
  });

  it('detects the top of the backswing and anchors phases to it', () => {
    const track = faceOnTrack(true);
    const series = computeSeries(track, capture)!;
    expect(series.topFrame).toBeGreaterThan(7);
    expect(series.topFrame).toBeLessThan(series.peakFrame);

    const phases = detectPhases(track, capture, series);
    const top = phases.find((p) => p.key === 'top')!;
    // the 'top' phase should END near the detected reversal frame
    expect(Math.abs(top.endFrame - series.topFrame)).toBeLessThanOrEqual(3);
  });

  it('falls back to the 2D estimate honestly when depth is flat (lower confidence)', () => {
    const track3d = faceOnTrack(true);
    const track2d = faceOnTrack(false); // z zeroed everywhere

    const s3 = computeSeries(track3d, capture)!;
    const s2 = computeSeries(track2d, capture)!;
    expect(s2.depthReliability).toBeLessThan(0.2);

    const conf3 = computeMetrics(track3d, capture, s3, detectPhases(track3d, capture, s3))
      .find((m) => m.id === 'shoulder_turn')!.confidence;
    const conf2 = computeMetrics(track2d, capture, s2, detectPhases(track2d, capture, s2))
      .find((m) => m.id === 'shoulder_turn')!.confidence;

    // Depth-less capture must report LOWER confidence for rotation, and never NaN.
    expect(conf2).toBeLessThan(conf3);
    expect(Number.isFinite(conf2)).toBe(true);
  });
});
