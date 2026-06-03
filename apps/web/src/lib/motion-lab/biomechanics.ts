// ============================================================
// SwingIQ — Motion Lab: Biomechanics Engine
// ------------------------------------------------------------
// Turns a real MediaPipe pose track into (a) per-frame signal series
// used by the timeline, 3D viewer, and scoring, and (b) a set of
// honest, proxy-labeled biomechanical metrics.
//
// HONESTY: these are single-camera 2D+depth PROXIES, not lab
// measurements. Reference ranges are clearly-labeled starter
// heuristics, editable and never claimed as validated.
// ============================================================

import type {
  MotionPoseTrack,
  MotionPoseFrame,
  CaptureContext,
  MotionMetric,
  MotionPhaseSegment,
} from './types';
import { isRotationalMotion } from './taxonomy';

// ── MediaPipe Pose 33 landmark indices ────────────────────────
const NOSE = 0;
const L_SHOULDER = 11;
const R_SHOULDER = 12;
const L_WRIST = 15;
const R_WRIST = 16;
const L_HIP = 23;
const R_HIP = 24;
const L_KNEE = 25;
const R_KNEE = 26;
const L_ANKLE = 27;
const R_ANKLE = 28;

interface Pt {
  x: number;
  y: number;
  z: number;
}

function pt(frame: MotionPoseFrame, i: number): Pt {
  const lm = frame.landmarks[i];
  return lm ? { x: lm.x, y: lm.y, z: lm.z } : { x: 0, y: 0, z: 0 };
}
function mid(a: Pt, b: Pt): Pt {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2 };
}
function deg(rad: number): number {
  return (rad * 180) / Math.PI;
}
function range(v: number[]): number {
  if (v.length === 0) return 0;
  return Math.max(...v) - Math.min(...v);
}
function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
/** Interior angle (deg) at vertex b for points a-b-c, in the image plane. */
function angleAt(a: Pt, b: Pt, c: Pt): number {
  const v1x = a.x - b.x;
  const v1y = a.y - b.y;
  const v2x = c.x - b.x;
  const v2y = c.y - b.y;
  const dot = v1x * v2x + v1y * v2y;
  const m1 = Math.hypot(v1x, v1y);
  const m2 = Math.hypot(v2x, v2y);
  if (m1 === 0 || m2 === 0) return 180;
  return deg(Math.acos(clamp(dot / (m1 * m2), -1, 1)));
}

// ── Per-frame signal series ───────────────────────────────────

export interface MotionSeries {
  frames: number;
  tMs: number[];
  /** Image-plane orientation of the shoulder line (deg). */
  shoulderLineDeg: number[];
  hipLineDeg: number[];
  /** Spine tilt from vertical, hips→shoulders (deg). */
  spineTiltDeg: number[];
  headX: number[];
  comX: number[];
  leadWristV: number[];
  shoulderV: number[];
  hipV: number[];
  /** Combined whole-body motion energy per frame (0+). */
  energy: number[];
  /** Index of peak lead-wrist speed — the dynamic "strike" frame. */
  peakFrame: number;
}

/** Which wrist leads, given handedness (lead arm crosses the body). */
function leadWristIndex(capture: CaptureContext): number {
  if (capture.handedness === 'left') return R_WRIST;
  return L_WRIST; // right-handed (and unknown default)
}
function leadKneeIndices(capture: CaptureContext): [number, number, number] {
  // lead leg = front leg toward target
  if (capture.handedness === 'left') return [R_HIP, R_KNEE, R_ANKLE];
  return [L_HIP, L_KNEE, L_ANKLE];
}

function speedSeries(points: Pt[], tMs: number[]): number[] {
  const out = new Array(points.length).fill(0);
  for (let i = 1; i < points.length; i++) {
    const dt = Math.max(1, tMs[i] - tMs[i - 1]) / 1000;
    const d = Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    out[i] = d / dt;
  }
  if (out.length > 1) out[0] = out[1];
  return out;
}

