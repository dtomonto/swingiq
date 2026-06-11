'use client';

// ============================================================
// SwingVantage — Live Kinematic Panel
//
// The animated "Kinematic tracking active" visual on the home hero (and
// reused on /demo). A fully-articulated athlete swings on a loop while an
// accent skeleton overlay tracks every joint — and EACH SPORT SWINGS ITS OWN
// WAY: golf is a tall vertical swing off the turf, baseball/softball a flatter
// rotational swing with the bat cocked over the shoulder and a waist-high
// contact, tennis a forehand drive with contact out front, pickleball/padel a
// compact punch. Metric chips read values DERIVED FROM THE LIVE POSE.
//
// Realism stack: 2-D skeletal rig (pelvis/spine/shoulder rotation, two-bone IK
// arms + legs, wrist hinge, weight shift) through per-sport swing keyframes ·
// volumetric tapered body w/ rim light + depth shading · follow-through head
// swivel · ball-flight + impact flash + turf divot (golf) + foot-pressure
// plates · live kinematic-sequence bars · shaft flex + speed comet · camera
// breath + vignette + perspective floor · mocap chrome (REC timecode, frame
// counter, tracking reticle).
//
// Deterministic from a single rAF clock. Respects prefers-reduced-motion
// (holds impact). aria-hidden decorative. No assets, no fabricated data.
// ============================================================

import { useEffect, useMemo, useRef, useState } from 'react';
import { KINEMATIC_SPORTS, type KinematicMetric, type KinematicSport } from '@/lib/demo/kinematic-sports';

const SWING_MS = 4200; // one full swing loop
const SWINGS_PER_SPORT = 2; // dwell ~8.4s per sport
const RESET_FROM = 0.95; // u≥ this is the loop "cut" back to setup
const CAPTURE_FPS = 120; // implied high-speed capture (frame counter)
const IMPACT_U = 0.62; // reference contact (head-swivel / GRF / flex centre)

const DEG = Math.PI / 180;
const VB_W = 260;
const VB_H = 230;
const GROUND_Y = 210;

type Pt = { x: number; y: number };
const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

// ── Implement geometry per kind ───────────────────────────────────────────
const IMPLEMENTS: Record<string, { len: number; width: number; head: 'club' | 'oval' | 'paddle' | 'knob' }> = {
  club: { len: 82, width: 2.6, head: 'club' },
  bat: { len: 60, width: 4.2, head: 'knob' },
  racket: { len: 46, width: 2.4, head: 'oval' },
  paddle: { len: 40, width: 3.2, head: 'paddle' },
};

// ── Per-sport swing keyframes ──────────────────────────────────────────────
// Row = [u, phi, hip, sh, wt, knee, wrist, side, head]
//   phi   hand-orbit angle (deg from straight-down, + = backswing/trail side)
//   hip   pelvis rotation (deg, + = coiled to trail, − = open to target)
//   sh    shoulder rotation (deg)
//   wt    lateral pelvis shift (px, + = trail foot)
//   knee  flex factor 0..1
//   wrist club-angle vs lead arm (×88° hinge; may be negative = level/forward)
//   side  lateral spine offset (px)
//   head  head lateral drift (px)
type Pose = { phi: number; hip: number; sh: number; wt: number; knee: number; wrist: number; side: number; head: number };

interface SwingProfile {
  keys: number[][];
  contact: Pt; // where the strike happens / ball sits
  groundStrike: boolean; // turf divot
  launch: Pt; // ball-flight direction (x: lateral, y: vertical; negative y = up)
  impactU: number;
}

// GOLF — tall vertical swing, ball on the turf, club way overhead at the top.
const GOLF: SwingProfile = {
  keys: [
    [0.0, 10, 0, 0, 0, 0.5, 0.15, 0, 0],
    [0.08, 42, 8, 24, 3, 0.5, 0.3, 2, 1],
    [0.22, 98, 24, 60, 7, 0.46, 0.72, 4, 2],
    [0.38, 176, 44, 96, 9, 0.46, 1.0, 6, 2],
    [0.46, 150, 30, 84, 2, 0.52, 1.0, 4, 1],
    [0.55, 72, -2, 46, -4, 0.56, 0.85, -2, 0],
    [0.62, 8, -22, 20, -7, 0.5, 0.2, -8, -1],
    [0.7, -64, -40, -18, -9, 0.46, 0.3, -6, -2],
    [0.8, -150, -52, -72, -9, 0.4, 0.7, -2, -3],
    [0.9, -188, -58, -92, -8, 0.36, 1.0, 2, -3],
    [0.95, -188, -58, -92, -8, 0.36, 1.0, 2, -3],
    [1.0, 10, 0, 0, 0, 0.5, 0.15, 0, 0],
  ],
  contact: { x: 148, y: GROUND_Y - 1 },
  groundStrike: true,
  launch: { x: -1, y: -0.62 },
  impactU: 0.62,
};

