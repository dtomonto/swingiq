// ============================================================
// SwingVantage — pose3d: Multi-View Triangulation
// ------------------------------------------------------------
// Recovers TRUE metric 3D joint positions from two or more calibrated
// camera views via the Direct Linear Transform (DLT): each view that
// sees a joint contributes two linear constraints; the joint's 3D
// position is the null-space of the stacked system, solved as the
// smallest eigenvector of AᵀA. Observations are weighted by landmark
// visibility, and we report per-joint reprojection error so confidence
// is MEASURED, not asserted.
// ============================================================

import { type Mat, type Vec, smallestEigenvector } from './linalg';
import { type Camera, projectionMatrix, projectPoint } from './camera';

export interface ViewObservation {
  /** 3×4 projection matrix for this camera. */
  P: Mat;
  /** Normalized landmark coords [{x,y,visibility}] (length 33). */
  landmarks: Array<{ x: number; y: number; visibility: number }>;
}

export interface TriangulatedJoint {
  point: Vec; // [X,Y,Z] in world (metric) units
  reprojError: number; // mean normalized reprojection error across views
  views: number; // how many views contributed
}

const MIN_VIS = 0.3;

/** Triangulate one joint from its observations across views. Null if < 2 views. */
export function triangulateJoint(
  obs: Array<{ P: Mat; u: number; v: number; weight: number }>,
): Vec | null {
  const usable = obs.filter((o) => o.weight > 0);
  if (usable.length < 2) return null;

  // Build AᵀA (4×4) by accumulating each view's two weighted rows.
  const ATA: Mat = Array.from({ length: 4 }, () => new Array(4).fill(0));
  const addRow = (row: Vec, w: number) => {
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) ATA[i][j] += w * w * row[i] * row[j];
  };
  for (const o of usable) {
    const [p0, p1, p2] = o.P;
    const rowU = [o.u * p2[0] - p0[0], o.u * p2[1] - p0[1], o.u * p2[2] - p0[2], o.u * p2[3] - p0[3]];
    const rowV = [o.v * p2[0] - p1[0], o.v * p2[1] - p1[1], o.v * p2[2] - p1[2], o.v * p2[3] - p1[3]];
    addRow(rowU, o.weight);
    addRow(rowV, o.weight);
  }

  const X = smallestEigenvector(ATA);
  if (Math.abs(X[3]) < 1e-9) return null;
  return [X[0] / X[3], X[1] / X[3], X[2] / X[3]];
}

/** Mean normalized reprojection error of a 3D point across the given views. */
export function reprojectionError(point: Vec, views: Array<{ P: Mat; u: number; v: number }>): number {
  let sum = 0;
  let n = 0;
  for (const view of views) {
    const proj = projectPoint(view.P, point);
    if (!proj) continue;
    sum += Math.hypot(proj.u - view.u, proj.v - view.v);
    n++;
  }
  return n > 0 ? sum / n : Infinity;
}

/**
 * Triangulate a full 33-joint skeleton from multiple calibrated views.
 * Joints seen by < 2 views are returned as null (honest gaps, not invented).
 */
export function triangulateSkeleton(views: ViewObservation[]): {
  points: Array<Vec | null>;
  perJointError: number[];
  meanReprojError: number;
} {
  const numJoints = Math.max(0, ...views.map((v) => v.landmarks.length));
  const points: Array<Vec | null> = [];
  const perJointError: number[] = [];
  let errSum = 0;
  let errCount = 0;

  for (let j = 0; j < numJoints; j++) {
    const obs = views
      .map((view) => {
        const lm = view.landmarks[j];
        if (!lm || lm.visibility < MIN_VIS) return null;
        return { P: view.P, u: lm.x, v: lm.y, weight: Math.sqrt(lm.visibility) };
      })
      .filter((o): o is { P: Mat; u: number; v: number; weight: number } => o !== null);

    const point = triangulateJoint(obs);
    points.push(point);
    if (point) {
      const err = reprojectionError(point, obs);
      perJointError.push(err);
      errSum += err;
      errCount++;
    } else {
      perJointError.push(Infinity);
    }
  }

  return {
    points,
    perJointError,
    meanReprojError: errCount > 0 ? errSum / errCount : Infinity,
  };
}

/** Convenience: build view observations from cameras + their per-view landmarks. */
export function viewsFromCameras(
  cameras: Camera[],
  perViewLandmarks: ViewObservation['landmarks'][],
): ViewObservation[] {
  return cameras.map((cam, i) => ({
    P: projectionMatrix(cam),
    landmarks: perViewLandmarks[i] ?? [],
  }));
}
