// ============================================================
// SwingVantage — Motion Lab: 2D Overlay Geometry
// ------------------------------------------------------------
// Pure, framework-free helpers that turn the stored pose track into
// the 2D primitives the VideoOverlayLab draws ON TOP of the user's
// actual clip: nearest-frame lookup, joint angles, an estimated
// centre of mass + base of support, and the bone/landmark schema.
//
// HONESTY: landmarks are MediaPipe estimates in normalized image
// coords (0–1). Angles are 2D (image-plane) reads, not 3D joint
// angles — they are directional and confidence-gated, never medical.
// All functions are deterministic and unit-tested.
// ============================================================

import type { MotionLandmark, MotionPoseTrack, MotionPoseFrame } from './types';
import type { SportId } from '@swingiq/core';

// ── MediaPipe 33-point schema ─────────────────────────────────

export const LM = {
  nose: 0,
  leftShoulder: 11, rightShoulder: 12,
  leftElbow: 13, rightElbow: 14,
  leftWrist: 15, rightWrist: 16,
  leftHip: 23, rightHip: 24,
  leftKnee: 25, rightKnee: 26,
  leftAnkle: 27, rightAnkle: 28,
  leftHeel: 29, rightHeel: 30,
  leftFoot: 31, rightFoot: 32,
} as const;

/** The clean athletic skeleton we draw (pairs of landmark indices). */
export const OVERLAY_BONES: ReadonlyArray<readonly [number, number]> = [
  [11, 12], [11, 23], [12, 24], [23, 24],          // torso box
  [11, 13], [13, 15],                              // left arm
  [12, 14], [14, 16],                              // right arm
  [23, 25], [25, 27], [27, 31],                    // left leg + foot
  [24, 26], [26, 28], [28, 32],                    // right leg + foot
];

/** Joints we render as dots. */
export const OVERLAY_JOINTS: readonly number[] = [
  0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28, 31, 32,
];

/**
 * Approximate fraction of total body mass per segment, used to weight a
 * centre-of-mass estimate. These are coarse Dempster-style proportions —
 * good enough for a directional COM read, not a lab figure.
 */
const MASS_WEIGHTS: ReadonlyArray<readonly [number, number]> = [
  [LM.nose, 0.08],          // head
  [LM.leftShoulder, 0.06], [LM.rightShoulder, 0.06],
  [LM.leftHip, 0.14], [LM.rightHip, 0.14], // pelvis carries the most
  [LM.leftElbow, 0.03], [LM.rightElbow, 0.03],
  [LM.leftWrist, 0.02], [LM.rightWrist, 0.02],
  [LM.leftKnee, 0.06], [LM.rightKnee, 0.06],
  [LM.leftAnkle, 0.03], [LM.rightAnkle, 0.03],
];

// ── Time / frame lookup ───────────────────────────────────────

/**
 * The index of the pose frame whose timestamp is closest to `tMs`.
 * Frames are assumed sorted ascending by tMs (the pipeline guarantees this).
 * Returns -1 for an empty track.
 */
export function frameIndexForTime(frames: ReadonlyArray<MotionPoseFrame>, tMs: number): number {
  if (frames.length === 0) return -1;
  if (frames.length === 1) return 0;
  // Binary search for the insertion point, then pick the nearer neighbour.
  let lo = 0;
  let hi = frames.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (frames[mid].tMs < tMs) lo = mid + 1;
    else hi = mid;
  }
  const hiIdx = lo;
  const loIdx = Math.max(0, lo - 1);
  const dHi = Math.abs(frames[hiIdx].tMs - tMs);
  const dLo = Math.abs(frames[loIdx].tMs - tMs);
  return dLo <= dHi ? loIdx : hiIdx;
}

// ── Angles ────────────────────────────────────────────────────

/**
 * The 2D angle (degrees, 0–180) at vertex `b` formed by points a–b–c, using
 * only image-plane x/y. Returns null when any point is missing.
 */
