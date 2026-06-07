// ============================================================
// SwingVantage — Pickleball Drill Library
// Drills mapped to visual stroke issues and phases.
// All YouTube links are SEARCH LINKS only — never hardcoded video IDs.
// ============================================================

import type { SportDrillRecommendation } from '../types';

function ytSearch(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

export const PICKLEBALL_DRILLS: SportDrillRecommendation[] = [
  // ── Popping Up Dinks ─────────────────────────────────────────
  {
    id: 'pb_dink_height_gate',
    sport_id: 'pickleball',
    issue_id: 'pb_popping_up_dinks',
    phase: 'contact',
    name: 'Net-Skimmer Dink Gate Drill',
    goal: 'Keep dinks low and unattackable by controlling paddle-face angle',
    steps: [
      'Stand at the kitchen line with a partner across the net',
      'Set a string or eye-line target ~6 inches above the net tape',
      'Cross-court dink, trying to send every ball just over your target line',
      'Keep the paddle face slightly open and stable — lift with the legs, not the wrist',
      'Count consecutive dinks that clear low without popping above shoulder height',
    ],
    reps_or_duration: '5 minutes cross-court, then 5 minutes straight-ahead',
    skill_level: 'beginner',
    difficulty: 'beginner',
    equipment_needed: 'Paddle, balls, partner, optional string target',
    safety_note: null,
    youtube_search_query: 'pickleball dink drill keep it low unattackable paddle control',
    youtube_search_url: ytSearch('pickleball dink drill keep it low unattackable paddle control'),
    coach_channel_hint: 'PrimeTime Pickleball, Enhance Pickleball',
    focus_feel: 'Soft hands, quiet wrist — push the ball over the net with your legs, not a swing.',
    source_ids: [],
    last_reviewed: '2026-06-01',
  },

  // ── Netting the Third-Shot Drop ──────────────────────────────
  {
    id: 'pb_third_drop_arc',
    sport_id: 'pickleball',
    issue_id: 'pb_netting_third_drop',
    phase: 'forward_swing',
    name: 'Third-Shot Drop Arc Drill',
    goal: 'Land soft drops in the kitchen instead of dumping them into the net',
    steps: [
      'Start at the baseline; partner feeds from the kitchen line',
      'Hit a drop aiming for an arc that peaks on your side of the net',
      'Lift the ball with leg drive and a low-to-high paddle path — stay relaxed',
      'Target a cone or towel inside the non-volley zone',
      'Track make/miss; progress to drop-and-advance toward the line',
    ],
    reps_or_duration: '3 sets of 15 drops, then 10 drop-and-advance reps',
    skill_level: 'intermediate',
    difficulty: 'intermediate',
    equipment_needed: 'Paddle, balls, partner, target cone',
    safety_note: null,
    youtube_search_query: 'pickleball third shot drop drill arc soft hands tutorial',
    youtube_search_url: ytSearch('pickleball third shot drop drill arc soft hands tutorial'),
    coach_channel_hint: 'Enhance Pickleball, Briones Pickleball',
    focus_feel: 'Feel the ball float off the paddle — the arc peaks before the net, then drops soft.',
    source_ids: [],
    last_reviewed: '2026-06-01',
  },

  // ── Driving Long ─────────────────────────────────────────────
  {
    id: 'pb_drive_depth_control',
    sport_id: 'pickleball',
    issue_id: 'pb_driving_long',
    phase: 'contact',
    name: 'Drive Depth & Topspin Control Drill',
    goal: 'Keep drives in by adding low-to-high brush and contacting out front',
    steps: [
      'Feed yourself or have a partner feed mid-court balls',
      'Drive with a low-to-high brush to add topspin that pulls the ball down',
      'Make contact clearly out in front of the body, not beside the hip',
      'Aim for a deep target band 2–4 feet inside the baseline',
      'If balls sail, close the paddle face slightly and finish lower',
    ],
    reps_or_duration: '3 sets of 12 drives to a deep target band',
    skill_level: 'intermediate',
    difficulty: 'intermediate',
    equipment_needed: 'Paddle, balls, partner or wall',
    safety_note: null,
    youtube_search_query: 'pickleball drive topspin control keep it in drill',
    youtube_search_url: ytSearch('pickleball drive topspin control keep it in drill'),
    coach_channel_hint: 'PrimeTime Pickleball, ThatPickleballGuy',
    focus_feel: 'Brush up the back of the ball — feel topspin grab and pull the drive down in front of the baseline.',
    source_ids: [],
    last_reviewed: '2026-06-01',
  },

  // ── Poor Reset ───────────────────────────────────────────────
  {
    id: 'pb_transition_reset',
    sport_id: 'pickleball',
    issue_id: 'pb_poor_reset',
    phase: 'contact',
    name: 'Transition-Zone Reset Drill',
    goal: 'Absorb pace and reset hard balls softly into the kitchen',
    steps: [
      'Stand in the transition zone (mid-court); partner drives or volleys at you',
      'Let the paddle "give" on contact — soft hands, relaxed grip, no swing',
      'Punch nothing — simply present a stable face and absorb the pace',
      'Reset the ball low into the NVZ, then step in behind it',
      'Progress: partner increases pace as your hands stay soft',
    ],
    reps_or_duration: '4 sets of 10 resets, increasing feed pace',
    skill_level: 'advanced',
    difficulty: 'advanced',
    equipment_needed: 'Paddle, balls, partner',
    safety_note: 'Wear eye protection when taking driven balls at close range.',
    youtube_search_query: 'pickleball reset drill soft hands transition zone block',
    youtube_search_url: ytSearch('pickleball reset drill soft hands transition zone block'),
    coach_channel_hint: 'Enhance Pickleball, Pickleball Therapy',
    focus_feel: 'Catch the ball with the paddle like an egg — let it die soft and drop into the kitchen.',
    source_ids: [],
    last_reviewed: '2026-06-01',
  },

  // ── Speed-Up Errors ──────────────────────────────────────────
  {
    id: 'pb_attackable_ball_id',
    sport_id: 'pickleball',
    issue_id: 'pb_speed_up_error',
    phase: 'contact',
    name: 'Attackable-Ball Recognition Drill',
    goal: 'Only speed up balls above net height; keep low balls soft',
    steps: [
      'Dink cross-court with a partner at the kitchen line',
      'On any ball that pops above net height, attack it with a controlled roll',
      'On any ball below net height, keep dinking — no speed-up',
      'Call out "up!" or "down!" before each contact to train recognition',
      'Track unforced speed-up errors and aim to drive them toward zero',
    ],
    reps_or_duration: '10-minute dink-and-attack game, tracking errors',
    skill_level: 'intermediate',
    difficulty: 'intermediate',
    equipment_needed: 'Paddle, balls, partner',
    safety_note: null,
    youtube_search_query: 'pickleball when to speed up attackable ball recognition drill',
    youtube_search_url: ytSearch('pickleball when to speed up attackable ball recognition drill'),
    coach_channel_hint: 'Briones Pickleball, Pickleball Therapy',
    focus_feel: 'Patience — wait for the ball that floats up. If it is below the net, you keep it soft.',
    source_ids: [],
    last_reviewed: '2026-06-01',
  },

  // ── Long Backswing ───────────────────────────────────────────
  {
    id: 'pb_compact_backswing_fence',
    sport_id: 'pickleball',
    issue_id: 'pb_long_backswing',
    phase: 'compact_prep',
    name: 'Fence Compact-Backswing Constraint',
    goal: 'Shorten the take-back to a compact, pickleball-specific preparation',
    steps: [
      'Stand with your back about a foot from a fence at the kitchen line',
      'Volley with a partner — if your paddle hits the fence, the backswing is too long',
      'Keep all preparation in front of your back hip',
      'Drive face control from the shoulder turn, not a long arm swing',
      'Progress away from the fence once the compact feel is grooved',
    ],
    reps_or_duration: '3 sets of 20 volleys with the fence constraint',
    skill_level: 'beginner',
    difficulty: 'beginner',
    equipment_needed: 'Paddle, balls, partner, fence',
    safety_note: null,
    youtube_search_query: 'pickleball compact volley no backswing punch drill',
    youtube_search_url: ytSearch('pickleball compact volley no backswing punch drill'),
    coach_channel_hint: 'PrimeTime Pickleball, Enhance Pickleball',
    focus_feel: 'Tiny, quiet preparation — the power is in your legs and shoulder, not a windup.',
    source_ids: [],
    last_reviewed: '2026-06-01',
  },

  // ── Late Volleys ─────────────────────────────────────────────
  {
    id: 'pb_hands_battle_volley',
    sport_id: 'pickleball',
    issue_id: 'pb_late_volley',
    phase: 'contact',
    name: 'Hands-Battle Quick Volley Drill',
    goal: 'Meet fast volleys out front with a ready paddle and firm wrist',
    steps: [
      'Both players at the kitchen line, paddle up in ready position',
      'Rapid-fire volley exchange straight at each other, chest-high',
      'Meet every ball out in front — no reaching back or arm-swinging',
      'Reset the paddle to center after every contact',
      'Increase pace gradually; keep the wrist firm and contact early',
    ],
    reps_or_duration: '4 rounds of 30 seconds with rest between',
    skill_level: 'advanced',
    difficulty: 'advanced',
    equipment_needed: 'Paddle, balls, partner',
    safety_note: 'Wear eye protection — fast exchanges at close range.',
    youtube_search_query: 'pickleball hands battle volley speed drill paddle up',
    youtube_search_url: ytSearch('pickleball hands battle volley speed drill paddle up'),
    coach_channel_hint: 'ThatPickleballGuy, PrimeTime Pickleball',
    focus_feel: 'Paddle stays up and out front — you block and redirect, you never wind up.',
    source_ids: [],
    last_reviewed: '2026-06-01',
  },

  // ── Kitchen Footwork ─────────────────────────────────────────
  {
    id: 'pb_kitchen_line_footwork',
    sport_id: 'pickleball',
    issue_id: 'pb_kitchen_footwork',
    phase: 'split_step',
    name: 'Kitchen-Line Footwork & Split Drill',
    goal: 'Get to and hold the non-volley-zone line on balance',
    steps: [
      'Start at the baseline; drop and advance in two to three steps',
      'Split-step each time your partner contacts the ball',
      'Stop with both feet set behind the kitchen line — no momentum over the line',
      'Shuffle laterally to cover dinks without crossing into the NVZ on a volley',
      'Reset to the line after every shot',
    ],
    reps_or_duration: '3 sets of 8 advance-and-hold sequences',
    skill_level: 'beginner',
    difficulty: 'intermediate',
    equipment_needed: 'Paddle, balls, partner',
    safety_note: null,
    youtube_search_query: 'pickleball footwork drill get to kitchen line split step',
    youtube_search_url: ytSearch('pickleball footwork drill get to kitchen line split step'),
    coach_channel_hint: 'Enhance Pickleball, Briones Pickleball',
    focus_feel: 'Move forward under control, split as they hit, and arrive balanced behind the line.',
    source_ids: [],
    last_reviewed: '2026-06-01',
  },

  // ── Poor Transition Zone ─────────────────────────────────────
  {
    id: 'pb_transition_drop_advance',
    sport_id: 'pickleball',
    issue_id: 'pb_poor_transition_zone',
    phase: 'recovery',
    name: 'Drop-Step-Drop Transition Ladder',
    goal: 'Move through the transition zone safely instead of getting stuck mid-court',
    steps: [
      'Hit a third-shot drop from the baseline',
      'Take two controlled steps in, then split-step',
      'If the next ball is low, drop or reset again — do not rush forward',
      'Only advance to the line when you have hit an unattackable ball',
      'Repeat the drop-step-drop ladder until you reach the kitchen',
    ],
    reps_or_duration: '3 sets of 6 full transition sequences',
    skill_level: 'advanced',
    difficulty: 'advanced',
    equipment_needed: 'Paddle, balls, partner',
    safety_note: null,
    youtube_search_query: 'pickleball transition zone drill drop and advance no mans land',
    youtube_search_url: ytSearch('pickleball transition zone drill drop and advance no mans land'),
    coach_channel_hint: 'Pickleball Therapy, Enhance Pickleball',
    focus_feel: 'Patience moving in — earn the line one soft ball at a time, never sprint through the middle.',
    source_ids: [],
    last_reviewed: '2026-06-01',
  },

  // ── Open Paddle Face ─────────────────────────────────────────
  {
    id: 'pb_paddle_face_wall',
    sport_id: 'pickleball',
    issue_id: 'pb_open_paddle_face',
    phase: 'contact',
    name: 'Paddle-Face Control Wall Drill',
    goal: 'Stabilize the paddle face so dinks and drives leave at the right angle',
    steps: [
      'Stand a few feet from a wall; dink-rally against it continuously',
      'Watch where the ball strikes the wall — high means the face is too open',
      'Adjust to a square or slightly open face that returns the ball low',
      'Keep the wrist quiet — the face angle should not change through contact',
      'Progress to alternating forehand and backhand dinks on the wall',
    ],
    reps_or_duration: '8 minutes continuous wall dinks',
    skill_level: 'beginner',
    difficulty: 'beginner',
    equipment_needed: 'Paddle, ball, wall',
    safety_note: null,
    youtube_search_query: 'pickleball paddle face angle control wall drill dink',
    youtube_search_url: ytSearch('pickleball paddle face angle control wall drill dink'),
    coach_channel_hint: 'Enhance Pickleball',
    focus_feel: 'The face is a stable platform — set the angle early and keep it quiet through the ball.',
    source_ids: [],
    last_reviewed: '2026-06-01',
  },
];

// ──────────────────────────────────────────────────────────────
// Lookup helpers
// ──────────────────────────────────────────────────────────────

export function getPickleballDrillsForIssue(issueId: string): SportDrillRecommendation[] {
  return PICKLEBALL_DRILLS.filter((d) => d.issue_id === issueId);
}

export function getPickleballDrillsForPhase(phase: string): SportDrillRecommendation[] {
  return PICKLEBALL_DRILLS.filter((d) => d.phase === phase);
}
