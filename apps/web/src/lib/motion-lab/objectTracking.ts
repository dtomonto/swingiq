// ============================================================
// SwingVantage — Motion Lab: Implement / Object Path Estimation
// ------------------------------------------------------------
// Estimates the path of the swung implement (golf club, bat, tennis
// racket) WITHOUT a pixel-level object detector. We don't see the
// club/bat/racket — we infer its head path by projecting outward from
// the hands along the lead/grip forearm, scaled by a sport-specific
// implement length. The contact zone is the head position at the
// strike frame; an "estimated swing path" is the head's travel
// direction through contact.
//
// HONESTY FIRST: this is an INFERENCE from body pose, weaker than the
// pose estimate it's built on — so its basis is 'ai_inferred' and its
// confidence is capped low. It is never presented as true object
// tracking or ball-flight measurement. A provider seam (`ObjectTracking-
// Provider`) lets a real ML detector (or user-assisted tagging) drop in
// later behind the same contract.
//
// Pure + dependency-light; unit-tested in __tests__/objectTracking.test.ts.
// ============================================================

import type { MotionPoseTrack, CaptureContext, MotionPhaseSegment, MotionBasis } from './types';
import type { MotionSeries } from './biomechanics';

// ── MediaPipe Pose 33 indices used here ───────────────────────
const L_ELBOW = 13;
const R_ELBOW = 14;
const L_WRIST = 15;
const R_WRIST = 16;

const RAD2DEG = 180 / Math.PI;

/** The kind of swung implement, derived from the sport + motion. */
export type ImplementType = 'club' | 'bat' | 'racket' | 'none';

/** One estimated implement-head position over the motion. */
export interface ImplementPathPoint {
  frame: number;
  tMs: number;
  /** Estimated grip (hands) position — normalized image coords (0–1). */
  grip: { x: number; y: number };
  /** Estimated implement-head position — normalized image coords (0–1). */
  head: { x: number; y: number };
  /** 0–1 confidence for THIS point (driven by joint visibility). */
  confidence: number;
}

/** The full traced head path with its honesty metadata. */
export interface ImplementPathTrace {
  points: ImplementPathPoint[];
  basis: MotionBasis;
  /** 0–1 overall confidence in the trace. */
  confidence: number;
  /** Human-readable method tag for the debug panel. */
  method: string;
}

/** Where the implement is estimated to meet the ball. */
export interface ContactZoneEstimate {
  frame: number;
  tMs: number;
  x: number;
  y: number;
  confidence: number;
  basis: MotionBasis;
}

/** A direction read on the head's travel THROUGH contact. */
export interface SwingPathEstimate {
  /**
   * Vertical approach at contact (deg). Positive = swinging UP (ascending,
   * e.g. driver), negative = swinging DOWN (descending, e.g. iron/ground ball).
   * null when there aren't enough tracked points to read it.
   */
  verticalApproachDeg: number | null;
  /** Plain-language label: 'ascending' | 'level' | 'descending' | 'unknown'. */
  approach: 'ascending' | 'level' | 'descending' | 'unknown';
  confidence: number;
  basis: MotionBasis;
}

/** The complete, honesty-labeled object-tracking result. */
export interface ObjectTrackingResult {
  implement: ImplementType;
  /** False when there is no swung implement to track (e.g. a throw). */
  available: boolean;
  trace: ImplementPathTrace;
  contactZone: ContactZoneEstimate | null;
  swingPath: SwingPathEstimate;
  /** 0–1 overall confidence (mirrors the trace). */
  confidence: number;
  basis: MotionBasis;
  /** Always present unless basis === 'measured' — keeps the read honest. */
  disclaimer: string;
  /** Capture/limitation flags surfaced to the user and the debug panel. */
  warnings: string[];
}

// ── Provider seam ─────────────────────────────────────────────

