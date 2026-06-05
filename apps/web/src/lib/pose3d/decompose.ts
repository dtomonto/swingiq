// ============================================================
// SwingVantage — pose3d: Essential Matrix Decomposition
// ------------------------------------------------------------
// Recovers the relative camera pose (R, t up to scale) from the
// essential matrix, then disambiguates the 4 mathematical solutions by
// CHEIRALITY — the one real solution has triangulated points in front
// of BOTH cameras.
// ============================================================

import { type Mat, type Vec, matMul, transpose, det3, svd3 } from './linalg';
import { triangulateJoint } from './triangulate';
import type { P2 } from './eightpoint';

const W: Mat = [[0, -1, 0], [1, 0, 0], [0, 0, 1]];

export interface Pose {
  R: Mat;
  t: Vec;
}

const negate = (m: Mat): Mat => m.map((row) => row.map((v) => -v));

/** The 4 candidate relative poses from an essential matrix. */
export function essentialToPoses(E: Mat): Pose[] {
  const { U, V } = svd3(E);
  let Ra = matMul(matMul(U, W), transpose(V));
  let Rb = matMul(matMul(U, transpose(W)), transpose(V));
  if (det3(Ra) < 0) Ra = negate(Ra);
  if (det3(Rb) < 0) Rb = negate(Rb);
  const t: Vec = [U[0][2], U[1][2], U[2][2]];
  const tn: Vec = [-t[0], -t[1], -t[2]];
  return [
    { R: Ra, t },
    { R: Ra, t: tn },
    { R: Rb, t },
    { R: Rb, t: tn },
  ];
}

function projFromPose(R: Mat, t: Vec): Mat {
  return [
    [R[0][0], R[0][1], R[0][2], t[0]],
    [R[1][0], R[1][1], R[1][2], t[1]],
    [R[2][0], R[2][1], R[2][2], t[2]],
  ];
}
const P_IDENTITY: Mat = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0]];

/** Count correspondences triangulating in front of both cameras. */
function cheiralityScore(pose: Pose, pts1: P2[], pts2: P2[]): number {
  const P2m = projFromPose(pose.R, pose.t);
  let front = 0;
  const sample = Math.min(pts1.length, 60);
  for (let i = 0; i < sample; i++) {
    const X = triangulateJoint([
      { P: P_IDENTITY, u: pts1[i][0], v: pts1[i][1], weight: 1 },
      { P: P2m, u: pts2[i][0], v: pts2[i][1], weight: 1 },
    ]);
    if (!X) continue;
    const z1 = X[2];
    const z2 = pose.R[2][0] * X[0] + pose.R[2][1] * X[1] + pose.R[2][2] * X[2] + pose.t[2];
    if (z1 > 0 && z2 > 0) front++;
  }
  return front;
}

/** Pick the physically-valid (R, t) by cheirality. Returns null if degenerate. */
export function recoverPose(E: Mat, pts1: P2[], pts2: P2[]): { pose: Pose; frontRatio: number } | null {
  const poses = essentialToPoses(E);
  let best: Pose | null = null;
  let bestScore = -1;
  for (const pose of poses) {
    const score = cheiralityScore(pose, pts1, pts2);
    if (score > bestScore) { bestScore = score; best = pose; }
  }
  if (!best || bestScore <= 0) return null;
  const sample = Math.min(pts1.length, 60);
  return { pose: best, frontRatio: bestScore / sample };
}
