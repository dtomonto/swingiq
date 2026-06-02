// ============================================================
// SwingIQ — Motion Lab: Sport / Motion Taxonomy
// ------------------------------------------------------------
// The single source of truth for which motions each sport supports
// and the canonical phase template for each motion. Phase templates
// are *labels + canonical timing fractions* — the actual phase
// windows are detected per-clip in phases.ts from the real pose track.
// ============================================================

import type { SportId, MotionTypeId } from './types';

export interface MotionTypeConfig {
  id: MotionTypeId;
  label: string;
  /** A short hint shown under the option. */
  hint: string;
}

export interface SportConfigLite {
  id: SportId;
  name: string;
  emoji: string;
  accent: string;
  motions: MotionTypeConfig[];
}

/** A phase in a motion's canonical template. */
export interface PhaseTemplate {
  key: string;
  label: string;
  short: string;
  /** Cumulative END position of this phase as a fraction of the active window (0–1). */
  cumEnd: number;
  /** A short, reusable coaching read for the phase. */
  read: string;
}

// ── Sports & their motions ────────────────────────────────────

export const MOTION_SPORTS: SportConfigLite[] = [
  {
    id: 'golf',
    name: 'Golf',
    emoji: '⛳',
    accent: '#22C55E',
    motions: [
      { id: 'driver', label: 'Driver Swing', hint: 'Full swing, tee shot' },
      { id: 'iron', label: 'Iron Swing', hint: 'Full swing, ball on turf' },
      { id: 'wedge', label: 'Wedge Swing', hint: 'Controlled partial swing' },
      { id: 'pitch_chip', label: 'Pitch / Chip', hint: 'Short-game shot' },
      { id: 'putt', label: 'Putting Stroke', hint: 'Green stroke' },
    ],
  },
  {
    id: 'tennis',
    name: 'Tennis',
    emoji: '🎾',
    accent: '#EAB308',
    motions: [
      { id: 'forehand', label: 'Forehand', hint: 'Groundstroke' },
      { id: 'backhand', label: 'Backhand', hint: 'One or two-handed' },
      { id: 'serve', label: 'Serve', hint: 'Overhead serve' },
      { id: 'volley', label: 'Volley', hint: 'Net shot' },
      { id: 'return', label: 'Return', hint: 'Return of serve' },
    ],
  },
  {
    id: 'baseball',
    name: 'Baseball',
    emoji: '⚾',
    accent: '#EF4444',
    motions: [
      { id: 'hitting', label: 'Hitting Swing', hint: 'Batting' },
      { id: 'throwing', label: 'Throwing Motion', hint: 'Position throw' },
      { id: 'pitching', label: 'Pitching Motion', hint: 'Mound delivery' },
      { id: 'fielding', label: 'Fielding Transfer', hint: 'Glove-to-hand' },
      { id: 'catcher_throw', label: 'Catcher Throw-down', hint: 'Pop time throw' },
    ],
  },
  {
    id: 'softball_slow',
    name: 'Slow Pitch Softball',
    emoji: '🥎',
    accent: '#F97316',
    motions: [
      { id: 'hitting', label: 'Hitting Swing', hint: 'High-arc pitch' },
      { id: 'throwing', label: 'Throwing Motion', hint: 'Position throw' },
      { id: 'fielding', label: 'Fielding Transfer', hint: 'Glove-to-hand' },
    ],
  },
  {
    id: 'softball_fast',
    name: 'Fast Pitch Softball',
    emoji: '🥎',
    accent: '#EC4899',
    motions: [
      { id: 'hitting', label: 'Hitting Swing', hint: 'Compact swing' },
      { id: 'pitching', label: 'Pitching Motion', hint: 'Windmill delivery' },
      { id: 'throwing', label: 'Throwing Motion', hint: 'Position throw' },
      { id: 'fielding', label: 'Fielding Transfer', hint: 'Glove-to-hand' },
    ],
  },
];

export function getSport(sport: SportId): SportConfigLite {
  return MOTION_SPORTS.find((s) => s.id === sport) ?? MOTION_SPORTS[0];
}

export function getMotion(sport: SportId, motionType: MotionTypeId): MotionTypeConfig {
  const s = getSport(sport);
  return s.motions.find((m) => m.id === motionType) ?? s.motions[0];
}

// ── Phase templates ───────────────────────────────────────────