export function jointAngle2D(
  a: { x: number; y: number } | undefined,
  b: { x: number; y: number } | undefined,
  c: { x: number; y: number } | undefined,
): number | null {
  if (!a || !b || !c) return null;
  const v1x = a.x - b.x, v1y = a.y - b.y;
  const v2x = c.x - b.x, v2y = c.y - b.y;
  const m1 = Math.hypot(v1x, v1y);
  const m2 = Math.hypot(v2x, v2y);
  if (m1 < 1e-6 || m2 < 1e-6) return null;
  let cos = (v1x * v2x + v1y * v2y) / (m1 * m2);
  cos = Math.max(-1, Math.min(1, cos));
  return (Math.acos(cos) * 180) / Math.PI;
}

export interface OverlayAngle {
  id: string;
  label: string;
  /** Vertex landmark index (where the arc/number is drawn). */
  vertex: number;
  /** Angle in degrees, or null when not derivable. */
  value: number | null;
  /** 0–1 visibility-driven confidence for the three contributing joints. */
  confidence: number;
}

const DOMINANT_SIDE_ANGLES = (lead: 'left' | 'right'): Array<{ id: string; label: string; a: number; b: number; c: number }> => {
  const L = lead === 'left';
  return [
    { id: 'lead_knee', label: 'Front-knee flex', a: L ? LM.leftHip : LM.rightHip, b: L ? LM.leftKnee : LM.rightKnee, c: L ? LM.leftAnkle : LM.rightAnkle },
    { id: 'hit_elbow', label: 'Hitting-arm elbow', a: L ? LM.rightShoulder : LM.leftShoulder, b: L ? LM.rightElbow : LM.leftElbow, c: L ? LM.rightWrist : LM.leftWrist },
    { id: 'lead_shoulder', label: 'Lead-shoulder open', a: L ? LM.leftElbow : LM.rightElbow, b: L ? LM.leftShoulder : LM.rightShoulder, c: L ? LM.leftHip : LM.rightHip },
    { id: 'trunk_hinge', label: 'Trunk hinge', a: LM.leftShoulder, b: LM.leftHip, c: LM.leftKnee },
  ];
};

/**
 * Sport-relevant joint angles for one frame. `lead` is the front/target-side
 * of the body (right-handers lead with the left side). Confidence is the mean
 * visibility of the three contributing landmarks; the UI fades low-confidence
 * reads rather than asserting them.
 */
export function overlayJointAngles(
  landmarks: ReadonlyArray<MotionLandmark>,
  lead: 'left' | 'right',
): OverlayAngle[] {
  if (landmarks.length < 33) return [];
  return DOMINANT_SIDE_ANGLES(lead).map(({ id, label, a, b, c }) => {
    const value = jointAngle2D(landmarks[a], landmarks[b], landmarks[c]);
    const conf = (((landmarks[a]?.v ?? 0) + (landmarks[b]?.v ?? 0) + (landmarks[c]?.v ?? 0)) / 3) || 0;
    return { id, label, vertex: b, value: value == null ? null : Math.round(value), confidence: conf };
  });
}

// ── Balance: centre of mass + base of support ─────────────────

export interface BalanceEstimate {
  /** Estimated whole-body centre of mass (normalized image coords). */
  com: { x: number; y: number };
  /** Foot contact span on the ground (normalized x of each foot + midpoint). */
  base: { leftX: number; rightX: number; midX: number; y: number };
  /**
   * Signed horizontal offset of the COM from the base midpoint, as a fraction
   * of the stance width. 0 = centred, +ve = shifted toward the right edge of
   * the image, -ve = toward the left. |value| > ~0.5 suggests the COM is near
   * or past the edge of support (reaching / falling away).
   */
  comOffset: number;
  /** 0–1 confidence (mean visibility of the contributing landmarks). */
  confidence: number;
}

