// ============================================================
// SwingVantage — Motion Lab: 3D Rotational Kinematics (pure)
// ------------------------------------------------------------
// Small, dependency-free helpers that turn the depth (z) axis of the
// pose track into TRUE axial rotation — the turn of the body about the
// vertical (spine) axis, measured in the horizontal/transverse plane.
//
// Why this exists: a face-on camera sees almost none of a real shoulder
// turn in the image plane (atan2 of dy/dx barely moves), because the
// turn happens in DEPTH. The Motion Lab already reconstructs that depth
// (MediaPipe relative-z for single view; metric-z for multi-view), so
// these helpers let the metric engine finally read rotation from it,
// with an honest fallback to the 2D image estimate when depth is flat.
//
// Everything here is pure and unit-tested in __tests__/kinematics3d.test.ts.
// ============================================================

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

const RAD2DEG = 180 / Math.PI;

/**
 * Horizontal-plane heading (deg) of a body segment — its rotation about the
 * vertical (Y) axis. Uses the segment's width (x) and depth (z); height (y) is
 * intentionally ignored so shrug/side-bend doesn't masquerade as turn.
 */
export function headingDeg(dx: number, dz: number): number {
  return Math.atan2(dz, dx) * RAD2DEG;
}

/**
 * Unwrap a degree series so consecutive frame-to-frame deltas never exceed
 * ±180° — turning the raw atan2 sawtooth into a continuous rotation angle.
 */
export function unwrapDeg(series: number[]): number[] {
  if (series.length === 0) return [];
  const out: number[] = [series[0]];
  for (let i = 1; i < series.length; i++) {
    let d = series[i] - series[i - 1];
    while (d > 180) d -= 360;
    while (d < -180) d += 360;
    out.push(out[i - 1] + d);
  }
  return out;
}

/** Span (max − min) of a numeric series; 0 for empty/constant input. */
export function span(series: number[]): number {
  if (series.length === 0) return 0;
  let lo = Infinity;
  let hi = -Infinity;
  for (const v of series) {
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  return hi - lo;
}

/**
 * How much to trust depth-derived rotation, 0..1. A real turn swings a
 * segment's depth by a sizeable fraction of its image width; flat/noisy depth
 * swings it barely at all. Below a small noise floor we don't trust depth and
 * the caller falls back to the 2D image estimate.
 */
export function depthReliability(zSpread: number, width: number): number {
  const w = Math.abs(width);
  if (w < 1e-4) return 0;
  const noiseFloor = 0.04 * w; // depth wobble we treat as noise, not turn
  const usable = (zSpread - noiseFloor) / (0.5 * w);
  return Math.max(0, Math.min(1, usable));
}

/**
 * Blend a depth-based (3D) and an image-based (2D) angle estimate by how
 * reliable the depth signal is. reliability 1 → trust 3D; 0 → fall back to 2D.
 */
export function blendByReliability(value3d: number, value2d: number, reliability: number): number {
  const r = Math.max(0, Math.min(1, reliability));
  return value3d * r + value2d * (1 - r);
}

/**
 * Detect the "top of backswing": the dominant reversal of the lead hand before
 * the strike. We look in [start, strike) for the frame where the lead wrist is
 * highest (smallest image-y) — the natural apex of the coil — and require it to
 * sit a little inside the window so a flat/edge case degrades to a sensible
 * default rather than frame 0. Returns -1 when no clear top is found.
 */
export function detectTopFrame(leadWristY: number[], strikeFrame: number): number {
  const end = Math.min(strikeFrame, leadWristY.length - 1);
  if (end < 2) return -1;
  let topIdx = -1;
  let minY = Infinity;
  for (let i = 1; i < end; i++) {
    if (leadWristY[i] < minY) {
      minY = leadWristY[i];
      topIdx = i;
    }
  }
  // Reject a top that's indistinguishable from the surrounding frames (flat
  // motion) — there's no real reversal to anchor to.
  const ySpan = span(leadWristY.slice(0, end + 1));
  if (topIdx <= 0 || ySpan < 1e-3) return -1;
  return topIdx;
}

/** First-difference derivative of an angle series → angular velocity (deg/s). */
export function angularVelocityDeg(headingDegSeries: number[], tMs: number[]): number[] {
  const n = headingDegSeries.length;
  const out = new Array(n).fill(0);
  for (let i = 1; i < n; i++) {
    const dt = Math.max(1, tMs[i] - tMs[i - 1]) / 1000;
    out[i] = Math.abs(headingDegSeries[i] - headingDegSeries[i - 1]) / dt;
  }
  if (n > 1) out[0] = out[1];
  return out;
}

/** Index of the maximum value in a series (0 for empty). */
export function argmax(v: number[]): number {
  let idx = 0;
  let best = -Infinity;
  for (let i = 0; i < v.length; i++) {
    if (v[i] > best) {
      best = v[i];
      idx = i;
    }
  }
  return idx;
}
