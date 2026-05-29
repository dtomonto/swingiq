// ============================================================
// SwingIQ — Swing Phase Definitions
// Static coaching content for each phase of the golf swing.
// ============================================================

import type { SwingPhase } from '../types';

export interface PhaseDefinition {
  phase: SwingPhase;
  label: string;
  short_label: string;
  description: string;
  key_checkpoints: string[];
  common_errors: string[];
  coaching_cue: string;      // feel-based cue
  technical_cue: string;     // data / position cue
  estimated_pct_of_swing: number; // rough % of total swing duration
}

export const SWING_PHASE_DEFINITIONS: Record<SwingPhase, PhaseDefinition> = {
  setup_address: {
    phase: 'setup_address',
    label: 'Setup & Address',
    short_label: 'Address',
    description:
      'The starting position before the swing begins. Setup determines the blueprint for everything that follows.',
    key_checkpoints: [
      'Feet shoulder-width apart (irons) or slightly wider (driver)',
      'Spine tilted slightly away from target (driver) or neutral (irons)',
      'Weight balanced 50/50 or slightly into lead heel',
      'Arms hanging naturally, slight bend in elbows',
      'Ball position: inside lead heel (driver) to centre (short irons)',
    ],
    common_errors: [
      'Weight too much on toes causing balance issues',
      'Standing too close or too far from ball',
      'Aim is left/right of intended target',
      'Grip too tight restricting arm swing',
    ],
    coaching_cue: 'Feel like you\'re sitting into a tall bar stool — athletic and ready.',
    technical_cue: 'Check that spine angle, knee flex, and ball position match your club selection.',
    estimated_pct_of_swing: 0,
  },

  takeaway: {
    phase: 'takeaway',
    label: 'Takeaway',
    short_label: 'Takeaway',
    description:
      'The first movement of the club away from the ball. Sets the path and plane for the entire backswing.',
    key_checkpoints: [
      'Club moves back low and inside target line initially',
      'Shoulders start to rotate while hips resist',
      'Wrists remain mostly uncocked until hands reach hip height',
      'Club face stays roughly square (matching spine angle)',
    ],
    common_errors: [
      'Picking up the club — too steep takeaway',
      'Rolling the forearms open causing inside path',
      'Swaying the hips instead of rotating',
      'Disconnecting trail arm from body too early',
    ],
    coaching_cue: 'Feel like you\'re pushing the handle low along the ground for the first foot.',
    technical_cue: 'At hip height, the shaft should be parallel to target line; toe of club points up.',
    estimated_pct_of_swing: 0.12,
  },

  club_parallel_back: {
    phase: 'club_parallel_back',
    label: 'Club Parallel (Back)',
    short_label: 'P3',
    description:
      'When the shaft is parallel to the ground on the backswing (hands at hip height, often called P3).',
    key_checkpoints: [
      'Shaft parallel to ground and to target line',
      'Toe of club pointing straight up (neutral face)',
      'Left arm (right-hander) relatively straight',
      'Weight beginning to shift into trail side',
    ],
    common_errors: [
      'Club face already rolled open or closed',
      'Too much wrist cock creating steep plane',
      'Trail elbow flying away from body',
    ],
    coaching_cue: 'Feel like the club is a tray you\'re carrying — flat, not tilted.',
    technical_cue: 'Shaft should be on your hand-plane: parallel to the ground and your forearm line.',
    estimated_pct_of_swing: 0.22,
  },

  lead_arm_parallel: {
    phase: 'lead_arm_parallel',
    label: 'Lead Arm Parallel (P4)',
    short_label: 'P4',
    description:
      'When the lead arm is parallel to the ground on the backswing (often called P4 or halfway back).',
    key_checkpoints: [
      'Lead arm parallel to ground',
      'Wrists fully hinged (or nearly)',
      'Shoulder turn nearing 45–60°',
      'Weight predominantly on trail foot',
    ],
    common_errors: [
      'Insufficient wrist hinge reducing power',
      'Lead arm breaking down (chicken wing)',
      'Reverse pivot — weight moving toward target',
    ],
    coaching_cue: 'Feel the width in your swing — arms stretched away from your body.',
    technical_cue: 'Shaft should point toward the target line when shaft is parallel to the ground.',
    estimated_pct_of_swing: 0.32,
  },

  top_of_backswing: {
    phase: 'top_of_backswing',
    label: 'Top of Backswing',
    short_label: 'Top',
    description:
      'The transition point — the farthest the club travels back before the downswing begins.',
    key_checkpoints: [
      'Shoulder turn 90° (or as close as mobility allows)',
      'Hip turn 30–45°',
      'Shaft on plane or slightly laid off',
      'Weight loaded into trail hip/glute',
      'Lead wrist flat or slightly cupped (driver)',
    ],
    common_errors: [
      'Over-swinging past parallel',
      'Reverse pivot (spine leans toward target)',
      'Cross the line — shaft points right of target',
      'Laid-off shaft — points left of target at top',
      'Early wrist breakdown (cupped lead wrist)',
    ],
    coaching_cue: 'Feel the tension in your lead shoulder — coiled against a resisting lower body.',
    technical_cue: 'Trail elbow should be pointing roughly at the ground; shaft parallel or slightly short.',
    estimated_pct_of_swing: 0.45,
  },

  transition: {
    phase: 'transition',
    label: 'Transition',
    short_label: 'Transition',
    description:
      'The brief moment where the backswing ends and the downswing begins. Critical for sequencing and power.',
    key_checkpoints: [
      'Lower body initiates the downswing (hips begin to shift and rotate)',
      'Upper body/arms "drop" rather than throw at ball',
      'Club shallows on the way down',
      'Weight begins shifting toward lead side',
    ],
    common_errors: [
      'Casting from the top (early release of wrist hinge)',
      'Shoulder spinning first (over the top)',
      'Steep transition losing shallowing move',
    ],
    coaching_cue: 'Feel like you\'re bumping your lead hip toward the target before your arms move.',
    technical_cue: 'Lead hip should begin lateral shift before hands start moving downward.',
    estimated_pct_of_swing: 0.50,
  },

  lead_arm_parallel_downswing: {
    phase: 'lead_arm_parallel_downswing',
    label: 'Lead Arm Parallel (Downswing)',
    short_label: 'P6',
    description:
      'When the lead arm is parallel to the ground on the downswing (P6). Club should be on plane or slightly below.',
    key_checkpoints: [
      'Lead arm parallel to ground',
      'Club approaching from inside or on-plane',
      'Wrists still maintaining some lag',
      'Hips open 20–30°',
    ],
    common_errors: [
      'Over-the-top move (club outside-in at this point)',
      'Already fully cast — no lag remaining',
      'Weight still on trail side (hanging back)',
    ],
    coaching_cue: 'Feel the handle pointing at your trail hip — you\'re still "loading" the shaft.',
    technical_cue: 'Shaft should be below the plane line set at address; butt of club pointing at ball-target line.',
    estimated_pct_of_swing: 0.62,
  },

  shaft_parallel_downswing: {
    phase: 'shaft_parallel_downswing',
    label: 'Shaft Parallel (Downswing)',
    short_label: 'P7',
    description:
      'When the shaft is parallel to the ground on the downswing (P7). The "delivery position" — sets impact.',
    key_checkpoints: [
      'Hands ahead of club head (lag maintained)',
      'Trail elbow tucked close to trail hip',
      'Weight majority on lead side',
      'Hips open 40–50°',
      'Face angle approaching square',
    ],
    common_errors: [
      'Flipping — wrists releasing early',
      'Trail elbow sticking out (blocking impact)',
      'Face still open — will cause weak fade/slice',
    ],
    coaching_cue: 'Feel the shaft being dragged through — handle leading, club head trailing.',
    technical_cue: 'Butt of club should point at the ball; hands ahead of the club head.',
    estimated_pct_of_swing: 0.75,
  },

  impact: {
    phase: 'impact',
    label: 'Impact',
    short_label: 'Impact',
    description:
      'The moment of contact with the ball. The moment of truth — everything in the swing serves this position.',
    key_checkpoints: [
      'Hands ahead of ball (forward shaft lean for irons)',
      'Hips open 40–50° to target',
      'Shoulders approaching square',
      'Weight 70–80% on lead foot',
      'Head slightly behind ball',
      'Club face square to path (or intentional shape)',
    ],
    common_errors: [
      'Flipping — wrists breaking down before impact',
      'Early extension — hips thrusting toward ball',
      'Hanging back — weight still on trail foot',
      'Chicken wing lead arm',
    ],
    coaching_cue: 'Feel like you\'re pressing a thumbtack into a wall with the handle — driving the handle toward the target.',
    technical_cue: 'Shaft lean of 2–6° for irons; hands 2–4 inches ahead of the ball at impact.',
    estimated_pct_of_swing: 0.85,
  },

  post_impact: {
    phase: 'post_impact',
    label: 'Post-Impact / Extension',
    short_label: 'Extension',
    description:
      'Immediately after the ball is struck. Extension through the ball and into the follow-through.',
    key_checkpoints: [
      'Lead arm extending toward target',
      'Trail arm crossing over lead arm (for draws)',
      'Club path continuing down target line',
      'Head beginning to release naturally',
    ],
    common_errors: [
      'Chicken winging — lead arm folding immediately',
      'Blocking the release — holding face open',
      'Decelerating through impact',
    ],
    coaching_cue: 'Feel like you\'re reaching the club to shake hands with someone at the target.',
    technical_cue: 'Both arms should be extended together for 6–12 inches past the ball before folding.',
    estimated_pct_of_swing: 0.90,
  },

  finish: {
    phase: 'finish',
    label: 'Finish',
    short_label: 'Finish',
    description:
      'The end of the swing. A balanced, full finish indicates a complete and controlled release.',
    key_checkpoints: [
      'Weight fully on lead foot (90%+ for full shots)',
      'Trail foot up on its toe or lifted',
      'Belt buckle facing target or left of target',
      'Hands high — club behind the head',
      'Balanced and comfortable holding the pose',
    ],
    common_errors: [
      'Falling backward — weight not transferred',
      'Shortened finish — deceleration or restricted turn',
      'Off-balance — lateral sway not corrected',
    ],
    coaching_cue: 'Feel tall, balanced, and proud — like a statue you could hold for 3 seconds.',
    technical_cue: 'Trail shoulder should point toward or past the target. Lead leg straight and firm.',
    estimated_pct_of_swing: 1.0,
  },
};

/** Ordered array of all swing phases in sequence */
export const SWING_PHASE_SEQUENCE: SwingPhase[] = [
  'setup_address',
  'takeaway',
  'club_parallel_back',
  'lead_arm_parallel',
  'top_of_backswing',
  'transition',
  'lead_arm_parallel_downswing',
  'shaft_parallel_downswing',
  'impact',
  'post_impact',
  'finish',
];

/** Key phases shown prominently in the UI timeline (abbreviated set) */
export const KEY_PHASE_SEQUENCE: SwingPhase[] = [
  'setup_address',
  'top_of_backswing',
  'impact',
  'finish',
];