/** Weighted centre of mass + base of support for one frame. */
export function balanceEstimate(landmarks: ReadonlyArray<MotionLandmark>): BalanceEstimate | null {
  if (landmarks.length < 33) return null;
  let sx = 0, sy = 0, sw = 0, sv = 0, nv = 0;
  for (const [idx, w] of MASS_WEIGHTS) {
    const p = landmarks[idx];
    if (!p) continue;
    sx += p.x * w;
    sy += p.y * w;
    sw += w;
    sv += p.v;
    nv += 1;
  }
  if (sw < 1e-6) return null;
  const com = { x: sx / sw, y: sy / sw };

  const la = landmarks[LM.leftAnkle];
  const ra = landmarks[LM.rightAnkle];
  const leftX = la?.x ?? com.x;
  const rightX = ra?.x ?? com.x;
  const midX = (leftX + rightX) / 2;
  const footY = Math.max(la?.y ?? com.y, ra?.y ?? com.y);
  const stance = Math.abs(rightX - leftX);
  const comOffset = stance > 1e-3 ? (com.x - midX) / (stance / 2) : 0;

  return {
    com,
    base: { leftX, rightX, midX, y: footY },
    comOffset,
    confidence: nv > 0 ? sv / nv : 0,
  };
}

/** Plain-language read of a COM offset (for tooltips / a11y labels). */
export function balanceVerdict(offset: number): 'stable' | 'shifting' | 'reaching' {
  const a = Math.abs(offset);
  if (a <= 0.4) return 'stable';
  if (a <= 0.8) return 'shifting';
  return 'reaching';
}

// ── Footwork ──────────────────────────────────────────────────

export interface StanceRead {
  /** Stance width as a fraction of hip width (1 = feet under hips). */
  widthRatio: number | null;
  label: 'narrow' | 'athletic' | 'wide' | 'unknown';
  confidence: number;
}

/** A coarse stance-width read from ankle spacing vs hip spacing. */
export function stanceRead(landmarks: ReadonlyArray<MotionLandmark>): StanceRead {
  if (landmarks.length < 33) return { widthRatio: null, label: 'unknown', confidence: 0 };
  const la = landmarks[LM.leftAnkle], ra = landmarks[LM.rightAnkle];
  const lh = landmarks[LM.leftHip], rh = landmarks[LM.rightHip];
  if (!la || !ra || !lh || !rh) return { widthRatio: null, label: 'unknown', confidence: 0 };
  const ankleSpan = Math.abs(ra.x - la.x);
  const hipSpan = Math.abs(rh.x - lh.x);
  const conf = (la.v + ra.v + lh.v + rh.v) / 4;
  if (hipSpan < 1e-3) return { widthRatio: null, label: 'unknown', confidence: conf };
  const ratio = ankleSpan / hipSpan;
  const label = ratio < 0.9 ? 'narrow' : ratio <= 2.0 ? 'athletic' : 'wide';
  return { widthRatio: ratio, label, confidence: conf };
}

// ── Convenience ───────────────────────────────────────────────

/** The lead (front/target-side) of the body for a handedness. */
export function leadSide(handedness: 'left' | 'right' | 'unknown'): 'left' | 'right' {
  // Right-handers lead with their left side (and vice-versa). Unknown defaults
  // to a right-handed assumption (lead = left), the most common case.
  return handedness === 'left' ? 'right' : 'left';
}

/** Mean visibility across a frame's landmarks (overall track-confidence proxy). */
export function frameVisibility(frame: MotionPoseFrame | undefined): number {
  if (!frame || frame.landmarks.length === 0) return 0;
  let s = 0;
  for (const l of frame.landmarks) s += l.v;
  return s / frame.landmarks.length;
}

/** True when this sport/clip is expected to carry an implement path overlay. */
export function expectsImplementOverlay(sport: SportId): boolean {
  return sport === 'golf' || sport === 'tennis' || sport === 'pickleball' || sport === 'padel' || sport.startsWith('softball') || sport === 'baseball';
}

/** Resample a track frame at an arbitrary index (clamped, no interpolation). */
export function frameAt(track: MotionPoseTrack, index: number): MotionPoseFrame | undefined {
  if (track.frames.length === 0) return undefined;
  return track.frames[Math.max(0, Math.min(track.frames.length - 1, index))];
}
