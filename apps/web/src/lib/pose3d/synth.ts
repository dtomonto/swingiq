// ============================================================
// SwingVantage — pose3d: Synthetic Skeleton Generator
// ------------------------------------------------------------
// Procedurally generates anthropometrically-plausible 33-joint 3D
// skeletons (a canonical T-pose articulated by random, range-limited
// joint rotations) and projects them through random cameras. This is
// the (honest) training source for the single-view lifting model: no
// proprietary mocap dataset required, and the same generator gives
// ground-truth 3D for validating multi-view triangulation.
// ============================================================

import { type Vec, type Mat, matVec, euler, rotX, rotY, rotZ, matMul } from './linalg';
import { type Camera, projectionMatrix, projectPoint } from './camera';

export const NUM_JOINTS = 33;

// Canonical T-pose (metres; hips at origin, +Y up, +Z toward camera-front).
// Indices follow MediaPipe Pose. Coarse but anatomically sane.
const CANONICAL: number[][] = (() => {
  const j: number[][] = Array.from({ length: NUM_JOINTS }, () => [0, 0, 0]);
  // torso
  j[23] = [-0.10, 0.00, 0]; j[24] = [0.10, 0.00, 0];        // hips
  j[11] = [-0.20, 0.50, 0]; j[12] = [0.20, 0.50, 0];        // shoulders
  // head cluster (around 0.7–0.8 m)
  j[0] = [0.00, 0.78, 0.08];                                 // nose
  j[1] = [-0.03, 0.80, 0.06]; j[2] = [-0.04, 0.80, 0.05]; j[3] = [-0.05, 0.80, 0.05];
  j[4] = [0.03, 0.80, 0.06]; j[5] = [0.04, 0.80, 0.05]; j[6] = [0.05, 0.80, 0.05];
  j[7] = [-0.08, 0.78, 0.00]; j[8] = [0.08, 0.78, 0.00];     // ears
  j[9] = [-0.03, 0.74, 0.07]; j[10] = [0.03, 0.74, 0.07];    // mouth
  // arms (out to sides)
  j[13] = [-0.45, 0.50, 0]; j[14] = [0.45, 0.50, 0];         // elbows
  j[15] = [-0.70, 0.50, 0]; j[16] = [0.70, 0.50, 0];         // wrists
  j[17] = [-0.76, 0.50, 0]; j[18] = [0.76, 0.50, 0];         // pinky
  j[19] = [-0.77, 0.52, 0]; j[20] = [0.77, 0.52, 0];         // index
  j[21] = [-0.74, 0.50, 0.02]; j[22] = [0.74, 0.50, 0.02];   // thumb
  // legs
  j[25] = [-0.11, -0.50, 0]; j[26] = [0.11, -0.50, 0];       // knees
  j[27] = [-0.11, -0.98, 0]; j[28] = [0.11, -0.98, 0];       // ankles
  j[29] = [-0.11, -1.03, -0.05]; j[30] = [0.11, -1.03, -0.05]; // heels
  j[31] = [-0.11, -1.02, 0.12]; j[32] = [0.11, -1.02, 0.12];   // foot index
  return j;
})();

// ── Deterministic RNG (mulberry32) ────────────────────────────
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = (r: () => number, lo: number, hi: number) => lo + (hi - lo) * r();

function rotateSubtree(joints: number[][], indices: number[], pivot: number, R: Mat): void {
  const p = joints[pivot];
  for (const i of indices) {
    const local: Vec = [joints[i][0] - p[0], joints[i][1] - p[1], joints[i][2] - p[2]];
    const rotated = matVec(R, local);
    joints[i] = [rotated[0] + p[0], rotated[1] + p[1], rotated[2] + p[2]];
  }
}