// BASEBALL / SOFTBALL — bat cocked over the rear shoulder, flat rotational
// swing through a waist-high contact out front, big wrap finish.
const BAT: SwingProfile = {
  keys: [
    [0.0, 132, 4, -8, 3, 0.55, 0.24, 0, 0], // stance — bat up over rear shoulder
    [0.14, 142, 16, 30, 6, 0.5, 0.28, 2, 1], // load
    [0.3, 134, 24, 56, 8, 0.48, 0.34, 3, 1], // stride (coil)
    [0.46, 108, 2, 34, 2, 0.52, 0.48, -1, 0], // hip fire — hips open, bat lags
    [0.6, -16, -28, 6, -6, 0.5, -0.9, -6, -1], // contact — level, out front
    [0.74, -82, -50, -54, -8, 0.46, -0.8, -4, -2], // extension
    [0.88, -150, -58, -78, -7, 0.42, -0.66, 0, -3], // finish — wrap
    [0.95, -150, -58, -78, -7, 0.42, -0.66, 0, -3],
    [1.0, 132, 4, -8, 3, 0.55, 0.24, 0, 0],
  ],
  contact: { x: 96, y: 150 },
  groundStrike: false,
  launch: { x: -1, y: -0.5 },
  impactU: 0.6,
};

// TENNIS — looping forehand: racket back, drive forward to a contact out front
// at chest height, finish up over the lead shoulder.
const RACKET: SwingProfile = {
  keys: [
    [0.0, 14, 0, 2, 0, 0.5, 0.0, 0, 0], // ready
    [0.1, 70, 15, 40, 4, 0.5, 0.32, 2, 1], // unit turn
    [0.26, 122, 28, 66, 7, 0.48, 0.52, 4, 1], // backswing loop
    [0.46, 58, 6, 40, 0, 0.52, 0.42, 0, 0], // forward swing
    [0.6, -24, -26, 10, -5, 0.5, -0.18, -4, -1], // contact — out front
    [0.78, -120, -46, -60, -7, 0.46, -0.34, -2, -2], // follow
    [0.9, -176, -52, -82, -6, 0.42, -0.5, 2, -3], // finish over shoulder
    [0.95, -176, -52, -82, -6, 0.42, -0.5, 2, -3],
    [1.0, 14, 0, 2, 0, 0.5, 0.0, 0, 0],
  ],
  contact: { x: 100, y: 138 },
  groundStrike: false,
  launch: { x: -1, y: -0.46 },
  impactU: 0.6,
};

// PICKLEBALL / PADEL — compact: short backswing, punchy forward stroke to a
// waist contact out front, short follow. Lower amplitude throughout.
const PADDLE: SwingProfile = {
  keys: [
    [0.0, 16, 0, 0, 0, 0.5, 0.0, 0, 0], // ready
    [0.12, 56, 10, 22, 3, 0.5, 0.26, 2, 1], // split / prep
    [0.3, 86, 18, 40, 5, 0.48, 0.36, 3, 1], // compact backswing
    [0.5, 30, 2, 20, 0, 0.52, 0.22, 0, 0], // forward swing
    [0.62, -16, -16, 8, -4, 0.5, -0.36, -3, -1], // contact
    [0.8, -70, -28, -32, -5, 0.46, -0.3, -1, -2], // recovery
    [0.92, -96, -34, -42, -4, 0.44, -0.2, 1, -2], // short follow
    [0.97, -96, -34, -42, -4, 0.44, -0.2, 1, -2],
    [1.0, 16, 0, 0, 0, 0.5, 0.0, 0, 0],
  ],
  contact: { x: 106, y: 150 },
  groundStrike: false,
  launch: { x: -1, y: -0.4 },
  impactU: 0.62,
};

// SOFTBALL (slow-pitch) — uppercut: deeper load, bat ascends through a lower
// contact, lofted launch (the high-arc ball, vs baseball's line drive).
const SOFTBALL: SwingProfile = {
  keys: [
    [0.0, 126, 4, -8, 3, 0.56, 0.28, 0, 0],
    [0.14, 138, 16, 30, 6, 0.5, 0.32, 2, 1],
    [0.3, 130, 24, 54, 8, 0.5, 0.38, 3, 1],
    [0.46, 96, 2, 32, 2, 0.6, 0.56, -1, 0], // deep knee — drop well under the ball
    [0.6, -26, -26, 8, -6, 0.58, -1.12, -7, -2], // contact — bat steeply up (big uppercut)
    [0.74, -82, -48, -52, -9, 0.4, -1.05, -4, -4], // tall vertical extension
    [0.88, -150, -56, -80, -7, 0.38, -0.78, 0, -4],
    [0.95, -150, -56, -80, -7, 0.38, -0.78, 0, -4],
    [1.0, 126, 4, -8, 3, 0.56, 0.28, 0, 0],
  ],
  contact: { x: 98, y: 162 },
  groundStrike: false,
  launch: { x: -1, y: -0.95 }, // towering high arc (vs baseball's flat liner)
  impactU: 0.6,
};

// PADEL — compact like pickleball but with a more upward, wristy flick (balls
// played off the back glass tend to be lifted), slightly larger than pickleball.
const PADEL: SwingProfile = {
  keys: [
    [0.0, 18, 0, 2, 0, 0.5, 0.0, 0, 0],
    [0.12, 44, 8, 16, 2, 0.5, 0.22, 1, 1], // very short prep
    [0.3, 66, 14, 30, 4, 0.48, 0.32, 2, 1], // compact backswing (shortest of all sports)
    [0.5, 28, 2, 18, 0, 0.52, 0.22, 0, 0],
    [0.62, -18, -16, 8, -4, 0.5, -0.34, -3, -1], // contact — upward flick off the glass
    [0.8, -62, -26, -30, -4, 0.46, -0.42, -1, -3], // short follow
    [0.92, -86, -32, -40, -3, 0.44, -0.28, 1, -3],
    [0.97, -86, -32, -40, -3, 0.44, -0.28, 1, -3],
    [1.0, 18, 0, 2, 0, 0.5, 0.0, 0, 0],
  ],
  contact: { x: 104, y: 144 },
  groundStrike: false,
  launch: { x: -1, y: -0.6 },
  impactU: 0.62,
};

