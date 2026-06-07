// ============================================================
// SwingVantage — Pickleball Stroke Phase Definitions
// Pickleball is NOT small-court tennis: the stroke is compact,
// the paddle has no strings to brush, and the non-volley zone
// (kitchen) governs footwork and shot selection. Phases below
// model the compact paddle stroke cycle (dink / drop / drive /
// volley) shared across pickleball shots.
// Evidence sources: USA Pickleball coaching resources, PPR
// teaching methodology, published paddle-sport coaching material.
// ============================================================

import type { SportPhaseDefinition } from '../types';

export type PickleballPhase =
  | 'ready_position'
  | 'split_step'
  | 'compact_prep'
  | 'forward_swing'
  | 'contact'
  | 'follow_through'
  | 'recovery';

export const PICKLEBALL_PHASE_SEQUENCE: PickleballPhase[] = [
  'ready_position',
  'split_step',
  'compact_prep',
  'forward_swing',
  'contact',
  'follow_through',
  'recovery',
];

export const PICKLEBALL_PHASE_DEFINITIONS: Record<PickleballPhase, SportPhaseDefinition> = {
  ready_position: {
    phase: 'ready_position',
    label: 'Ready Position',
    short_label: 'Ready',
    description:
      'The athletic base at or behind the kitchen line. Paddle is held high and out front in a neutral, ' +
      'compact position — ready for a dink, reset, or speed-up with minimal movement.',
    key_checkpoints: [
      'Paddle up and out in front of the body at chest height',
      'Knees bent, weight on the balls of the feet, low center of gravity',
      'Feet roughly shoulder-width, ready to move forward to the kitchen line',
      'Continental ("hammer") grip for fast forehand/backhand transitions',
      'Eyes on the paddle and contact of the opponent, not just the ball',
    ],
    common_errors: [
      'Paddle dropped low — forces a longer, slower path up to the ball',
      'Standing tall — slow to react to a speed-up at the chest',
      'Weight on heels — late to the kitchen line and late on resets',
      'Eastern forehand grip — slow to defend the backhand volley',
    ],
    coaching_cue: 'Paddle up, hands soft, ready to absorb or attack — like a boxer guarding the chest.',
    technical_cue: 'Neutral continental grip; paddle tip up; ready position re-set within ~0.4s of every shot.',
    estimated_pct_of_swing: 0,
  },

  split_step: {
    phase: 'split_step',
    label: 'Split Step',
    short_label: 'Split',
    description:
      'A small hop that lands as the opponent contacts the ball, loading the legs so the first move ' +
      'to the ball — forward to the kitchen or back into transition — is explosive and balanced.',
    key_checkpoints: [
      'Both feet land together the instant the opponent strikes the ball',
      'Land soft and low — knees bent, weight forward',
      'Read the ball off the paddle to choose direction immediately',
      'Stay light — the split is a load, not a stop',
    ],
    common_errors: [
      'No split step — flat-footed and late to attackable balls',
      'Splitting too early or too late relative to opponent contact',
      'Landing tall, losing the loaded, reactive base',
      'Drifting backward instead of holding ground at the kitchen',
    ],
    coaching_cue: 'Land as they hit — be on balance the moment the ball comes off their paddle.',
    technical_cue: 'Time the split to opponent contact; land loaded to push forward into the NVZ line.',
    estimated_pct_of_swing: 0.12,
  },

  compact_prep: {
    phase: 'compact_prep',
    label: 'Compact Preparation',
    short_label: 'Prep',
    description:
      'A short, quiet paddle take-back. Pickleball has no long backswing loop — preparation is small and ' +
      'shoulder-driven so the same setup can dink, reset, drop, or drive without telegraphing.',
    key_checkpoints: [
      'Backswing stays in front of the body — paddle barely passes the hip',
      'Shoulder turn (not the arm) sets the paddle',
      'Wrist stays firm and quiet — no big cock or load',
      'Same compact prep for dink, drop, and drive (disguise)',
      'Lead with a stable, slightly open or square paddle face',
    ],
    common_errors: [
      'Long, tennis-style backswing — late contact and pop-ups',
      'Wristy take-back — inconsistent face angle at contact',
      'Lifting the elbow and arm-swinging instead of shoulder turn',
      'Different prep for soft vs. hard shots, telegraphing intent',
    ],
    coaching_cue: 'Short and quiet — most of your power comes from your legs and shoulder, not a big swing.',
    technical_cue: 'Keep the backswing in front of the back hip; drive face control from the shoulder, not the wrist.',
    estimated_pct_of_swing: 0.3,
  },

  forward_swing: {
    phase: 'forward_swing',
    label: 'Forward Swing',
    short_label: 'Forward',
    description:
      'The paddle moves to the ball on a low-to-high (dink/drop) or level (drive/volley) path. Tempo is ' +
      'controlled — the goal is paddle-face accuracy and the right pace, not maximum speed.',
    key_checkpoints: [
      'Low-to-high lift for dinks and third-shot drops (soft arc)',
      'Level, compact push for drives and punch volleys',
      'Legs add the lift on drops — knees extend, paddle stays passive',
      'Paddle accelerates smoothly, no sudden wrist snap',
      'Body stays balanced and quiet over a stable base',
    ],
    common_errors: [
      'All-arm swing with no leg lift on the drop',
      'Decelerating into the ball, dumping drops into the net',
      'Swinging too hard on a soft shot — losing touch',
      'Wrist flicking to add pace, spraying the paddle face',
    ],
    coaching_cue: 'Lift soft shots with your legs; push drives with your shoulder — let the paddle stay calm.',
    technical_cue: 'Match path to shot: upward for dink/drop, level for drive/volley; power from legs, not wrist.',
    estimated_pct_of_swing: 0.5,
  },

  contact: {
    phase: 'contact',
    label: 'Contact',
    short_label: 'Contact',
    description:
      'Paddle meets ball. In pickleball the single biggest variables are paddle-face angle and contact ' +
      'height — out in front, with a stable face, at or above net height for attacks and below it for resets.',
    key_checkpoints: [
      'Contact clearly out in front of the body (not beside the hip)',
      'Paddle face controlled — slightly open for dinks, square for drives',
      'Soft hands on resets — absorb pace, do not add it',
      'Contact height read correctly: attack a high ball, reset a low one',
      'Eyes locked on the contact point through the strike',
    ],
    common_errors: [
      'Open paddle face popping dinks up into the attack zone',
      'Late contact behind the body — drives sail long',
      'Tight hands on resets — the ball rebounds and floats',
      'Attacking a ball below net height (unforced speed-up error)',
    ],
    coaching_cue: 'Meet it out front with a quiet face — let the ball come to you, then place it.',
    technical_cue: 'Contact out front; control face angle for the shot; soft hands below net height, firm above it.',
    estimated_pct_of_swing: 0.65,
  },

  follow_through: {
    phase: 'follow_through',
    label: 'Follow-Through',
    short_label: 'Follow',
    description:
      'A short, controlled finish. Pickleball follow-throughs are compact — they shape the ball and reset ' +
      'the paddle quickly rather than wrapping around the body like a groundstroke.',
    key_checkpoints: [
      'Finish low-to-high but short — paddle stops near eye level on a drop',
      'Drive follow-through stays compact and forward (toward the target)',
      'Paddle returns to ready position immediately',
      'Body stays balanced — no falling forward into the kitchen (foot fault)',
      'No deceleration before contact disguised as a "short" finish',
    ],
    common_errors: [
      'Big wrap-around finish — slow to re-set for the next ball',
      'Following momentum into the kitchen and faulting',
      'Flipping the wrist over at the finish, losing face control',
      'Long finish on a reset, adding unwanted pace',
    ],
    coaching_cue: 'Short finish, then paddle straight back up — the next ball is coming fast.',
    technical_cue: 'Keep the finish compact and balanced; recover the paddle before the opponent re-contacts.',
    estimated_pct_of_swing: 0.82,
  },

  recovery: {
    phase: 'recovery',
    label: 'Recovery',
    short_label: 'Recovery',
    description:
      'Re-establishing position and balance after the shot. In doubles this means holding or regaining the ' +
      'kitchen line with your partner and re-setting the paddle for the next exchange.',
    key_checkpoints: [
      'Paddle back to ready position at chest height',
      'Re-establish the kitchen line if you advanced from transition',
      'Move with your partner — keep doubles spacing tight',
      'Reset weight forward, balanced, ready to split again',
    ],
    common_errors: [
      'Admiring the shot instead of resetting the paddle',
      'Backing off the kitchen line after a soft shot',
      'Partner spacing opening up — leaving a seam down the middle',
      'Recovering tall and flat-footed',
    ],
    coaching_cue: 'Get back to the line with your partner and your paddle up — the point is not over.',
    technical_cue: 'Hold the NVZ line, restore partner spacing, re-set the paddle within ~0.4s of contact.',
    estimated_pct_of_swing: 1.0,
  },
};