const GOLF_FULL: PhaseTemplate[] = [
  { key: 'setup', label: 'Setup / Address', short: 'Setup', cumEnd: 0.08, read: 'Your starting posture and alignment before the swing.' },
  { key: 'takeaway', label: 'Takeaway', short: 'Takeaway', cumEnd: 0.22, read: 'The first move away from the ball — sets the swing path.' },
  { key: 'lead_arm_parallel', label: 'Lead-Arm Parallel', short: 'Lead Parallel', cumEnd: 0.34, read: 'Lead arm reaches horizontal in the backswing.' },
  { key: 'top', label: 'Top of Backswing', short: 'Top', cumEnd: 0.46, read: 'The fully coiled position — peak of your turn.' },
  { key: 'transition', label: 'Transition', short: 'Transition', cumEnd: 0.54, read: 'Lower body starts down while the club still goes back.' },
  { key: 'downswing', label: 'Downswing', short: 'Downswing', cumEnd: 0.66, read: 'Stored energy releases toward the ball.' },
  { key: 'impact', label: 'Impact Zone', short: 'Impact', cumEnd: 0.74, read: 'The moment of truth — where the ball is struck.' },
  { key: 'release', label: 'Release', short: 'Release', cumEnd: 0.86, read: 'Arms and club extend through the ball.' },
  { key: 'finish', label: 'Finish', short: 'Finish', cumEnd: 1.0, read: 'Balanced, fully-rotated finishing position.' },
];

const GOLF_PUTT: PhaseTemplate[] = [
  { key: 'setup', label: 'Setup', short: 'Setup', cumEnd: 0.2, read: 'Stance, eye line, and posture over the ball.' },
  { key: 'backstroke', label: 'Backstroke', short: 'Back', cumEnd: 0.5, read: 'Smooth, controlled takeaway of the putter.' },
  { key: 'impact', label: 'Impact', short: 'Impact', cumEnd: 0.65, read: 'Putter meets ball — face control matters most here.' },
  { key: 'follow', label: 'Follow-Through', short: 'Follow', cumEnd: 1.0, read: 'Stroke continues toward the target line.' },
];

const TENNIS_GROUND: PhaseTemplate[] = [
  { key: 'ready', label: 'Ready Position', short: 'Ready', cumEnd: 0.1, read: 'Athletic base before the stroke.' },
  { key: 'unit_turn', label: 'Unit Turn', short: 'Unit Turn', cumEnd: 0.28, read: 'Shoulders and hips rotate together.' },
  { key: 'loading', label: 'Loading', short: 'Load', cumEnd: 0.44, read: 'Weight and torque stored on the back side.' },
  { key: 'prep', label: 'Racket Drop / Prep', short: 'Prep', cumEnd: 0.56, read: 'Racket drops into the slot before forward swing.' },
  { key: 'acceleration', label: 'Forward Acceleration', short: 'Accel', cumEnd: 0.7, read: 'The kinetic chain fires toward contact.' },
  { key: 'contact', label: 'Contact Zone', short: 'Contact', cumEnd: 0.8, read: 'Racket meets ball out in front.' },
  { key: 'follow', label: 'Follow-Through', short: 'Follow', cumEnd: 0.92, read: 'Racket continues across the body.' },
  { key: 'recovery', label: 'Recovery', short: 'Recovery', cumEnd: 1.0, read: 'Return to ready for the next ball.' },
];

const TENNIS_SERVE: PhaseTemplate[] = [
  { key: 'ready', label: 'Ready / Stance', short: 'Ready', cumEnd: 0.12, read: 'Setup stance and grip.' },
  { key: 'toss', label: 'Toss & Load', short: 'Toss', cumEnd: 0.34, read: 'Ball toss with the trophy-position load.' },
  { key: 'drop', label: 'Racket Drop', short: 'Drop', cumEnd: 0.5, read: 'Racket drops behind the back.' },
  { key: 'acceleration', label: 'Acceleration', short: 'Accel', cumEnd: 0.7, read: 'Explosive upward swing to contact.' },
  { key: 'contact', label: 'Contact', short: 'Contact', cumEnd: 0.8, read: 'Full extension at the highest point.' },
  { key: 'follow', label: 'Follow-Through', short: 'Follow', cumEnd: 1.0, read: 'Deceleration across the body.' },
];

const HITTING: PhaseTemplate[] = [
  { key: 'stance', label: 'Stance', short: 'Stance', cumEnd: 0.12, read: 'Balanced starting position in the box.' },
  { key: 'load', label: 'Load', short: 'Load', cumEnd: 0.3, read: 'Weight gathers back, hands set.' },
  { key: 'stride', label: 'Stride', short: 'Stride', cumEnd: 0.46, read: 'Front foot strides toward the pitch.' },
  { key: 'launch', label: 'Launch', short: 'Launch', cumEnd: 0.58, read: 'Hips fire and the swing starts down.' },
  { key: 'connection', label: 'Connection', short: 'Connect', cumEnd: 0.68, read: 'Hands and hips stay connected into the zone.' },
  { key: 'contact', label: 'Contact Zone', short: 'Contact', cumEnd: 0.78, read: 'Bat meets ball at the optimal point.' },
  { key: 'extension', label: 'Extension', short: 'Extension', cumEnd: 0.9, read: 'Arms extend through the ball.' },
  { key: 'finish', label: 'Finish', short: 'Finish', cumEnd: 1.0, read: 'Full, balanced rotation to finish.' },
];