/** Optional user-assisted corrections (the "manual tagging" fallback). */
export interface ImplementManualHints {
  /** Override the implement type (e.g. user picked a different club). */
  implement?: ImplementType;
  /** Manually-marked head positions by frame index (normalized 0–1). */
  headByFrame?: Record<number, { x: number; y: number }>;
  /** Manually-marked contact frame. */
  contactFrame?: number;
}

export interface ObjectTrackingInput {
  track: MotionPoseTrack;
  capture: CaptureContext;
  /** Per-frame series (gives us the strike frame); may be null for short clips. */
  series: MotionSeries | null;
  phases: MotionPhaseSegment[];
  manualHints?: ImplementManualHints;
}

/** The single interface a real object detector (or manual tagger) implements. */
export interface ObjectTrackingProvider {
  id: string;
  label: string;
  isAvailable: (input: ObjectTrackingInput) => boolean;
  track: (input: ObjectTrackingInput) => ObjectTrackingResult;
}

// ── Implement mapping + geometry constants ────────────────────

const DISCLAIMER =
  'Estimated implement path — inferred from your hand and arm motion, not from detecting the club/bat/racket itself. Treat the path and contact point as directional. A future on-device object detector (or manual correction) will sharpen this.';

/** Multiplier on measured forearm length to reach the implement HEAD. */
const LENGTH_FACTOR: Record<ImplementType, number> = {
  club: 4.4, // grip → driver/iron head
  bat: 3.4, // grip → barrel end
  racket: 2.7, // grip → racket tip
  none: 0,
};

/** Hard cap on heuristic (single-view, arm-extrapolated) confidence. */
const HEURISTIC_CAP = 0.5;

/** Resolve the swung implement from the capture context. */
export function implementForSport(capture: CaptureContext): ImplementType {
  const { sport, motionType } = capture;
  if (sport === 'golf') return 'club';
  if (sport === 'tennis') return 'racket';
  // baseball / softball: only the hitting swing has a swung bat.
  if (motionType === 'hitting') return 'bat';
  return 'none'; // throwing / pitching / fielding — the hand carries the ball
}

// ── Small geometry helpers (pure) ─────────────────────────────

interface P2 {
  x: number;
  y: number;
}

function lm(track: MotionPoseTrack, frame: number, idx: number): { x: number; y: number; v: number } | null {
  const f = track.frames[frame];
  if (!f) return null;
  const p = f.landmarks[idx];
  return p ? { x: p.x, y: p.y, v: p.v } : null;
}

