// ============================================================
// SwingIQ — Motion Lab: Kinetic Chain Sequencing
// ------------------------------------------------------------
// Estimates the ORDER and TIMING of the energy transfer through the
// body: lower body → torso → arms → implement. A good athletic motion
// fires "ground up" — the hips peak first, then the shoulders/torso,
// then the hands, then the club/bat/racket. When that order breaks
// (upper body first, arms before torso, everything at once) energy
// "leaks" and speed/consistency drop.
//
// Inputs are the per-frame velocity series the biomechanics engine
// already builds, plus the estimated implement head path (objectTracking)
// for the final link in the chain. Depth-aware: when the reconstructed
// depth is reliable we time the segments by their ROTATIONAL (angular)
// velocity — the textbook kinematic sequence — otherwise we fall back to
// linear speed and lower the confidence.
//
// HONESTY: this is a proxy from single-camera pose, never a force-plate
// or 3D-mocap measurement. Basis + confidence are carried through.
// Pure + unit-tested in __tests__/kineticChain.test.ts.
// ============================================================

import type { MotionPoseTrack, CaptureContext, MotionBasis } from './types';
import type { MotionSeries } from './biomechanics';
import type { ObjectTrackingResult } from './objectTracking';
import { argmax } from './kinematics3d';

export type ChainSegment = 'lower_body' | 'torso' | 'arms' | 'implement';

/** When one link in the chain reaches its peak speed. */
export interface SegmentTiming {
  segment: ChainSegment;
  label: string;
  /** Frame index of this segment's peak speed (null when not derivable). */
  peakFrame: number | null;
  /** Peak position as a fraction of the motion (0 = start, 1 = end). */
  peakTimePct: number | null;
  confidence: number;
}

export interface PowerLeakFlag {
  id: string;
  label: string;
  detail: string;
  severity: 'low' | 'moderate' | 'high';
}

/** The structured kinetic-chain read for one motion. */
export interface KineticChainScore {
  /** 0–100 — overall efficiency of the energy transfer. */
  overall: number;
  /** 0–100 — purely how well the firing ORDER matched ground-up sequence. */
  sequenceQuality: number;
  segments: SegmentTiming[];
  /** Peak-timing fractions per segment for quick access (0–1, null when unknown). */
  lowerBodyTiming: number | null;
  torsoTiming: number | null;
  armTiming: number | null;
  implementTiming: number | null;
  /** Count of adjacent links that fired in the right order, out of the pairs we could read. */
  orderedLinks: number;
  comparableLinks: number;
  powerLeakFlags: PowerLeakFlag[];
  coachingSummary: string;
  recommendedFocus: string;
  basis: MotionBasis;
  confidence: number;
  /** Present unless basis === 'measured'. */
  disclaimer: string | null;
}

const DISCLAIMER =
  'Kinetic sequence is estimated from single-camera pose — the firing order is a proxy, not a force-plate or lab measurement. Read it as directional.';

/** Peak speed frame of the estimated implement head, from its traced path. */
function implementPeakFrame(ot: ObjectTrackingResult | undefined): { frame: number | null; confidence: number } {
  if (!ot || !ot.available || ot.trace.points.length < 3) return { frame: null, confidence: 0 };
  const pts = ot.trace.points;
  const speeds = new Array(pts.length).fill(0);
  for (let i = 1; i < pts.length; i++) {
    const dt = Math.max(1, pts[i].tMs - pts[i - 1].tMs) / 1000;
    const d = Math.hypot(pts[i].head.x - pts[i - 1].head.x, pts[i].head.y - pts[i - 1].head.y);
    speeds[i] = d / dt;
  }
  const idx = argmax(speeds);
  return { frame: pts[idx]?.frame ?? null, confidence: ot.confidence };
}

function pct(frame: number | null, frames: number): number | null {
  if (frame == null || frames < 2) return null;
  return +(frame / (frames - 1)).toFixed(3);
}

/**
 * Build the kinetic-chain read. Never throws — returns an honest low-confidence
 * result when the motion is too short or too poorly tracked to sequence.
 */
