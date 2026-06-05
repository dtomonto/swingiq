// ============================================================
// SwingVantage — Motion Lab: kinetic chain sequencing tests
// ------------------------------------------------------------
// Guarantees the firing-order read + power-leak flags are correct and
// that the engine degrades honestly on thin input.
// ============================================================

import { computeKineticChain } from '../kineticChain';
import type { MotionPoseTrack, CaptureContext } from '../types';
import type { MotionSeries } from '../biomechanics';
import type { ObjectTrackingResult } from '../objectTracking';

const CAPTURE: CaptureContext = {
  sport: 'golf',
  motionType: 'driver',
  view: 'face_on',
  handedness: 'right',
};

function track(n: number, basis: MotionPoseTrack['basis'] = 'estimated', conf = 0.8): MotionPoseTrack {
  return {
    schema: 'mediapipe_pose_33',
    fps: 30,
    frames: Array.from({ length: n }, (_, i) => ({ tMs: i * 33, landmarks: [] })),
    attemptedFrames: n,
    trackingConfidence: conf,
    basis,
  };
}

/** Build a MotionSeries with controlled peak positions; everything else zeroed. */
function series(n: number, opts: { hip: number; torso: number; arm: number; depth?: number }): MotionSeries {
  const zeros = () => new Array(n).fill(0);
  const spike = (idx: number) => {
    const a = zeros();
    a[idx] = 1;
    return a;
  };
  return {
    frames: n,
    tMs: Array.from({ length: n }, (_, i) => i * 33),
    shoulderLineDeg: zeros(),
    hipLineDeg: zeros(),
    spineTiltDeg: zeros(),
    headX: zeros(),
    comX: zeros(),
    comZ: zeros(),
    leadWristV: spike(opts.arm),
    shoulderV: spike(opts.torso),
    hipV: spike(opts.hip),
    energy: zeros(),
    peakFrame: opts.arm,
    shoulderHeadingDeg: zeros(),
    hipHeadingDeg: zeros(),
    relShoulderTurn: zeros(),
    relHipTurn: zeros(),
    separationDeg: zeros(),
    shoulderAngVel: spike(opts.torso),
    hipAngVel: spike(opts.hip),
    depthReliability: opts.depth ?? 0.6, // > 0.4 → uses angular velocity
    topFrame: -1,
    shoulderTurnDeg: 0,
    hipTurnDeg: 0,
    xFactorDeg: 0,
  };
}

/** Minimal object-tracking result whose head speed peaks at `implFrame`. */
function objectTracking(n: number, implFrame: number, conf = 0.4): ObjectTrackingResult {
  const points = Array.from({ length: n }, (_, i) => ({
    frame: i,
    tMs: i * 33,
    grip: { x: 0.5, y: 0.5 },
    // small steps everywhere, one big jump landing ON implFrame → peak speed there
    head: { x: i * 0.01 + (i === implFrame ? 0.3 : 0), y: 0.5 },
    confidence: conf,
  }));
  return {
    implement: 'club',
    available: true,
    trace: { points, basis: 'ai_inferred', confidence: conf, method: 'heuristic-forearm' },
    contactZone: null,
    swingPath: { verticalApproachDeg: null, approach: 'unknown', confidence: conf, basis: 'ai_inferred' },
    confidence: conf,
    basis: 'ai_inferred',
    disclaimer: '',
    warnings: [],
  };
}

describe('computeKineticChain', () => {
  it('scores a ground-up sequence as ordered with no leaks', () => {
    const res = computeKineticChain(track(10), CAPTURE, series(10, { hip: 2, torso: 4, arm: 6 }));
    expect(res.sequenceQuality).toBe(100);
    expect(res.powerLeakFlags).toHaveLength(0);
    expect(res.overall).toBe(100);
    expect(res.orderedLinks).toBe(2);
    expect(res.comparableLinks).toBe(2);
    expect(res.lowerBodyTiming).toBeLessThan(res.torsoTiming!);
    expect(res.torsoTiming).toBeLessThan(res.armTiming!);
  });

  it('flags an upper-body-first (reverse) sequence as high severity', () => {
    const res = computeKineticChain(track(10), CAPTURE, series(10, { hip: 6, torso: 2, arm: 8 }));
    const leak = res.powerLeakFlags.find((f) => f.id === 'upper_body_first');
    expect(leak).toBeDefined();
    expect(leak!.severity).toBe('high');
    expect(res.sequenceQuality).toBeLessThan(100);
    expect(res.overall).toBeLessThan(res.sequenceQuality);
  });

  it('includes the implement link and flags an early cast', () => {
    // arm peaks at 6 but implement peaks earlier at 4 → casting.
    const res = computeKineticChain(track(10), CAPTURE, series(10, { hip: 2, torso: 4, arm: 6 }), objectTracking(10, 4));
    expect(res.implementTiming).not.toBeNull();
    expect(res.comparableLinks).toBe(3);
    expect(res.powerLeakFlags.some((f) => f.id === 'implement_casts_early')).toBe(true);
  });

  it('flags a fire-all-at-once pattern', () => {
    const res = computeKineticChain(track(12), CAPTURE, series(12, { hip: 5, torso: 5, arm: 5 }));
    expect(res.powerLeakFlags.some((f) => f.id === 'simultaneous_fire')).toBe(true);
  });

  it('degrades honestly when there is too little signal', () => {
    const res = computeKineticChain(track(2), CAPTURE, null);
    expect(res.basis).toBe('placeholder');
    expect(res.confidence).toBe(0);
    expect(res.overall).toBe(0);
    expect(res.segments).toHaveLength(0);
  });

  it('drops the disclaimer only for measured (multi-view) data', () => {
    const est = computeKineticChain(track(10, 'estimated'), CAPTURE, series(10, { hip: 2, torso: 4, arm: 6 }));
    const meas = computeKineticChain(track(10, 'measured'), CAPTURE, series(10, { hip: 2, torso: 4, arm: 6 }));
    expect(est.disclaimer).not.toBeNull();
    expect(meas.disclaimer).toBeNull();
  });
});
