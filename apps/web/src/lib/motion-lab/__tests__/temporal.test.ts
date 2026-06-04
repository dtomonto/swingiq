// ============================================================
// SwingIQ — Motion Lab: temporal intelligence tests
// ------------------------------------------------------------
// Verifies anchored durations, contact-window stability, tempo, the
// timing flags, and honest degradation on thin input.
// ============================================================

import { computeTemporal } from '../temporal';
import type { MotionPoseTrack, CaptureContext, MotionPhaseSegment } from '../types';
import type { MotionSeries } from '../biomechanics';

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
    frames: Array.from({ length: n }, (_, i) => ({ tMs: i * 50, landmarks: [] })),
    attemptedFrames: n,
    trackingConfidence: conf,
    basis,
  };
}

/** Build a MotionSeries; only the fields temporal reads are meaningful. */
function series(
  n: number,
  opts: { top: number; peak: number; leadWristV?: number[]; comX?: number[] },
): MotionSeries {
  const zeros = () => new Array(n).fill(0);
  const v = opts.leadWristV ?? (() => {
    const a = new Array(n).fill(0.3);
    a[opts.peak] = 10; // single clean speed peak at the strike
    return a;
  })();
  return {
    frames: n,
    tMs: Array.from({ length: n }, (_, i) => i * 50),
    shoulderLineDeg: zeros(),
    hipLineDeg: zeros(),
    spineTiltDeg: zeros(),
    headX: zeros(),
    comX: opts.comX ?? new Array(n).fill(0.5),
    comZ: zeros(),
    leadWristV: v,
    shoulderV: zeros(),
    hipV: zeros(),
    energy: zeros(),
    peakFrame: opts.peak,
    shoulderHeadingDeg: zeros(),
    hipHeadingDeg: zeros(),
    relShoulderTurn: zeros(),
    relHipTurn: zeros(),
    separationDeg: zeros(),
    shoulderAngVel: zeros(),
    hipAngVel: zeros(),
    depthReliability: 0.5,
    topFrame: opts.top,
    shoulderTurnDeg: 0,
    hipTurnDeg: 0,
    xFactorDeg: 0,
  };
}

const PHASES: MotionPhaseSegment[] = [];

describe('computeTemporal', () => {
  it('anchors durations to the top and strike', () => {
    const res = computeTemporal(track(20), CAPTURE, series(20, { top: 15, peak: 17 }), PHASES);
    // load = start → top = tMs[15] - tMs[0] = 750ms
    expect(res.loadDurationMs).toBe(750);
    expect(res.transitionDurationMs).not.toBeNull();
    expect(res.accelerationDurationMs).not.toBeNull();
    expect(res.tempoRatio).not.toBeNull();
    expect(res.tempoRatio!).toBeGreaterThan(2); // ~3.75:1, a smooth golf rhythm
    expect(res.flags).toHaveLength(0);
  });

  it('flags a rushed transition when the backswing is quick', () => {
    const res = computeTemporal(track(20), CAPTURE, series(20, { top: 4, peak: 10 }), PHASES);
    expect(res.rushedTransition).toBe(true);
    expect(res.flags.some((f) => f.id === 'rushed_transition')).toBe(true);
  });

  it('flags speed that peaks too early (early release)', () => {
    const res = computeTemporal(track(20), CAPTURE, series(20, { top: 3, peak: 6 }), PHASES);
    expect(res.peakSpeedTimePct!).toBeLessThan(0.45);
    expect(res.flags.some((f) => f.id === 'early_peak')).toBe(true);
  });

  it('flags an unstable contact window when the body drifts through the strike', () => {
    const comX = new Array(20).fill(0.5);
    // big lateral drift around the strike frame (12..16, window ±2 of peak 14)
    [0.4, 0.45, 0.5, 0.6, 0.7].forEach((x, i) => (comX[12 + i] = x));
    const res = computeTemporal(track(20), CAPTURE, series(20, { top: 8, peak: 14, comX }), PHASES);
    expect(res.contactWindowStability!).toBeLessThan(50);
    expect(res.flags.some((f) => f.id === 'unstable_contact_window')).toBe(true);
  });

  it('computes deceleration control from the post-strike slow-down', () => {
    const res = computeTemporal(track(20), CAPTURE, series(20, { top: 15, peak: 17 }), PHASES);
    // base speed 0.3 at the finish vs peak 10 → well-controlled (~97/100)
    expect(res.decelerationControl!).toBeGreaterThan(80);
  });

  it('reads raw per-phase durations from the detected segments', () => {
    const phases: MotionPhaseSegment[] = [
      { key: 'setup', label: 'Setup', shortLabel: 'Setup', startFrame: 0, endFrame: 4, startMs: 0, endMs: 200, keyFrame: 2, confidence: 0.8, basis: 'estimated', interpretation: '' },
      { key: 'top', label: 'Top', shortLabel: 'Top', startFrame: 5, endFrame: 15, startMs: 250, endMs: 750, keyFrame: 15, confidence: 0.7, basis: 'estimated', interpretation: '' },
    ];
    const res = computeTemporal(track(20), CAPTURE, series(20, { top: 15, peak: 17 }), phases);
    expect(res.phaseDurations).toHaveLength(2);
    expect(res.phaseDurations[0]).toMatchObject({ key: 'setup', ms: 200 });
    expect(res.phaseDurations[1].ms).toBe(500);
  });

  it('degrades honestly when there is too little signal', () => {
    const res = computeTemporal(track(2), CAPTURE, null, PHASES);
    expect(res.basis).toBe('placeholder');
    expect(res.confidence).toBe(0);
    expect(res.tempoRatio).toBeNull();
  });

  it('drops the disclaimer only for measured data', () => {
    const est = computeTemporal(track(20, 'estimated'), CAPTURE, series(20, { top: 15, peak: 17 }), PHASES);
    const meas = computeTemporal(track(20, 'measured'), CAPTURE, series(20, { top: 15, peak: 17 }), PHASES);
    expect(est.disclaimer).not.toBeNull();
    expect(meas.disclaimer).toBeNull();
  });
});
