// ============================================================
// SwingIQ — Motion Lab: implement/object path estimation tests
// ------------------------------------------------------------
// Guarantees the heuristic stays HONEST: it extrapolates the head
// along the forearm, caps its confidence, labels its basis, and never
// throws on degenerate input.
// ============================================================

import {
  estimateImplementPath,
  implementForSport,
  heuristicForearmProvider,
  type ObjectTrackingInput,
} from '../objectTracking';
import type { MotionPoseTrack, CaptureContext, MotionPoseFrame } from '../types';

const L_ELBOW = 13;
const R_ELBOW = 14;
const L_WRIST = 15;
const R_WRIST = 16;

/** Build a 33-landmark frame with the arms placed vertically (wrist above elbow). */
function frame(tMs: number, wristY: number, vis = 0.9): MotionPoseFrame {
  const landmarks = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, v: 0.5 }));
  const set = (i: number, y: number) => (landmarks[i] = { x: 0.5, y, z: 0, v: vis });
  set(L_WRIST, wristY);
  set(R_WRIST, wristY);
  set(L_ELBOW, wristY + 0.1); // elbow BELOW wrist (image y is down-positive)
  set(R_ELBOW, wristY + 0.1);
  return { tMs, landmarks };
}

/** A short ascending track: hands rise across the clip. */
function ascendingTrack(): MotionPoseTrack {
  return {
    schema: 'mediapipe_pose_33',
    fps: 30,
    frames: [0.6, 0.55, 0.5, 0.45, 0.4].map((y, i) => frame(i * 33, y)),
    attemptedFrames: 5,
    trackingConfidence: 0.9,
    basis: 'estimated',
  };
}

function input(track: MotionPoseTrack, capture: Partial<CaptureContext> = {}): ObjectTrackingInput {
  return {
    track,
    capture: {
      sport: 'golf',
      motionType: 'driver',
      view: 'face_on',
      handedness: 'right',
      ...capture,
    },
    series: null,
    phases: [],
  };
}

describe('implementForSport', () => {
  it('maps sport + motion to the swung implement', () => {
    expect(implementForSport({ sport: 'golf', motionType: 'driver' } as CaptureContext)).toBe('club');
    expect(implementForSport({ sport: 'tennis', motionType: 'forehand' } as CaptureContext)).toBe('racket');
    expect(implementForSport({ sport: 'baseball', motionType: 'hitting' } as CaptureContext)).toBe('bat');
    expect(implementForSport({ sport: 'softball_slow', motionType: 'hitting' } as CaptureContext)).toBe('bat');
    // No swung implement for a throw — honest 'none'.
    expect(implementForSport({ sport: 'baseball', motionType: 'throwing' } as CaptureContext)).toBe('none');
  });
});

describe('estimateImplementPath — heuristic', () => {
  it('extrapolates the head beyond the grip along the forearm', () => {
    const res = estimateImplementPath(input(ascendingTrack()));
    expect(res.available).toBe(true);
    expect(res.implement).toBe('club');
    const p = res.trace.points[0];
    // Forearm points straight up (grip above elbow), so the head is further up.
    expect(p.head.y).toBeLessThan(p.grip.y);
    expect(Math.abs(p.head.x - p.grip.x)).toBeLessThan(1e-6);
    // Head reaches ~forearm(0.1) * club factor(4.4) beyond the grip.
    expect(p.grip.y - p.head.y).toBeCloseTo(0.44, 2);
  });

  it('keeps confidence honestly capped and basis ai_inferred', () => {
    const res = estimateImplementPath(input(ascendingTrack()));
    expect(res.basis).toBe('ai_inferred');
    expect(res.confidence).toBeLessThanOrEqual(0.5);
    expect(res.confidence).toBeGreaterThan(0);
    expect(res.disclaimer.length).toBeGreaterThan(0);
  });

  it('estimates a contact zone and an ascending swing path', () => {
    const res = estimateImplementPath(input(ascendingTrack()));
    expect(res.contactZone).not.toBeNull();
    expect(res.contactZone!.confidence).toBeLessThanOrEqual(0.5);
    expect(res.swingPath.approach).toBe('ascending');
    expect(res.swingPath.verticalApproachDeg).toBeGreaterThan(0);
  });

  it('reads a descending swing path when the hands drop into contact', () => {
    const track = ascendingTrack();
    track.frames = [0.4, 0.45, 0.5, 0.55, 0.6].map((y, i) => frame(i * 33, y)); // descending
    const res = estimateImplementPath(input(track));
    expect(res.swingPath.approach).toBe('descending');
    expect(res.swingPath.verticalApproachDeg).toBeLessThan(0);
  });

  it('returns an honest unavailable result for a throw (no implement)', () => {
    const res = estimateImplementPath(input(ascendingTrack(), { sport: 'baseball', motionType: 'throwing' }));
    expect(res.implement).toBe('none');
    expect(res.available).toBe(false);
    expect(res.contactZone).toBeNull();
    expect(res.warnings.length).toBeGreaterThan(0);
  });

  it('honors a manual implement override', () => {
    const res = estimateImplementPath({ ...input(ascendingTrack()), manualHints: { implement: 'racket' } });
    expect(res.implement).toBe('racket');
    expect(res.available).toBe(true);
  });

  it('honors a manually-tagged head position', () => {
    const res = estimateImplementPath({
      ...input(ascendingTrack()),
      manualHints: { headByFrame: { 0: { x: 0.9, y: 0.1 } } },
    });
    const p0 = res.trace.points.find((p) => p.frame === 0)!;
    expect(p0.head.x).toBe(0.9);
    expect(p0.head.y).toBe(0.1);
    expect(p0.confidence).toBeGreaterThanOrEqual(0.6); // manual tag is trusted more
  });

  it('never throws and degrades honestly with too few visible joints', () => {
    const track: MotionPoseTrack = {
      schema: 'mediapipe_pose_33',
      fps: 30,
      frames: [
        { tMs: 0, landmarks: Array.from({ length: 33 }, () => ({ x: 0, y: 0, z: 0, v: 0 })) },
        { tMs: 33, landmarks: Array.from({ length: 33 }, () => ({ x: 0, y: 0, z: 0, v: 0 })) },
        { tMs: 66, landmarks: Array.from({ length: 33 }, () => ({ x: 0, y: 0, z: 0, v: 0 })) },
      ],
      attemptedFrames: 3,
      trackingConfidence: 0,
      basis: 'estimated',
    };
    const res = estimateImplementPath(input(track));
    // Degenerate forearm (all points identical) → no usable trace, but no throw.
    expect(res.available).toBe(false);
    expect(res.trace.points.length).toBeLessThan(2);
  });

  it('provider is unavailable when there are too few frames', () => {
    const track = ascendingTrack();
    track.frames = track.frames.slice(0, 1);
    expect(heuristicForearmProvider.isAvailable(input(track))).toBe(false);
  });
});
