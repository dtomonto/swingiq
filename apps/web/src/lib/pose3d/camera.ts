// ============================================================
// SwingVantage — pose3d: Camera Model
// ------------------------------------------------------------
// A pinhole camera in NORMALIZED image coordinates (u,v ∈ [0,1]), so
// it composes directly with MediaPipe's normalized landmarks. Provides
// projection-matrix assembly, point projection, and practical
// calibration presets for common two-phone arrangements (the
// extrinsics are approximate and then refined by reprojection error).
// ============================================================

import { type Mat, type Vec, matMul, cross3, normalize3 } from './linalg';

export interface CameraIntrinsics {
  fx: number;
  fy: number;
  cx: number;
  cy: number;
}

export interface Camera {
  id: string;
  K: CameraIntrinsics;
  /** World→camera rotation (3×3). */
  R: Mat;
  /** World→camera translation (3-vector). */
  t: Vec;
}

/** Default normalized intrinsics for a typical phone (≈ 60° HFOV). */
export function defaultIntrinsics(): CameraIntrinsics {
  // In normalized coords a focal length of ~0.9 ≈ a moderate phone FOV.
  return { fx: 0.9, fy: 0.9, cx: 0.5, cy: 0.5 };
}

function K3x3(k: CameraIntrinsics): Mat {
  return [
    [k.fx, 0, k.cx],
    [0, k.fy, k.cy],
    [0, 0, 1],
  ];
}

/** Assemble the 3×4 projection matrix P = K · [R | t]. */
export function projectionMatrix(cam: Camera): Mat {
  const Rt: Mat = cam.R.map((row, i) => [...row, cam.t[i]]);
  return matMul(K3x3(cam.K), Rt);
}

/** Project a world point [X,Y,Z] to normalized image (u,v). null if behind cam. */
export function projectPoint(P: Mat, X: Vec): { u: number; v: number; depth: number } | null {
  const Xh = [X[0], X[1], X[2], 1];
  const x = P[0][0] * Xh[0] + P[0][1] * Xh[1] + P[0][2] * Xh[2] + P[0][3] * Xh[3];
  const y = P[1][0] * Xh[0] + P[1][1] * Xh[1] + P[1][2] * Xh[2] + P[1][3] * Xh[3];
  const w = P[2][0] * Xh[0] + P[2][1] * Xh[1] + P[2][2] * Xh[2] + P[2][3] * Xh[3];
  if (Math.abs(w) < 1e-9) return null;
  return { u: x / w, v: y / w, depth: w };
}

/**
 * Build a camera positioned on a circle around the subject (at world origin),
 * looking at it. `azimuthDeg` = angle around the vertical axis (0 = front,
 * 90 = down-the-line), `elevationDeg` = camera height angle, `distance` in
 * the same metric units as the subject (≈ metres).
 */
export function cameraOnArc(
  id: string,
  azimuthDeg: number,
  elevationDeg: number,
  distance: number,
  K: CameraIntrinsics = defaultIntrinsics(),
): Camera {
  const az = (azimuthDeg * Math.PI) / 180;
  const el = (elevationDeg * Math.PI) / 180;
  // Camera centre on a sphere around the subject (origin).
  const C: Vec = [
    distance * Math.sin(az) * Math.cos(el),
    distance * Math.sin(el),
    distance * Math.cos(az) * Math.cos(el),
  ];
  // Proper look-at: camera forward points from C toward the origin, so the
  // camera-space depth (Z_c) of the subject ≈ `distance` (well-scaled).
  const forward = normalize3([-C[0], -C[1], -C[2]]);
  const right = normalize3(cross3([0, 1, 0], forward));
  const up = cross3(forward, right);
  // World→camera rotation: rows are the camera axes expressed in world coords.
  const R: Mat = [right, up, forward];
  const t: Vec = [
    -(R[0][0] * C[0] + R[0][1] * C[1] + R[0][2] * C[2]),
    -(R[1][0] * C[0] + R[1][1] * C[1] + R[1][2] * C[2]),
    -(R[2][0] * C[0] + R[2][1] * C[1] + R[2][2] * C[2]),
  ];
  return { id, K, R, t };
}

export type RigPreset = 'face_dtl_90' | 'face_dtl_45' | 'two_front_stereo';

/**
 * Practical two-camera calibration presets (approximate extrinsics that the
 * triangulator then refines). These cover the most common at-home rigs.
 */
export function rigPreset(preset: RigPreset, distance = 3): Camera[] {
  switch (preset) {
    case 'face_dtl_90':
      // One face-on, one down-the-line (90° apart), both slightly above hips.
      return [cameraOnArc('face', 0, 8, distance), cameraOnArc('dtl', 90, 8, distance)];
    case 'face_dtl_45':
      return [cameraOnArc('face', 0, 8, distance), cameraOnArc('dtl', 45, 8, distance)];
    case 'two_front_stereo':
      // A short-baseline stereo pair, both roughly face-on.
      return [cameraOnArc('left', -12, 6, distance), cameraOnArc('right', 12, 6, distance)];
  }
}