/** Generate one random, range-limited articulated 3D pose (world coords). */
export function samplePose(r: () => number): number[][] {
  const j = CANONICAL.map((p) => p.slice());

  // Articulate arms (shoulder + elbow) and legs (hip + knee).
  rotateSubtree(j, [13, 15, 17, 19, 21], 11, matMul(rotZ(rand(r, -0.4, 1.6)), rotY(rand(r, -1.2, 1.2))));
  rotateSubtree(j, [15, 17, 19, 21], 13, rotY(rand(r, -1.6, 0.2)));
  rotateSubtree(j, [14, 16, 18, 20, 22], 12, matMul(rotZ(rand(r, -1.6, 0.4)), rotY(rand(r, -1.2, 1.2))));
  rotateSubtree(j, [16, 18, 20, 22], 14, rotY(rand(r, -0.2, 1.6)));
  rotateSubtree(j, [25, 27, 29, 31], 23, rotX(rand(r, -0.5, 0.9)));
  rotateSubtree(j, [27, 29, 31], 25, rotX(rand(r, -1.4, 0.0)));
  rotateSubtree(j, [26, 28, 30, 32], 24, rotX(rand(r, -0.5, 0.9)));
  rotateSubtree(j, [28, 30, 32], 26, rotX(rand(r, -1.4, 0.0)));
  // Spine/head lean.
  rotateSubtree(j, [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22], 23,
    matMul(rotX(rand(r, -0.25, 0.25)), rotY(rand(r, -0.3, 0.3))));

  // Whole-body global orientation (mostly azimuth).
  const G = euler(rand(r, -Math.PI, Math.PI), rand(r, -0.2, 0.2), rand(r, -0.15, 0.15));
  for (let i = 0; i < j.length; i++) j[i] = matVec(G, j[i]);
  return j;
}

/** Camera-space depth (Z_c) of a world point for a camera. */
export function cameraDepth(cam: Camera, X: Vec): number {
  return cam.R[2][0] * X[0] + cam.R[2][1] * X[1] + cam.R[2][2] * X[2] + cam.t[2];
}

export interface ProjectedView {
  landmarks: Array<{ x: number; y: number; visibility: number }>;
  depths: number[];
}

/** Project a 3D pose through a camera into normalized landmarks + depths. */
export function projectPose(cam: Camera, pose: number[][]): ProjectedView {
  const P = projectionMatrix(cam);
  const landmarks = pose.map((X) => {
    const pr = projectPoint(P, X);
    return pr ? { x: pr.u, y: pr.v, visibility: 0.95 } : { x: 0, y: 0, visibility: 0 };
  });
  const depths = pose.map((X) => cameraDepth(cam, X));
  return { landmarks, depths };
}

// ── Lift-model training sample (torso-relative, scale-invariant) ──
const L_SH = 11, R_SH = 12, L_HIP = 23, R_HIP = 24;
const midX = (lm: { x: number }[], a: number, b: number) => (lm[a].x + lm[b].x) / 2;
const midY = (lm: { y: number }[], a: number, b: number) => (lm[a].y + lm[b].y) / 2;

export interface LiftSample {
  input: number[];  // 66: torso-normalized (x,y) for 33 joints
  target: number[]; // 33: distance-relative depth per joint (hip plane ≈ 0)
}

/** Minimum image torso size — below this the subject is too edge-on to lift. */
export const MIN_TORSO_IMG = 0.03;
const clampIn = (n: number) => (n < -6 ? -6 : n > 6 ? 6 : n);

/** Torso-normalize 2D landmarks into the 66-dim model input. Shared with inference. */
export function normalizeInput(lm: Array<{ x: number; y: number }>): number[] | null {
  const hipX = midX(lm, L_HIP, R_HIP), hipY = midY(lm, L_HIP, R_HIP);
  const shX = midX(lm, L_SH, R_SH), shY = midY(lm, L_SH, R_SH);
  const sImg = Math.max(MIN_TORSO_IMG, Math.hypot(shX - hipX, shY - hipY));
  const input: number[] = [];
  for (let j = 0; j < NUM_JOINTS; j++) {
    input.push(clampIn((lm[j].x - hipX) / sImg), clampIn((lm[j].y - hipY) / sImg));
  }
  return input;
}

/**
 * Build a scale/translation-invariant (input2D → relativeDepth) training pair.
 * Depth target is normalized by the hip distance (≈ camera distance), giving a
 * small, dimensionless, scale-free quantity that's stable to learn.
 */
export function toLiftSample(view: ProjectedView, _pose: number[][]): LiftSample | null {
  const lm = view.landmarks;
  const shX = midX(lm, L_SH, R_SH), shY = midY(lm, L_SH, R_SH);
  const hipX = midX(lm, L_HIP, R_HIP), hipY = midY(lm, L_HIP, R_HIP);
  if (Math.hypot(shX - hipX, shY - hipY) < MIN_TORSO_IMG) return null; // too foreshortened

  const input = normalizeInput(lm);
  if (!input) return null;

  const hipDepth = (view.depths[L_HIP] + view.depths[R_HIP]) / 2;
  if (Math.abs(hipDepth) < 1e-3) return null;

  const target: number[] = [];
  for (let j = 0; j < NUM_JOINTS; j++) target.push((view.depths[j] - hipDepth) / hipDepth);
  return { input, target };
}
