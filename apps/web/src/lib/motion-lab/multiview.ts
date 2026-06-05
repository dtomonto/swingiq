// ============================================================
// SwingVantage — Motion Lab: Multi-View Track Builder
// ------------------------------------------------------------
// Turns two (roughly time-aligned) single-camera pose tracks into a
// single MULTI-VIEW track of TRUE triangulated 3D, using the pose3d
// engine. Frame i of view A is paired with the best-matching frame in
// a small temporal window of view B (reprojection-error search) to
// absorb modest phone desync. The result carries basis 'measured' and
// a confidence derived from real reprojection error.
//
// HONESTY: triangulation is only valid when the two clips capture the
// same instants. We report reprojection error so a poorly-synced or
// mis-calibrated capture shows LOW confidence rather than false 3D.
// ============================================================

import type { MotionPoseTrack, MotionPoseFrame } from './types';
import {
  type Camera,
  reconstructMultiViewFrame,
  worldPointsToViewerLandmarks,
} from '@/lib/pose3d';

export interface ViewLandmarks {
  tMs: number;
  landmarks: Array<{ x: number; y: number; visibility: number }>;
}

/** Uniformly resample a list of frames to exactly `n` entries (index-nearest). */
function resample<T>(items: T[], n: number): T[] {
  if (items.length === 0 || n <= 0) return [];
  if (items.length === n) return items.slice();
  const out: T[] = [];
  for (let i = 0; i < n; i++) {
    out.push(items[Math.round((i * (items.length - 1)) / (n - 1))]);
  }
  return out;
}

/**
 * Build a measured multi-view track from two per-view landmark sequences and
 * the calibrated rig. `searchWindow` frames of slack on view B absorb desync.
 */
export function buildMultiViewTrack(
  viewA: ViewLandmarks[],
  viewB: ViewLandmarks[],
  cameras: Camera[],
  searchWindow = 2,
): MotionPoseTrack {
  const n = Math.min(viewA.length, viewB.length);
  if (n < 2 || cameras.length < 2) {
    return { schema: 'mediapipe_pose_33', fps: 30, frames: [], attemptedFrames: n, trackingConfidence: 0, basis: 'placeholder' };
  }

  const a = resample(viewA, n);
  const b = resample(viewB, n);

  const frames: MotionPoseFrame[] = [];
  let confSum = 0;

  for (let i = 0; i < n; i++) {
    // Search a small temporal window in B for the best (lowest-reproj) match.
    let best = reconstructMultiViewFrame([a[i].landmarks, b[i].landmarks], cameras);
    for (let d = -searchWindow; d <= searchWindow; d++) {
      const j = i + d;
      if (j < 0 || j >= n || d === 0) continue;
      const cand = reconstructMultiViewFrame([a[i].landmarks, b[j].landmarks], cameras);
      if (cand.reprojError < best.reprojError) best = cand;
    }

    const landmarks = worldPointsToViewerLandmarks(best.points);
    frames.push({ tMs: a[i].tMs, landmarks });
    confSum += best.confidence;
  }

  return {
    schema: 'mediapipe_pose_33',
    fps: 30,
    frames,
    attemptedFrames: n,
    trackingConfidence: +(confSum / n).toFixed(3),
    // True triangulated 3D from calibrated multi-view geometry.
    basis: 'measured',
  };
}
