// ============================================================
// SwingVantage — pose3d: High-level Reconstruction Engine
// ------------------------------------------------------------
// Two honest paths to 3D:
//   • SINGLE VIEW  → the trained lift model refines per-joint depth
//                    (basis 'ai_inferred' — a learned prior).
//   • MULTI VIEW   → DLT triangulation from 2+ calibrated cameras
//                    (basis 'measured' — true metric 3D), with
//                    reprojection error as a real confidence.
// The pipeline picks whichever inputs are available.
// ============================================================

import { type Vec, type Mat } from './linalg';
import { type Camera, projectionMatrix } from './camera';
import { triangulateSkeleton } from './triangulate';
import { getActiveLiftProvider } from './providers';

export interface Lm3 { x: number; y: number; z: number; v: number }

// ── Single-view: learned depth refinement (via the provider seam) ──

/** Whether any single-view lift provider is available. */
export function liftAvailable(): boolean {
  return getActiveLiftProvider() !== null;
}

/**
 * Refine one frame's landmark depths with the active lift provider. Returns the
 * landmarks with z replaced by the learned distance-relative depth (hip ≈ 0).
 * Falls back to the original z when no provider can run.
 */
export function enrichFrameWithLift(landmarks: Lm3[]): { landmarks: Lm3[]; applied: boolean } {
  const provider = getActiveLiftProvider();
  const depths = provider ? provider.liftDepths(landmarks) : null;
  if (!depths) return { landmarks, applied: false };
  return {
    landmarks: landmarks.map((lm, i) => ({ ...lm, z: depths[i] ?? lm.z })),
    applied: true,
  };
}

// ── Multi-view: true triangulated 3D ─────────────────────────

export interface MultiViewReconstruction {
  /** Per-joint world 3D ([X,Y,Z]) or null where < 2 views saw it. */
  points: Array<Vec | null>;
  /** Mean normalized reprojection error (lower = better). */
  reprojError: number;
  /** 0–1 confidence derived from reprojection error. */
  confidence: number;
}

/** Reprojection error → confidence (normalized image units). */
export function reprojConfidence(reproj: number): number {
  if (!Number.isFinite(reproj)) return 0;
  return Math.max(0.2, Math.min(0.99, 1 - reproj / 0.05));
}

/**
 * Triangulate one synchronized multi-view frame into metric 3D.
 * @param perViewLandmarks landmarks for each camera (same joint order)
 * @param cameras calibrated cameras matching `perViewLandmarks`
 */
export function reconstructMultiViewFrame(
  perViewLandmarks: Array<Array<{ x: number; y: number; visibility: number }>>,
  cameras: Camera[],
): MultiViewReconstruction {
  const Ps: Mat[] = cameras.map(projectionMatrix);
  const views = perViewLandmarks.map((landmarks, i) => ({ P: Ps[i], landmarks }));
  const { points, meanReprojError } = triangulateSkeleton(views);
  return { points, reprojError: meanReprojError, confidence: reprojConfidence(meanReprojError) };
}

/**
 * Convert triangulated world points into viewer-friendly normalized landmarks
 * (centred on the hip midpoint, scaled by torso length) so the existing 3D
 * viewer can render measured multi-view 3D the same way it renders estimates.
 */
export function worldPointsToViewerLandmarks(points: Array<Vec | null>): Lm3[] {
  const L_HIP = 23, R_HIP = 24, L_SH = 11, R_SH = 12;
  const have = (i: number) => points[i] != null;
  const mid = (a: number, b: number): Vec =>
    have(a) && have(b)
      ? [(points[a]![0] + points[b]![0]) / 2, (points[a]![1] + points[b]![1]) / 2, (points[a]![2] + points[b]![2]) / 2]
      : [0, 0, 0];
  const hip = mid(L_HIP, R_HIP);
  const sh = mid(L_SH, R_SH);
  const scale = Math.max(0.2, Math.hypot(sh[0] - hip[0], sh[1] - hip[1], sh[2] - hip[2]));

  return points.map((p) => {
    if (!p) return { x: 0.5, y: 0.5, z: 0, v: 0 };
    return {
      x: 0.5 + (p[0] - hip[0]) / (scale * 4),
      y: 0.5 - (p[1] - hip[1]) / (scale * 4),
      z: (p[2] - hip[2]) / (scale * 2),
      v: 0.95,
    };
  });
}
