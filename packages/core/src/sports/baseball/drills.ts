// ============================================================
// SwingIQ — Baseball Drill Library
// Drills mapped to visual swing issues and phases.
// All YouTube links are SEARCH LINKS only — never hardcoded video IDs.
// ============================================================

import type { SportDrillRecommendation } from '../types';

function ytSearch(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

export const BASEBALL_DRILLS: SportDrillRecommendation[] = [
  // ── Casting Hands ─────────────────────────────────────────────
  {
    id: 'bb_back_to_screen',
    sport_id: 'baseball',
    issue_id: 'casting_hands',
    phase: 'bat_lag',
    name: 'Back-to-the-Screen Drill',
    goal: 'Eliminate bat casting by keeping the knob to the ball path',
    steps: [
      'Stand with your back to a fence or batting cage screen, 6-8 inches away',
      'Take your normal stance and begin the swing',
      'The bat should NOT hit the screen on the backswing or early downswing',
      'If the barrel hits the screen, you are casting — the screen provides immediate feedback',
      'Work in slow motion first, then progress to tee work, then live BP',
    ],
    reps_or_duration: '3 sets of 15 tee swings',
    skill_level: 'beginner',
    difficulty: 'beginner',
    equipment_needed: 'Bat, batting cage, tee',
    safety_note: 'Ensure no one is in the path of the bat before drilling.',
    youtube_search_query: 'baseball casting drill back to screen hitting',
    youtube_search_url: ytSearch('baseball casting drill back to screen hitting'),
    coach_channel_hint: 'Tanner Koziol, Baseball Hitting Academy',
    focus_feel: 'Feel your hands staying close — knob leading, barrel dragging.',
    source_ids: [],
    last_reviewed: '2024-01-01',
  },

  // ── Hip Stall ─────────────────────────────────────────────────
  {
    id: 'bb_hip_fire_tee',
    sport_id: 'baseball',
    issue_id: 'hip_stall',
    phase: 'hip_rotation',
    name: 'Hip-Fire Tee Drill',
    goal: 'Train explosive hip rotation through the contact zone',
    steps: [
      'Set tee at belt height — center of the plate',
      'Take your normal stance and load',
      'On the swing, consciously think "hip-shoulder-hands" in that sequence',
      '"Squish the bug" with your back foot as hips fire',
      'Hold your finish — belt buckle should point at the pitcher',
    ],
    reps_or_duration: '3 sets of 20 — hold finish 2 seconds each',
    skill_level: 'beginner',
    difficulty: 'beginner',
    equipment_needed: 'Bat, batting tee, ball',
    safety_note: null,
    youtube_search_query: 'baseball hip rotation drill squish bug tee work',
    youtube_search_url: ytSearch('baseball hip rotation drill squish bug tee work'),
    coach_channel_hint: 'Driveline Baseball, Cressey Sports',
    focus_feel: 'Feel your back hip driving through — squish the bug, belt to the pitcher.',
    source_ids: [],
    last_reviewed: '2024-01-01',
  },

  // ── Lunging Forward ───────────────────────────────────────────
  {
    id: 'bb_soft_stride_drill',
    sport_id: 'baseball',
    issue_id: 'lunging_forward',
    phase: 'stride',
    name: 'Soft Stride — Stay Back Drill',
    goal: 'Train a controlled soft stride without shifting weight forward',
    steps: [
      'Place a cone or line at your normal stride landing spot',
      'Practice the load and stride without swinging — focus on soft landing',
      'Your front foot lands softly, heel-first, while hands stay back',
      'Feel 60% of your weight on your back leg at landing',
      'Add swing once stride feels controlled — tee work first',
    ],
    reps_or_duration: '3 sets of 20 stride-only reps, then 20 tee swings',
    skill_level: 'beginner',
    difficulty: 'beginner',
    equipment_needed: 'Bat, tee, cone or line marker',
    safety_note: null,
    youtube_search_query: 'baseball staying back soft stride drill hitting',
    youtube_search_url: ytSearch('baseball staying back soft stride drill hitting'),
    coach_channel_hint: 'ProBaseballInsider',
    focus_feel: 'Stride feels like stepping on a scale — gentle, controlled, not a fall forward.',
    source_ids: [],
    last_reviewed: '2024-01-01',
  },

  // ── Early Shoulder Pull ───────────────────────────────────────
  {
    id: 'bb_inside_tee_opposite',
    sport_id: 'baseball',
    issue_id: 'early_shoulder_pull',
    phase: 'hip_rotation',
    name: 'Inside Tee Opposite-Field Drill',
    goal: 'Prevent early front shoulder opening by training opposite-field contact',
    steps: [
      'Set tee on the inside-back portion of the plate (deep contact position)',
      'Goal: drive the ball to opposite field',
      'If front shoulder opens early, ball goes foul or weakly to pull side',
      'Keep front shoulder closed until hips clear — then shoulders follow',
      'Progress to outside pitch location on the tee',
    ],
    reps_or_duration: '3 sets of 15 opposite-field tee swings',
    skill_level: 'intermediate',
    difficulty: 'intermediate',
    equipment_needed: 'Bat, batting tee, balls',
    safety_note: null,
    youtube_search_query: 'baseball front shoulder opening early drill opposite field',
    youtube_search_url: ytSearch('baseball front shoulder opening early drill opposite field'),
    coach_channel_hint: 'Tanner Koziol',
    focus_feel: 'Keep that front shoulder closed until your hips are through — then let it fly.',
    source_ids: [],
    last_reviewed: '2024-01-01',
  },

  // ── Head Off Ball ─────────────────────────────────────────────
  {
    id: 'bb_read_the_seams',
    sport_id: 'baseball',
    issue_id: 'head_off_ball',
    phase: 'contact',
    name: 'Read the Seams Drill',
    goal: 'Train head stillness by requiring the hitter to identify ball details at contact',
    steps: [
      'Pitcher or tossing partner writes a number (1, 2, 3) on several balls in marker',
      'Hitter must call out the number on the ball while hitting or immediately after',
      'If they cannot identify the number, they are not keeping eyes on the ball',
      'Tee variation: put a sticker on the ball; call out the color at contact',
      'Progress to live soft-toss, then machine or BP',
    ],
    reps_or_duration: '3 sets of 15 — call the number/color each time',
    skill_level: 'beginner',
    difficulty: 'beginner',
    equipment_needed: 'Balls with numbers marked, bat, tee or soft-toss',
    safety_note: null,
    youtube_search_query: 'baseball read the seams numbers drill eyes on ball contact',
    youtube_search_url: ytSearch('baseball read the seams numbers drill eyes on ball contact'),
    coach_channel_hint: 'Baseball Rebellion',
    focus_feel: 'See the ball on the bat. Not the result — the actual contact moment.',
    source_ids: [],
    last_reviewed: '2024-01-01',
  },

  // ── Chopping Swing ────────────────────────────────────────────
  {
    id: 'bb_level_swing_tee',
    sport_id: 'baseball',
    issue_id: 'chopping_swing',
    phase: 'extension',
    name: 'Level Through the Zone Tee Drill',
    goal: 'Replace chopping motion with a slight upward swing matching the pitch descent angle',
    steps: [
      'Set tee at belt height in the center of the plate',
      'Consciously drive the barrel through on a level to slight-upward path',
      'Aim to hit the ball with a line-drive trajectory, not a bouncer',
      'Check: ball should fly in a line, not arc or bounce immediately',
      'Variation: set two tees — one at normal height, one 2 inches higher and 8 inches in front; barrel must travel between both tees',
    ],
    reps_or_duration: '4 sets of 15 with focus on trajectory',
    skill_level: 'beginner',
    difficulty: 'beginner',
    equipment_needed: 'Bat, two batting tees, balls',
    safety_note: null,
    youtube_search_query: 'baseball level swing path drill tee work line drive',
    youtube_search_url: ytSearch('baseball level swing path drill tee work line drive'),
    coach_channel_hint: 'Driveline Baseball',
    focus_feel: 'Drive through the zone — barrel on the same plane as the ball, not chopping down.',
    source_ids: [],
    last_reviewed: '2024-01-01',
  },

  // ── Arm Bar Lead ──────────────────────────────────────────────
  {
    id: 'bb_one_hand_drill',
    sport_id: 'baseball',
    issue_id: 'arm_bar_lead',
    phase: 'bat_lag',
    name: 'Lead Arm One-Hand Swing Drill',
    goal: 'Remove arm bar by training lead arm pull without rigidity',
    steps: [
      'Use a light bat or training bat',
      'Remove your back hand and swing with only the lead arm',
      'The lead arm should bend naturally — pulling, not extending too early',
      'Contact should still feel firm — not floppy',
      'After 10 reps, re-add the back hand and replicate the feeling',
    ],
    reps_or_duration: '3 sets of 10 one-hand, 10 two-hand',
    skill_level: 'intermediate',
    difficulty: 'intermediate',
    equipment_needed: 'Light bat or training bat, tee',
    safety_note: 'Use a lighter training bat for single-arm work — reduces wrist strain.',
    youtube_search_query: 'baseball one hand lead arm drill bat lag',
    youtube_search_url: ytSearch('baseball one hand lead arm drill bat lag'),
    coach_channel_hint: 'Baseball Hitting Academy',
    focus_feel: 'Feel the lead arm pulling — active but not locked straight.',
    source_ids: [],
    last_reviewed: '2024-01-01',
  },
];

// ──────────────────────────────────────────────────────────────
// Lookup helpers
// ──────────────────────────────────────────────────────────────

export function getBaseballDrillsForIssue(issueId: string): SportDrillRecommendation[] {
  return BASEBALL_DRILLS.filter((d) => d.issue_id === issueId);
}

export function getBaseballDrillsForPhase(phase: string): SportDrillRecommendation[] {
  return BASEBALL_DRILLS.filter((d) => d.phase === phase);
}
