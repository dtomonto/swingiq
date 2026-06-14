// ============================================================
// SwingVantage — Camera-Motion Estimator (L4)
// ------------------------------------------------------------
// Estimates GLOBAL frame-to-frame motion (camera pan / tilt / shake) by
// block-matching the tiny 32×32 grayscale signatures the frame extractor
// ALREADY computes for motion detection — so it costs nothing extra and
// needs no new dependency.
//
// Why it matters: the quality profiler previously proxied "camera shake"
// from exposure variance, which is weak. A real global-motion estimate
// gives an honest stability signal AND lets the swing-window detector tell
// the camera moving apart from the ATHLETE moving.
//
// Pure + deterministic (operates on number buffers) so it is unit-tested.
// ============================================================

export interface FrameMotion {
  /** Horizontal global shift in 32-grid units (positive = content moved right). */
  dx: number;
  /** Vertical global shift in 32-grid units. */
  dy: number;
  /** Euclidean magnitude of the shift. */
  magnitude: number;
}

export interface CameraMotionProfile {
  /** Per-frame global motion; index 0 is always zero (no previous frame). */
  perFrame: FrameMotion[];
  /** Mean shift magnitude across the clip (32-grid units). */
  meanMagnitude: number;
  /** 0–1 — how erratic/large the camera motion is (1 = very shaky). */
  shakeScore: number;
  /** 0–1 — steadiness (1 = rock steady). `1 - shakeScore`. */
  stabilityScore: number;
  /** Coarse classification of the dominant camera movement. */
  dominantAxis: 'none' | 'horizontal' | 'vertical' | 'diagonal';
}

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

/**
 * Estimate the integer (dx, dy) global shift that best aligns `b` onto `a` by
 * minimising the mean absolute difference over the overlapping region, searching
 * shifts in [-maxShift, maxShift]. Sub-pixel accuracy isn't needed — we only want
 * a robust steadiness/pan signal. Returns {0,0,0} for degenerate input.
 */
export function estimateShift(
  a: ArrayLike<number>,
  b: ArrayLike<number>,
  width: number,
  height: number,
  maxShift = 3,
): FrameMotion {
  if (a.length === 0 || b.length === 0 || width <= 0 || height <= 0) {
    return { dx: 0, dy: 0, magnitude: 0 };
  }
  let bestDx = 0;
  let bestDy = 0;
  let bestCost = Infinity;

  for (let dy = -maxShift; dy <= maxShift; dy++) {
    for (let dx = -maxShift; dx <= maxShift; dx++) {
      let sad = 0;
      let count = 0;
      const x0 = Math.max(0, -dx);
      const x1 = Math.min(width, width - dx);
      const y0 = Math.max(0, -dy);
      const y1 = Math.min(height, height - dy);
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const ai = y * width + x;
          const bi = (y + dy) * width + (x + dx);
          sad += Math.abs(a[ai] - b[bi]);
          count++;
        }
      }
      if (count === 0) continue;
      const mean = sad / count;
      // Prefer the smaller shift on ties so noise doesn't read as motion.
      const tieBreak = (Math.abs(dx) + Math.abs(dy)) * 1e-6;
      const cost = mean + tieBreak;
      if (cost < bestCost) {
        bestCost = cost;
        bestDx = dx;
        bestDy = dy;
      }
    }
  }
  return { dx: bestDx, dy: bestDy, magnitude: Math.hypot(bestDx, bestDy) };
}

const mean = (xs: number[]): number => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const std = (xs: number[]): number => {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
};

/**
 * Build the camera-motion profile across a time-ordered list of grayscale
 * signatures. Steadiness blends the mean shift (pan/drift) with its jitter
 * (erratic shake) so both a slow follow and a handheld wobble read as motion.
 */
export function cameraMotionProfile(
  signatures: ArrayLike<number>[],
  width: number,
  height: number,
  maxShift = 3,
): CameraMotionProfile {
  const perFrame: FrameMotion[] = [{ dx: 0, dy: 0, magnitude: 0 }];
  for (let i = 1; i < signatures.length; i++) {
    perFrame.push(estimateShift(signatures[i - 1], signatures[i], width, height, maxShift));
  }

  const mags = perFrame.slice(1).map((f) => f.magnitude);
  const meanMagnitude = mean(mags);
  // Jitter = how much the per-axis shift varies (a steady pan has low jitter).
  const jitter = std(perFrame.slice(1).map((f) => f.dx)) + std(perFrame.slice(1).map((f) => f.dy));
  // ~1.5 grid-units of combined motion/jitter drives stability to zero.
  const shakeScore = clamp((meanMagnitude + jitter) / 3, 0, 1);
  const stabilityScore = clamp(1 - shakeScore, 0, 1);

  const sumAbsDx = perFrame.reduce((s, f) => s + Math.abs(f.dx), 0);
  const sumAbsDy = perFrame.reduce((s, f) => s + Math.abs(f.dy), 0);
  let dominantAxis: CameraMotionProfile['dominantAxis'] = 'none';
  if (meanMagnitude >= 0.5) {
    if (sumAbsDx > sumAbsDy * 1.5) dominantAxis = 'horizontal';
    else if (sumAbsDy > sumAbsDx * 1.5) dominantAxis = 'vertical';
    else dominantAxis = 'diagonal';
  }

  return { perFrame, meanMagnitude, shakeScore, stabilityScore, dominantAxis };
}
