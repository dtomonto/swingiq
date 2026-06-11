// ============================================================
// SwingVantage — Motion Lab: Continuous Movement Engine
// ------------------------------------------------------------
// Golf, baseball and softball are DISCRETE swings: the rep starts and
// ends with the strike. Tennis, pickleball and padel are NOT — the hit
// is one beat in a continuous loop of ready → move → contact →
// decelerate → recover → next-ready. Scoring those sports as if they
// stopped at contact misses the half of the game that actually wins
// the next ball.
//
// This engine adds a movement-intelligence layer FOR THE RALLY SPORTS
// only. It reuses the already-computed pose track + series + phases and
// reads three things the discrete pipeline never scored:
//   • readiness   — was the athlete in an athletic ready position to start?
//   • recovery    — after contact, did they decelerate and rebalance?
//   • recentering — did they move back toward a usable next-ready spot?
//
// HONESTY: every read is a single-camera PROXY from estimated pose. A
// short clip often has only a few post-contact frames, so recovery /
// recentering degrade GRACEFULLY to "not enough footage" with low
// confidence rather than inventing a number. Nothing here is medical.
// ============================================================

import type {
  MotionPoseTrack,
  CaptureContext,
  MotionPhaseSegment,
  MotionBasis,
  SportId,
} from './types';
import type { MotionSeries } from './biomechanics';
import {
  balanceEstimate,
  balanceVerdict,
  overlayJointAngles,
  stanceRead,
  leadSide,
} from './overlay-geometry';

// ── Movement model ────────────────────────────────────────────

export type MovementModel =
  | 'stationary_rotational_swing' // golf
  | 'stride_rotational_swing' // baseball / softball
  | 'continuous_rally'; // tennis / pickleball / padel

/** The three sports whose value lives in the movement AROUND the strike. */
export function isContinuousSport(sport: SportId): boolean {
  return sport === 'tennis' || sport === 'pickleball' || sport === 'padel';
}

/** The movement model for a (sport, motion) pair. */
export function movementModelFor(sport: SportId, _motionType: string): MovementModel {
  if (isContinuousSport(sport)) return 'continuous_rally';
  if (sport === 'golf') return 'stationary_rotational_swing';
  return 'stride_rotational_swing'; // baseball, softball_slow, softball_fast
}

const MOVEMENT_MODEL_LABEL: Record<MovementModel, string> = {
  stationary_rotational_swing: 'Stationary rotational swing',
  stride_rotational_swing: 'Stride-based rotational swing',
  continuous_rally: 'Continuous rally movement',
};
export const movementModelLabel = (m: MovementModel): string => MOVEMENT_MODEL_LABEL[m];

// ── Result types ──────────────────────────────────────────────

export type CheckpointStatus = 'good' | 'watch' | 'needs_work' | 'not_available';

export interface MovementCheckpoint {
  id: 'readiness' | 'spacing' | 'recovery' | 'recentering';
  label: string;
  /** 0–100, or null when the clip doesn't show enough to score it. */
  score: number | null;
  status: CheckpointStatus;
  /** Plain-language read for the athlete. */
  detail: string;
  confidence: number;
}

export interface ContactEvent {
  id: string;
  /** Milliseconds from clip start. */
  timestamp: number;
  frameIndex: number;
  confidence: number;
}

export type MovementFocus = 'readiness' | 'spacing' | 'recovery' | 'recentering';

export interface ContinuousMovementSummary {
  movementModel: MovementModel;
  /** Detected strike(s). Short clips usually carry one honest contact. */
  contactEvents: ContactEvent[];
  /** Whether a split-step / loaded ready hop was plausibly detected. */
  splitStepDetected: boolean;
  checkpoints: MovementCheckpoint[];
  /** Blended movement-efficiency score across the available checkpoints. */
  efficiencyScore: number | null;
  /** The single most valuable thing to work on next. */
  primaryFocus: MovementFocus;
  /** One-line read in the product's "what we saw" voice. */
  headline: string;
  confidence: number;
  basis: MotionBasis;
  notes: string[];
}

