// ============================================================
// SwingIQ — pose3d: Essential Matrix (normalized 8-point + RANSAC)
// ------------------------------------------------------------
// Estimates the essential matrix between two calibrated views from 2D
// point correspondences — the heart of per-capture SELF-CALIBRATION
// (no rig preset needed). Uses Hartley normalization for conditioning,
// enforces the essential-matrix constraints via SVD, and wraps it in
// RANSAC for robustness to mistracked landmarks.
// ============================================================

import { type Mat, type Vec, matMul, transpose, smallestEigenvector, svd3, diag3 } from './linalg';

export type P2 = [number, number];

/** Hartley normalization: centre at origin, mean distance √2. Returns T. */
function normalizePoints(pts: P2[]): { norm: P2[]; T: Mat } {
  const n = pts.length;
  let cx = 0, cy = 0;
  for (const [x, y] of pts) { cx += x; cy += y; }
  cx /= n; cy /= n;
  let meanDist = 0;
  for (const [x, y] of pts) meanDist += Math.hypot(x - cx, y - cy);
  meanDist /= n;
  const s = meanDist > 1e-9 ? Math.SQRT2 / meanDist : 1;
  const T: Mat = [[s, 0, -s * cx], [0, s, -s * cy], [0, 0, 1]];
  const norm: P2[] = pts.map(([x, y]) => [s * (x - cx), s * (y - cy)]);
  return { norm, T };
}

/** Estimate the essential matrix from ≥8 calibrated correspondences. */
export function estimateEssential(pts1: P2[], pts2: P2[]): Mat | null {
  if (pts1.length < 8 || pts1.length !== pts2.length) return null;
  const { norm: n1, T: T1 } = normalizePoints(pts1);
  const { norm: n2, T: T2 } = normalizePoints(pts2);

  // Build the constraint matrix A and solve A f = 0.
  const ATA: Mat = Array.from({ length: 9 }, () => new Array(9).fill(0));
  for (let k = 0; k < n1.length; k++) {
    const [x1, y1] = n1[k];
    const [x2, y2] = n2[k];
    const row = [x2 * x1, x2 * y1, x2, y2 * x1, y2 * y1, y2, x1, y1, 1];
    for (let i = 0; i < 9; i++) for (let j = 0; j < 9; j++) ATA[i][j] += row[i] * row[j];
  }
  const f = smallestEigenvector(ATA);
  let E: Mat = [[f[0], f[1], f[2]], [f[3], f[4], f[5]], [f[6], f[7], f[8]]];

  // Enforce essential-matrix structure: two equal singular values, third 0.
  const { U, S, V } = svd3(E);
  const s = (S[0] + S[1]) / 2;
  E = matMul(matMul(U, diag3(s, s, 0)), transpose(V));

  // Denormalize: E = T2ᵀ · Ê · T1.
  return matMul(matMul(transpose(T2), E), T1);
}

/** Sampson distance of a correspondence to E (lower = better fit). */
export function sampsonDistance(E: Mat, p1: P2, p2: P2): number {
  const a: Vec = [p1[0], p1[1], 1];
  const b: Vec = [p2[0], p2[1], 1];
  const Ea = [E[0][0] * a[0] + E[0][1] * a[1] + E[0][2], E[1][0] * a[0] + E[1][1] * a[1] + E[1][2], E[2][0] * a[0] + E[2][1] * a[1] + E[2][2]];
  const Etb = [E[0][0] * b[0] + E[1][0] * b[1] + E[2][0], E[0][1] * b[0] + E[1][1] * b[1] + E[2][1], E[0][2] * b[0] + E[1][2] * b[1] + E[2][2]];
  const num = (b[0] * Ea[0] + b[1] * Ea[1] + Ea[2]) ** 2;
  const den = Ea[0] * Ea[0] + Ea[1] * Ea[1] + Etb[0] * Etb[0] + Etb[1] * Etb[1];
  return den > 1e-12 ? num / den : Infinity;
}

export interface RansacResult {
  E: Mat;
  inliers: boolean[];
  inlierCount: number;
}

/** RANSAC essential-matrix estimation. `rand` is a [0,1) generator. */
export function ransacEssential(
  pts1: P2[],
  pts2: P2[],
  rand: () => number,
  opts: { iterations?: number; threshold?: number } = {},
): RansacResult | null {
  const n = pts1.length;
  if (n < 8) return null;
  const iterations = opts.iterations ?? 200;
  const threshold = opts.threshold ?? 1e-3;

  let bestInliers: boolean[] = [];
  let bestCount = 0;

  for (let it = 0; it < iterations; it++) {
    // sample 8 distinct indices
    const idx = new Set<number>();
    while (idx.size < 8) idx.add(Math.floor(rand() * n));
    const s1 = [...idx].map((i) => pts1[i]);
    const s2 = [...idx].map((i) => pts2[i]);
    const E = estimateEssential(s1, s2);
    if (!E) continue;

    const inliers = new Array<boolean>(n);
    let count = 0;
    for (let i = 0; i < n; i++) {
      const ok = sampsonDistance(E, pts1[i], pts2[i]) < threshold;
      inliers[i] = ok;
      if (ok) count++;
    }
    if (count > bestCount) { bestCount = count; bestInliers = inliers; }
  }

  if (bestCount < 8) return null;
  // Refit on all inliers for a stable estimate.
  const in1 = pts1.filter((_, i) => bestInliers[i]);
  const in2 = pts2.filter((_, i) => bestInliers[i]);
  const E = estimateEssential(in1, in2);
  if (!E) return null;
  return { E, inliers: bestInliers, inlierCount: bestCount };
}
