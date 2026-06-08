// ============================================================
// SwingVantage — Golf mobility & physical readiness (Phase 8)
// ------------------------------------------------------------
// The body side of the swing: the mobility areas that most affect a golf
// motion, a quick dynamic warm-up, and a helper that turns a BodySync
// readiness zone into a priority the athlete can act on. Pure data +
// pure functions.
//
// SAFETY: SwingVantage is not a medical service. These are general
// movement-prep suggestions, not a diagnosis or treatment. The disclaimer
// below is surfaced wherever readiness/mobility guidance appears.
// ============================================================

export const READINESS_SAFETY =
  'General movement prep, not medical advice. Ease in, skip anything that causes pain, ' +
  'and check with a qualified professional for any injury or persistent discomfort.';

export interface MobilityArea {
  id: string;
  name: string;
  /** Why it matters for the golf swing (plain language). */
  why: string;
}

/** The mobility areas that most influence a golf swing (general guidance). */
export const GOLF_MOBILITY_AREAS: MobilityArea[] = [
  { id: 'thoracic_rotation', name: 'Thoracic (upper-back) rotation', why: 'Lets you turn back and through without losing posture or coming over the top.' },
  { id: 'hip_rotation', name: 'Hip internal/external rotation', why: 'Powers the lower-body turn and a stable, rotating lead hip through impact.' },
  { id: 'hamstring', name: 'Hamstring mobility', why: 'Helps you keep your spine angle and hinge at address without rounding.' },
  { id: 'ankle', name: 'Ankle mobility', why: 'Supports weight shift and ground push without swaying or early extension.' },
  { id: 'shoulder', name: 'Shoulder mobility', why: 'Allows a full, connected backswing and a free release.' },
  { id: 'wrist_forearm', name: 'Wrist & forearm prep', why: 'Readies the hinge/unhinge and protects the lead wrist at impact.' },
  { id: 'glute_activation', name: 'Glute activation', why: 'Wakes up the engine of rotation and stabilises the pelvis.' },
  { id: 'core_activation', name: 'Core activation', why: 'Connects upper and lower body so sequencing transfers speed efficiently.' },
  { id: 'lead_knee', name: 'Lead-knee torque awareness', why: 'A stable, slightly flexed lead knee lets the hips clear without strain.' },
];

export interface WarmupMove {
  name: string;
  detail: string;
}

/** A short, equipment-free dynamic warm-up for golf. Optional + scalable. */
export const GOLF_DYNAMIC_WARMUP: WarmupMove[] = [
  { name: 'Standing thoracic rotations', detail: '10 each way — arms crossed, turn from the upper back.' },
  { name: 'Hip 90/90 switches', detail: '8 each side — open and close the hips on the ground or seated.' },
  { name: 'Leg swings', detail: '10 each leg front-to-back, 10 side-to-side.' },
  { name: 'Walking lunges with reach', detail: '6 each leg — reach the lead arm up and over for the t-spine.' },
  { name: 'Wrist circles + flexor stretch', detail: '20 circles, then a gentle 15-second forearm stretch each side.' },
  { name: 'Glute bridges', detail: '12 reps — squeeze at the top to switch the glutes on.' },
  { name: 'Step-by-step speed swings', detail: '5 easy half swings building to 3 near-full — never max effort cold.' },
];

export type ReadinessZone = 'green' | 'yellow' | 'orange' | 'red';
export type ReadinessSeverity = 'high' | 'medium' | 'low';

/** Map a readiness zone to a priority severity, or null when fully ready. */
export function readinessSeverity(zone: ReadinessZone): ReadinessSeverity | null {
  switch (zone) {
    case 'red': return 'high';
    case 'orange': return 'medium';
    case 'yellow': return 'low';
    case 'green': return null;
  }
}

/** Plain-language headline for a readiness zone (used when none provided). */
export function readinessHeadline(zone: ReadinessZone): string {
  switch (zone) {
    case 'red': return 'Low readiness — prioritise recovery and gentle movement today.';
    case 'orange': return 'Below-par readiness — warm up thoroughly and keep intensity moderate.';
    case 'yellow': return 'Moderate readiness — a full warm-up will help you get the most from practice.';
    case 'green': return 'Good readiness — you’re clear to train normally.';
  }
}

/**
 * True when low readiness could plausibly be CONTRIBUTING to a swing fault, so
 * the priority engine can hint "this may be mobility/readiness-driven" on
 * rotation/contact/sequencing-type issues rather than only mechanics.
 */
export function mayBeReadinessDriven(zone: ReadinessZone): boolean {
  return zone === 'orange' || zone === 'red';
}