function midp(a: P2, b: P2): P2 {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/** Which arm carries the grip: two-handed sports use both; racket uses dominant. */
function gripJoints(implement: ImplementType, capture: CaptureContext): {
  twoHanded: boolean;
  /** Dominant (racket) arm indices, used only when !twoHanded. */
  elbow: number;
  wrist: number;
} {
  // The racket sits in the dominant (trail) hand: right hand for a right-hander
  // (and for unknown handedness, which we default to right-handed).
  const dominantIsRight = capture.handedness !== 'left';
  return {
    twoHanded: implement === 'club' || implement === 'bat',
    elbow: dominantIsRight ? R_ELBOW : L_ELBOW,
    wrist: dominantIsRight ? R_WRIST : L_WRIST,
  };
}

/**
 * Estimate grip + head for one frame. Returns null when the needed joints
 * aren't visible enough to extrapolate honestly.
 */
function estimatePoint(
  track: MotionPoseTrack,
  frame: number,
  implement: ImplementType,
  capture: CaptureContext,
  factor: number,
): ImplementPathPoint | null {
  const joints = gripJoints(implement, capture);

  let grip: P2;
  let elbowMid: P2;
  let vis: number;

  if (joints.twoHanded) {
    const lw = lm(track, frame, L_WRIST);
    const rw = lm(track, frame, R_WRIST);
    const le = lm(track, frame, L_ELBOW);
    const re = lm(track, frame, R_ELBOW);
    if (!lw || !rw || !le || !re) return null;
    grip = midp(lw, rw);
    elbowMid = midp(le, re);
    vis = (lw.v + rw.v + le.v + re.v) / 4;
  } else {
    const w = lm(track, frame, joints.wrist);
    const e = lm(track, frame, joints.elbow);
    if (!w || !e) return null;
    grip = { x: w.x, y: w.y };
    elbowMid = { x: e.x, y: e.y };
    vis = (w.v + e.v) / 2;
  }

  // Direction the implement extends: along the forearm (elbow → grip), continued.
  const dx = grip.x - elbowMid.x;
  const dy = grip.y - elbowMid.y;
  const forearm = Math.hypot(dx, dy);
  if (forearm < 1e-4) return null; // degenerate — can't read a direction

  const ux = dx / forearm;
  const uy = dy / forearm;
  const reach = forearm * factor;
  const head = { x: grip.x + ux * reach, y: grip.y + uy * reach };

  return {
    frame,
    tMs: track.frames[frame]?.tMs ?? 0,
    grip,
    head,
    confidence: +Math.max(0, Math.min(1, vis)).toFixed(3),
  };
}

/** Resolve the strike/contact frame from phases → series → middle, honestly. */
function contactFrame(track: MotionPoseTrack, series: MotionSeries | null, phases: MotionPhaseSegment[]): number {
  const contactPhase = phases.find((p) => /contact|impact|release/.test(p.key));
  if (contactPhase) return contactPhase.keyFrame;
  if (series && series.peakFrame > 0) return series.peakFrame;
  return Math.floor(track.frames.length / 2);
}

function mean(v: number[]): number {
  return v.length ? v.reduce((s, x) => s + x, 0) / v.length : 0;
}

// ── The heuristic provider ────────────────────────────────────

/**
 * Estimates the implement head by extrapolating along the grip forearm.
 * Honest, capped-confidence, and never throws.
 */
export const heuristicForearmProvider: ObjectTrackingProvider = {
  id: 'heuristic-forearm',
  label: 'Forearm extrapolation (estimated)',
  isAvailable: (input) =>
    (input.manualHints?.implement ?? implementForSport(input.capture)) !== 'none' &&
    input.track.frames.length >= 3,
  track(input): ObjectTrackingResult {
    const { track, capture, series, phases, manualHints } = input;
    const implement = manualHints?.implement ?? implementForSport(capture);
    const basis: MotionBasis = 'ai_inferred';
    const warnings: string[] = [];

    if (implement === 'none') {
      return {
        implement,
        available: false,
        trace: { points: [], basis: 'placeholder', confidence: 0, method: 'none' },
        contactZone: null,
        swingPath: { verticalApproachDeg: null, approach: 'unknown', confidence: 0, basis: 'placeholder' },
        confidence: 0,
        basis: 'placeholder',
        disclaimer:
          'This motion has no swung implement to track (the hand carries the ball). Ball-flight tracking is not measured.',
        warnings: ['No swung implement for this motion type.'],
      };
    }

    const factor = LENGTH_FACTOR[implement];
    const points: ImplementPathPoint[] = [];
    for (let i = 0; i < track.frames.length; i++) {
      const pt = estimatePoint(track, i, implement, capture, factor);
      if (!pt) continue;
      // Apply a manual head override if the user tagged this frame.
      const manual = manualHints?.headByFrame?.[i];
      points.push(manual ? { ...pt, head: manual, confidence: Math.max(pt.confidence, 0.6) } : pt);
    }

    if (points.length < 2) {
      warnings.push('Hands/arms were not visible enough to trace the implement path.');
      return {
        implement,
        available: false,
        trace: { points, basis, confidence: 0, method: 'heuristic-forearm' },
        contactZone: null,
        swingPath: { verticalApproachDeg: null, approach: 'unknown', confidence: 0, basis },
        confidence: 0,
        basis,
        disclaimer: DISCLAIMER,
        warnings,
      };
    }

    const traceConf = +(mean(points.map((p) => p.confidence)) * HEURISTIC_CAP).toFixed(3);
    if (traceConf < 0.2) warnings.push('Low tracking confidence — treat the implement path as a rough guide.');
    if ((series?.depthReliability ?? 0) < 0.2) {
      warnings.push('Depth signal was weak, so the path is read in the image plane only (no true 3D arc).');
    }

    // ── Contact zone ──────────────────────────────────────────
    const cFrame = manualHints?.contactFrame ?? contactFrame(track, series, phases);
    const atContact = points.find((p) => p.frame === cFrame) ?? points[Math.floor(points.length / 2)];
    const contactZone: ContactZoneEstimate = {
      frame: atContact.frame,
      tMs: atContact.tMs,
      x: +atContact.head.x.toFixed(4),
      y: +atContact.head.y.toFixed(4),
      confidence: +(atContact.confidence * HEURISTIC_CAP).toFixed(3),
      basis,
    };

    // ── Swing path (vertical approach through contact) ────────
    const ci = points.indexOf(atContact);
    const a = points[Math.max(0, ci - 1)];
    const b = points[Math.min(points.length - 1, ci + 1)];
    let swingPath: SwingPathEstimate = { verticalApproachDeg: null, approach: 'unknown', confidence: 0, basis };
    if (a && b && a !== b) {
      const ddx = b.head.x - a.head.x;
      const ddy = b.head.y - a.head.y; // image y is DOWN-positive
      const moved = Math.hypot(ddx, ddy);
      if (moved > 1e-4) {
        // Positive = ascending (head moving up the image, i.e. dy negative).
        const vDeg = Math.atan2(-ddy, Math.hypot(ddx, 1e-6)) * RAD2DEG;
        const approach = vDeg > 5 ? 'ascending' : vDeg < -5 ? 'descending' : 'level';
        swingPath = {
          verticalApproachDeg: +vDeg.toFixed(1),
          approach,
          confidence: +(Math.min(a.confidence, b.confidence) * HEURISTIC_CAP).toFixed(3),
          basis,
        };
      }
    }

    return {
      implement,
      available: true,
      trace: { points, basis, confidence: traceConf, method: 'heuristic-forearm' },
      contactZone,
      swingPath,
      confidence: traceConf,
      basis,
      disclaimer: DISCLAIMER,
      warnings,
    };
  },
};

/** A no-op provider: always returns an honest, empty placeholder result. */
export const mockObjectTrackingProvider: ObjectTrackingProvider = {
  id: 'mock',
  label: 'Mock (no object tracking)',
  isAvailable: () => true,
  track(input): ObjectTrackingResult {
    const implement = implementForSport(input.capture);
    return {
      implement,
      available: false,
      trace: { points: [], basis: 'placeholder', confidence: 0, method: 'mock' },
      contactZone: null,
      swingPath: { verticalApproachDeg: null, approach: 'unknown', confidence: 0, basis: 'placeholder' },
      confidence: 0,
      basis: 'placeholder',
      disclaimer: DISCLAIMER,
      warnings: ['Object tracking is in demo mode — no path was computed.'],
    };
  },
};

/** Pick the best available provider for the given input. */
export function getActiveObjectTrackingProvider(input: ObjectTrackingInput): ObjectTrackingProvider {
  return heuristicForearmProvider.isAvailable(input) ? heuristicForearmProvider : mockObjectTrackingProvider;
}

/**
 * Convenience entry point used by the pipeline. Runs the active provider and
 * NEVER throws — on any error it returns an honest, unavailable result so the
 * analysis always completes.
 */
export function estimateImplementPath(input: ObjectTrackingInput): ObjectTrackingResult {
  try {
    return getActiveObjectTrackingProvider(input).track(input);
  } catch {
    const implement = implementForSport(input.capture);
    return {
      implement,
      available: false,
      trace: { points: [], basis: 'placeholder', confidence: 0, method: 'error' },
      contactZone: null,
      swingPath: { verticalApproachDeg: null, approach: 'unknown', confidence: 0, basis: 'placeholder' },
      confidence: 0,
      basis: 'placeholder',
      disclaimer: DISCLAIMER,
      warnings: ['Implement path could not be estimated for this clip.'],
    };
  }
}
