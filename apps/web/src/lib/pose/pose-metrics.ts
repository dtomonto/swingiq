// ============================================================
// SwingVantage — Pose-derived Swing Metrics (pure, unit-tested)
//
// Turns per-frame MediaPipe pose landmarks into a few robust, camera-
// agnostic descriptors that give the AI OBJECTIVE grounding (real
// geometry) alongside what it sees in the frames. These are proxies,
// not lab measurements, and are labeled as such everywhere.
// ============================================================

import type { PoseFrame } from './pose-detection';

// MediaPipe pose landmark indices we rely on.
const NOSE = 0;
const L_SHOULDER = 11;
const R_SHOULDER = 12;
const L_HIP = 23;
const R_HIP = 24;
const MIN_INDEX = R_HIP; // a usable frame must include at least up to here

export interface PoseMetrics {
  framesWithPose: number;
  /** Range of the shoulder-line angle across frames (rotation proxy), degrees. */
  shoulderTurnRangeDeg: number;
  /** Range of spine tilt (shoulder-mid → hip-mid) across frames (posture-change proxy), degrees. */
  spineAngleRangeDeg: number;
  /** Horizontal range of the head across frames, % of frame width (head stability). */
  headSwayPct: number;
  /** Horizontal range of the hip midpoint across frames, % of frame width (sway/slide). */
  hipSwayPct: number;
}

interface Pt {
  x: number;
  y: number;
}

function angleDeg(dx: number, dy: number): number {
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

function mid(a: Pt, b: Pt): Pt {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function range(values: number[]): number {
  return Math.max(...values) - Math.min(...values);
}

/**
 * Compute swing metrics from pose frames. Returns null when fewer than two
 * frames contain a usable pose (not enough to describe movement).
 */
export function computePoseMetrics(frames: PoseFrame[]): PoseMetrics | null {
  const usable = frames.filter((f) => f.landmarks.length > MIN_INDEX);
  if (usable.length < 2) return null;

  const shoulderAngles: number[] = [];
  const spineAngles: number[] = [];
  const noseX: number[] = [];
  const hipMidX: number[] = [];

  for (const f of usable) {
    const lm = f.landmarks;
    const ls = lm[L_SHOULDER];
    const rs = lm[R_SHOULDER];
    const lh = lm[L_HIP];
    const rh = lm[R_HIP];
    const nose = lm[NOSE];

    shoulderAngles.push(angleDeg(rs.x - ls.x, rs.y - ls.y));
    const sMid = mid(ls, rs);
    const hMid = mid(lh, rh);
    spineAngles.push(angleDeg(hMid.x - sMid.x, hMid.y - sMid.y));
    noseX.push(nose.x);
    hipMidX.push(hMid.x);
  }

  return {
    framesWithPose: usable.length,
    shoulderTurnRangeDeg: Math.round(range(shoulderAngles)),
    spineAngleRangeDeg: Math.round(range(spineAngles)),
    headSwayPct: Math.round(range(noseX) * 100),
    hipSwayPct: Math.round(range(hipMidX) * 100),
  };
}

/** A compact, AI-readable summary of the measured signals. */
export function summarizePoseMetrics(m: PoseMetrics): string {
  return [
    `On-device pose detection succeeded on ${m.framesWithPose} frames (proxies, not lab-grade)`,
    `shoulder-line angle varied ~${m.shoulderTurnRangeDeg}° across the motion (rotation proxy)`,
    `spine tilt varied ~${m.spineAngleRangeDeg}° (posture-change / early-extension proxy)`,
    `head moved ~${m.headSwayPct}% of frame width horizontally (head stability)`,
    `hips moved ~${m.hipSwayPct}% horizontally (sway / slide)`,
  ].join('; ');
}