/** Build the per-frame series from a pose track. Null when too short. */
export function computeSeries(track: MotionPoseTrack, capture: CaptureContext): MotionSeries | null {
  const frames = track.frames;
  if (frames.length < 3) return null;

  const tMs = frames.map((f) => f.tMs);
  const shoulderLineDeg: number[] = [];
  const hipLineDeg: number[] = [];
  const spineTiltDeg: number[] = [];
  const headX: number[] = [];
  const comX: number[] = [];

  const leadWristPts: Pt[] = [];
  const shoulderMidPts: Pt[] = [];
  const hipMidPts: Pt[] = [];

  const lwIdx = leadWristIndex(capture);

  for (const f of frames) {
    const ls = pt(f, L_SHOULDER);
    const rs = pt(f, R_SHOULDER);
    const lh = pt(f, L_HIP);
    const rh = pt(f, R_HIP);
    const nose = pt(f, NOSE);
    const sMid = mid(ls, rs);
    const hMid = mid(lh, rh);

    shoulderLineDeg.push(deg(Math.atan2(rs.y - ls.y, rs.x - ls.x)));
    hipLineDeg.push(deg(Math.atan2(rh.y - lh.y, rh.x - lh.x)));
    // spine tilt from vertical (0 = upright)
    spineTiltDeg.push(deg(Math.atan2(sMid.x - hMid.x, hMid.y - sMid.y)));
    headX.push(nose.x);
    comX.push(hMid.x);

    leadWristPts.push(pt(f, lwIdx));
    shoulderMidPts.push(sMid);
    hipMidPts.push(hMid);
  }

  const leadWristV = speedSeries(leadWristPts, tMs);
  const shoulderV = speedSeries(shoulderMidPts, tMs);
  const hipV = speedSeries(hipMidPts, tMs);

  const energy = leadWristV.map((v, i) => v + shoulderV[i] * 0.5 + hipV[i] * 0.5);

  let peakFrame = 0;
  let peakV = -1;
  for (let i = 0; i < leadWristV.length; i++) {
    if (leadWristV[i] > peakV) {
      peakV = leadWristV[i];
      peakFrame = i;
    }
  }

  return {
    frames: frames.length,
    tMs,
    shoulderLineDeg,
    hipLineDeg,
    spineTiltDeg,
    headX,
    comX,
    leadWristV,
    shoulderV,
    hipV,
    energy,
    peakFrame,
  };
}

// ── Metric scoring helpers ────────────────────────────────────

/** Score where lower is better, mapped against a "bad" upper bound. */
function lowerBetter(value: number, good: number, bad: number): number {
  if (value <= good) return 100;
  if (value >= bad) return 20;
  return Math.round(100 - ((value - good) / (bad - good)) * 80);
}
/** Tent score peaking inside [min,max], falling off outside by `slack`. */
function inRange(value: number, min: number, max: number, slack: number): number {
  if (value >= min && value <= max) return 100;
  const d = value < min ? min - value : value - max;
  return Math.round(clamp(100 - (d / slack) * 70, 20, 100));
}

function argmax(v: number[]): number {
  let idx = 0;
  let best = -Infinity;
  for (let i = 0; i < v.length; i++) if (v[i] > best) { best = v[i]; idx = i; }
  return idx;
}

const PROXY_NOTE =
  'Single-camera proxy from estimated 3D pose — directional, not a lab measurement. Reference ranges are starter heuristics.';

// ── The metric engine ─────────────────────────────────────────

