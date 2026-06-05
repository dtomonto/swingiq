// ============================================================
// SwingVantage — Fast Pitch Softball Swing Phase Definitions
// Fast pitch softball requires fundamentally different timing
// than baseball or slow pitch: faster ball speed (50-75 mph),
// shorter distance (43 ft for women's, 46 ft for men's),
// rising ball trajectory, and a narrower reaction window.
// The swing must be compact, quick, and adjustable.
//
// Sources: USA Softball coaching education, NFCA (National
// Fastpitch Coaches Association) resources, published research
// on fast pitch hitting mechanics and reaction time.
// ============================================================

import type { SportPhaseDefinition } from '../types';

export type FastPitchPhase =
  | 'stance'
  | 'load'
  | 'rapid_stride'
  | 'hip_fire'
  | 'contact'
  | 'extension'
  | 'follow_through';

export const FAST_PITCH_PHASE_SEQUENCE: FastPitchPhase[] = [
  'stance',
  'load',
  'rapid_stride',
  'hip_fire',
  'contact',
  'extension',
  'follow_through',
];

export const FAST_PITCH_PHASE_DEFINITIONS: Record<FastPitchPhase, SportPhaseDefinition> = {
  stance: {
    phase: 'stance',
    label: 'Stance',
    short_label: 'Stance',
    description:
      'The starting position in the batter\'s box. Fast pitch requires a compact, efficient stance — there is less time to react than baseball. Stance must allow for quick weight transfer.',
    key_checkpoints: [
      'Feet shoulder-width apart — compact stance is acceptable',
      'Knees slightly bent, weight balanced or slightly on balls of feet',
      'Hands near back shoulder, relaxed grip',
      'Head level, eyes forward — focus on the pitcher\'s release point',
      'Slightly more upright than baseball (narrower strike zone)',
    ],
    common_errors: [
      'Too wide a stance — slows hip rotation',
      'Too far from plate — limits coverage on inside pitches',
      'Grip too tight before pitch begins',
      'Head tilted — makes pitch-plane recognition harder',
    ],
    coaching_cue: 'Stay compact and explosive. The pitch is coming fast — be ready instantly.',
    technical_cue: 'Weight on balls of feet. Hands comfortably back. Eyes locked on release point.',
    estimated_pct_of_swing: 0,
  },

  load: {
    phase: 'load',
    label: 'Load',
    short_label: 'Load',
    description:
      'Quick weight shift onto the back leg as the pitch is released. In fast pitch, the load must be faster and more compact than baseball — there is less time for a large movement.',
    key_checkpoints: [
      'Small, quick weight shift to back hip (not a big sway)',
      'Hands cock slightly back — minimal movement',
      'Front knee lifts slightly for stride trigger',
      'Hips stay closed during load',
      'Eyes pick up ball out of the pitcher\'s hand',
    ],
    common_errors: [
      'Loading too late — pitcher already past release',
      'Over-loading — too much movement wastes the reaction window',
      'Opening hips during load',
      'Losing eye contact with release point during load',
    ],
    coaching_cue: 'Quick, quiet load. Less movement, more explosion. You need your eyes on the ball.',
    technical_cue: 'Load must complete within 100-150ms of pitcher\'s release — compact is key.',
    estimated_pct_of_swing: 0.12,
  },

  rapid_stride: {
    phase: 'rapid_stride',
    label: 'Rapid Stride',
    short_label: 'Stride',
    description:
      'In fast pitch, the stride is typically short and fast — often 4-6 inches. Longer strides cause balance problems and slow the hip rotation needed for the compact, fast swing.',
    key_checkpoints: [
      'Short stride — 4-6 inches maximum in most cases',
      'Front foot lands quickly and softly',
      'Foot lands closed or square — not open',
      'Hands stay absolutely back during stride',
      'The ball\'s plane is being read during this phase',
    ],
    common_errors: [
      'Long, slow stride — mimicking baseball timing and losing contact',
      'Stride foot opening — robbing hip rotation',
      'Hands drifting forward with stride',
      'Lunge stride — shifting weight prematurely',
    ],
    coaching_cue: 'Short and quick. Tiny step, explosive swing. Save the power for the bat.',
    technical_cue: 'Shorter stride than baseball. Foot must land before the ball enters the zone.',
    estimated_pct_of_swing: 0.25,
  },

  hip_fire: {
    phase: 'hip_fire',
    label: 'Hip Fire',
    short_label: 'Hip Fire',
    description:
      'Explosive hip rotation — the primary power source. In fast pitch, this must happen quickly because the ball moves through the zone faster than baseball.',
    key_checkpoints: [
      'Hips rotate explosively toward pitcher',
      'Front foot pivots as hips drive through',
      'Back heel rises off the ground',
      'Shoulders follow hips — not simultaneous',
      'Weight shifts forward rapidly',
    ],
    common_errors: [
      'Hips stalling — arm-only swing',
      'Arms starting before hips fire',
      'Both feet staying flat — no rotation',
      'Front side collapsing under hip pressure',
    ],
    coaching_cue: 'Hips first — always. Let the hips fire the shoulders, not the arms.',
    technical_cue: 'Fast pitch requires maximum hip rotation speed — compact means no wasted movement, not less rotation.',
    estimated_pct_of_swing: 0.40,
  },

  contact: {
    phase: 'contact',
    label: 'Contact',
    short_label: 'Contact',
    description:
      'Ball meets bat sweet spot. The rising pitch trajectory in fast pitch means the ball often contacts in a slightly different zone than baseball. Keeping the head down is absolutely critical.',
    key_checkpoints: [
      'Head locked — eyes on ball at contact',
      'Contact slightly in front of or at the hip',
      'Hips mostly open at contact',
      'Bat on the same plane as the ball\'s trajectory',
      'Firm front side — no buckling',
    ],
    common_errors: [
      'Head pulling off the rising ball',
      'Contact too deep — ball jams hitter',
      'Bat below the ball\'s rising plane — pop-ups',
      'Front leg collapsing',
    ],
    coaching_cue: 'See the ball hit the bat. The rising pitch tricks your eyes — trust your hands.',
    technical_cue: 'The rising pitch requires bat plane adjustment — stay on the ball\'s plane through contact.',
    estimated_pct_of_swing: 0.60,
  },

  extension: {
    phase: 'extension',
    label: 'Extension',
    short_label: 'Extension',
    description:
      'Both arms extend through the contact zone. Fast pitch power is generated from rotation, so extension drives force into the ball through the zone.',
    key_checkpoints: [
      'Both arms extending through the hitting zone',
      'Bat stays on the ball\'s plane',
      'Weight fully transferring forward',
      'Hips completely open',
    ],
    common_errors: [
      'Stopping at contact instead of driving through',
      'Collapsing elbow before extension',
      'Bat path going flat when ball is rising',
    ],
    coaching_cue: 'Drive through — not just to contact. Push that barrel through the zone.',
    technical_cue: 'Extension maintains bat speed through the zone for maximum energy transfer.',
    estimated_pct_of_swing: 0.75,
  },

  follow_through: {
    phase: 'follow_through',
    label: 'Follow-Through',
    short_label: 'Finish',
    description:
      'The bat completes its arc. Fast pitch follow-through is often slightly more compact than baseball due to the quicker, tighter swing, but should still finish high.',
    key_checkpoints: [
      'Bat finishes above front shoulder',
      'Head down until well after contact',
      'Full weight on front foot',
      'Hips and torso facing the pitcher',
    ],
    common_errors: [
      'Stopping swing at contact',
      'One-handed finish',
      'Head coming up immediately at contact',
    ],
    coaching_cue: 'Finish high — the swing isn\'t done until the bat is past your shoulder.',
    technical_cue: 'Even compact fast pitch swings decelerate after contact, not at it.',
    estimated_pct_of_swing: 0.85,
  },
};
