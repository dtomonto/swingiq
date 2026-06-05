// ============================================================
// SwingVantage — Motion Lab: Biomechanics Engine
// ------------------------------------------------------------
// Turns a real MediaPipe pose track into (a) per-frame signal series
// used by the timeline, 3D viewer, and scoring, and (b) a set of
// honest, proxy-labeled biomechanical metrics.
//
// 3D-AWARE: rotation, separation, and sequencing are read from the
// DEPTH (z) axis the pipeline reconstructs — true axial turn lives in
// the transverse plane, which a face-on camera barely shows in the
// image plane. When depth is flat/noisy we fall back to the 2D image
// estimate and lower the confidence, so nothing over-claims.
//
// HONESTY: single-camera 2D+depth values are PROXIES, not lab
// measurements; multi-view triangulation upgrades the basis to
// 'measured'. Reference ranges are clearly-labeled starter heuristics.
// ============================================================

import type {
  MotionPoseTrack,
  MotionPoseFrame,
  CaptureContext,
  MotionMetric,
  MotionPhaseSegment,
} from './types';
import { isRotationalMotion } from './taxonomy';
import { scoreMetric, metricTarget, type MotionSkillLevel } from './referenceRanges';
import {
  headingDeg,
  unwrapDeg,
  span,
  depthReliability,
  blendByReliability,
  detectTopFrame,
  angularVelocityDeg,
  argmax,
} from './kinematics3d';

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
  return span(v);
}
function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
function median(v: number[]): number {
  if (v.length === 0) return 0;
  const s = [...v].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
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
  /** Image-plane orientation of the shoulder line (deg) — kept for the 2D fallback. */
  shoulderLineDeg: number[];
  hipLineDeg: number[];
  /** Spine tilt from vertical, hips→shoulders (deg). */
  spineTiltDeg: number[];
  headX: number[];
  comX: number[];
  comZ: number[];
  leadWristV: number[];
  shoulderV: number[];
  hipV: number[];
  /** Combined whole-body motion energy per frame (0+). */
  energy: number[];
  /** Index of peak lead-wrist speed — the dynamic "strike" frame. */
  peakFrame: number;

  // ── 3D rotational kinematics (depth-aware) ──────────────────
  /** Unwrapped horizontal-plane heading of the shoulder line (deg). */
  shoulderHeadingDeg: number[];
  hipHeadingDeg: number[];
  /** Heading relative to the setup pose (deg) — the coil "over time". */
  relShoulderTurn: number[];
  relHipTurn: number[];
  /** |shoulder − hip| relative turn per frame (deg) — separation over time. */
  separationDeg: number[];
  /** Angular velocity of the segment headings (deg/s) — drives sequencing. */
  shoulderAngVel: number[];
  hipAngVel: number[];
  /** 0..1 — how much real depth signal drove the rotation reads. */
  depthReliability: number;
  /** Detected top-of-backswing (reversal) frame, or −1 when none is clear. */
  topFrame: number;
  /** Blended (3D where reliable, else 2D) rotation magnitudes (deg). */
  shoulderTurnDeg: number;
  hipTurnDeg: number;
  xFactorDeg: number;
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

/** 3D speed (units/s) — includes the depth axis the pipeline reconstructs. */
function speedSeries(points: Pt[], tMs: number[]): number[] {
  const out = new Array(points.length).fill(0);
  for (let i = 1; i < points.length; i++) {
    const dt = Math.max(1, tMs[i] - tMs[i - 1]) / 1000;
    const d = Math.hypot(
      points[i].x - points[i - 1].x,
      points[i].y - points[i - 1].y,
      points[i].z - points[i - 1].z,
    );
    out[i] = d / dt;
  }
  if (out.length > 1) out[0] = out[1];
  return out;
}

/** Mean of the first `n` entries of a series (the setup/address reference). */
function setupMean(series: number[], n: number): number {
  const k = Math.max(1, Math.min(series.length, n));
  let s = 0;
  for (let i = 0; i < k; i++) s += series[i];
  return s / k;
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
  const comZ: number[] = [];

  const leadWristPts: Pt[] = [];
  const shoulderMidPts: Pt[] = [];
  const hipMidPts: Pt[] = [];

  // Raw horizontal-plane headings + segment depth/width for reliability.
  const shoulderHeadingRaw: number[] = [];
  const hipHeadingRaw: number[] = [];
  const shoulderDz: number[] = [];
  const hipDz: number[] = [];
  const shoulderLen: number[] = [];
  const hipLen: number[] = [];

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
    comZ.push(hMid.z);

    leadWristPts.push(pt(f, lwIdx));
    shoulderMidPts.push(sMid);
    hipMidPts.push(hMid);

    // Horizontal-plane heading uses width (x) and depth (z); y is ignored.
    const sdx = rs.x - ls.x;
    const sdz = rs.z - ls.z;
    const hdx = rh.x - lh.x;
    const hdz = rh.z - lh.z;
    shoulderHeadingRaw.push(headingDeg(sdx, sdz));
    hipHeadingRaw.push(headingDeg(hdx, hdz));
    shoulderDz.push(sdz);
    hipDz.push(hdz);
    shoulderLen.push(Math.hypot(sdx, sdz));
    hipLen.push(Math.hypot(hdx, hdz));
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

  // ── 3D rotational kinematics ──────────────────────────────────
  const shoulderHeadingDeg = unwrapDeg(shoulderHeadingRaw);
  const hipHeadingDeg = unwrapDeg(hipHeadingRaw);
  const setupN = Math.max(1, Math.round(frames.length * 0.08));
  const sRef = setupMean(shoulderHeadingDeg, setupN);
  const hRef = setupMean(hipHeadingDeg, setupN);
  const relShoulderTurn = shoulderHeadingDeg.map((v) => v - sRef);
  const relHipTurn = hipHeadingDeg.map((v) => v - hRef);
  const separationDeg = relShoulderTurn.map((v, i) => Math.abs(v - relHipTurn[i]));

  const shoulderAngVel = angularVelocityDeg(shoulderHeadingDeg, tMs);
  const hipAngVel = angularVelocityDeg(hipHeadingDeg, tMs);

  // Depth reliability: a real turn swings depth by a chunk of segment length.
  const sRel = depthReliability(span(shoulderDz), median(shoulderLen));
  const hRel = depthReliability(span(hipDz), median(hipLen));
  const depthRel = +(0.5 * (sRel + hRel)).toFixed(3);
  const topFrame = detectTopFrame(leadWristPts.map((p) => p.y), peakFrame);

  // Coil = peak relative heading from setup to the strike. 3D when reliable,
  // else the 2D image-tilt range over the same window.
  const toStrike = Math.max(2, Math.min(frames.length - 1, peakFrame));
  const shoulderTurn3D = Math.max(...relShoulderTurn.slice(0, toStrike + 1).map(Math.abs));
  const hipTurn3D = Math.max(...relHipTurn.slice(0, toStrike + 1).map(Math.abs));
  const shoulderTurn2D = span(shoulderLineDeg.slice(0, toStrike + 1));
  const hipTurn2D = span(hipLineDeg.slice(0, toStrike + 1));
  const shoulderTurnDeg = blendByReliability(shoulderTurn3D, shoulderTurn2D, sRel);
  const hipTurnDeg = blendByReliability(hipTurn3D, hipTurn2D, hRel);

  // X-Factor = peak hip↔shoulder separation across the motion.
  const xFactor3D = Math.max(...separationDeg);
  const xFactor2D = span(shoulderLineDeg.map((s, i) => s - hipLineDeg[i]));
  const xFactorDeg = blendByReliability(xFactor3D, xFactor2D, depthRel);

  return {
    frames: frames.length,
    tMs,
    shoulderLineDeg,
    hipLineDeg,
    spineTiltDeg,
    headX,
    comX,
    comZ,
    leadWristV,
    shoulderV,
    hipV,
    energy,
    peakFrame,
    shoulderHeadingDeg,
    hipHeadingDeg,
    relShoulderTurn,
    relHipTurn,
    separationDeg,
    shoulderAngVel,
    hipAngVel,
    depthReliability: depthRel,
    topFrame,
    shoulderTurnDeg,
    hipTurnDeg,
    xFactorDeg,
  };
}

// ── Metric scoring helpers ────────────────────────────────────
// Metric → 0–100 scoring lives in referenceRanges.ts (skill-segmented),
// so the engine stays focused on geometry and the heuristics stay swappable.

const PROXY_NOTE =
  'Single-camera proxy from estimated 3D pose — directional, not a lab measurement. Reference ranges are starter heuristics.';
const DEPTH_NOTE =
  'Read from the reconstructed depth (transverse-plane) axis — true axial rotation a face-on camera cannot see in 2D.';
const DEPTH_FALLBACK_NOTE =
  'Depth signal was weak for this clip, so rotation fell back to the 2D image estimate (lower confidence). A cleaner side/face-on angle or two-camera capture sharpens this.';

/** A note that reflects whether depth actually drove a rotation read. */
function rotationNote(depthRel: number, measured: boolean): string {
  if (measured) return DEPTH_NOTE + ' Basis: measured (multi-view triangulation).';
  if (depthRel >= 0.35) return PROXY_NOTE + ' ' + DEPTH_NOTE;
  return PROXY_NOTE + ' ' + DEPTH_FALLBACK_NOTE;
}

// ── The metric engine ─────────────────────────────────────────

export function computeMetrics(
  track: MotionPoseTrack,
  capture: CaptureContext,
  series: MotionSeries | null,
  phases: MotionPhaseSegment[],
): MotionMetric[] {
  const conf = track.trackingConfidence;
  const basis = track.basis;
  const measured = basis === 'measured';
  const rotational = isRotationalMotion(capture.sport, capture.motionType);
  const skill: MotionSkillLevel = capture.skillLevel ?? 'intermediate';

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

  // Depth-aware confidence multiplier for rotation reads: full when measured or
  // depth-rich, reduced (honestly) when we fell back to the 2D estimate.
  const depthConf = measured ? 1 : 0.55 + 0.45 * series.depthReliability;

  const shoulderTurn = Math.round(series.shoulderTurnDeg);
  const hipTurn = Math.round(series.hipTurnDeg);
  const xFactor = Math.round(series.xFactorDeg);
  const headSwayPct = Math.round(range(series.headX) * 100);
  const pelvisSwayPct = Math.round(range(series.comX) * 100);
  const spineChange = Math.round(range(series.spineTiltDeg));

  // Sway vs turn: how much of the pelvis motion is lateral slide (x) versus
  // depth/rotation (z). High lateral share = "slider"; low = "rotator".
  const lateral = range(series.comX);
  const depthMove = range(series.comZ);
  const turnShare = Math.round((depthMove / (lateral + depthMove + 1e-4)) * 100);

  // knee flex (lead leg) minimum interior angle
  const [hipI, kneeI, ankleI] = leadKneeIndices(capture);
  let minKnee = 180;
  for (const f of track.frames) {
    const a = angleAt(pt(f, hipI), pt(f, kneeI), pt(f, ankleI));
    if (a < minKnee) minKnee = a;
  }
  const kneeFlexDeg = Math.round(180 - minKnee); // how much the knee bends from straight

  // tempo ratio (backswing : downswing) around the top + strike when known.
  const peak = series.peakFrame;
  const pivot = series.topFrame > 0 ? series.topFrame : peak;
  const back = Math.max(1, pivot);
  const down = Math.max(1, series.frames - 1 - pivot);
  const tempoRatio = +(back / down).toFixed(1);

  // balance at finish — head horizontal drift over final 15%
  const tail = Math.max(2, Math.round(series.frames * 0.15));
  const finishHead = series.headX.slice(-tail);
  const balanceDriftPct = Math.round(range(finishHead) * 100);

  // sequencing — do hips peak before shoulders before hands? Use angular
  // velocity of the segment headings when depth is reliable (textbook kinematic
  // sequence), else the linear mid-point speeds.
  const useAngular = series.depthReliability > 0.4;
  const hipPeak = useAngular ? argmax(series.hipAngVel) : argmax(series.hipV);
  const shPeak = useAngular ? argmax(series.shoulderAngVel) : argmax(series.shoulderV);
  const handPeak = series.peakFrame;
  let ordered = 0;
  if (hipPeak <= shPeak) ordered++;
  if (shPeak <= handPeak) ordered++;
  const sequencingScore = ordered === 2 ? 92 : ordered === 1 ? 60 : 30;

  const handSpeedPeak = +Math.max(...series.leadWristV).toFixed(2);
  const rom = Math.round(Math.max(series.shoulderTurnDeg, range(series.relShoulderTurn)));

  const metrics: MotionMetric[] = [];

  if (rotational) {
    metrics.push({
      id: 'shoulder_turn',
      name: 'Shoulder Rotation',
      value: shoulderTurn,
      unit: '°',
      normalizedScore: scoreMetric('shoulder_turn', shoulderTurn, skill),
      target: metricTarget('shoulder_turn', skill),
      confidence: +(conf * depthConf).toFixed(3),
      basis,
      phase: series.topFrame > 0 ? phaseFor(series.topFrame) : 'top',
      explanation: `Your shoulders turned about ${shoulderTurn}° away from address at the top — measured around your spine, not just the tilt the camera sees.`,
      whyItMatters: 'Shoulder turn stores the energy that becomes clubhead/bat/racket speed.',
      recommendedFix: shoulderTurn < 70 ? 'Work on a fuller turn — feel your back to the target at the top.' : 'Good range — keep it controlled and repeatable.',
      drillId: 'rotation_load',
      limitations: rotationNote(series.depthReliability, measured),
      series: series.relShoulderTurn.map((v) => Math.round(v)),
    });
    metrics.push({
      id: 'hip_turn',
      name: 'Hip Rotation',
      value: hipTurn,
      unit: '°',
      normalizedScore: scoreMetric('hip_turn', hipTurn, skill),
      target: metricTarget('hip_turn', skill),
      confidence: +(conf * depthConf).toFixed(3),
      basis,
      phase: series.topFrame > 0 ? phaseFor(series.topFrame) : 'top',
      explanation: `Your hips turned roughly ${hipTurn}° from address at the top, measured around the spine axis.`,
      whyItMatters: 'Hips lead the downswing — too little or too much changes your power and path.',
      recommendedFix: 'Let the hips start down first, but keep them quieter than the shoulders going back.',
      drillId: 'hip_lead',
      limitations: rotationNote(series.depthReliability, measured),
      series: series.relHipTurn.map((v) => Math.round(v)),
    });
    metrics.push({
      id: 'hip_shoulder_sep',
      name: 'Hip–Shoulder Separation (X-Factor)',
      value: xFactor,
      unit: '°',
      normalizedScore: scoreMetric('hip_shoulder_sep', xFactor, skill),
      target: metricTarget('hip_shoulder_sep', skill),
      confidence: +(conf * depthConf * 0.95).toFixed(3),
      basis,
      phase: 'transition',
      explanation: `Peak stretch between your shoulder and hip turn was about ${xFactor}° — the coil that snaps through the ball.`,
      whyItMatters: 'Separation is the "stretch" that creates speed — the engine of a powerful motion.',
      recommendedFix: 'Feel the hips start down while the chest still points back — that builds the stretch.',
      drillId: 'separation_step',
      limitations: rotationNote(series.depthReliability, measured),
      series: series.separationDeg.map((v) => Math.round(v)),
    });
  }

  metrics.push({
    id: 'sequencing',
    name: 'Kinematic Sequencing',
    value: sequencingScore,
    unit: '/100',
    normalizedScore: sequencingScore,
    confidence: +(conf * (useAngular ? 0.85 : 0.7)).toFixed(3),
    basis,
    phase: 'downswing',
    explanation:
      ordered === 2
        ? 'Your hips, then shoulders, then hands peaked in the right order.'
        : 'The order your hips, shoulders, and hands sped up was out of sequence.',
    whyItMatters: 'Energy should flow ground-up: hips → torso → arms → implement. Out of order leaks power.',
    recommendedFix: 'Start the downswing from the ground up — feel the lead hip clear before the hands fire.',
    drillId: 'sequence_pump',
    limitations: useAngular
      ? PROXY_NOTE + ' Order is read from the angular velocity of your hips vs shoulders (depth-aware).'
      : PROXY_NOTE + ' Depth was too flat to use rotation speed, so order is read from linear motion (lower confidence).',
  });

  metrics.push({
    id: 'head_stability',
    name: 'Head Stability',
    value: headSwayPct,
    unit: '% frame',
    normalizedScore: scoreMetric('head_stability', headSwayPct, skill),
    target: metricTarget('head_stability', skill),
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
    normalizedScore: scoreMetric('pelvis_sway', pelvisSwayPct, skill),
    target: metricTarget('pelvis_sway', skill),
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

  // 3D-native: how much of the pelvis motion is rotation vs lateral slide.
  metrics.push({
    id: 'rotation_quality',
    name: 'Rotation vs Slide',
    value: turnShare,
    unit: '% turn',
    normalizedScore: scoreMetric('rotation_quality', turnShare, skill),
    target: metricTarget('rotation_quality', skill),
    confidence: +(conf * depthConf).toFixed(3),
    basis,
    phase: 'downswing',
    explanation: `About ${turnShare}% of your pelvis motion was rotation (around the spine) versus sliding sideways.`,
    whyItMatters: 'Power comes from turning around a stable centre — sliding leaks it and moves your low point.',
    recommendedFix: turnShare < 55 ? 'Feel like you turn in a barrel — rotate the belt buckle, don’t slide it.' : 'Good rotational quality — keep turning around a stable centre.',
    drillId: 'anti_sway',
    limitations: rotationNote(series.depthReliability, measured) + ' Compares depth (rotation) vs lateral (slide) pelvis travel.',
  });

  metrics.push({
    id: 'spine_change',
    name: 'Posture / Spine-Angle Change',
    value: spineChange,
    unit: '°',
    normalizedScore: scoreMetric('spine_change', spineChange, skill),
    target: metricTarget('spine_change', skill),
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
    normalizedScore: scoreMetric('knee_flex', kneeFlexDeg, skill),
    target: metricTarget('knee_flex', skill),
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
    normalizedScore: scoreMetric('tempo_ratio', tempoRatio, skill),
    target: metricTarget('tempo_ratio', skill),
    confidence: conf * (series.topFrame > 0 ? 0.8 : 0.65),
    basis,
    phase: 'overall',
    explanation: `Your back-to-through timing was about ${tempoRatio} : 1${series.topFrame > 0 ? ' (measured from the detected top of your backswing)' : ''}.`,
    whyItMatters: 'A smooth, repeatable tempo (often near 3:1 in golf) helps everything sync up.',
    recommendedFix: 'Count a smooth "one-two" back and a quicker "three" through.',
    drillId: 'metronome_tempo',
    limitations: PROXY_NOTE + (series.topFrame > 0 ? '' : ' Tempo uses the strike frame as the pivot because no clear top was detected.'),
  });

  metrics.push({
    id: 'balance_finish',
    name: 'Finish Balance',
    value: balanceDriftPct,
    unit: '% frame',
    normalizedScore: scoreMetric('balance_finish', balanceDriftPct, skill),
    target: metricTarget('balance_finish', skill),
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
    normalizedScore: scoreMetric('hand_speed_peak', handSpeedPeak, skill),
    target: metricTarget('hand_speed_peak', skill),
    confidence: conf * 0.7,
    basis,
    phase: phaseFor(handPeak),
    explanation: 'Relative speed of your lead hand at its fastest point (3D — includes depth).',
    whyItMatters: 'Hand speed is a rough proxy for how much speed reaches the implement.',
    recommendedFix: 'Speed comes from sequence and separation, not from swinging harder with the arms.',
    drillId: 'speed_swish',
    limitations: PROXY_NOTE + ' This is a normalized 3D speed, not mph.',
    series: series.leadWristV.map((v) => +v.toFixed(2)),
  });

  metrics.push({
    id: 'rom',
    name: 'Range of Motion',
    value: rom,
    unit: '°',
    normalizedScore: scoreMetric('rom', rom, skill),
    target: metricTarget('rom', skill),
    confidence: +(conf * depthConf).toFixed(3),
    basis,
    phase: 'overall',
    explanation: `Total rotational range across the motion was about ${rom}°.`,
    whyItMatters: 'Enough range lets you build speed; too much can cost control.',
    recommendedFix: 'Match your range to what you can control and repeat.',
    drillId: null,
    limitations: rotationNote(series.depthReliability, measured),
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