const THROWING: PhaseTemplate[] = [
  { key: 'set', label: 'Set', short: 'Set', cumEnd: 0.12, read: 'Starting position before the throw.' },
  { key: 'load', label: 'Load', short: 'Load', cumEnd: 0.28, read: 'Weight gathers over the back leg.' },
  { key: 'stride', label: 'Stride', short: 'Stride', cumEnd: 0.44, read: 'Stride toward the target.' },
  { key: 'cocking', label: 'Arm Cocking', short: 'Cocking', cumEnd: 0.58, read: 'Arm lays back into external rotation.' },
  { key: 'acceleration', label: 'Acceleration', short: 'Accel', cumEnd: 0.72, read: 'Arm whips forward as hips clear.' },
  { key: 'release', label: 'Release', short: 'Release', cumEnd: 0.8, read: 'Ball leaves the hand out front.' },
  { key: 'deceleration', label: 'Deceleration', short: 'Decel', cumEnd: 0.9, read: 'The arm safely slows down.' },
  { key: 'follow', label: 'Follow-Through', short: 'Follow', cumEnd: 1.0, read: 'Body continues over the front leg.' },
];

const PITCHING_WINDMILL: PhaseTemplate[] = [
  { key: 'set', label: 'Set', short: 'Set', cumEnd: 0.12, read: 'Presentation and start of the delivery.' },
  { key: 'load', label: 'Load / Push-off', short: 'Load', cumEnd: 0.3, read: 'Drive off the rubber begins.' },
  { key: 'top', label: 'Top of Circle', short: 'Top', cumEnd: 0.46, read: 'Arm reaches the top of the windmill.' },
  { key: 'stride', label: 'Stride', short: 'Stride', cumEnd: 0.6, read: 'Long, powerful stride down the mound line.' },
  { key: 'acceleration', label: 'Acceleration', short: 'Accel', cumEnd: 0.74, read: 'Arm accelerates through the downswing.' },
  { key: 'release', label: 'Release', short: 'Release', cumEnd: 0.82, read: 'Ball releases at the hip with wrist snap.' },
  { key: 'follow', label: 'Follow-Through', short: 'Follow', cumEnd: 1.0, read: 'Arm and body finish toward the plate.' },
];

const TRANSFER: PhaseTemplate[] = [
  { key: 'field', label: 'Field', short: 'Field', cumEnd: 0.3, read: 'Glove receives the ball.' },
  { key: 'transfer', label: 'Transfer', short: 'Transfer', cumEnd: 0.55, read: 'Ball moves from glove to hand.' },
  { key: 'set', label: 'Set & Stride', short: 'Set', cumEnd: 0.78, read: 'Footwork sets up the throw.' },
  { key: 'release', label: 'Release', short: 'Release', cumEnd: 1.0, read: 'Quick, accurate release to the target.' },
];

const VOLLEY: PhaseTemplate[] = [
  { key: 'ready', label: 'Ready', short: 'Ready', cumEnd: 0.25, read: 'Compact ready position at the net.' },
  { key: 'turn', label: 'Shoulder Turn', short: 'Turn', cumEnd: 0.5, read: 'Small unit turn — no big backswing.' },
  { key: 'contact', label: 'Contact', short: 'Contact', cumEnd: 0.72, read: 'Punch contact out in front.' },
  { key: 'finish', label: 'Finish', short: 'Finish', cumEnd: 1.0, read: 'Short, controlled finish.' },
];

/** Resolve the canonical phase template for a (sport, motion) pair. */
export function getPhaseTemplate(sport: SportId, motionType: MotionTypeId): PhaseTemplate[] {
  if (sport === 'golf') {
    if (motionType === 'putt') return GOLF_PUTT;
    if (motionType === 'pitch_chip') return GOLF_FULL.slice(0, 7).concat(GOLF_FULL.slice(8));
    return GOLF_FULL;
  }
  if (sport === 'tennis') {
    if (motionType === 'serve') return TENNIS_SERVE;
    if (motionType === 'volley') return VOLLEY;
    return TENNIS_GROUND; // forehand, backhand, return
  }
  // baseball / softball
  if (motionType === 'hitting') return HITTING;
  if (motionType === 'pitching') return sport === 'softball_fast' ? PITCHING_WINDMILL : THROWING;
  if (motionType === 'fielding') return TRANSFER;
  if (motionType === 'catcher_throw') return THROWING;
  return THROWING; // throwing
}

/** True for motions that are fundamentally rotational (swing-like). */
export function isRotationalMotion(sport: SportId, motionType: MotionTypeId): boolean {
  if (sport === 'golf') return true;
  if (sport === 'tennis') return motionType !== 'volley';
  return motionType === 'hitting';
}