const PROFILES: Record<string, SwingProfile> = { club: GOLF, bat: BAT, racket: RACKET, paddle: PADDLE };
// Per-sport overrides so every sport swings its own way — softball ≠ baseball,
// padel ≠ tennis — falling back to the implement family otherwise.
const PROFILE_BY_ID: Record<string, SwingProfile> = {
  golf: GOLF,
  baseball: BAT,
  softball_slow: SOFTBALL,
  softball_fast: BAT,
  tennis: RACKET,
  pickleball: PADDLE,
  padel: PADEL,
};
const profileFor = (sport: KinematicSport): SwingProfile => PROFILE_BY_ID[sport.id] ?? PROFILES[sport.implement] ?? GOLF;

const PHASE_BREAKS = [0, 0.08, 0.34, 0.5, 0.62, 0.78];

const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const mix = (lo: number, hi: number, t: number) => lo + (hi - lo) * t;

function poseAt(keys: number[][], u: number): Pose {
  let i = 0;
  while (i < keys.length - 2 && u >= keys[i + 1][0]) i++;
  const a = keys[i];
  const b = keys[i + 1];
  const span = b[0] - a[0] || 1;
  const t = smooth(clamp01((u - a[0]) / span));
  const lerp = (k: number) => a[k] + (b[k] - a[k]) * t;
  return { phi: lerp(1), hip: lerp(2), sh: lerp(3), wt: lerp(4), knee: lerp(5), wrist: lerp(6), side: lerp(7), head: lerp(8) };
}

/** Two-bone IK: joint position between root `a` and target `b`. */
function solveBone(a: Pt, b: Pt, l1: number, l2: number, sign: number): Pt {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  let d = Math.hypot(dx, dy);
  d = Math.min(l1 + l2 - 0.01, Math.max(Math.abs(l1 - l2) + 0.01, d));
  const base = Math.atan2(dy, dx);
  let cosA = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d);
  cosA = Math.min(1, Math.max(-1, cosA));
  const ang = base + sign * Math.acos(cosA);
  return { x: a.x + l1 * Math.cos(ang), y: a.y + l1 * Math.sin(ang) };
}

interface Rig {
  head: Pt; neck: Pt; pelvis: Pt;
  leadHip: Pt; trailHip: Pt; leadKnee: Pt; trailKnee: Pt; leadAnk: Pt; trailAnk: Pt;
  leadSh: Pt; trailSh: Pt; leadElbow: Pt; trailElbow: Pt; hands: Pt; clubEnd: Pt;
  look: number;
}

/** Ground-reaction vertical motion: load (squat) into transition, then thrust
 *  up through impact — the GRF pattern of a real swing. */
const groundReaction = (u: number) => 2.6 * Math.exp(-Math.pow((u - 0.45) / 0.05, 2)) - 4.2 * Math.exp(-Math.pow((u - 0.6) / 0.06, 2));

/** Shaft flex: loads/bows (lag) into the downswing, then kicks through release. */
const shaftBend = (u: number) => 9 * Math.exp(-Math.pow((u - 0.52) / 0.05, 2)) - 7.5 * Math.exp(-Math.pow((u - 0.66) / 0.045, 2));

function buildRig(p: Pose, implement: string, u: number): Rig {
  const cx = VB_W / 2;
  const pelvisY = 144 + (1 - p.knee) * 8 + groundReaction(u);
  const pelvis: Pt = { x: cx + p.wt, y: pelvisY };

  const hipHalf = 16 * Math.cos(p.hip * DEG);
  const hipDrop = Math.sin(p.hip * DEG) * 3;
  const leadHip: Pt = { x: pelvis.x - hipHalf, y: pelvis.y + hipDrop };
  const trailHip: Pt = { x: pelvis.x + hipHalf, y: pelvis.y - hipDrop };

  const neck: Pt = { x: pelvis.x + p.side, y: pelvis.y - 50 };
  const shHalf = 21 * Math.cos(p.sh * DEG);
  const shDrop = Math.sin(p.sh * DEG) * 5;
  const leadSh: Pt = { x: neck.x - shHalf, y: neck.y + shDrop };
  const trailSh: Pt = { x: neck.x + shHalf, y: neck.y - shDrop };

  const head: Pt = { x: neck.x + p.head, y: neck.y - 16 };

  const orbit: Pt = { x: neck.x, y: neck.y + 7 };
  const phi = p.phi * DEG;
  const R = 50;
  const hands: Pt = { x: orbit.x + R * Math.sin(phi), y: orbit.y + R * Math.cos(phi) };

  const leadAnk: Pt = { x: cx - 24, y: GROUND_Y };
  const trailAnk: Pt = { x: cx + 24, y: GROUND_Y };
  const leadKnee = solveBone(leadHip, leadAnk, 32, 32, -1);
  const trailKnee = solveBone(trailHip, trailAnk, 32, 32, 1);

  const leadElbow = solveBone(leadSh, hands, 22, 24, 1);
  const trailElbow = solveBone(trailSh, hands, 22, 24, -1);

  const impl = IMPLEMENTS[implement] ?? IMPLEMENTS.club;
  const psi = (p.phi + p.wrist * 88) * DEG;
  const clubEnd: Pt = { x: hands.x + impl.len * Math.sin(psi), y: hands.y + impl.len * Math.cos(psi) };

  const look = smooth(clamp01((u - IMPACT_U) / 0.26));

  return { head, neck, pelvis, leadHip, trailHip, leadKnee, trailKnee, leadAnk, trailAnk, leadSh, trailSh, leadElbow, trailElbow, hands, clubEnd, look };
}

