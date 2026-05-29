// ============================================================
// SwingIQ — Tennis Swing Phase Definitions
// Based on established tennis coaching methodology:
// groundstroke mechanics (forehands/backhands) and serve phases.
// Evidence sources: USTA coaching resources, sports biomechanics
// literature on tennis stroke production.
// ============================================================

import type { SportPhaseDefinition } from '../types';

export type TennisPhase =
  | 'ready_position'
  | 'unit_turn'
  | 'backswing'
  | 'loading'
  | 'forward_swing'
  | 'contact_zone'
  | 'follow_through'
  | 'recovery';

export const TENNIS_PHASE_SEQUENCE: TennisPhase[] = [
  'ready_position',
  'unit_turn',
  'backswing',
  'loading',
  'forward_swing',
  'contact_zone',
  'follow_through',
  'recovery',
];

export const TENNIS_PHASE_DEFINITIONS: Record<TennisPhase, SportPhaseDefinition> = {
  ready_position: {
    phase: 'ready_position',
    label: 'Ready Position',
    short_label: 'Ready',
    description:
      'The athletic base position between shots. Allows rapid movement to either side and sets the stage for proper unit turn.',
    key_checkpoints: [
      'Feet shoulder-width apart or slightly wider',
      'Knees bent, weight balanced on balls of feet',
      'Racket held loosely in front at mid-height',
      'Non-dominant hand supporting throat of racket',
      'Eyes tracking the ball and opponent',
    ],
    common_errors: [
      'Feet too narrow — limits lateral push-off',
      'Weight on heels — slows first-step reaction',
      'Racket hanging low — slows backswing preparation',
      'Stiff knees — reduces explosion off first step',
    ],
    coaching_cue: 'Feel like a goalkeeper ready to dive either way — bouncy and alert.',
    technical_cue: 'Weight forward, racket centered, split step timed as opponent contacts ball.',
    estimated_pct_of_swing: 0,
  },

  unit_turn: {
    phase: 'unit_turn',
    label: 'Unit Turn',
    short_label: 'Unit Turn',
    description:
      'Shoulders and hips rotate together as a single unit, taking the racket back while moving toward the ball.',
    key_checkpoints: [
      'Shoulders and hips rotate simultaneously (not just arm)',
      'Non-dominant hand guides racket back in a continuous motion',
      'Front foot steps toward the ball for positioning',
      'Racket face stays relatively vertical early in turn',
      'Eyes remain focused on the ball throughout',
    ],
    common_errors: [
      'Late unit turn — arm-only swing without body rotation',
      'Over-rotating hips before shoulders (lose torque)',
      'Looking away from ball during turn',
      'Racket taken back with straight arm only (no shoulder)',
    ],
    coaching_cue: 'Turn your whole chest to the fence behind you — racket follows the shoulder.',
    technical_cue: 'Shoulder turn should begin within 0.5s of recognizing ball direction.',
    estimated_pct_of_swing: 0.1,
  },

  backswing: {
    phase: 'backswing',
    label: 'Backswing',
    short_label: 'Backswing',
    description:
      'The racket travels to the loaded position. Loop or straight-back depending on stroke style. Sets the swing plane for the forward swing.',
    key_checkpoints: [
      'Racket head drops below wrist height at bottom of loop',
      'Elbow bent at approximately 90° on forehand',
      'Shoulders fully turned perpendicular to net',
      'Non-dominant arm extending for balance (forehand)',
      'Weight loading onto back foot',
    ],
    common_errors: [
      'Racket taken back too high — creates steep angle',
      'Elbow flying away from body on backswing',
      'Short backswing — not enough stored energy',
      'Racket face opens or closes prematurely',
      'Body over-rotating beyond ideal shoulder turn',
    ],
    coaching_cue: 'Let the racket drop behind you naturally — like a pendulum swinging back.',
    technical_cue: 'Racket tip should drop below ball height during loop for upward contact angle.',
    estimated_pct_of_swing: 0.25,
  },

  loading: {
    phase: 'loading',
    label: 'Loading',
    short_label: 'Load',
    description:
      'The coiled position just before forward swing. Maximum torque stored in the kinetic chain — ground up through legs, hips, torso, shoulder, arm, and racket.',
    key_checkpoints: [
      'Weight loaded on back leg (open or semi-open stance)',
      'Knees bent for explosive push-off',
      'Hips and shoulders maximally separated from target (closed)',
      'Racket in loaded position — butt cap pointing toward ball',
      'Non-hitting arm pointing toward ball for targeting',
    ],
    common_errors: [
      'Weight already shifted forward — losing power source',
      'Knees straightening before swing starts',
      'Hips and shoulders already opening (loss of torque)',
      'Racket too high at loading point',
    ],
    coaching_cue: 'Feel coiled like a spring — everything loaded and ready to explode forward.',
    technical_cue: 'Maximum hip-shoulder separation here. Delay hip opening until legs push.',
    estimated_pct_of_swing: 0.35,
  },

  forward_swing: {
    phase: 'Forward Swing',
    label: 'Forward Swing',
    short_label: 'Forward',
    description:
      'The kinetic chain fires from the ground up. Legs push, hips rotate, torso follows, shoulder comes through, arm accelerates the racket toward contact.',
    key_checkpoints: [
      'Leg drive initiates the sequence — not the arm',
      'Hips clear before shoulders reach contact angle',
      'Elbow leads the way forward (not the wrist)',
      'Wrist stays laid back until just before contact',
      'Contact point moving toward the ball',
    ],
    common_errors: [
      'Arm starting before hips — reverse kinetic chain',
      'Hitting with bent arm at contact (weak power transfer)',
      'Wrist flipping early — loss of control at contact',
      'Dropping shoulder instead of rotating',
    ],
    coaching_cue: 'Lead with the elbow. Let the hips drag the shoulder, the shoulder drag the arm.',
    technical_cue: 'Hip clearance should precede arm acceleration by ~50-80ms for optimal power.',
    estimated_pct_of_swing: 0.55,
  },

  contact_zone: {
    phase: 'contact_zone',
    label: 'Contact Zone',
    short_label: 'Contact',
    description:
      'The critical 6–12 inches where racket meets ball. Contact point, arm extension, and racket face angle at contact determine ball direction, spin, and pace.',
    key_checkpoints: [
      'Contact in front of body and hip (not beside hip)',
      'Arm approaching full extension at contact',
      'Racket face square to intended target (with topspin angle)',
      'Head down — eyes on contact point',
      'Weight transferring from back foot to front foot',
    ],
    common_errors: [
      'Contact too far behind body — loss of power and direction',
      'Looking up before contact — head movement affects swing path',
      'Racket face too open — ball pops up without pace',
      'Wrist collapsing at contact — lack of firmness',
      'Contact arm too bent — loss of reach and leverage',
    ],
    coaching_cue: 'Hit through the ball — imagine reaching out to shake hands in front of you.',
    technical_cue: 'Optimal forehand contact: ball positioned ~1 arm-length in front of hip at waist height.',
    estimated_pct_of_swing: 0.7,
  },

  follow_through: {
    phase: 'follow_through',
    label: 'Follow-Through',
    short_label: 'Follow',
    description:
      'Arm and racket continue past contact point to full finish. Follow-through is not decorative — it controls where the swing decelerates and shapes ball spin.',
    key_checkpoints: [
      'Racket continues across body toward non-dominant shoulder',
      'Arm finishes high on the shoulder or wrapped around body',
      'Hips and torso fully rotated to face the target',
      'Weight fully on front foot',
      'Non-dominant arm moves back to counterbalance',
    ],
    common_errors: [
      'Stopping the racket at contact — deceleration before contact',
      'Follow-through going straight rather than across body',
      'Not completing rotation — body staying sideways',
      'Grip tightening too early — arm tension',
    ],
    coaching_cue: 'Let the racket finish naturally by your ear — don\'t muscle it there.',
    technical_cue: 'Racket tip should pass over the hitting shoulder for full topspin finish.',
    estimated_pct_of_swing: 0.85,
  },

  recovery: {
    phase: 'recovery',
    label: 'Recovery',
    short_label: 'Recovery',
    description:
      'Returning to ready position immediately after follow-through. Rapid recovery is critical for court coverage and the next shot.',
    key_checkpoints: [
      'Racket back to ready position with non-dominant hand',
      'Push off from front foot to return to base',
      'Eyes re-acquiring ball and opponent position',
      'Footwork begins immediately after contact',
    ],
    common_errors: [
      'Admiring the shot instead of recovering',
      'Recovering on heels instead of balls of feet',
      'Not returning racket to neutral grip during recovery',
    ],
    coaching_cue: 'The shot is done the moment you follow through. Recover before you react.',
    technical_cue: 'Recovery steps begin within 0.3s of contact on competitive points.',
    estimated_pct_of_swing: 1.0,
  },
};