export function computeKineticChain(
  track: MotionPoseTrack,
  capture: CaptureContext,
  series: MotionSeries | null,
  objectTracking?: ObjectTrackingResult,
): KineticChainScore {
  const basis = track.basis;
  const frames = track.frames.length;

  // Too little signal to sequence anything.
  if (!series || frames < 4) {
    return {
      overall: 0,
      sequenceQuality: 0,
      segments: [],
      lowerBodyTiming: null,
      torsoTiming: null,
      armTiming: null,
      implementTiming: null,
      orderedLinks: 0,
      comparableLinks: 0,
      powerLeakFlags: [],
      coachingSummary: 'Not enough clean motion was tracked to read your kinetic sequence. Re-film with the full body in frame and good light.',
      recommendedFocus: 'Improve the capture, then re-analyse.',
      basis: 'placeholder',
      confidence: 0,
      disclaimer: DISCLAIMER,
    };
  }

  // Depth-aware: when depth is reliable, time the body segments by ROTATIONAL
  // (angular) velocity — the real kinematic sequence; else linear speed.
  const useAngular = series.depthReliability > 0.4;
  const hipPeak = useAngular ? argmax(series.hipAngVel) : argmax(series.hipV);
  const torsoPeak = useAngular ? argmax(series.shoulderAngVel) : argmax(series.shoulderV);
  const armPeak = series.peakFrame;
  const impl = implementPeakFrame(objectTracking);

  const conf = track.trackingConfidence;
  const seqConf = +(conf * (useAngular ? 0.85 : 0.7)).toFixed(3);

  const segments: SegmentTiming[] = [
    { segment: 'lower_body', label: 'Lower body (hips)', peakFrame: hipPeak, peakTimePct: pct(hipPeak, frames), confidence: seqConf },
    { segment: 'torso', label: 'Torso (shoulders)', peakFrame: torsoPeak, peakTimePct: pct(torsoPeak, frames), confidence: seqConf },
    { segment: 'arms', label: 'Arms / hands', peakFrame: armPeak, peakTimePct: pct(armPeak, frames), confidence: +(conf * 0.7).toFixed(3) },
    { segment: 'implement', label: 'Implement', peakFrame: impl.frame, peakTimePct: pct(impl.frame, frames), confidence: +(impl.confidence).toFixed(3) },
  ];

  // Order check across the chain links we can actually read.
  const order: number[] = [hipPeak, torsoPeak, armPeak];
  if (impl.frame != null) order.push(impl.frame);
  let orderedLinks = 0;
  const comparableLinks = order.length - 1;
  for (let i = 1; i < order.length; i++) {
    if (order[i - 1] <= order[i]) orderedLinks++;
  }
  const sequenceQuality = comparableLinks > 0 ? Math.round((orderedLinks / comparableLinks) * 100) : 0;

  // ── Power-leak flags ──────────────────────────────────────────
  const flags: PowerLeakFlag[] = [];
  if (torsoPeak < hipPeak) {
    flags.push({
      id: 'upper_body_first',
      label: 'Upper body leads',
      detail: 'Your shoulders/torso appear to fire before your lower body, which can cut across the ideal path and leak power.',
      severity: 'high',
    });
  }
  if (armPeak < torsoPeak) {
    flags.push({
      id: 'arms_before_torso',
      label: 'Arms before torso',
      detail: 'Your hands speed up before your torso peaks — an "all arms" pattern that drains rotational power.',
      severity: 'moderate',
    });
  }
  if (impl.frame != null && impl.frame < armPeak) {
    flags.push({
      id: 'implement_casts_early',
      label: 'Early release / cast',
      detail: 'The implement appears to reach peak speed before your hands do, a sign of casting or an early release.',
      severity: 'moderate',
    });
  }
  // "Everything at once": peaks clustered in a tight window = no real sequence.
  const window = Math.max(...order) - Math.min(...order);
  if (comparableLinks >= 2 && window <= Math.max(1, Math.round(frames * 0.06))) {
    flags.push({
      id: 'simultaneous_fire',
      label: 'Fires all at once',
      detail: 'Your segments peak almost together instead of in a ground-up wave — sequencing them adds free speed.',
      severity: 'moderate',
    });
  }

  // ── Overall = order quality, lightly penalized by the worst leak ──
  const worst = flags.reduce((m, f) => Math.max(m, f.severity === 'high' ? 25 : f.severity === 'moderate' ? 15 : 8), 0);
  const overall = Math.max(0, Math.min(100, sequenceQuality - worst));

  // ── Coaching summary + focus ──────────────────────────────────
  const ordered = sequenceQuality >= 90;
  const sportWord = capture.sport === 'golf' ? 'club' : capture.sport === 'tennis' ? 'racket' : 'bat';
  let coachingSummary: string;
  let recommendedFocus: string;
  if (ordered && flags.length === 0) {
    coachingSummary = `Your energy flows in the right order — lower body, then torso, then hands${impl.frame != null ? `, then the ${sportWord}` : ''}. That ground-up wave is exactly what creates effortless speed. Keep it.`;
    recommendedFocus = 'Maintain this sequence — groove it so it repeats under pressure.';
  } else {
    const lead = flags[0];
    coachingSummary = lead
      ? `Your main timing issue is "${lead.label.toLowerCase()}": ${lead.detail} Fixing the order — not swinging harder — is where your free speed is.`
      : 'Your firing order is slightly out of sequence. Energy should build ground-up: hips → torso → arms → implement.';
    recommendedFocus = flags.some((f) => f.id === 'upper_body_first' || f.id === 'simultaneous_fire')
      ? 'Start the downswing from the ground up — feel the lead hip clear before the hands fire.'
      : 'Keep the torso turning so the arms stay connected — let speed arrive late, at contact.';
  }

  return {
    overall,
    sequenceQuality,
    segments,
    lowerBodyTiming: pct(hipPeak, frames),
    torsoTiming: pct(torsoPeak, frames),
    armTiming: pct(armPeak, frames),
    implementTiming: pct(impl.frame, frames),
    orderedLinks,
    comparableLinks,
    powerLeakFlags: flags,
    coachingSummary,
    recommendedFocus,
    basis,
    confidence: seqConf,
    disclaimer: basis === 'measured' ? null : DISCLAIMER,
  };
}
