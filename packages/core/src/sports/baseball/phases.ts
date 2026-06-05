// ============================================================
// SwingVantage — Baseball Swing Phase Definitions
// Based on established baseball hitting mechanics and biomechanics.
// Sources: ABCA coaching resources, published hitting biomechanics
// research, USA Baseball coach education materials.
// ============================================================

import type { SportPhaseDefinition } from '../types';

export type BaseballPhase =
  | 'stance'
  | 'load'
  | 'stride'
  | 'hip_rotation'
  | 'bat_lag'
  | 'contact'
  | 'extension'
  | 'follow_through';

export const BASEBALL_PHASE_SEQUENCE: BaseballPhase[] = [
  'stance',
  'load',
  'stride',
  'hip_rotation',
  'bat_lag',
  'contact',
  'extension',
  'follow_through',
];

export const BASEBALL_PHASE_DEFINITIONS: Record<BaseballPhase, SportPhaseDefinition> = {
  stance: {
    phase: 'stance',
    label: 'Stance',
    short_label: 'Stance',
    description:
      'Starting position in the batter\'s box. A balanced, athletic stance allows the hitter to react to any pitch location.',
    key_checkpoints: [
      'Feet shoulder-width apart or slightly wider',
      'Knees bent, weight balanced or slightly on balls of feet',
      'Hands held near or above the back shoulder',
      'Shoulders roughly level or back shoulder slightly lower',
      'Eyes level, head facing the pitcher',
    ],
    common_errors: [
      'Feet too wide — restricts hip rotation',
      'Feet too narrow — limits balance and power base',
      'Hands too low — slows bat path to the zone',
      'Weight too far back before load begins',
      'Tense grip — restricts bat speed and feel',
    ],
    coaching_cue: 'Stand tall, stay loose. Imagine you\'re about to catch a line drive — athletic and ready.',
    technical_cue: 'Weight centered. Knees bent. Hands above back shoulder. Head level with both eyes on the pitcher.',
    estimated_pct_of_swing: 0,
  },

  load: {
    phase: 'load',
    label: 'Load',
    short_label: 'Load',
    description:
      'Weight shifts to the back leg as hands cock into the loaded position. Stores energy for the swing and creates separation between the lower and upper body.',
    key_checkpoints: [
      'Weight shifts to back hip and leg (60-70% back)',
      'Hands move slightly back and/or up — bat cocked',
      'Front knee begins to rise for stride',
      'Hips remain closed (not yet opening)',
      'Back elbow drops toward back hip',
    ],
    common_errors: [
      'Swaying — weight moves laterally instead of rotating onto back leg',
      'Hands drifting forward during load (no coil)',
      'Hips opening during the load phase',
      'Over-loading — shifting too far back loses balance',
    ],
    coaching_cue: 'Gather your energy on your back hip — like drawing a bow before the shot.',
    technical_cue: 'The load creates potential energy in the hip-shoulder complex. Keep hips closed.',
    estimated_pct_of_swing: 0.15,
  },

  stride: {
    phase: 'stride',
    label: 'Stride',
    short_label: 'Stride',
    description:
      'The front foot strides forward to plant a firm front side. The stride should be controlled — soft landing — and create the foundation for hip rotation.',
    key_checkpoints: [
      'Stride length: 6-12 inches forward (not lateral drift)',
      'Front foot lands softly on the heel-ball — not slammed',
      'Front foot lands closed or square — not wide open',
      'Hands stay back during the stride (no early arm swing)',
      'Hips remain closed during the stride',
    ],
    common_errors: [
      'Long or lunge stride — shifts weight forward too early',
      'Foot landing open (pointing toward pitcher) — robs hip rotation',
      'Hands triggering with the stride — starting the swing too early',
      'Stride direction pulling toward pull-field side',
    ],
    coaching_cue: 'Quiet step — like stepping on thin ice. Land soft and closed.',
    technical_cue: 'Stride foot lands with heel first, toes pointing roughly toward home plate or slightly in.',
    estimated_pct_of_swing: 0.3,
  },

  hip_rotation: {
    phase: 'hip_rotation',
    label: 'Hip Rotation',
    short_label: 'Hip Fire',
    description:
      'Hips fire explosively open — the engine of the baseball swing. The kinetic chain begins here: hips lead the shoulders which lead the arms.',
    key_checkpoints: [
      'Hips rotate toward the pitcher aggressively',
      'Front foot becomes the pivot point (firm front side)',
      'Back heel begins to come off the ground',
      'Shoulder rotation lags slightly behind hip rotation',
      'Weight transfers from back to front as hips fire',
    ],
    common_errors: [
      'Hip stall — hips stop rotating before shoulders come through',
      'Shoulders rotating simultaneously with hips (losing lag)',
      'Front side collapsing — front knee buckles inward',
      'Back foot staying flat — limiting hip clearance',
    ],
    coaching_cue: 'Stomp and squish the bug with your back foot — drive those hips through.',
    technical_cue: 'Hip clearance should precede shoulder rotation by ~20-40ms for optimal power transfer.',
    estimated_pct_of_swing: 0.45,
  },

  bat_lag: {
    phase: 'bat_lag',
    label: 'Bat Lag',
    short_label: 'Lag',
    description:
      'As hips fire, the hands/bat trail behind. This lag stores energy and keeps the barrel on-plane for a longer contact window. The barrel stays behind the hands.',
    key_checkpoints: [
      'Hands approach the zone before the bat barrel',
      'Bat head remains above or behind hands',
      'Back elbow close to back hip (slotted)',
      'Wrists still cocked at this point',
      'Hips already partially rotated while hands stay loaded',
    ],
    common_errors: [
      'Casting — bat barrel drops away from body early',
      'Arm-barring — lead arm extending too early',
      'Hands pushing out away from body',
      'Early release of wrist hinge',
    ],
    coaching_cue: 'Feel your hands leading and the barrel dragging behind — like cracking a whip.',
    technical_cue: 'Knob of bat should be pointing toward the incoming pitch at maximum lag.',
    estimated_pct_of_swing: 0.55,
  },

  contact: {
    phase: 'contact',
    label: 'Contact',
    short_label: 'Contact',
    description:
      'Ball meets sweet spot of the bat. Contact position, launch angle, and bat speed at this moment determine the result.',
    key_checkpoints: [
      'Contact slightly in front of hip for pull, at hip for center, deeper for opposite field',
      'Hips fully or nearly fully rotated',
      'Head down — eyes on the ball at contact',
      'Both arms approaching extension through the zone',
      'Firm front side — no front side collapse',
    ],
    common_errors: [
      'Contact too far out in front — pull-only hitter, weak on outside pitches',
      'Contact too deep — arm cramped, no power',
      'Head pulling off ball — miss-hits and popups',
      'Front shoulder flying open — leads to early rotation and weak pull-side contact',
    ],
    coaching_cue: 'Hit the inside of the ball. See the ball hit the bat — not your intention.',
    technical_cue: 'Ideal bat angle at contact: slightly up (-5° to +10°) for launch angle optimization.',
    estimated_pct_of_swing: 0.65,
  },

  extension: {
    phase: 'extension',
    label: 'Extension',
    short_label: 'Extension',
    description:
      'Both arms fully extend through the hitting zone after contact. Extension drives the ball with full power and directs flight.',
    key_checkpoints: [
      'Both arms straight through the zone (not at full contact — slightly after)',
      'Bat stays on a level or slightly upward plane through zone',
      'Hips fully facing the pitcher',
      'Weight fully on front side',
      'Back foot off the ground or on toe',
    ],
    common_errors: [
      'Stopping hands at contact instead of driving through',
      'Collapsing back elbow before extension',
      'Chopping downward instead of extending through',
    ],
    coaching_cue: 'Drive through the ball — like you\'re trying to hit the wall behind the pitcher.',
    technical_cue: 'Extension point is 12-18 inches past contact — not at the contact point.',
    estimated_pct_of_swing: 0.78,
  },

  follow_through: {
    phase: 'follow_through',
    label: 'Follow-Through',
    short_label: 'Finish',
    description:
      'The bat completes its arc to a full finish. The follow-through reveals the quality of the swing — a complete finish indicates full effort and swing path.',
    key_checkpoints: [
      'Bat finishes high — over the front shoulder',
      'Head stays down until well after contact',
      'Full weight on front foot — back foot on toe',
      'Hips squared to the pitcher',
      'Back stays relatively tall — no major lean forward',
    ],
    common_errors: [
      'One-handed finish — non-dominant hand releases early',
      'Bat wrapping around the body — chopping motion',
      'Shoulder dipping — upward sweep instead of rotation',
    ],
    coaching_cue: 'Finish with the knob pointing at the ground and the barrel at the sky.',
    technical_cue: 'Full follow-through indicates the swing decelerated after contact, not at contact.',
    estimated_pct_of_swing: 0.85,
  },
};