export function computeMetrics(
  track: MotionPoseTrack,
  capture: CaptureContext,
  series: MotionSeries | null,
  phases: MotionPhaseSegment[],
): MotionMetric[] {
  const conf = track.trackingConfidence;
  const basis = track.basis;
  const rotational = isRotationalMotion(capture.sport, capture.motionType);

  // Not enough signal — return honest "couldn't measure" metrics.
  if (!series) {
    return [
      {
        id: 'tracking',
        name: 'Body tracking',
        value: track.frames.length,
        unit: 'frames',
        normalizedScore: track.frames.length > 0 ? 40 : 0,
        confidence: conf,
        basis,
        phase: 'overall',
        explanation: 'How many frames a body pose could be found in.',
        whyItMatters: 'Reliable analysis needs the whole body in frame for most of the motion.',
        recommendedFix: 'Re-film with the full body visible, good light, and the subject larger in frame.',
        drillId: null,
        limitations: 'Too few tracked frames to compute movement metrics.',
      },
    ];
  }

  const phaseFor = (frame: number): string => {
    const p = phases.find((ph) => frame >= ph.startFrame && frame <= ph.endFrame);
    return p?.key ?? 'overall';
  };

  const shoulderTurn = Math.round(range(series.shoulderLineDeg));
  const hipTurn = Math.round(range(series.hipLineDeg));
  const sepSeries = series.shoulderLineDeg.map((s, i) => Math.abs(s - series.hipLineDeg[i]));
  const xFactor = Math.round(Math.max(...sepSeries));
  const headSwayPct = Math.round(range(series.headX) * 100);
  const pelvisSwayPct = Math.round(range(series.comX) * 100);
  const spineChange = Math.round(range(series.spineTiltDeg));

  // knee flex (lead leg) minimum interior angle
  const [hipI, kneeI, ankleI] = leadKneeIndices(capture);
  let minKnee = 180;
  for (const f of track.frames) {
    const a = angleAt(pt(f, hipI), pt(f, kneeI), pt(f, ankleI));
    if (a < minKnee) minKnee = a;
  }
  const kneeFlexDeg = Math.round(180 - minKnee); // how much the knee bends from straight

  // tempo ratio (backswing : downswing) around the peak frame
  const peak = series.peakFrame;
  const back = Math.max(1, peak);
  const down = Math.max(1, series.frames - 1 - peak);
  const tempoRatio = +(back / down).toFixed(1);

  // balance at finish — head + com horizontal drift over final 15%
  const tail = Math.max(2, Math.round(series.frames * 0.15));
  const finishHead = series.headX.slice(-tail);
  const balanceDriftPct = Math.round(range(finishHead) * 100);

  // sequencing — do hips peak before shoulders before hands?
  const hipPeak = argmax(series.hipV);
  const shPeak = argmax(series.shoulderV);
  const handPeak = series.peakFrame;
  let ordered = 0;
  if (hipPeak <= shPeak) ordered++;
  if (shPeak <= handPeak) ordered++;
  const sequencingScore = ordered === 2 ? 92 : ordered === 1 ? 60 : 30;

  const handSpeedPeak = +Math.max(...series.leadWristV).toFixed(2);
  const rom = shoulderTurn;

  const metrics: MotionMetric[] = [];

  if (rotational) {
    metrics.push({
      id: 'shoulder_turn',
      name: 'Shoulder Rotation',
      value: shoulderTurn,
      unit: '°',
      normalizedScore: inRange(shoulderTurn, 70, 110, 60),
      confidence: conf,
      basis,
      phase: phaseFor(peak),
      explanation: `Your shoulder line rotated through about ${shoulderTurn}° across the motion.`,
      whyItMatters: 'Shoulder turn stores the energy that becomes clubhead/bat/racket speed.',
      recommendedFix: shoulderTurn < 70 ? 'Work on a fuller turn — feel your back to the target at the top.' : 'Good range — keep it controlled and repeatable.',
      drillId: 'rotation_load',
      limitations: PROXY_NOTE,
      series: series.shoulderLineDeg,
    });
    metrics.push({
      id: 'hip_turn',
      name: 'Hip Rotation',
      value: hipTurn,
      unit: '°',
      normalizedScore: inRange(hipTurn, 35, 70, 45),
      confidence: conf,
      basis,
      phase: phaseFor(peak),
      explanation: `Your hips rotated through roughly ${hipTurn}°.`,
      whyItMatters: 'Hips lead the downswing — too little or too much changes your power and path.',
      recommendedFix: 'Let the hips start down first, but keep them quieter than the shoulders going back.',
      drillId: 'hip_lead',
      limitations: PROXY_NOTE,
      series: series.hipLineDeg,
    });
    metrics.push({
      id: 'hip_shoulder_sep',
      name: 'Hip–Shoulder Separation (X-Factor)',
      value: xFactor,
      unit: '°',
      normalizedScore: inRange(xFactor, 20, 55, 40),
      confidence: conf * 0.85,
      basis,
      phase: 'transition',
      explanation: `Peak difference between shoulder and hip rotation was about ${xFactor}°.`,
      whyItMatters: 'Separation is the "stretch" that creates speed — the engine of a powerful motion.',
      recommendedFix: 'Feel the hips start down while the chest still points back — that builds the stretch.',
      drillId: 'separation_step',
      limitations: PROXY_NOTE + ' Depth-based separation is especially sensitive to camera angle.',
      series: sepSeries.map((v) => Math.round(v)),
    });
  }

  metrics.push({
    id: 'sequencing',
    name: 'Kinematic Sequencing',
    value: sequencingScore,
    unit: '/100',
    normalizedScore: sequencingScore,
    confidence: conf * 0.8,
    basis,
    phase: 'downswing',
    explanation:
      ordered === 2
        ? 'Your hips, then shoulders, then hands peaked in the right order.'
        : 'The order your hips, shoulders, and hands sped up was out of sequence.',
    whyItMatters: 'Energy should flow ground-up: hips → torso → arms → implement. Out of order leaks power.',
    recommendedFix: 'Start the downswing from the ground up — feel the lead hip clear before the hands fire.',
    drillId: 'sequence_pump',
    limitations: PROXY_NOTE,
  });

  metrics.push({
    id: 'head_stability',
    name: 'Head Stability',
    value: headSwayPct,
    unit: '% frame',
    normalizedScore: lowerBetter(headSwayPct, 6, 25),
    confidence: conf,
    basis,
    phase: 'overall',
    explanation: `Your head drifted about ${headSwayPct}% of the frame width horizontally.`,
    whyItMatters: 'A stable head keeps your low point and contact consistent.',
    recommendedFix: 'Pick a spot and keep your eyes on it through contact.',
    drillId: 'steady_head',
    limitations: PROXY_NOTE,
    series: series.headX.map((x) => Math.round(x * 100)),
  });

  metrics.push({
    id: 'pelvis_sway',
    name: 'Pelvis Sway / Slide',
    value: pelvisSwayPct,
    unit: '% frame',
    normalizedScore: lowerBetter(pelvisSwayPct, 8, 30),
    confidence: conf,
    basis,
    phase: 'overall',
    explanation: `Your hips moved about ${pelvisSwayPct}% of the frame width side-to-side.`,
    whyItMatters: 'Too much lateral slide drains rotational power and hurts consistency.',
    recommendedFix: 'Rotate around a stable centre instead of sliding toward the target.',
    drillId: 'anti_sway',
    limitations: PROXY_NOTE,
    series: series.comX.map((x) => Math.round(x * 100)),
  });

  metrics.push({
    id: 'spine_change',
    name: 'Posture / Spine-Angle Change',
    value: spineChange,
    unit: '°',
    normalizedScore: lowerBetter(spineChange, 8, 30),
    confidence: conf,
    basis,
    phase: 'downswing',
    explanation: `Your spine tilt changed by about ${spineChange}° during the motion.`,
    whyItMatters: 'Big posture changes (early extension / standing up) move the strike point.',
    recommendedFix: 'Keep your chest covering the ball — maintain your forward tilt into contact.',
    drillId: 'posture_hold',
    limitations: PROXY_NOTE,
    series: series.spineTiltDeg.map((x) => Math.round(x)),
  });

  metrics.push({
    id: 'knee_flex',
    name: 'Lead-Knee Flex',
    value: kneeFlexDeg,
    unit: '°',
    normalizedScore: inRange(kneeFlexDeg, 15, 45, 30),
    confidence: conf * 0.8,
    basis,
    phase: 'setup',
    explanation: `Your lead knee bent about ${kneeFlexDeg}° from straight at its deepest.`,
    whyItMatters: 'Athletic knee flex stores ground force you can push back into the strike.',
    recommendedFix: 'Set up with soft, athletic knees — avoid locking out or squatting too low.',
    drillId: null,
    limitations: PROXY_NOTE,
  });

  metrics.push({
    id: 'tempo_ratio',
    name: 'Tempo Ratio (back : through)',
    value: tempoRatio,
    unit: ':1',
    normalizedScore: inRange(tempoRatio, 2.5, 3.5, 2),
    confidence: conf * 0.7,
    basis,
    phase: 'overall',
    explanation: `Your back-to-through timing was about ${tempoRatio} : 1.`,
    whyItMatters: 'A smooth, repeatable tempo (often near 3:1 in golf) helps everything sync up.',
    recommendedFix: 'Count a smooth "one-two" back and a quicker "three" through.',
    drillId: 'metronome_tempo',
    limitations: PROXY_NOTE + ' Tempo depends on the detected strike frame and frame rate.',
  });

  metrics.push({
    id: 'balance_finish',
    name: 'Finish Balance',
    value: balanceDriftPct,
    unit: '% frame',
    normalizedScore: lowerBetter(balanceDriftPct, 4, 18),
    confidence: conf,
    basis,
    phase: 'finish',
    explanation: `Your head drifted about ${balanceDriftPct}% of frame width during the finish.`,
    whyItMatters: 'Holding a balanced finish is a sign the whole motion was under control.',
    recommendedFix: 'Hold your finish for a two-count — if you can’t, the sequence needs work.',
    drillId: 'hold_finish',
    limitations: PROXY_NOTE,
  });

  metrics.push({
    id: 'hand_speed_peak',
    name: 'Peak Hand Speed (relative)',
    value: handSpeedPeak,
    unit: 'units/s',
    normalizedScore: clamp(Math.round(handSpeedPeak * 35), 20, 100),
    confidence: conf * 0.7,
    basis,
    phase: phaseFor(handPeak),
    explanation: 'Relative speed of your lead hand at its fastest point.',
    whyItMatters: 'Hand speed is a rough proxy for how much speed reaches the implement.',
    recommendedFix: 'Speed comes from sequence and separation, not from swinging harder with the arms.',
    drillId: 'speed_swish',
    limitations: PROXY_NOTE + ' This is a normalized image-space speed, not mph.',
    series: series.leadWristV.map((v) => +v.toFixed(2)),
  });

  metrics.push({
    id: 'rom',
    name: 'Range of Motion',
    value: rom,
    unit: '°',
    normalizedScore: inRange(rom, 60, 120, 60),
    confidence: conf,
    basis,
    phase: 'overall',
    explanation: `Total rotational range across the motion was about ${rom}°.`,
    whyItMatters: 'Enough range lets you build speed; too much can cost control.',
    recommendedFix: 'Match your range to what you can control and repeat.',
    drillId: null,
    limitations: PROXY_NOTE,
  });

  // Repeatability needs multiple sessions — honest null on a single clip.
  metrics.push({
    id: 'repeatability',
    name: 'Repeatability Index',
    value: null,
    unit: '',
    normalizedScore: null,
    confidence: 0,
    basis: 'placeholder',
    phase: 'overall',
    explanation: 'How consistent this motion is across multiple reps.',
    whyItMatters: 'Consistency separates good players from great ones.',
    recommendedFix: 'Analyse several swings — Motion Lab will track repeatability across sessions.',
    drillId: null,
    limitations: 'Cannot be computed from a single clip. Needs 3+ analysed motions.',
  });

  return metrics;
}