// ── Helpers ───────────────────────────────────────────────────

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, n));
}
function mean(v: number[]): number {
  return v.length ? v.reduce((s, x) => s + x, 0) / v.length : 0;
}
function median(v: number[]): number {
  if (!v.length) return 0;
  const s = [...v].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function statusFor(score: number | null): CheckpointStatus {
  if (score == null) return 'not_available';
  if (score >= 70) return 'good';
  if (score >= 45) return 'watch';
  return 'needs_work';
}

/** Map a lead-knee flex angle (deg) to an "athletic readiness" score. */
function kneeFlexScore(angleDeg: number | null): number | null {
  if (angleDeg == null) return null;
  // ~150–170° is a loaded, athletic flex; standing tall (>178) or a deep
  // squat (<135) both read worse for a reactive ready position.
  if (angleDeg >= 150 && angleDeg <= 172) return 100;
  if (angleDeg > 172) return clamp(100 - (angleDeg - 172) * 6);
  return clamp(100 - (150 - angleDeg) * 3);
}

// ── Engine ────────────────────────────────────────────────────

/**
 * Compute the continuous-movement read for a rally sport. Returns null for
 * discrete swing sports (golf / baseball / softball) and for clips too short
 * to read movement from.
 */
export function computeContinuousMovement(
  track: MotionPoseTrack,
  capture: CaptureContext,
  series: MotionSeries | null,
  phases: MotionPhaseSegment[],
): ContinuousMovementSummary | null {
  if (!isContinuousSport(capture.sport)) return null;
  const frames = track.frames;
  if (!series || frames.length < 5) return null;

  const movementModel: MovementModel = 'continuous_rally';
  const basis: MotionBasis = track.basis === 'measured' ? 'measured' : 'estimated';
  const lead = leadSide(capture.handedness);
  const notes: string[] = [];

  // ── Contact event: the peak lead-wrist speed frame ────────────
  const contactFrame = Math.max(0, Math.min(frames.length - 1, series.peakFrame));
  const speed = series.leadWristV;
  const peakV = speed[contactFrame] ?? 0;
  const medV = median(speed.filter((v) => v > 0));
  // How cleanly the strike stands out from the rest of the clip (0–1).
  const peakClarity = medV > 1e-6 ? clamp((peakV / medV - 1) / 2, 0, 1) : 0.3;
  const contact: ContactEvent = {
    id: 'c0',
    timestamp: frames[contactFrame]?.tMs ?? 0,
    frameIndex: contactFrame,
    confidence: +(0.4 + 0.5 * peakClarity).toFixed(2),
  };

  // Split-step / loaded ready hop: a small energy bump before preparation.
  // Only some templates carry an explicit phase; otherwise infer from a dip
  // then rise in COM height early in the clip.
  const splitStepDetected =
    phases.some((p) => p.key === 'split') ||
    (frames.length >= 6 &&
      (() => {
        const headY = frames.slice(0, Math.ceil(frames.length * 0.35)).map((f) => f.landmarks[0]?.y ?? 0);
        return Math.max(...headY) - Math.min(...headY) > 0.012;
      })());

  // ── Readiness: the athletic base at the START of the clip ─────
  const startFrame = frames[0];
  const startBal = balanceEstimate(startFrame.landmarks);
  const startAngles = overlayJointAngles(startFrame.landmarks, lead);
  const startKnee = startAngles.find((a) => a.id === 'lead_knee')?.value ?? null;
  const startStance = stanceRead(startFrame.landmarks);

  const readinessParts: number[] = [];
  let readinessConf = 0;
  let readinessN = 0;
  if (startBal) {
    // Centred over the base = ready to move either way.
    readinessParts.push(clamp(100 - Math.abs(startBal.comOffset) * 90));
    readinessConf += startBal.confidence;
    readinessN++;
  }
  const kScore = kneeFlexScore(startKnee);
  if (kScore != null) {
    readinessParts.push(kScore);
    readinessConf += startAngles.find((a) => a.id === 'lead_knee')?.confidence ?? 0;
    readinessN++;
  }
  if (startStance.label !== 'unknown') {
    readinessParts.push(startStance.label === 'athletic' ? 100 : startStance.label === 'wide' ? 70 : 55);
    readinessConf += startStance.confidence;
    readinessN++;
  }
  const readinessScore = readinessParts.length ? Math.round(mean(readinessParts)) : null;
  const readinessConfidence = readinessN ? +(readinessConf / readinessN).toFixed(2) : 0;

  // ── Spacing: where contact sits relative to the lead hip ──────
  // Out-front contact (ahead of the lead hip toward the net) reads as good
  // spacing; jammed contact behind the lead hip reads as crowded.
  const contactBal = balanceEstimate(frames[contactFrame]?.landmarks ?? startFrame.landmarks);
  let spacingScore: number | null = null;
  let spacingConfidence = 0;
  if (contactBal) {
    // |comOffset| near the edge of support at contact = reaching / falling away.
    const off = Math.abs(contactBal.comOffset);
    spacingScore = clamp(100 - Math.max(0, off - 0.25) * 120);
    spacingConfidence = +contactBal.confidence.toFixed(2);
  }

  // ── Recovery: deceleration + rebalance AFTER contact ──────────
  const postFrames = frames.length - 1 - contactFrame;
  let recoveryScore: number | null = null;
  let recoveryConfidence = 0;
  if (postFrames >= 2) {
    const endFrame = frames[frames.length - 1];
    const endBal = balanceEstimate(endFrame.landmarks);
    const parts: number[] = [];
    // 1) Did speed bleed off after the strike (controlled deceleration)?
    const endV = mean(speed.slice(-2));
    if (peakV > 1e-6) parts.push(clamp(100 - (endV / peakV) * 100 + 20));
    // 2) Did the athlete end balanced over their base (not falling away)?
    if (endBal) {
      const verdict = balanceVerdict(endBal.comOffset);
      parts.push(verdict === 'stable' ? 95 : verdict === 'shifting' ? 60 : 30);
      recoveryConfidence = endBal.confidence;
    }
    recoveryScore = parts.length ? Math.round(mean(parts)) : null;
    recoveryConfidence = +(recoveryConfidence || 0.4).toFixed(2);
  } else {
    notes.push('Clip ends near contact — film a beat longer to score recovery and next-ready position.');
  }

  // ── Recentering: returning toward a usable next-ready spot ────
  let recenteringScore: number | null = null;
  let recenteringConfidence = 0;
  if (postFrames >= 2) {
    const comX = series.comX;
    const startX = comX[0] ?? 0;
    const endX = comX[comX.length - 1] ?? startX;
    // Returning laterally toward where you started = re-centred for the next
    // ball. A nominal court step is ~0.12 of frame width.
    const drift = Math.abs(endX - startX);
    recenteringScore = clamp(100 - Math.max(0, drift - 0.04) * 500);
    recenteringConfidence = +(0.35 + 0.4 * series.depthReliability).toFixed(2);
  }

  // ── Checkpoints ───────────────────────────────────────────────
  const checkpoints: MovementCheckpoint[] = [
    {
      id: 'readiness',
      label: 'Ready position',
      score: readinessScore,
      status: statusFor(readinessScore),
      detail: readinessDetail(readinessScore),
      confidence: readinessConfidence,
    },
    {
      id: 'spacing',
      label: 'Contact spacing',
      score: spacingScore,
      status: statusFor(spacingScore),
      detail: spacingDetail(spacingScore),
      confidence: spacingConfidence,
    },
    {
      id: 'recovery',
      label: 'Recovery after contact',
      score: recoveryScore,
      status: statusFor(recoveryScore),
      detail: recoveryDetail(recoveryScore, postFrames),
      confidence: recoveryConfidence,
    },
    {
      id: 'recentering',
      label: 'Next-ready position',
      score: recenteringScore,
      status: statusFor(recenteringScore),
      detail: recenteringDetail(recenteringScore, postFrames),
      confidence: recenteringConfidence,
    },
  ];

  // ── Efficiency + primary focus ────────────────────────────────
  const scored = checkpoints.filter((c) => c.score != null) as Array<MovementCheckpoint & { score: number }>;
  const efficiencyScore = scored.length
    ? Math.round(mean(scored.map((c) => c.score)))
    : null;

  // The single most valuable fix = lowest available checkpoint, with a tie-break
  // that favours the movement half of the game (recovery / next-ready) because
  // that is what the discrete pipeline already neglects.
  const PRIORITY: MovementFocus[] = ['recovery', 'recentering', 'spacing', 'readiness'];
  const primaryFocus: MovementFocus =
    [...scored]
      .sort((a, b) => a.score - b.score || PRIORITY.indexOf(a.id) - PRIORITY.indexOf(b.id))[0]?.id ?? 'recovery';

  const confidence = +clamp(
    track.trackingConfidence * 0.6 + peakClarity * 0.2 + (scored.length / 4) * 0.2,
    0,
    1,
  ).toFixed(2);

  return {
    movementModel,
    contactEvents: [contact],
    splitStepDetected,
    checkpoints,
    efficiencyScore,
    primaryFocus,
    headline: headlineFor(primaryFocus, checkpoints),
    confidence,
    basis,
    notes,
  };
}

// ── Narrative ─────────────────────────────────────────────────

function readinessDetail(s: number | null): string {
  if (s == null) return 'Could not read your starting posture clearly from this clip.';
  if (s >= 70) return 'You start in a balanced, athletic ready position — primed to move either way.';
  if (s >= 45) return 'Your ready position is okay but a little upright or off-centre — load the knees and stay balanced.';
  return 'You start too tall or off-balance, which slows your first step. Sink into an athletic base.';
}
function spacingDetail(s: number | null): string {
  if (s == null) return 'Contact point relative to your body was not clearly visible.';
  if (s >= 70) return 'You make contact on balance with room to swing — good spacing.';
  if (s >= 45) return 'Contact is a touch crowded or reaching — work to meet the ball with cleaner spacing.';
  return 'You are jammed or falling away at contact. Use your feet to create space and meet the ball out front.';
}
function recoveryDetail(s: number | null, post: number): string {
  if (s == null) return post < 2 ? 'The clip ends too close to contact to score your recovery.' : 'Recovery was not clearly readable.';
  if (s >= 70) return 'You decelerate under control and end balanced — ready to play the next ball.';
  if (s >= 45) return 'Your recovery is a little loose — control the finish and rebalance sooner.';
  return 'You finish off-balance or falling away, which leaves you late for the next ball.';
}
function recenteringDetail(s: number | null, post: number): string {
  if (s == null) return post < 2 ? 'Not enough footage after contact to see your re-centring step.' : 'Re-centring path was not clearly readable.';
  if (s >= 70) return 'You move back toward a usable next-ready position after the shot.';
  if (s >= 45) return 'You drift after contact — add a recovery step back toward the middle.';
  return 'You stay where you hit and do not re-centre, leaving the court open for the next ball.';
}

const FOCUS_LEAD: Record<MovementFocus, string> = {
  readiness: 'Your biggest opportunity is your ready position before the ball.',
  spacing: 'Your biggest opportunity is your spacing at contact.',
  recovery: 'Your biggest opportunity is recovery after contact.',
  recentering: 'Your biggest opportunity is re-centring into the next-ready position.',
};

function headlineFor(focus: MovementFocus, checkpoints: MovementCheckpoint[]): string {
  const cp = checkpoints.find((c) => c.id === focus);
  return `${FOCUS_LEAD[focus]} ${cp?.detail ?? ''}`.trim();
}