const pathOf = (...pts: Pt[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

/** Tapered limb as a filled capsule hull between two joints (root ra → tip rb). */
function capsule(a: Pt, b: Pt, ra: number, rb: number): string {
  const d = Math.hypot(b.x - a.x, b.y - a.y) || 0.01;
  const ang = Math.atan2(b.y - a.y, b.x - a.x);
  const alpha = Math.acos(Math.min(1, Math.max(-1, (ra - rb) / d)));
  const p = (c: Pt, r: number, t: number): Pt => ({ x: c.x + r * Math.cos(t), y: c.y + r * Math.sin(t) });
  const A1 = p(a, ra, ang + alpha);
  const A2 = p(a, ra, ang - alpha);
  const B1 = p(b, rb, ang + alpha);
  const B2 = p(b, rb, ang - alpha);
  const f = (n: number) => n.toFixed(1);
  return `M${f(A1.x)} ${f(A1.y)}A${f(ra)} ${f(ra)} 0 1 0 ${f(A2.x)} ${f(A2.y)}L${f(B2.x)} ${f(B2.y)}A${f(rb)} ${f(rb)} 0 1 0 ${f(B1.x)} ${f(B1.y)}Z`;
}

function liveMetric(m: KinematicMetric, p: Pose, headSpeed: number): string {
  const [lo, hi] = m.range;
  const label = m.label.toLowerCase();
  let t: number;
  if (label.includes('hip rotation')) t = clamp01(Math.abs(p.hip) / 58);
  else if (label.includes('shoulder')) t = clamp01(Math.abs(p.sh) / 96);
  else if (label.includes('x-factor')) t = clamp01(Math.abs(p.sh - p.hip) / 55);
  else if (label.includes('speed') || m.unit === 'mph') t = headSpeed;
  else if (label.includes('sequencing')) t = clamp01(0.5 + headSpeed * 0.45);
  else if (m.unit === ':1') t = 0.5 + Math.sin(p.phi * DEG) * 0.06;
  else t = clamp01(0.5 + Math.sin((p.phi + 40) * DEG) * 0.45);
  return mix(lo, hi, clamp01(t)).toFixed(m.unit === ':1' ? 1 : 0);
}

function phaseLabel(sport: KinematicSport, u: number): string {
  let idx = 0;
  for (let i = 0; i < PHASE_BREAKS.length; i++) if (u >= PHASE_BREAKS[i]) idx = i;
  const n = sport.phases.length;
  return sport.phases[Math.min(n - 1, Math.round((idx / 5) * (n - 1)))];
}

/** Kinematic-sequence activation (hips→torso→arms→club firing order). */
function sequenceBars(keys: number[][], u: number, implement: string): { key: string; v: number }[] {
  const du = 0.012;
  const u0 = Math.max(0, u - du);
  const a = poseAt(keys, u0);
  const b = poseAt(keys, u);
  const ra = buildRig(a, implement, u0);
  const rb = buildRig(b, implement, u);
  return [
    { key: 'HIP', v: clamp01(Math.abs(b.hip - a.hip) / du / 320) },
    { key: 'TOR', v: clamp01(Math.abs(b.sh - a.sh) / du / 520) },
    { key: 'ARM', v: clamp01(dist(ra.hands, rb.hands) / du / 900) },
    { key: 'CLB', v: clamp01(dist(ra.clubEnd, rb.clubEnd) / du / 2600) },
  ];
}

const timecode = (ms: number) => {
  const total = Math.floor(ms);
  const s = Math.floor(total / 1000);
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  const ff = String(Math.floor(((total % 1000) / 1000) * CAPTURE_FPS)).padStart(2, '0');
  return `${mm}:${ss}:${ff}`;
};

export function LiveKinematicPanel({ className = '' }: { className?: string }) {
  const [reduced, setReduced] = useState(false);
  const [clock, setClock] = useState({ u: 0, sportIdx: 0, t: 0 });
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (reduced) {
      setClock({ u: IMPACT_U, sportIdx: 0, t: IMPACT_U * SWING_MS });
      return;
    }
    let raf = 0;
    const loop = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const swings = elapsed / SWING_MS;
      setClock({ u: swings % 1, sportIdx: Math.floor(swings / SWINGS_PER_SPORT) % KINEMATIC_SPORTS.length, t: elapsed });
      raf = window.requestAnimationFrame(loop);
    };
    raf = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(raf);
  }, [reduced]);

  const sport = KINEMATIC_SPORTS[clock.sportIdx];
  const accent = sport.accent;
  const u = clock.u;
  const profile = profileFor(sport);
  const keys = profile.keys;
  const contact = profile.contact;
  const impactU = profile.impactU;
  const pose = poseAt(keys, u);
  const rig = useMemo(() => buildRig(pose, sport.implement, u), [pose, sport.implement, u]);
  const inReset = u >= RESET_FROM;
  const downswing = u >= impactU - 0.12 && u <= impactU + 0.04;

  const trail = useMemo(() => {
    if (reduced || inReset) return [] as Pt[];
    const pts: Pt[] = [];
    for (let k = 9; k >= 0; k--) {
      const uu = u - k * 0.013;
      if (uu < 0) continue;
      pts.push(buildRig(poseAt(keys, uu), sport.implement, uu).clubEnd);
    }
    return pts;
  }, [u, keys, sport.implement, reduced, inReset]);

  const shaftGhosts = useMemo(() => {
    if (reduced || !downswing) return [] as { a: Pt; b: Pt }[];
    const g: { a: Pt; b: Pt }[] = [];
    for (let k = 1; k <= 3; k++) {
      const uu = u - k * 0.022;
      if (uu < impactU - 0.18) continue;
      const r = buildRig(poseAt(keys, uu), sport.implement, uu);
      g.push({ a: r.hands, b: r.clubEnd });
    }
    return g;
  }, [u, keys, sport.implement, reduced, downswing, impactU]);

  const headSpeed = useMemo(() => {
    if (trail.length < 2) return 0.1;
    return clamp01(dist(trail[trail.length - 2], trail[trail.length - 1]) / 26);
  }, [trail]);

  // Ball: golf rests on the turf; air sports get an incoming ball, then launch.
  const ball = useMemo(() => {
    if (reduced) return { x: contact.x, y: contact.y, op: 1, trail: [] as Pt[] };
    if (inReset) return { x: contact.x, y: contact.y, op: 0, trail: [] };
    if (u >= impactU) {
      const D = VB_W + 40;
      const rise = -profile.launch.y * 340;
      const grav = rise * 0.33;
      const flight = (f: number): Pt => ({ x: contact.x + profile.launch.x * f * D, y: contact.y - rise * f + grav * f * f });
      const f = clamp01((u - impactU) / 0.31);
      const tr: Pt[] = [];
      for (let k = 1; k <= 5; k++) tr.push(flight(Math.max(0, f - k * 0.05)));
      return { ...flight(f), op: 1 - clamp01((f - 0.8) / 0.2), trail: tr };
    }
    if (profile.groundStrike) return { x: contact.x, y: contact.y, op: 1, trail: [] };
    // incoming ball arcs in from the far side just before contact
    const pre = clamp01((u - (impactU - 0.14)) / 0.14);
    return { x: contact.x + (1 - pre) * 70, y: contact.y - (1 - pre) * 46, op: pre, trail: [] };
  }, [u, contact, impactU, profile.groundStrike, profile.launch, reduced, inReset]);

  const flash = reduced ? 0 : Math.exp(-Math.pow((u - impactU) / 0.022, 2));
  const dust = useMemo(() => {
    if (flash < 0.05) return [] as { x: number; y: number; r: number; o: number }[];
    return [0, 1, 2, 3, 4].map((i) => {
      const ang = -2.7 + i * 0.5;
      const reach = (6 + i * 3) * (1.2 - flash * 0.4);
      return { x: contact.x + Math.cos(ang) * reach, y: contact.y + Math.sin(ang) * reach * 0.7, r: 1 + i * 0.4, o: flash * (0.5 - i * 0.06) };
    });
  }, [flash, contact]);

  const divot = useMemo(() => {
    if (reduced || !profile.groundStrike) return [] as { x: number; y: number; r: number; o: number }[];
    const f = (u - impactU) / 0.13;
    if (f < 0 || f > 1) return [];
    return [0, 1, 2, 3, 4].map((i) => {
      const ang = -2.5 - i * 0.22;
      const sp = (11 + i * 4) * f;
      return { x: contact.x + Math.cos(ang) * sp, y: contact.y - Math.abs(Math.sin(ang)) * sp + 34 * f * f, r: 1.5 + i * 0.5, o: (1 - f) * 0.7 };
    });
  }, [u, impactU, contact, profile.groundStrike, reduced]);

  const leadPress = clamp01(0.5 - pose.wt / 18);
  const trailPress = clamp01(0.5 + pose.wt / 18);

  const plane = useMemo(() => {
    const a = buildRig(poseAt(keys, 0), sport.implement, 0);
    const dx = contact.x - a.trailSh.x;
    const dy = contact.y - a.trailSh.y;
    return { x1: contact.x + dx * 0.45, y1: contact.y + dy * 0.45, x2: a.trailSh.x - dx * 0.85, y2: a.trailSh.y - dy * 0.85 };
  }, [keys, contact, sport.implement]);

  const handPath = useMemo(() => {
    if (reduced || u < impactU - 0.14 || u > 0.9) return [] as Pt[];
    const pts: Pt[] = [];
    for (let s = impactU - 0.14; s <= u; s += 0.02) pts.push(buildRig(poseAt(keys, s), sport.implement, s).hands);
    return pts;
  }, [u, keys, sport.implement, reduced, impactU]);

  const shaft = useMemo(() => {
    const dx = rig.clubEnd.x - rig.hands.x;
    const dy = rig.clubEnd.y - rig.hands.y;
    const len = Math.hypot(dx, dy) || 1;
    const perp = { x: -dy / len, y: dx / len };
    const bend = reduced ? 0 : shaftBend(u) + headSpeed * 4;
    const mid = { x: (rig.hands.x + rig.clubEnd.x) / 2, y: (rig.hands.y + rig.clubEnd.y) / 2 };
    const ctrl = { x: mid.x + perp.x * bend, y: mid.y + perp.y * bend };
    const path = `M${rig.hands.x.toFixed(1)} ${rig.hands.y.toFixed(1)} Q${ctrl.x.toFixed(1)} ${ctrl.y.toFixed(1)} ${rig.clubEnd.x.toFixed(1)} ${rig.clubEnd.y.toFixed(1)}`;
    let comet: Pt | null = null;
    if (!reduced && headSpeed > 0.35 && trail.length > 1) {
      const prev = trail[trail.length - 2];
      const vx = rig.clubEnd.x - prev.x;
      const vy = rig.clubEnd.y - prev.y;
      const vl = Math.hypot(vx, vy) || 1;
      const reach = headSpeed * 20;
      comet = { x: rig.clubEnd.x - (vx / vl) * reach, y: rig.clubEnd.y - (vy / vl) * reach };
    }
    return { path, comet };
  }, [rig.clubEnd, rig.hands, u, headSpeed, reduced, trail]);

  const phase = phaseLabel(sport, u);
  const shownMetrics = useMemo(() => sport.metrics.slice(0, 3), [sport]);
  const seq = useMemo(() => sequenceBars(keys, reduced ? 0.55 : u, sport.implement), [u, keys, sport.implement, reduced]);
  const impl = IMPLEMENTS[sport.implement] ?? IMPLEMENTS.club;
  const frame = Math.floor(u * CAPTURE_FPS) + 1;

  const joints = [rig.head, rig.neck, rig.leadSh, rig.trailSh, rig.leadElbow, rig.trailElbow, rig.hands, rig.pelvis, rig.leadHip, rig.trailHip, rig.leadKnee, rig.trailKnee];
  const xs = joints.map((j) => j.x);
  const ys = joints.map((j) => j.y);
  const bb = { x0: Math.min(...xs) - 12, y0: Math.min(...ys) - 12, x1: Math.max(...xs) + 12, y1: Math.max(...ys) + 12 };

  const camS = reduced ? 1 : 1 + 0.018 * Math.sin(clock.t / 2200);
  const camX = reduced ? 0 : 1.4 * Math.sin(clock.t / 2600);
  const camY = reduced ? 0 : 1.2 * Math.sin(clock.t / 3100);
  const grey = 'hsl(var(--muted-foreground))';

  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-border bg-background ${className}`}
      style={{ ['--svq-accent' as string]: accent }}
      aria-hidden="true"
    >
      <style>{KEYFRAMES}</style>

      <div className="pointer-events-none absolute inset-0 opacity-[0.18] transition-colors duration-700" style={{ background: `radial-gradient(120% 90% at 50% 0%, ${accent}, transparent 60%)` }} />
      <div className="svq-grid pointer-events-none absolute inset-0 opacity-[0.07]" />
      <div className="pointer-events-none absolute inset-0" style={{ boxShadow: 'inset 0 0 60px 12px rgba(0,0,0,0.55)' }} />

      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="relative z-0 block h-full w-full">
        <defs>
          <radialGradient id="svq-floor" cx="50%" cy="100%" r="60%">
            <stop offset="0%" stopColor={accent} stopOpacity="0.3" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="svq-trail" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={accent} stopOpacity="0" />
            <stop offset="100%" stopColor={accent} stopOpacity="0.95" />
          </linearGradient>
          <filter id="svq-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="1.4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g opacity="0.5">
          {[-60, -30, 0, 30, 60].map((dx) => (
            <line key={dx} x1={VB_W / 2 + dx * 0.25} y1={GROUND_Y - 26} x2={VB_W / 2 + dx} y2={GROUND_Y + 14} stroke={accent} strokeWidth="0.6" opacity="0.18" />
          ))}
          {[0, 10, 22].map((dy) => (
            <line key={dy} x1={20 - dy * 0.3} x2={VB_W - 20 + dy * 0.3} y1={GROUND_Y + dy} y2={GROUND_Y + dy} stroke={accent} strokeWidth="0.6" opacity={0.22 - dy * 0.006} />
          ))}
        </g>
        <ellipse cx={VB_W / 2} cy={GROUND_Y + 6} rx="94" ry="12" fill="url(#svq-floor)" />

        <g transform={`translate(${camX} ${camY}) translate(${VB_W / 2} ${GROUND_Y}) scale(${camS}) translate(${-VB_W / 2} ${-GROUND_Y})`}>
          <ellipse cx={rig.pelvis.x} cy={GROUND_Y + 5} rx="32" ry="5.5" fill="#000" opacity="0.2" />
          <ellipse cx={rig.leadAnk.x} cy={GROUND_Y + 4} rx="11" ry="3.4" fill={accent} opacity={0.12 + leadPress * 0.5} />
          <ellipse cx={rig.trailAnk.x} cy={GROUND_Y + 4} rx="11" ry="3.4" fill={accent} opacity={0.12 + trailPress * 0.5} />

          <line x1={plane.x1} y1={plane.y1} x2={plane.x2} y2={plane.y2} stroke={accent} strokeWidth="1" strokeDasharray="3 4" opacity="0.16" />
          {handPath.length > 1 && <path d={pathOf(...handPath)} fill="none" stroke={accent} strokeWidth="1.2" strokeLinecap="round" opacity="0.22" />}
          {!reduced && <line className="svq-scan" x1="14" x2={VB_W - 14} y1="0" y2="0" stroke={accent} strokeWidth="1.5" opacity="0.4" />}

          {ball.trail.length > 1 && <path d={pathOf(...ball.trail, { x: ball.x, y: ball.y })} fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity={0.55 * ball.op} />}
          {ball.op > 0.02 && <circle cx={ball.x} cy={ball.y} r="2.6" fill="#fff" opacity={ball.op} />}
          {ball.op > 0.02 && <circle cx={ball.x} cy={ball.y} r="2.6" fill="none" stroke={accent} strokeWidth="0.8" opacity={ball.op} />}

          {/* ── athlete body (volumetric, depth-shaded) ────────────────── */}
          <g style={{ opacity: inReset ? 0.5 : 1, transition: 'opacity 120ms linear' }}>
            <path d={pathOf(rig.leadSh, rig.trailSh, rig.trailHip, rig.leadHip)} fill={grey} fillOpacity="0.2" stroke="none" />
            <g fill={grey} fillOpacity="0.22" stroke="none">
              <path d={capsule(rig.trailHip, rig.trailKnee, 6, 4.6)} />
              <path d={capsule(rig.trailKnee, rig.trailAnk, 4.6, 3.2)} />
              <path d={capsule(rig.trailSh, rig.trailElbow, 4, 3.2)} />
              <path d={capsule(rig.trailElbow, rig.hands, 3.2, 2.4)} />
            </g>
            <g fill={grey} fillOpacity="0.36" stroke="none">
              <path d={capsule(rig.pelvis, rig.neck, 7, 6)} />
              <path d={capsule(rig.leadHip, rig.leadKnee, 6, 4.6)} />
              <path d={capsule(rig.leadKnee, rig.leadAnk, 4.6, 3.2)} />
              <path d={capsule(rig.leadSh, rig.leadElbow, 4, 3.2)} />
              <path d={capsule(rig.leadElbow, rig.hands, 3.2, 2.4)} />
            </g>
            <g transform="translate(-0.9 -1.3)" fill={grey} fillOpacity="0.18" stroke="none">
              <path d={capsule(rig.leadHip, rig.leadKnee, 3, 2.3)} />
              <path d={capsule(rig.pelvis, rig.neck, 3.5, 3)} />
              <path d={capsule(rig.leadSh, rig.leadElbow, 2, 1.6)} />
            </g>
            <g stroke={grey} strokeOpacity="0.4" strokeWidth="5" strokeLinecap="round">
              <line x1={rig.leadAnk.x - 8} y1={GROUND_Y} x2={rig.leadAnk.x + 4} y2={GROUND_Y} />
              <line x1={rig.trailAnk.x - 4} y1={GROUND_Y} x2={rig.trailAnk.x + 8} y2={GROUND_Y} />
            </g>
            <g transform={`rotate(${mix(8, -14, rig.look)} ${rig.head.x} ${rig.head.y})`}>
              <ellipse cx={rig.head.x} cy={rig.head.y} rx="10.5" ry="11.5" fill={grey} fillOpacity="0.28" />
              <ellipse cx={rig.head.x} cy={rig.head.y} rx="10.5" ry="11.5" fill="none" stroke={grey} strokeOpacity="0.4" strokeWidth="1.3" />
              <circle cx={rig.head.x + mix(-1.5, -5, rig.look)} cy={rig.head.y + mix(4, -2, rig.look)} r="1.7" fill={accent} opacity="0.85" />
            </g>
          </g>

          {trail.length > 1 && <path d={pathOf(...trail)} fill="none" stroke="url(#svq-trail)" strokeWidth={2 + headSpeed * 4.5} strokeLinecap="round" opacity={0.35 + headSpeed * 0.5} />}

          {shaftGhosts.map((g, i) => (
            <line key={i} x1={g.a.x} y1={g.a.y} x2={g.b.x} y2={g.b.y} stroke={accent} strokeWidth={impl.width} strokeLinecap="round" opacity={0.16 * (shaftGhosts.length - i)} />
          ))}

          <g style={{ opacity: inReset ? 0.5 : 1 }}>
            {shaft.comet && <line x1={rig.clubEnd.x} y1={rig.clubEnd.y} x2={shaft.comet.x} y2={shaft.comet.y} stroke={accent} strokeWidth={3 + headSpeed * 3} strokeLinecap="round" opacity={headSpeed * 0.7} filter="url(#svq-glow)" />}
            <path d={shaft.path} fill="none" stroke={accent} strokeWidth={impl.width} strokeLinecap="round" filter="url(#svq-glow)" />
            {impl.head === 'club' && <circle cx={rig.clubEnd.x} cy={rig.clubEnd.y} r="3.2" fill={accent} filter="url(#svq-glow)" />}
            {impl.head === 'knob' && <circle cx={rig.clubEnd.x} cy={rig.clubEnd.y} r="2.4" fill={accent} />}
            {impl.head === 'oval' && <ellipse cx={rig.clubEnd.x} cy={rig.clubEnd.y} rx="7" ry="9" fill="none" stroke={accent} strokeWidth="1.8" filter="url(#svq-glow)" />}
            {impl.head === 'paddle' && <rect x={rig.clubEnd.x - 5} y={rig.clubEnd.y - 6} width="10" height="12" rx="3" fill="none" stroke={accent} strokeWidth="1.8" />}
          </g>

          {flash > 0.05 && (
            <g>
              <circle cx={contact.x} cy={contact.y} r={2 + (1 - flash) * 14} fill="none" stroke="#fff" strokeWidth={1.4 * flash} opacity={flash * 0.8} />
              <circle cx={contact.x} cy={contact.y} r={3.5 * flash} fill="#fff" opacity={flash} />
              {dust.map((d, i) => (
                <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={grey} opacity={d.o} />
              ))}
            </g>
          )}
          {divot.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="#7a6a45" opacity={d.o} />
          ))}

          <g stroke="var(--svq-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.92" className="transition-[stroke] duration-700">
            <path d={pathOf(rig.leadAnk, rig.leadKnee, rig.leadHip, rig.pelvis, rig.trailHip, rig.trailKnee, rig.trailAnk)} />
            <path d={pathOf(rig.pelvis, rig.neck)} />
            <path d={pathOf(rig.leadSh, rig.neck, rig.trailSh)} />
            <path d={pathOf(rig.leadSh, rig.leadElbow, rig.hands, rig.trailElbow, rig.trailSh)} />
            <line x1={rig.neck.x} y1={rig.neck.y} x2={rig.head.x} y2={rig.head.y} />
          </g>

          <g fill="var(--svq-accent)" className="transition-[fill] duration-700">
            {joints.map((j, i) => (
              <circle key={i} className={reduced ? '' : 'svq-joint'} cx={j.x} cy={j.y} r="2.5" style={{ animationDelay: `${i * 90}ms` }} />
            ))}
            <circle cx={rig.hands.x} cy={rig.hands.y} r="3.4" fill="none" stroke="var(--svq-accent)" strokeWidth="1.4" />
          </g>

          {!reduced && (
            <g stroke={accent} strokeWidth="1" fill="none" opacity="0.55">
              <path d={`M${bb.x0} ${bb.y0 + 8} L${bb.x0} ${bb.y0} L${bb.x0 + 8} ${bb.y0}`} />
              <path d={`M${bb.x1 - 8} ${bb.y0} L${bb.x1} ${bb.y0} L${bb.x1} ${bb.y0 + 8}`} />
              <path d={`M${bb.x0} ${bb.y1 - 8} L${bb.x0} ${bb.y1} L${bb.x0 + 8} ${bb.y1}`} />
              <path d={`M${bb.x1 - 8} ${bb.y1} L${bb.x1} ${bb.y1} L${bb.x1} ${bb.y1 - 8}`} />
            </g>
          )}
        </g>
      </svg>

      {/* ── HUD ───────────────────────────────────────────────────────── */}
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-3 py-2">
        <span className="inline-flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-foreground/80">
          <span className="svq-live h-1.5 w-1.5 rounded-full" style={{ background: '#ff4d4d' }} />
          REC
          <span className="tabular-nums text-foreground/55">{timecode(clock.t % (SWING_MS * SWINGS_PER_SPORT))}</span>
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide transition-colors duration-500" style={{ borderColor: `${accent}66`, color: accent, background: `${accent}14` }}>
          <span className="text-[11px] leading-none">{sport.emoji}</span>
          {sport.name}
        </span>
      </div>

      <div className="absolute right-2.5 top-9 z-10 flex flex-col items-end gap-1.5">
        {shownMetrics.map((m) => (
          <div key={m.label} className="rounded-md border border-border bg-card/80 px-2 py-1 text-right shadow-sm backdrop-blur-sm transition-shadow" style={flash > 0.2 ? { boxShadow: `0 0 ${6 + flash * 10}px ${accent}` } : undefined}>
            <div className="text-[8px] font-medium uppercase tracking-wide text-muted-foreground">{m.label}</div>
            <div className="font-heading text-[11px] font-bold leading-tight tabular-nums" style={{ color: accent }}>
              {liveMetric(m, pose, headSpeed)}
              <span className="ml-0.5 text-[8px] font-medium text-muted-foreground">{m.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="absolute left-2.5 top-9 z-10 rounded-md border border-border bg-card/70 px-2 py-1.5 backdrop-blur-sm">
        <div className="mb-1 text-[7px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Sequence</div>
        <div className="flex items-end gap-[3px]" style={{ height: 22 }}>
          {seq.map((b) => (
            <div key={b.key} className="flex flex-col items-center justify-end" style={{ height: '100%' }}>
              <div className="w-[5px] rounded-sm transition-[height] duration-100" style={{ height: `${Math.max(8, b.v * 100)}%`, background: accent, opacity: 0.4 + b.v * 0.6 }} />
              <div className="mt-0.5 text-[6px] font-medium uppercase text-muted-foreground">{b.key}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between px-3 py-2">
        <span className="inline-flex items-center gap-2">
          <span className="rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] transition-colors duration-300" style={{ background: `${accent}1f`, color: accent }}>
            {phase}
          </span>
          <span className="font-mono text-[8px] tabular-nums text-muted-foreground">{String(frame).padStart(3, '0')}/{CAPTURE_FPS}</span>
        </span>
        <span className="text-[8px] font-medium uppercase tracking-wide text-muted-foreground">Live for every {sport.noun.replace(/s$/, '')}</span>
      </div>
    </div>
  );
}

const KEYFRAMES = `
@keyframes svq-pulse { 0%, 100% { opacity: 0.4; r: 2.1px; } 50% { opacity: 1; r: 3px; } }
@keyframes svq-scan { 0% { transform: translateY(6px); opacity: 0; } 12% { opacity: 0.5; } 88% { opacity: 0.4; } 100% { transform: translateY(206px); opacity: 0; } }
@keyframes svq-live { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.35; transform: scale(0.65); } }
.svq-joint { animation: svq-pulse 1.8s ease-in-out infinite; }
.svq-scan { animation: svq-scan 2.6s linear infinite; }
.svq-live { animation: svq-live 1.1s ease-in-out infinite; }
.svq-grid { background-image: linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px); background-size: 20px 20px; }
@media (prefers-reduced-motion: reduce) { .svq-scan, .svq-live { animation: none !important; } }
`;
