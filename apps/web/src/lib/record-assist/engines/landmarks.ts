// ============================================================
// SwingVantage — RecordAssist: BlazePose landmark map + helpers
// ------------------------------------------------------------
// MediaPipe Pose Landmarker emits 33 landmarks in a fixed order. We
// centralize the indices + a few pure geometry helpers so every engine
// reads the same schema. No I/O, no React — trivially testable.
// ============================================================

import type { PoseLandmark } from '../types';

/** BlazePose 33-landmark indices. */
export const LM = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
} as const;

export const HEAD_POINTS = [LM.NOSE, LM.LEFT_EAR, LM.RIGHT_EAR];
export const FOOT_POINTS = [
  LM.LEFT_ANKLE,
  LM.RIGHT_ANKLE,
  LM.LEFT_HEEL,
  LM.RIGHT_HEEL,
  LM.LEFT_FOOT_INDEX,
  LM.RIGHT_FOOT_INDEX,
];
export const HAND_POINTS = [LM.LEFT_WRIST, LM.RIGHT_WRIST];

/** Minimum model visibility for a landmark to be "trusted". */
export const VIS_THRESHOLD = 0.5;

/** Whether a landmark exists and is confidently visible. */
export function isVisible(lm: PoseLandmark | undefined, threshold = VIS_THRESHOLD): boolean {
  return !!lm && lm.visibility >= threshold;
}

/** Whether at least one of the indices is confidently visible. */
export function anyVisible(
  landmarks: PoseLandmark[],
  indices: readonly number[],
  threshold = VIS_THRESHOLD,
): boolean {
  return indices.some((i) => isVisible(landmarks[i], threshold));
}

/** Whether ALL of the indices are confidently visible. */
export function allVisible(
  landmarks: PoseLandmark[],
  indices: readonly number[],
  threshold = VIS_THRESHOLD,
): boolean {
  return indices.every((i) => isVisible(landmarks[i], threshold));
}

/**
 * Whether a point sits inside the normalized frame with a small margin.
 * Landmarks just outside 0–1 mean that body part is cut off.
 */
export function isInFrame(lm: PoseLandmark | undefined, margin = 0.02): boolean {
  if (!lm) return false;
  return lm.x >= margin && lm.x <= 1 - margin && lm.y >= margin && lm.y <= 1 - margin;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Tight bounding box over confidently-visible landmarks, normalized 0–1.
 * Returns null when too few points are visible to be meaningful.
 */
export function boundingBox(
  landmarks: PoseLandmark[],
  threshold = VIS_THRESHOLD,
): BoundingBox | null {
  const pts = landmarks.filter((lm) => lm && lm.visibility >= threshold);
  if (pts.length < 4) return null;
  let minX = 1;
  let minY = 1;
  let maxX = 0;
  let maxY = 0;
  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/** Midpoint between two landmarks (no visibility check). */
export function midpoint(a: PoseLandmark | undefined, b: PoseLandmark | undefined): { x: number; y: number } | null {
  if (!a || !b) return null;
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/**
 * Approximate body centerline X (normalized), averaging shoulder + hip
 * midpoints when available, falling back to the bounding-box center.
 */
export function centerlineX(landmarks: PoseLandmark[]): number | null {
  const shoulders = midpoint(landmarks[LM.LEFT_SHOULDER], landmarks[LM.RIGHT_SHOULDER]);
  const hips = midpoint(landmarks[LM.LEFT_HIP], landmarks[LM.RIGHT_HIP]);
  const xs: number[] = [];
  if (shoulders && isVisible(landmarks[LM.LEFT_SHOULDER]) && isVisible(landmarks[LM.RIGHT_SHOULDER])) {
    xs.push(shoulders.x);
  }
  if (hips && isVisible(landmarks[LM.LEFT_HIP]) && isVisible(landmarks[LM.RIGHT_HIP])) {
    xs.push(hips.x);
  }
  if (xs.length === 0) {
    const box = boundingBox(landmarks);
    return box ? box.x + box.width / 2 : null;
  }
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

/** Euclidean distance between two normalized points. */
export function distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
