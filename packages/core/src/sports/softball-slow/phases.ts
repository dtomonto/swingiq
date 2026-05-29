// ============================================================
// SwingIQ — Slow Pitch Softball Swing Phase Definitions
// Slow pitch softball has a fundamentally different hitting
// situation than baseball: the ball is arcing downward at
// contact, comes in slower, and the strike zone is larger.
// Mechanics differ from baseball — wider stance, higher contact,
// more of an arc swing to match the ball's descent angle.
//
// Sources: ASA/USA Softball coaching resources, published
// slow pitch biomechanics, recreational softball instruction.
// ============================================================

import type { SportPhaseDefinition } from '../types';

export type SlowPitchPhase =
  | 'stance'
  | 'load'
  | 'stride'
  | 'hip_fire'
  | 'contact_arc'
  | 'extension'
  | 'follow_through';

export const SLOW_PITCH_PHASE_SEQUENCE: SlowPitchPhase[] = [
  'stance',
  'load',
  'stride',
  'hip_fire',
  'contact_arc',
  'extension',
  'follow_through',
];

export const SLOW_PITCH_PHASE_DEFINITIONS: Record<SlowPitchPhase, SportPhaseDefinition> = {
  stance: {
    phase: 'stance',
    label: 'Stance',
    short_label: 'Stance',
    description:
      'Starting position in the batter\'s box. Slow pitch allows more time to read the pitch, so the stance can be slightly more upright than baseball.',
    key_checkpoints: [
      'Feet shoulder-width or slightly wider (wider than baseball is common)',
      'Knees slightly bent, weight centered',
      'Hands near the back shoulder, bat angle comfortable',
      'Shoulders level or very slightly tilted back',
      'Head level, eyes tracking the pitcher\'s hand and the ball',
    ],
    common_errors: [
      'Stance too narrow — limits rotational power',
      'Standing too upright — loses hip engagement',
      'Grip too tight — reduces bat speed',
      'Head dropping before the pitch arrives',
    ],
    coaching_cue: 'Comfortable and ready. More time to react means no need to rush — be patient and athletic.',
    technical_cue: 'Feet slightly wider than baseball stance; more upright spine angle is acceptable.',
    estimated_pct_of_swing: 0,
  },

  load: {
    phase: 'load',
    label: 'Load',
    short_label: 'Load',
    description:
      'Weight shifts onto the back leg as the pitch arcs toward the plate. The load in slow pitch may be less aggressive than baseball due to the extra reaction time.',
    key_checkpoints: [
      'Weight moves to back leg (50-65% back)',
      'Hands cock slightly back and up',
      'Front shoulder begins to close',
      'Hips stay closed during the load',
      'Eyes tracking the peak of the ball arc',
    ],
    common_errors: [
      'Loading too early — weight shifts before reading pitch direction',
      'Over-loading — too much weight makes transfer choppy',
      'Failing to load at all — flat-footed contact',
    ],
    coaching_cue: 'Watch the ball arc. Load as it peaks — you have time to read and react.',
    technical_cue: 'Load initiation: approximately as the ball reaches peak height of its arc.',
    estimated_pct_of_swing: 0.15,
  },

  stride: {
    phase: 'stride',
    label: 'Stride',
    short_label: 'Stride',
    description:
      'A controlled forward stride as the ball descends toward the plate. Shorter stride than baseball is often preferred in slow pitch.',
    key_checkpoints: [
      'Short, controlled stride (4-8 inches) — not a lunge',
      'Front foot lands soft and closed or square',
      'Hands stay back during the stride',
      'Weight still on back leg at landing',
      'Head tracking the ball — adjusting to descent angle',
    ],
    common_errors: [
      'Long lunge stride — commits weight forward before ball arrives',
      'Foot opening on landing — robs hip rotation',
      'Swinging the hands with the stride (timing issue)',
    ],
    coaching_cue: 'Small step, soft landing. Let the ball get to you — don\'t chase it.',
    technical_cue: 'Stride shorter than baseball due to longer reaction window.',
    estimated_pct_of_swing: 0.28,
  },

  hip_fire: {
    phase: 'hip_fire',
    label: 'Hip Fire',
    short_label: 'Hip Fire',
    description:
      'Hips rotate explosively toward the pitcher as the ball enters the hitting zone. The power source for the slow pitch swing.',
    key_checkpoints: [
      'Hips fire open toward the pitcher',
      'Front foot becomes the pivot point',
      'Back heel rises as hips rotate',
      'Shoulder rotation follows the hips',
      'Hands slot down and through',
    ],
    common_errors: [
      'Arm-only swing — no hip rotation contributing',
      'Arms starting before hips',
      'Front foot going up on its toe instead of pivoting on heel',
    ],
    coaching_cue: 'Drive those hips through first. Arms follow — they never lead in this swing.',
    technical_cue: 'Hip rotation is the primary power source even at recreational levels of slow pitch.',
    estimated_pct_of_swing: 0.42,
  },

  contact_arc: {
    phase: 'contact_arc',
    label: 'Contact',
    short_label: 'Contact',
    description:
      'Ball-bat contact. In slow pitch, the ball is descending at an arc when it arrives. The swing often has a slight upward angle to match the descending pitch trajectory.',
    key_checkpoints: [
      'Contact slightly in front of or at the hip',
      'Bat angle slightly upward (matching ball descent for line drives)',
      'Head down — eyes on the ball',
      'Hips mostly open at contact',
      'Both arms extending through',
    ],
    common_errors: [
      'Chopping straight down at the ball — pops up',
      'Contact too far back — cramped and weak',
      'Head up — miss-hits',
      'Collapsing front leg at contact',
    ],
    coaching_cue: 'Match the arc of the ball. Brush up through it for a rising line drive.',
    technical_cue: 'Slight uppercut to match arc descent is efficient in slow pitch — unlike baseball.',
    estimated_pct_of_swing: 0.60,
  },

  extension: {
    phase: 'extension',
    label: 'Extension',
    short_label: 'Extension',
    description:
      'Both arms extend through the contact zone, driving the ball with full force.',
    key_checkpoints: [
      'Both arms extend fully through the zone after contact',
      'Bat stays on the ball\'s arc through extension',
      'Hips completely open at this point',
      'Weight on front side',
    ],
    common_errors: [
      'Stopping swing at contact',
      'Collapsing back elbow early',
      'Arms going straight instead of through the arc',
    ],
    coaching_cue: 'Drive through to the outfield wall — don\'t stop at contact.',
    technical_cue: 'Extension point is several inches past contact on the ball\'s flight path.',
    estimated_pct_of_swing: 0.75,
  },

  follow_through: {
    phase: 'follow_through',
    label: 'Follow-Through',
    short_label: 'Finish',
    description:
      'Complete swing finish. A full follow-through in slow pitch often has a slightly more arced path than baseball to match the ball\'s trajectory.',
    key_checkpoints: [
      'Bat finishes high — over the front shoulder',
      'Head stays down through impact',
      'Weight fully on front foot',
      'Hips and torso face the pitcher',
    ],
    common_errors: [
      'Bat wrapping around too flat',
      'Stopping follow-through too early',
      'One-handed finish',
    ],
    coaching_cue: 'High finish — let the bat swing itself through.',
    technical_cue: 'Full finish indicates deceleration after contact, not before.',
    estimated_pct_of_swing: 0.85,
  },
};
