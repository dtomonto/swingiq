// ============================================================
// SwingVantage — Motion Lab: Temporal Motion Intelligence
// ------------------------------------------------------------
// Reads HOW THE MOTION UNFOLDS OVER TIME, not just static angles: how
// long the load takes, how quick the transition at the top is, how long
// the acceleration to contact lasts, how steady the body is THROUGH the
// contact window, and how controlled the slow-down is afterward.
//
// Durations are anchored to the two events the engine already trusts —
// the top of the backswing (lead-hand reversal) and the strike (peak
// hand speed) — so they track the athlete's real timing instead of a
// fixed template guess. It complements the kinetic chain (which owns the
// firing ORDER) by owning the firing DURATIONS + stability.
//
// HONESTY: single-camera timing proxies, basis + confidence carried
// through. Repeatability is intentionally NOT computed here — it needs
// multiple reps (see comparison/persistence across sessions).
// Pure + unit-tested in __tests__/temporal.test.ts.
// ============================================================

import type { MotionPoseTrack, CaptureContext, MotionPhaseSegment, MotionBasis } from './types';
import type { MotionSeries } from './biomechanics';
import { span } from './kinematics3d';

export interface PhaseDuration {
  key: string;
  label: string;
  ms: number;
  /** Fraction of the whole motion this phase occupies (0–1). */
  pctOfMotion: number;
}

export interface TemporalFlag {
  id: string;
  label: string;
  detail: string;
  severity: 'low' | 'moderate' | 'high';
}

/** Structured temporal read for one motion. */
export interface TemporalIntelligence {
  totalMs: number;
  /** Backswing : downswing time ratio (e.g. ~3:1 in golf). null when no top. */
  tempoRatio: number | null;
  /** Start → top of backswing (the gather). null when no clear top. */
  loadDurationMs: number | null;
  /** The dwell/change-of-direction at the top before real acceleration. */
  transitionDurationMs: number | null;
  /** End of transition → strike (the drive to contact). */
  accelerationDurationMs: number | null;
  /** Raw per-phase durations from the detected segments (transparency). */
  phaseDurations: PhaseDuration[];
  /** Where peak hand speed lands in the motion (0 = start, 1 = end). */
  peakSpeedTimePct: number | null;
  /** 0–100 — how steady the body stays through the contact window. */
  contactWindowStability: number | null;
  /** 0–100 — how controlled the slow-down is after contact. */
  decelerationControl: number | null;
  rushedTransition: boolean;
  flags: TemporalFlag[];
  summary: string;
  basis: MotionBasis;
  confidence: number;
  disclaimer: string | null;
}

const DISCLAIMER =
  'Timing is estimated from single-camera pose — durations and stability are proxies, not lab measurements. Repeatability needs multiple reps and is tracked across sessions, not here.';

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function emptyResult(): TemporalIntelligence {
  return {
    totalMs: 0,
    tempoRatio: null,
    loadDurationMs: null,
    transitionDurationMs: null,
    accelerationDurationMs: null,
    phaseDurations: [],
    peakSpeedTimePct: null,
    contactWindowStability: null,
    decelerationControl: null,
    rushedTransition: false,
    flags: [],
    summary: 'Not enough clean motion was tracked to read your timing. Re-film the full rep with the body in frame.',
    basis: 'placeholder',
    confidence: 0,
    disclaimer: DISCLAIMER,
  };
}

/**
 * Build the temporal read. Never throws — returns an honest empty result when
 * the clip is too short or poorly tracked to time.
 */
