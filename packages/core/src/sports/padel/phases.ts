// ============================================================
// SwingVantage — Padel Stroke Phase Definitions
// Padel is NOT "tennis with walls": the back and side glass are
// in play, the game is always doubles, and the defining shots are
// the overhead family (bandeja, víbora, smash) used to hold the
// net. Phases below model the padel stroke cycle including the
// wall-read that has no equivalent in tennis or pickleball.
// Evidence sources: FIP/FEP coaching material, published padel
// coaching methodology on glass play and net control.
// ============================================================

import type { SportPhaseDefinition } from '../types';

export type PadelPhase =
  | 'ready_position'
  | 'split_step'
  | 'wall_read'
  | 'preparation'
  | 'contact'
  | 'follow_through'
  | 'recovery';

export const PADEL_PHASE_SEQUENCE: PadelPhase[] = [
  'ready_position',
  'split_step',
  'wall_read',
  'preparation',
  'contact',
  'follow_through',
  'recovery',
];

export const PADEL_PHASE_DEFINITIONS: Record<PadelPhase, SportPhaseDefinition> = {
  ready_position: {
    phase: 'ready_position',
    label: 'Ready Position',
    short_label: 'Ready',
    description:
      'The athletic base, shared with a partner. Position depends on whether the team is attacking at the ' +
      'net or defending at the back glass — paddle up, knees bent, ready to move to the ball or the wall.',
    key_checkpoints: [
      'Paddle held up and in front, continental grip',
      'Knees bent, weight forward on the balls of the feet',
      'Spacing with partner — cover the court as a pair, no gaps',
      'Eyes on the opponent\'s contact to read direction early',
      'Body angled to the likely play (net or back glass)',
    ],
    common_errors: [
      'Standing tall and flat between shots',
      'Partner spacing too wide — a seam opens down the middle',
      'Paddle dropped low — slow to defend a fast ball',
      'Watching the ball only, not reading the opponent',
    ],
    coaching_cue: 'Stay low and connected to your partner — move as one wall across the court.',
    technical_cue: 'Continental grip, paddle up; maintain ~3–4m partner spacing relative to ball position.',
    estimated_pct_of_swing: 0,
  },

  split_step: {
    phase: 'split_step',
    label: 'Split Step',
    short_label: 'Split',
    description:
      'A small loaded hop landing as the opponent strikes, so the first step — toward the ball, the net, or ' +
      'back to track a lob off the glass — is balanced and explosive.',
    key_checkpoints: [
      'Both feet land together on opponent contact',
      'Land low and loaded, weight forward',
      'Read the ball off the paddle to choose direction',
      'Be ready to turn and run back for a lob over your head',
    ],
    common_errors: [
      'No split — late on lobs and fast balls alike',
      'Splitting tall, losing the reactive base',
      'Drifting forward when a lob is coming (caught flat)',
    ],
    coaching_cue: 'Land as they hit — especially ready to turn and chase a lob to the back glass.',
    technical_cue: 'Time the split to opponent contact; load to push in any direction, including backpedal.',
    estimated_pct_of_swing: 0.1,
  },

  wall_read: {
    phase: 'wall_read',
    label: 'Wall Read',
    short_label: 'Wall Read',
    description:
      'The decision unique to padel: will you play the ball in the air, or let it pass and take it off the ' +
      'back or side glass? Reading the rebound — speed, height, and angle off the glass — sets up everything.',
    key_checkpoints: [
      'Judge whether to volley/smash or let the ball pass to the glass',
      'Track the ball all the way to the wall, turning side-on',
      'Give yourself space — move back and let the ball come off the glass to you',
      'Anticipate the rebound height and angle (back wall vs. side-back double wall)',
      'Set the feet early so contact after the bounce is on balance',
    ],
    common_errors: [
      'Crowding the ball against the glass — no room to swing',
      'Misjudging the rebound and contacting late or jammed',
      'Playing a ball off the glass when an air shot was better (or vice versa)',
      'Not turning to track the ball into the wall',
    ],
    coaching_cue: 'Let the wall be your friend — give the ball space and let it come back to you.',
    technical_cue: 'Read rebound trajectory off the glass; create distance so contact happens out of the corner, not in it.',
    estimated_pct_of_swing: 0.3,
  },

  preparation: {
    phase: 'preparation',
    label: 'Preparation',
    short_label: 'Prep',
    description:
      'Setting the paddle for the chosen shot. Volleys use a compact block; the overhead family (bandeja, ' +
      'víbora, smash) uses a higher, side-on preparation. Footwork sets up balance for the strike.',
    key_checkpoints: [
      'Turn side-on; non-paddle hand helps track the ball (overheads)',
      'Compact, blocking preparation for volleys',
      'Higher, controlled take-back for bandeja/víbora — not a full tennis serve motion',
      'Weight loaded to move into or under the ball',
      'For glass play, paddle set low and behind the rebound',
    ],
    common_errors: [
      'Big tennis-serve backswing on the bandeja — loss of control',
      'Late preparation after the wall read',
      'Square stance on overheads instead of turning side-on',
      'Over-preparing on volleys (winding up instead of blocking)',
    ],
    coaching_cue: 'Turn sideways and prepare early — the bandeja is controlled, not a full smash.',
    technical_cue: 'Match prep to shot: block for volleys, compact side-on lift for bandeja/víbora, fuller turn for the flat smash.',
    estimated_pct_of_swing: 0.45,
  },

  contact: {
    phase: 'contact',
    label: 'Contact',
    short_label: 'Contact',
    description:
      'Paddle meets ball. Padel rewards control and placement over raw power — contact point, paddle-face ' +
      'angle, and the choice of spin (slice on the bandeja, side-spin on the víbora) define the shot.',
    key_checkpoints: [
      'Contact out in front and at a comfortable, controlled height',
      'Bandeja: contact slightly in front, brushing for slice and depth control',
      'Víbora: contact with a side-spin brush for a skidding, aggressive overhead',
      'Volley: firm, stable face, punch toward the target',
      'For glass play, contact after the rebound with a clean, unhurried face',
    ],
    common_errors: [
      'Overhitting the smash when a bandeja would hold the net',
      'Flat, uncontrolled overhead that sits up for a counter',
      'Open face on the volley, floating the ball',
      'Contacting glass rebounds too close to the body',
    ],
    coaching_cue: 'Control first — the bandeja keeps you at the net; the smash only when the ball begs for it.',
    technical_cue: 'Choose spin to match intent: slice bandeja for control/depth, side-spin víbora to attack, flat smash to finish.',
    estimated_pct_of_swing: 0.6,
  },

  follow_through: {
    phase: 'follow_through',
    label: 'Follow-Through',
    short_label: 'Follow',
    description:
      'A controlled finish that shapes spin and depth, then recovers quickly. Padel follow-throughs stay ' +
      'compact so the player can hold the net and react to a fast reply or a counter off the glass.',
    key_checkpoints: [
      'Bandeja finishes out toward the target, low and controlled (not over the shoulder)',
      'Volley finish is short and forward',
      'Recover the paddle to ready position immediately',
      'Stay balanced — do not fall back off the net after an overhead',
      'Body controlled to react to the next ball or rebound',
    ],
    common_errors: [
      'Full over-the-shoulder smash finish on what should be a bandeja',
      'Falling backward after the overhead, surrendering the net',
      'Long, loose finish that delays the next reaction',
    ],
    coaching_cue: 'Finish out toward your target and stay forward — you are holding the net, not ending the point with one swing.',
    technical_cue: 'Keep the finish compact and balanced; recover the paddle and net position before the reply.',
    estimated_pct_of_swing: 0.8,
  },

  recovery: {
    phase: 'recovery',
    label: 'Recovery',
    short_label: 'Recovery',
    description:
      'Re-establishing court position with the partner. After an attacking shot the team holds the net; after ' +
      'a defensive glass shot the team recovers balance and waits for the next chance to take the net.',
    key_checkpoints: [
      'Paddle back to ready position at chest height',
      'Re-establish net position with the partner after attacking',
      'Recover spacing — move together to cover the middle and the lob',
      'If defending, reset balance and prepare for the next wall read',
    ],
    common_errors: [
      'Staying back after a bandeja instead of holding the net',
      'Partner spacing opening up after a scramble',
      'Admiring the shot instead of recovering position',
      'Leaving the lob lane open over the head',
    ],
    coaching_cue: 'Reset with your partner — win the net together and protect the lob over your heads.',
    technical_cue: 'Restore partner spacing and net/defense position; re-set the paddle within ~0.5s of contact.',
    estimated_pct_of_swing: 1.0,
  },
};
