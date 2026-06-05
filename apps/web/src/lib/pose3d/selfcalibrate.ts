// ============================================================
// SwingVantage — pose3d: Per-Capture Self-Calibration
// ------------------------------------------------------------
// Estimates the relative camera pose between two views DIRECTLY FROM
// THE DATA (no rig preset): the 33 landmarks across many frames give
// hundreds of 2D↔2D correspondences → RANSAC essential matrix →
// recovered (R, t). Returns calibrated cameras ready for triangulation,
// or null when the geometry is too weak (caller falls back to a preset).
// ============================================================

import { type Camera, type CameraIntrinsics, defaultIntrinsics } from './camera';
import { ransacEssential, type P2 } from './eightpoint';
import { recoverPose } from './decompose';
import { refinePose } from './bundle';
import type { Mat } from './linalg';

const I3: Mat = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
const MIN_VIS = 0.5;
const MAX_CORR = 400;

interface ViewFrames {
  landmarks: Array<{ x: number; y: number; visibility: number }>;
}

function calibrate(u: number, v: number, K: CameraIntrinsics): P2 {
  return [(u - K.cx) / K.fx, (v - K.cy) / K.fy];
}

/** Gather calibrated 2D correspondences seen (well) by both views. */
function gatherCorrespondences(
  viewA: ViewFrames[],
  viewB: ViewFrames[],
  K: CameraIntrinsics,
): { pts1: P2[]; pts2: P2[] } {
  const n = Math.min(viewA.length, viewB.length);
  const pts1: P2[] = [];
  const pts2: P2[] = [];
  for (let i = 0; i < n; i++) {
    const a = viewA[i].landmarks;
    const b = viewB[i].landmarks;
    const m = Math.min(a.length, b.length);
    for (let j = 0; j < m; j++) {
      if (a[j].visibility >= MIN_VIS && b[j].visibility >= MIN_VIS) {
        pts1.push(calibrate(a[j].x, a[j].y, K));
        pts2.push(calibrate(b[j].x, b[j].y, K));
      }
    }
  }
  // Subsample for RANSAC speed while keeping good coverage.
  if (pts1.length > MAX_CORR) {
    const step = pts1.length / MAX_CORR;
    const s1: P2[] = [];
    const s2: P2[] = [];
    for (let i = 0; i < MAX_CORR; i++) {
      const k = Math.floor(i * step);
      s1.push(pts1[k]);
      s2.push(pts2[k]);
    }
    return { pts1: s1, pts2: s2 };
  }
  return { pts1, pts2 };
}

export interface SelfCalibration {
  cameras: Camera[];
  inlierRatio: number;
  frontRatio: number;
  correspondences: number;
  /** Mean reprojection error after bundle refinement (lower = better). */
  reprojError: number;
}

/**
 * Self-calibrate two views. `rand` is injectable for deterministic tests.
 * Returns null if there aren't enough correspondences or the estimate is weak.
 */
export function selfCalibrate(
  viewA: ViewFrames[],
  viewB: ViewFrames[],
  K: CameraIntrinsics = defaultIntrinsics(),
  rand: () => number = Math.random,
): SelfCalibration | null {
  const { pts1, pts2 } = gatherCorrespondences(viewA, viewB, K);
  if (pts1.length < 16) return null;

  const ransac = ransacEssential(pts1, pts2, rand, { iterations: 250, threshold: 1e-3 });
  if (!ransac) return null;

  const in1 = pts1.filter((_, i) => ransac.inliers[i]);
  const in2 = pts2.filter((_, i) => ransac.inliers[i]);
  const recovered = recoverPose(ransac.E, in1, in2);
  if (!recovered) return null;

  const inlierRatio = ransac.inlierCount / pts1.length;
  // Reject obviously-bad geometry early (caller will use a rig preset instead).
  if (inlierRatio < 0.4 || recovered.frontRatio < 0.6) return null;

  // Bundle-adjust the pose to minimize reprojection error (only accepts
  // improvements, so it can never worsen the recovered estimate).
  const refined = refinePose(recovered.pose.R, recovered.pose.t, in1, in2, { iterations: 30 });

  const cameras: Camera[] = [
    { id: 'A', K, R: I3, t: [0, 0, 0] },
    { id: 'B', K, R: refined.R, t: refined.t },
  ];

  return {
    cameras,
    inlierRatio: +inlierRatio.toFixed(3),
    frontRatio: +recovered.frontRatio.toFixed(3),
    correspondences: pts1.length,
    reprojError: +refined.error.toFixed(5),
  };
}
