// ============================================================
// SwingVantage — Motion Lab: Sample / Demo sessions
// ------------------------------------------------------------
// Lets a visitor experience the lab BEFORE uploading. We procedurally
// generate a smooth, plausible 33-point pose track for a few signature
// racquet motions, then run it through the SAME real analysis engine
// (analyzePoseTrack) as a live clip. The result is the engine's honest
// read of a synthetic motion — never hand-authored numbers — and it is
// clearly labelled a Sample in the UI.
//
// No video exists for a sample (none was ever filmed), so the results
// view shows the 3D reconstruction, phases, metrics, scores, coaching
// report, and drills — everything except the video-overlay lab.
// ============================================================

import type { MotionSession, MotionPoseTrack, MotionLandmark, CaptureContext } from './types';
import type { SportId, MotionTypeId } from './types';
import { analyzePoseTrack } from './pipeline';

export interface SampleSpec {
  id: string;
  sport: SportId;
  motion: MotionTypeId;
  label: string;
  blurb: string;
  emoji: string;
}

export const SAMPLE_SPECS: SampleSpec[] = [
  { id: 'tennis-forehand', sport: 'tennis', motion: 'forehand', label: 'Tennis forehand', blurb: 'Low-to-high groundstroke', emoji: '🎾' },
  { id: 'pickleball-dink', sport: 'pickleball', motion: 'dink', label: 'Pickleball dink', blurb: 'Soft kitchen control', emoji: '🏓' },
  { id: 'padel-bandeja', sport: 'padel', motion: 'bandeja', label: 'Padel bandeja', blurb: 'Controlled overhead', emoji: '🎾' },
];

// ── Procedural skeleton ───────────────────────────────────────

type SwingStyle = 'groundstroke' | 'dink' | 'overhead';

/** Smoothstep eased interpolation between ordered keyframes (scalar). */
function sampleKeyframes(keys: Array<{ p: number; v: number }>, p: number): number {
  if (p <= keys[0].p) return keys[0].v;
  const last = keys[keys.length - 1];
  if (p >= last.p) return last.v;
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (p >= a.p && p <= b.p) {
      const t = (p - a.p) / (b.p - a.p);
      const e = t * t * (3 - 2 * t); // smoothstep
      return a.v + (b.v - a.v) * e;
    }
  }
  return last.v;
}

/** Hitting-wrist control points (normalized image coords) per swing style. */
function wristKeys(style: SwingStyle): { x: Array<{ p: number; v: number }>; y: Array<{ p: number; v: number }>; z: Array<{ p: number; v: number }> } {
  if (style === 'overhead') {
    // Up and behind → high contact above the shoulder → controlled finish.
    return {
      x: [{ p: 0, v: 0.40 }, { p: 0.35, v: 0.46 }, { p: 0.62, v: 0.30 }, { p: 1, v: 0.22 }],
      y: [{ p: 0, v: 0.30 }, { p: 0.35, v: 0.12 }, { p: 0.62, v: 0.10 }, { p: 1, v: 0.34 }],
      z: [{ p: 0, v: 0.02 }, { p: 0.35, v: -0.04 }, { p: 0.62, v: -0.14 }, { p: 1, v: 0.0 }],
    };
  }
  if (style === 'dink') {
    // Compact and low: tiny take-back, soft contact out front near waist.
    return {
      x: [{ p: 0, v: 0.42 }, { p: 0.35, v: 0.44 }, { p: 0.62, v: 0.34 }, { p: 1, v: 0.30 }],
      y: [{ p: 0, v: 0.52 }, { p: 0.35, v: 0.54 }, { p: 0.62, v: 0.50 }, { p: 1, v: 0.44 }],
      z: [{ p: 0, v: 0.0 }, { p: 0.35, v: 0.02 }, { p: 0.62, v: -0.10 }, { p: 1, v: -0.04 }],
    };
  }
  // groundstroke: low-to-high, big arc, waist-height contact out front, wrap finish.
  return {
    x: [{ p: 0, v: 0.44 }, { p: 0.35, v: 0.50 }, { p: 0.62, v: 0.24 }, { p: 1, v: 0.42 }],
    y: [{ p: 0, v: 0.40 }, { p: 0.35, v: 0.52 }, { p: 0.62, v: 0.40 }, { p: 1, v: 0.16 }],
    z: [{ p: 0, v: 0.02 }, { p: 0.35, v: 0.06 }, { p: 0.62, v: -0.16 }, { p: 1, v: -0.02 }],
  };
}

function lm(x: number, y: number, z = 0, v = 0.92): MotionLandmark {
  return { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)), z, v };
}

/**
 * One synthetic frame. A right-handed athlete (hitting arm = right side,
 * indices 12/14/16) standing roughly face-on, with the hitting arm swinging
 * through the motion and a small coil/uncoil rotation + weight shift.
 */