export function computeTemporal(
  track: MotionPoseTrack,
  capture: CaptureContext,
  series: MotionSeries | null,
  phases: MotionPhaseSegment[],
): TemporalIntelligence {
  const basis = track.basis;
  if (!series || series.frames < 4) return emptyResult();

  const { tMs, leadWristV, comX, peakFrame, topFrame, frames } = series;
  const totalMs = Math.max(0, tMs[tMs.length - 1] - tMs[0]);

  // Raw per-phase durations (straight from the detected segments).
  const phaseDurations: PhaseDuration[] = phases.map((p) => {
    const ms = Math.max(0, p.endMs - p.startMs);
    return { key: p.key, label: p.label, ms, pctOfMotion: totalMs > 0 ? +(ms / totalMs).toFixed(3) : 0 };
  });

  const peakV = Math.max(...leadWristV);
  const hasTop = topFrame > 0 && topFrame < peakFrame;

  // ── Anchored durations ────────────────────────────────────────
  let loadDurationMs: number | null = null;
  let transitionDurationMs: number | null = null;
  let accelerationDurationMs: number | null = null;
  let tempoRatio: number | null = null;

  if (hasTop) {
    loadDurationMs = Math.max(0, tMs[topFrame] - tMs[0]);

    // Transition = the dwell at the top until the hands re-accelerate past 30%
    // of their peak speed (the real change-of-direction window).
    let transitionEnd = topFrame + 1;
    const threshold = 0.3 * peakV;
    for (let i = topFrame + 1; i < peakFrame; i++) {
      if (leadWristV[i] >= threshold) {
        transitionEnd = i;
        break;
      }
    }
    transitionEnd = clamp(transitionEnd, topFrame + 1, Math.max(topFrame + 1, peakFrame));
    transitionDurationMs = Math.max(0, tMs[transitionEnd] - tMs[topFrame]);
    accelerationDurationMs = Math.max(0, tMs[peakFrame] - tMs[transitionEnd]);

    const back = Math.max(1, tMs[topFrame] - tMs[0]);
    const through = Math.max(1, tMs[tMs.length - 1] - tMs[topFrame]);
    tempoRatio = +(back / through).toFixed(1);
  }

  // ── Peak timing ───────────────────────────────────────────────
  const peakSpeedTimePct = frames > 1 ? +(peakFrame / (frames - 1)).toFixed(3) : null;

  // ── Contact-window stability ──────────────────────────────────
  // How much the body centre drifts in a window around the strike. A steady
  // base through contact = repeatable strike; lots of drift = unstable.
  const w = Math.max(1, Math.round(frames * 0.08));
  const lo = Math.max(0, peakFrame - w);
  const hi = Math.min(frames - 1, peakFrame + w);
  const drift = span(comX.slice(lo, hi + 1)); // normalized image units
  const contactWindowStability = Math.round(100 * (1 - clamp(drift / 0.15, 0, 1)));

  // ── Deceleration control ──────────────────────────────────────
  // After contact the hands should come down under control. If they're still
  // near peak speed at the finish, the motion was lashed, not controlled.
  let decelerationControl: number | null = null;
  if (peakFrame < frames - 1 && peakV > 1e-6) {
    const finishV = leadWristV[leadWristV.length - 1];
    decelerationControl = Math.round(100 * clamp((peakV - finishV) / peakV, 0, 1));
  }

  // ── Rushed transition ─────────────────────────────────────────
  // A snatched change of direction: the backswing is quick relative to the
  // downswing (low tempo ratio) OR the transition dwell is near-zero.
  const rushedTransition =
    (tempoRatio != null && tempoRatio < 1.5) ||
    (transitionDurationMs != null && totalMs > 0 && transitionDurationMs / totalMs < 0.04);

  // ── Flags ─────────────────────────────────────────────────────
  const flags: TemporalFlag[] = [];
  if (rushedTransition) {
    flags.push({
      id: 'rushed_transition',
      label: 'Rushed transition',
      detail: 'The change of direction at the top looks hurried. A smoother, slightly slower transition lets the lower body lead and adds speed where it counts — at contact.',
      severity: 'moderate',
    });
  }
  if (contactWindowStability != null && contactWindowStability < 50) {
    flags.push({
      id: 'unstable_contact_window',
      label: 'Unstable through contact',
      detail: 'Your body centre drifts noticeably around the strike, which moves your low point and hurts consistency. Rotate around a stable base through contact.',
      severity: 'moderate',
    });
  }
  if (decelerationControl != null && decelerationControl < 35) {
    flags.push({
      id: 'poor_deceleration',
      label: 'Lashing at the ball',
      detail: 'The hands are still near top speed at the finish instead of slowing under control — a sign of over-swinging rather than sequencing.',
      severity: 'low',
    });
  }
  if (peakSpeedTimePct != null && peakSpeedTimePct < 0.45) {
    flags.push({
      id: 'early_peak',
      label: 'Speed peaks early',
      detail: 'Your hands reach top speed well before the likely contact point, which can mean an early release — speed should arrive AT the ball, not before it.',
      severity: 'moderate',
    });
  }

  // ── Summary ───────────────────────────────────────────────────
  const idealTempo = capture.sport === 'golf' ? ' (a smooth ~3:1 is the classic golf rhythm)' : '';
  let summary: string;
  if (flags.length === 0) {
    summary = `Your timing looks smooth${tempoRatio != null ? ` — about a ${tempoRatio}:1 back-to-through tempo${idealTempo}` : ''}, with a stable base through contact and a controlled finish. Groove it so it repeats.`;
  } else {
    summary = `Your main timing note is "${flags[0].label.toLowerCase()}": ${flags[0].detail}`;
  }

  const confidence = +(track.trackingConfidence * (hasTop ? 0.8 : 0.6)).toFixed(3);

  return {
    totalMs,
    tempoRatio,
    loadDurationMs,
    transitionDurationMs,
    accelerationDurationMs,
    phaseDurations,
    peakSpeedTimePct,
    contactWindowStability,
    decelerationControl,
    rushedTransition,
    flags,
    summary,
    basis,
    confidence,
    disclaimer: basis === 'measured' ? null : DISCLAIMER,
  };
}
