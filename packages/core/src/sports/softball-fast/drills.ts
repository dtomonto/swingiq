// ============================================================
// SwingIQ — Fast Pitch Softball Drill Library
// All YouTube links are SEARCH LINKS only — never hardcoded.
// ============================================================

import type { SportDrillRecommendation } from '../types';

function ytSearch(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

export const FAST_PITCH_DRILLS: SportDrillRecommendation[] = [
  // ── Compact Load / Quick Stride ───────────────────────────────
  {
    id: 'fp_compact_stride_drill',
    sport_id: 'softball_fast',
    issue_id: 'lunging_forward',
    phase: 'rapid_stride',
    name: 'Compact Stride Constraint Drill',
    goal: 'Train the short, quick stride required for fast pitch timing',
    steps: [
      'Place a 6-inch flat marker where your front foot should land',
      'Practice the load and stride landing on or just before the marker',
      'Stride should be soft and quick — no pause at landing',
      'Hands must stay back — check by video or partner observation',
      'Repeat until stride is consistently short and soft without conscious effort',
    ],
    reps_or_duration: '3 sets of 20 stride-only reps, then 20 tee swings',
    skill_level: 'beginner',
    difficulty: 'beginner',
    equipment_needed: 'Bat, tee, small flat marker or tape',
    safety_note: null,
    youtube_search_query: 'fast pitch softball short stride drill compact hitting',
    youtube_search_url: ytSearch('fast pitch softball short stride drill compact hitting'),
    coach_channel_hint: 'Fastpitch TV, Softball Excellence',
    focus_feel: 'Step like you\'re stepping on ice — quick, quiet, and compact.',
    source_ids: [],
    last_reviewed: '2024-01-01',
  },

  // ── Hip Stall / Arms Only ─────────────────────────────────────
  {
    id: 'fp_hip_fire_wall',
    sport_id: 'softball_fast',
    issue_id: 'hip_stall',
    phase: 'hip_fire',
    name: 'Wall Hip-Fire Drill',
    goal: 'Train explosive hip rotation as the first movement in the downswing',
    steps: [
      'Stand with your back 4-6 inches from a wall in your batting stance',
      'Load up, then fire the hips open — back hip should brush the wall initially',
      'As the swing progresses, the hips should clear the wall',
      'Arms follow the hip rotation — never lead it',
      'Check: belt buckle should face the wall by end of swing',
    ],
    reps_or_duration: '3 sets of 15 shadow swings, then 15 tee swings',
    skill_level: 'beginner',
    difficulty: 'beginner',
    equipment_needed: 'Bat, wall space, tee',
    safety_note: 'Ensure no bat contact with the wall during the swing.',
    youtube_search_query: 'fast pitch softball hip rotation drill wall drive',
    youtube_search_url: ytSearch('fast pitch softball hip rotation drill wall drive'),
    coach_channel_hint: 'Fastpitch TV',
    focus_feel: 'Feel the back hip brushing the wall, then clearing it as hips rotate through.',
    source_ids: [],
    last_reviewed: '2024-01-01',
  },

  // ── Head Off Ball / Rising Pitch ─────────────────────────────
  {
    id: 'fp_rising_ball_eyes',
    sport_id: 'softball_fast',
    issue_id: 'head_off_ball',
    phase: 'contact',
    name: 'Rising Ball Visual Tracking Drill',
    goal: 'Train head-down discipline against the rising fast pitch trajectory',
    steps: [
      'Have a partner soft-toss at an upward angle to simulate a rising pitch',
      'Your only job: keep your head down and see the ball contact the bat',
      'Do NOT look up — call out what you see ("saw it" or "lost it")',
      'Progress to machine at low velocity with a rising setting',
      'Mark balls with numbers; call out the number at contact',
    ],
    reps_or_duration: '4 sets of 10 rising-angle tosses',
    skill_level: 'beginner',
    difficulty: 'beginner',
    equipment_needed: 'Bat, balls with numbers marked, partner',
    safety_note: null,
    youtube_search_query: 'fast pitch softball eyes on ball rising pitch drill tracking',
    youtube_search_url: ytSearch('fast pitch softball eyes on ball rising pitch drill tracking'),
    coach_channel_hint: 'NFCA, Fastpitch TV',
    focus_feel: 'The rising ball wants to fool your eyes. Trust your hands and stay down.',
    source_ids: [],
    last_reviewed: '2024-01-01',
  },

  // ── Casting / Bat Barrel Drops ────────────────────────────────
  {
    id: 'fp_knob_to_ball',
    sport_id: 'softball_fast',
    issue_id: 'casting_hands',
    phase: 'hip_fire',
    name: 'Knob to the Ball Drill',
    goal: 'Keep hands inside the ball path — eliminate casting in the fast pitch swing',
    steps: [
      'Set a tee at waist height in the center of the plate',
      'Swing with the focus of driving the knob of the bat toward the ball first',
      'The barrel trails behind — arriving last',
      'Feel the hands staying close to the body on the way to the ball',
      'Check by video: the barrel should not drop below the hands at any point before contact',
    ],
    reps_or_duration: '3 sets of 20 tee swings',
    skill_level: 'intermediate',
    difficulty: 'intermediate',
    equipment_needed: 'Bat, tee, balls',
    safety_note: null,
    youtube_search_query: 'fast pitch softball knob to ball drill hands inside casting',
    youtube_search_url: ytSearch('fast pitch softball knob to ball drill hands inside casting'),
    coach_channel_hint: 'Softball Excellence, Fastpitch TV',
    focus_feel: 'Feel the knob leading, the barrel dragging. Like cracking a whip.',
    source_ids: [],
    last_reviewed: '2024-01-01',
  },

  // ── Short Follow-Through ──────────────────────────────────────
  {
    id: 'fp_high_finish',
    sport_id: 'softball_fast',
    issue_id: 'arm_short_follow',
    phase: 'follow_through',
    name: 'High Finish Hold Drill',
    goal: 'Reinforce complete follow-through — important for deceleration after contact, not before it',
    steps: [
      'After each swing (tee or soft-toss), freeze and hold the finish',
      'Bat should be above or at front shoulder level',
      'Freeze for 2 seconds — take a photo or check with a partner',
      'If you can\'t hold the finish, you stopped the swing too early',
      'Progress to calling out "finish!" on every rep where you complete it properly',
    ],
    reps_or_duration: '3 sets of 15 with 2-second holds',
    skill_level: 'beginner',
    difficulty: 'beginner',
    equipment_needed: 'Bat, tee',
    safety_note: null,
    youtube_search_query: 'fast pitch softball follow through finish drill high',
    youtube_search_url: ytSearch('fast pitch softball follow through finish drill high'),
    coach_channel_hint: 'NFCA',
    focus_feel: 'The swing is done when the barrel is past your shoulder — never before.',
    source_ids: [],
    last_reviewed: '2024-01-01',
  },

  // ── Opposite Field — Front Shoulder ──────────────────────────
  {
    id: 'fp_oppo_tee',
    sport_id: 'softball_fast',
    issue_id: 'early_shoulder_pull',
    phase: 'hip_fire',
    name: 'Opposite Field Power Drill',
    goal: 'Build hip-shoulder separation habit by demanding opposite-field contact',
    steps: [
      'Set tee in the back half of the plate (outside pitch position)',
      'Drive the ball to the opposite field gap — not the pull side',
      'Front shoulder must stay closed until hips clear',
      'If ball goes to pull side, front shoulder opened too early',
      'Progress to outside-corner machine pitches at low velocity',
    ],
    reps_or_duration: '3 sets of 15 opposite-field contact swings',
    skill_level: 'intermediate',
    difficulty: 'intermediate',
    equipment_needed: 'Bat, tee, balls',
    safety_note: null,
    youtube_search_query: 'fast pitch softball opposite field drill shoulder closed hip separation',
    youtube_search_url: ytSearch('fast pitch softball opposite field drill shoulder closed hip separation'),
    coach_channel_hint: 'Fastpitch TV',
    focus_feel: 'Keep that front shoulder shut — let the hips do the work first.',
    source_ids: [],
    last_reviewed: '2024-01-01',
  },
];

export function getFastPitchDrillsForIssue(issueId: string): SportDrillRecommendation[] {
  return FAST_PITCH_DRILLS.filter((d) => d.issue_id === issueId);
}

export function getFastPitchDrillsForPhase(phase: string): SportDrillRecommendation[] {
  return FAST_PITCH_DRILLS.filter((d) => d.phase === phase);
}
