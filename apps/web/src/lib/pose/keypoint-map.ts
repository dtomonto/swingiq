// ============================================================
// SwingVantage — Keypoint schema mapping (MoveNet ↔ MediaPipe)
// ------------------------------------------------------------
// A second pose engine (MoveNet, COCO-17) speaks a different keypoint
// vocabulary than the MediaPipe-33 baseline. To compare/fuse them, map
// MoveNet's 17 keypoints onto the MediaPipe-33 index space so both
// engines produce the same shape. Pure + unit-tested.
// ============================================================

import type { PoseLandmark } from './pose-detection';

/** MoveNet (COCO-17) keypoint order. */
export const MOVENET_KEYPOINTS = [
  'nose',
  'left_eye',
  'right_eye',
  'left_ear',
  'right_ear',
  'left_shoulder',
  'right_shoulder',
  'left_elbow',
  'right_elbow',
  'left_wrist',
  'right_wrist',
  'left_hip',
  'right_hip',
  'left_knee',
  'right_knee',
  'left_ankle',
  'right_ankle',
] as const;

/**
 * MoveNet keypoint index → MediaPipe-33 landmark index. (e.g. MoveNet[5]
 * left_shoulder → MediaPipe[11] left_shoulder.) These 17 joints are the ones
 * both engines observe and that drive the swing metrics.
 */
export const MOVENET_TO_MP33: readonly number[] = [
  0, // nose
  2, // left_eye
  5, // right_eye
  7, // left_ear
  8, // right_ear
  11, // left_shoulder
  12, // right_shoulder
  13, // left_elbow
  14, // right_elbow
  15, // left_wrist
  16, // right_wrist
  23, // left_hip
  24, // right_hip
  25, // left_knee
  26, // right_knee
  27, // left_ankle
  28, // right_ankle
];

/** MediaPipe-33 indices that the second (MoveNet) engine can corroborate. */
export const SHARED_MP_INDICES: readonly number[] = [...MOVENET_TO_MP33].sort((a, b) => a - b);

export interface MoveNetKeypoint {
  /** Normalized 0–1 image coordinates. */
  x: number;
  y: number;
  /** Detection confidence 0–1. */
  score?: number;
}

/**
 * Map a MoveNet-17 keypoint array (normalized coords) onto a 33-length MediaPipe
 * landmark array. Unmapped MediaPipe slots (face detail, hands, feet) are filled
 * with zero-visibility placeholders so the array shape matches the baseline and
 * fusion only ever touches the corroborated joints.
 */
export function movenetTo33(kp: ReadonlyArray<MoveNetKeypoint>): PoseLandmark[] {
  const out: PoseLandmark[] = Array.from({ length: 33 }, () => ({ x: 0, y: 0, z: 0, visibility: 0 }));
  for (let i = 0; i < MOVENET_TO_MP33.length && i < kp.length; i++) {
    const k = kp[i];
    if (!k) continue;
    out[MOVENET_TO_MP33[i]] = { x: k.x, y: k.y, z: 0, visibility: k.score ?? 0 };
  }
  return out;
}
