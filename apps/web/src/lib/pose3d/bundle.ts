// ============================================================
// SwingIQ — pose3d: Bundle-Adjustment Refinement
// ------------------------------------------------------------
// Polishes a self-calibrated relative pose (R, t) by minimizing total
// reprojection error over all correspondences. The 3D points are
// re-triangulated at every evaluation, so we optimise only the 5 pose
// DOF (rotation via an axis-angle delta + translation direction; scale
// is free). A robust derivative-free pattern search keeps it dependency-
// free and stable.
// ============================================================

import { type Mat, type Vec, matMul, axisAngleToR, normalize3 } from './linalg';
import { triangulateJoint, type ViewObservation } from './triangulate';
import type { P2 } from './eightpoint';

const P_IDENTITY: Mat = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0]];

function projFromPose(R: Mat, t: Vec): Mat {
  return [
    [R[0][0], R[0][1], R[0][2], t[0]],
    [R[1][0], R[1][1], R[1][2], t[1]],
    [R[2][0], R[2][1], R[2][2], t[2]],
  ];
}

/** Mean reprojection error (both views) for a pose over the correspondences. */
export function poseReprojError(R: Mat, t: Vec, pts1: P2[], pts2: P2[]): number {
  const P2m = projFromPose(R, t);
  let sum = 0;
  let count = 0;
  const n = Math.min(pts1.length, pts2.length);
  for (let i = 0; i < n; i++) {
    const obs: Array<{ P: Mat; u: number; v: number; weight: number }> = [
      { P: P_IDENTITY, u: pts1[i][0], v: pts1[i][1], weight: 1 },
      { P: P2m, u: pts2[i][0], v: pts2[i][1], weight: 1 },
    ];
    const X = triangulateJoint(obs);
    if (!X) continue;
    const z1 = X[2];
    if (z1 <= 1e-6) continue;
    const e1 = Math.hypot(X[0] / z1 - pts1[i][0], X[1] / z1 - pts1[i][1]);
    const x2 = R[0][0] * X[0] + R[0][1] * X[1] + R[0][2] * X[2] + t[0];
    const y2 = R[1][0] * X[0] + R[1][1] * X[1] + R[1][2] * X[2] + t[1];
    const z2 = R[2][0] * X[0] + R[2][1] * X[1] + R[2][2] * X[2] + t[2];
    if (z2 <= 1e-6) continue;
    const e2 = Math.hypot(x2 / z2 - pts2[i][0], y2 / z2 - pts2[i][1]);
    sum += e1 + e2;
    count++;
  }
  return count > 0 ? sum / count : Infinity;
}

export interface RefinedPose {
  R: Mat;
  t: Vec;
  error: number;
  improvedFrom: number;
}

/**
 * Refine (R, t) by pattern search over a 6-vector p = [δrot(3), t(3)] where
 * R = expmap(δrot)·R0 and t = normalize(p[3..5]). Returns the best pose found.
 */
export function refinePose(
  R0: Mat,
  t0: Vec,
  pts1: P2[],
  pts2: P2[],
  opts: { iterations?: number; step?: number } = {},
): RefinedPose {
  const iterations = opts.iterations ?? 40;
  let step = opts.step ?? 0.05;

  // params: [r0,r1,r2, t0,t1,t2]; start at delta-rotation 0, t = t0.
  const p: number[] = [0, 0, 0, t0[0], t0[1], t0[2]];
  const poseFrom = (q: number[]): { R: Mat; t: Vec } => ({
    R: matMul(axisAngleToR([q[0], q[1], q[2]]), R0),
    t: normalize3([q[3], q[4], q[5]]),
  });
  const evalAt = (q: number[]): number => {
    const { R, t } = poseFrom(q);
    return poseReprojError(R, t, pts1, pts2);
  };

  const initial = evalAt(p);
  let best = initial;

  // Monotonic coordinate pattern search: only ever accepts improvements, so the
  // result can never be worse than the input pose. (The re-triangulated objective
  // is non-convex, so we keep steps conservative rather than chasing diagonals.)
  for (let it = 0; it < iterations; it++) {
    let improved = false;
    for (let d = 0; d < 6; d++) {
      for (const sgn of [1, -1]) {
        const trial = p.slice();
        trial[d] += sgn * step;
        const e = evalAt(trial);
        if (e < best) {
          best = e;
          p[d] = trial[d];
          improved = true;
        }
      }
    }
    if (!improved) step *= 0.5;
    if (step < 1e-4) break;
  }

  const { R, t } = poseFrom(p);
  return { R, t, error: best, improvedFrom: initial };
}

/** Re-export so callers building observations have the type to hand. */
export type { ViewObservation };