function buildFrame(style: SwingStyle, p: number): MotionLandmark[] {
  // Coil back through load, open through contact → follow (−1 coiled .. +1 open).
  const rot = sampleKeyframes([{ p: 0, v: 0 }, { p: 0.35, v: -1 }, { p: 0.62, v: 0.6 }, { p: 1, v: 1 }], p);
  const shift = sampleKeyframes([{ p: 0, v: 0 }, { p: 0.35, v: -0.012 }, { p: 0.62, v: 0.02 }, { p: 1, v: 0.012 }], p);
  const rotX = rot * 0.03; // shoulders rotate a touch in x

  // Static lower/upper body (with a small weight shift + rotation).
  const hipY = 0.55, shY = 0.31, kneeY = 0.74, ankY = 0.92;
  const cx = 0.5 + shift;
  const lShoulder = lm(cx + 0.11 + rotX, shY, 0.02 * rot);
  const rShoulder = lm(cx - 0.11 + rotX, shY, -0.02 * rot);
  const lHip = lm(cx + 0.07, hipY);
  const rHip = lm(cx - 0.07, hipY);
  const nose = lm(cx + rotX * 0.6, 0.16, 0.02 * rot);

  // Support arm (left): bent, held in front, fairly quiet.
  const lElbow = lm(cx + 0.13, shY + 0.10);
  const lWrist = lm(cx + 0.06, shY + 0.15, -0.02);

  // Hitting arm (right): wrist follows the styled arc; elbow sits between
  // shoulder and wrist, pulled slightly toward the body to imply a bend.
  const wk = wristKeys(style);
  const wristX = sampleKeyframes(wk.x, p) + shift;
  const wristY = sampleKeyframes(wk.y, p);
  const wristZ = sampleKeyframes(wk.z, p);
  const rWrist = lm(wristX, wristY, wristZ, 0.9);
  const rElbow = lm(
    rShoulder.x + (wristX - rShoulder.x) * 0.5 + 0.03,
    rShoulder.y + (wristY - rShoulder.y) * 0.5,
    wristZ * 0.5,
  );

  const lKnee = lm(cx + 0.065, kneeY);
  const rKnee = lm(cx - 0.065, kneeY);
  const lAnkle = lm(cx + 0.06, ankY);
  const rAnkle = lm(cx - 0.06, ankY);

  const out: MotionLandmark[] = new Array(33);
  // Core
  out[0] = nose;
  // Face cluster (eyes/ears/mouth) — small offsets around the nose so the head
  // renders without driving any metric.
  out[1] = lm(nose.x - 0.015, nose.y - 0.01); out[2] = lm(nose.x - 0.02, nose.y - 0.012); out[3] = lm(nose.x - 0.025, nose.y - 0.01);
  out[4] = lm(nose.x + 0.015, nose.y - 0.01); out[5] = lm(nose.x + 0.02, nose.y - 0.012); out[6] = lm(nose.x + 0.025, nose.y - 0.01);
  out[7] = lm(nose.x - 0.03, nose.y); out[8] = lm(nose.x + 0.03, nose.y);
  out[9] = lm(nose.x - 0.012, nose.y + 0.02); out[10] = lm(nose.x + 0.012, nose.y + 0.02);
  out[11] = lShoulder; out[12] = rShoulder;
  out[13] = lElbow; out[14] = rElbow;
  out[15] = lWrist; out[16] = rWrist;
  // Hands (pinky/index/thumb) near each wrist.
  out[17] = lm(lWrist.x - 0.01, lWrist.y + 0.02); out[18] = lm(lWrist.x + 0.01, lWrist.y + 0.02); out[19] = lm(lWrist.x, lWrist.y + 0.015);
  out[20] = lm(rWrist.x - 0.01, rWrist.y + 0.02, wristZ); out[21] = lm(rWrist.x + 0.01, rWrist.y + 0.02, wristZ); out[22] = lm(rWrist.x, rWrist.y + 0.015, wristZ);
  out[23] = lHip; out[24] = rHip;
  out[25] = lKnee; out[26] = rKnee;
  out[27] = lAnkle; out[28] = rAnkle;
  // Heels + foot index near the ankles.
  out[29] = lm(lAnkle.x - 0.01, ankY + 0.02); out[30] = lm(rAnkle.x - 0.01, ankY + 0.02);
  out[31] = lm(lAnkle.x + 0.03, ankY + 0.03); out[32] = lm(rAnkle.x + 0.03, ankY + 0.03);
  return out;
}

/** A full synthetic pose track for a swing style (pure, deterministic). */
export function generateSamplePoseTrack(style: SwingStyle, frameCount = 28, dtMs = 60): MotionPoseTrack {
  const frames = Array.from({ length: frameCount }, (_, i) => {
    const p = i / (frameCount - 1);
    return { tMs: i * dtMs, landmarks: buildFrame(style, p) };
  });
  return {
    schema: 'mediapipe_pose_33',
    fps: 30,
    frames,
    attemptedFrames: frameCount,
    trackingConfidence: 0.9,
    basis: 'estimated',
  };
}

function styleFor(spec: SampleSpec): SwingStyle {
  if (spec.motion === 'bandeja' || spec.motion === 'vibora' || spec.motion === 'smash') return 'overhead';
  if (spec.sport === 'pickleball') return 'dink';
  return 'groundstroke';
}

// Built lazily and cached so repeated opens are instant.
const cache = new Map<string, MotionSession>();

/** Build (or return the cached) sample session for a spec. */
export function buildSampleSession(spec: SampleSpec): MotionSession {
  const cached = cache.get(spec.id);
  if (cached) return cached;

  const track = generateSamplePoseTrack(styleFor(spec));
  const capture: CaptureContext = {
    sport: spec.sport,
    motionType: spec.motion,
    view: 'side',
    handedness: 'right',
    skillLevel: 'intermediate',
    heightCm: null,
    implement: null,
  };
  const session = analyzePoseTrack(track, capture, { modelVersion: 'sample-synthetic-1.0.0' });
  // Stamp it as a clearly-identifiable, non-persisted sample.
  const stamped: MotionSession = {
    ...session,
    id: `sample-${spec.id}`,
    tags: ['Sample'],
  };
  cache.set(spec.id, stamped);
  return stamped;
}

/** True when a session is one of the built-in demos (id convention + tag). */
export function isSampleSession(session: Pick<MotionSession, 'id' | 'tags'>): boolean {
  return session.id.startsWith('sample-') || !!session.tags?.includes('Sample');
}
