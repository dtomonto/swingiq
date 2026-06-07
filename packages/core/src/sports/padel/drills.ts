// ============================================================
// SwingVantage — Padel Drill Library
// Drills mapped to visual stroke issues and phases.
// All YouTube links are SEARCH LINKS only — never hardcoded video IDs.
// ============================================================

import type { SportDrillRecommendation } from '../types';

function ytSearch(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

export const PADEL_DRILLS: SportDrillRecommendation[] = [
  // ── Weak Bandeja ─────────────────────────────────────────────
  {
    id: 'pd_bandeja_control_target',
    sport_id: 'padel',
    issue_id: 'pd_weak_bandeja',
    phase: 'contact',
    name: 'Bandeja Control & Depth Drill',
    goal: 'Build a repeatable bandeja that holds the net instead of sitting up',
    steps: [
      'Partner lobs to your backhand-side overhead; you hit bandejas',
      'Turn side-on early and contact slightly in front, brushing with slice',
      'Aim deep cross-court to a target near the side glass',
      'Finish low and out toward the target — not over the shoulder',
      'Stay forward at the net after each one; track make/depth',
    ],
    reps_or_duration: '3 sets of 12 bandejas to a deep cross-court target',
    skill_level: 'intermediate',
    difficulty: 'intermediate',
    equipment_needed: 'Padel racket, balls, partner',
    safety_note: null,
    youtube_search_query: 'padel bandeja technique control depth drill tutorial',
    youtube_search_url: ytSearch('padel bandeja technique control depth drill tutorial'),
    coach_channel_hint: 'The Padel School, Hello Padel',
    focus_feel: 'Smooth and controlled — the bandeja is a placement shot that keeps you at the net, not a smash.',
    source_ids: [],
    last_reviewed: '2026-06-01',
  },

  // ── Poor Wall Read ───────────────────────────────────────────
  {
    id: 'pd_back_glass_spacing',
    sport_id: 'padel',
    issue_id: 'pd_poor_wall_read',
    phase: 'wall_read',
    name: 'Back-Glass Spacing & Read Drill',
    goal: 'Give the ball space off the glass and contact it on balance',
    steps: [
      'Partner feeds balls deep to the back glass',
      'Turn and track the ball into the wall, moving back with it',
      'Let the ball rebound and come to you — create space, never crowd the corner',
      'Set your feet and contact out of the corner with a clean, unhurried face',
      'Progress to side-glass then double-wall (side-then-back) rebounds',
    ],
    reps_or_duration: '3 sets of 10 back-glass, then 10 double-wall reps',
    skill_level: 'intermediate',
    difficulty: 'intermediate',
    equipment_needed: 'Padel racket, balls, partner, court with glass',
    safety_note: null,
    youtube_search_query: 'padel back wall glass technique read rebound footwork drill',
    youtube_search_url: ytSearch('padel back wall glass technique read rebound footwork drill'),
    coach_channel_hint: 'The Padel School',
    focus_feel: 'Let the wall do the work — give the ball room and let it come back to you, then play it calmly.',
    source_ids: [],
    last_reviewed: '2026-06-01',
  },

  // ── Overhit Smash ────────────────────────────────────────────
  {
    id: 'pd_smash_decision_game',
    sport_id: 'padel',
    issue_id: 'pd_overhit_smash',
    phase: 'contact',
    name: 'Smash-or-Bandeja Decision Game',
    goal: 'Finish only the right balls; default to control when in doubt',
    steps: [
      'Partner mixes deep lobs and short, high sit-ups',
      'On deep/awkward lobs, play a controlled bandeja or víbora',
      'Only flat-smash the short, high, comfortable balls',
      'Call your choice aloud ("bandeja" / "smash") before contact',
      'Score: lose a point for any overhit smash that floats long or out',
    ],
    reps_or_duration: '15-minute decision game, tracking shot selection',
    skill_level: 'advanced',
    difficulty: 'advanced',
    equipment_needed: 'Padel racket, balls, partner',
    safety_note: null,
    youtube_search_query: 'padel when to smash vs bandeja shot selection tutorial',
    youtube_search_url: ytSearch('padel when to smash vs bandeja shot selection tutorial'),
    coach_channel_hint: 'The Padel School, Hello Padel',
    focus_feel: 'Discipline over power — most overheads should hold the net, not try to end the point.',
    source_ids: [],
    last_reviewed: '2026-06-01',
  },

  // ── Poor Lob Depth ───────────────────────────────────────────
  {
    id: 'pd_lob_depth_target',
    sport_id: 'padel',
    issue_id: 'pd_poor_lob_depth',
    phase: 'contact',
    name: 'Deep Lob Target Drill',
    goal: 'Lob deep enough to push opponents off the net without going out',
    steps: [
      'From the back of the court, lob over a partner at the net',
      'Aim for a depth band in the last few feet before the back glass',
      'Lift with the legs and a long, controlled follow-through up and out',
      'Track depth: too short (attackable) vs. in the band vs. out',
      'Add disguise — same preparation as your drive',
    ],
    reps_or_duration: '3 sets of 15 lobs to a deep target band',
    skill_level: 'beginner',
    difficulty: 'intermediate',
    equipment_needed: 'Padel racket, balls, partner',
    safety_note: null,
    youtube_search_query: 'padel lob technique depth drill push opponents back',
    youtube_search_url: ytSearch('padel lob technique depth drill push opponents back'),
    coach_channel_hint: 'Hello Padel, The Padel School',
    focus_feel: 'High and deep — the lob is your reset button to flip the point and take the net.',
    source_ids: [],
    last_reviewed: '2026-06-01',
  },

  // ── Volley Errors ────────────────────────────────────────────
  {
    id: 'pd_volley_block_target',
    sport_id: 'padel',
    issue_id: 'pd_volley_error',
    phase: 'contact',
    name: 'Net Volley Block & Place Drill',
    goal: 'Stabilize the volley face and place it deep to hold the net',
    steps: [
      'Stand at the net; partner feeds drives and dipping balls',
      'Block with a firm, slightly open, stable face — minimal swing',
      'Punch the volley deep toward the corners or at the feet',
      'Keep contact out in front; recover the paddle immediately',
      'Progress to alternating forehand and backhand volleys',
    ],
    reps_or_duration: '3 sets of 15 volleys to deep targets',
    skill_level: 'beginner',
    difficulty: 'intermediate',
    equipment_needed: 'Padel racket, balls, partner',
    safety_note: null,
    youtube_search_query: 'padel volley technique block placement net drill',
    youtube_search_url: ytSearch('padel volley technique block placement net drill'),
    coach_channel_hint: 'The Padel School',
    focus_feel: 'Short and firm — set the face and guide the ball deep; the net does the rest.',
    source_ids: [],
    last_reviewed: '2026-06-01',
  },

  // ── Poor Net Transition ──────────────────────────────────────
  {
    id: 'pd_lob_and_advance',
    sport_id: 'padel',
    issue_id: 'pd_poor_net_transition',
    phase: 'recovery',
    name: 'Lob-and-Advance Net Transition Drill',
    goal: 'Use the lob to win the net and move up with your partner',
    steps: [
      'Start at the back defending; hit a deep lob over the net team',
      'As the lob forces them back, advance to the net with your partner',
      'Move up together, in a line — no one lagging behind',
      'Take the first volley deep to keep the net you just won',
      'Reset and repeat the defend → lob → advance cycle',
    ],
    reps_or_duration: '3 sets of 6 full transition sequences',
    skill_level: 'intermediate',
    difficulty: 'advanced',
    equipment_needed: 'Padel racket, balls, partner',
    safety_note: null,
    youtube_search_query: 'padel transition to net after lob positioning drill',
    youtube_search_url: ytSearch('padel transition to net after lob positioning drill'),
    coach_channel_hint: 'Hello Padel, The Padel School',
    focus_feel: 'The lob buys you time — use it to march to the net together and take control.',
    source_ids: [],
    last_reviewed: '2026-06-01',
  },

  // ── Partner Spacing ──────────────────────────────────────────
  {
    id: 'pd_partner_spacing_shadow',
    sport_id: 'padel',
    issue_id: 'pd_partner_spacing',
    phase: 'recovery',
    name: 'Connected-Pair Spacing Drill',
    goal: 'Move as a connected pair and protect the middle',
    steps: [
      'Play points focusing only on spacing with your partner',
      'When one moves wide, the other shifts to cover the middle',
      'Keep ~3–4 metres between you — close the seam down the centre',
      'Advance and retreat together as a line, never split front-and-back',
      'Debrief after each point: where did a gap appear?',
    ],
    reps_or_duration: '15-minute spacing-focused points',
    skill_level: 'intermediate',
    difficulty: 'intermediate',
    equipment_needed: 'Padel racket, balls, partner, opponents',
    safety_note: null,
    youtube_search_query: 'padel doubles positioning partner movement court coverage',
    youtube_search_url: ytSearch('padel doubles positioning partner movement court coverage'),
    coach_channel_hint: 'The Padel School',
    focus_feel: 'You and your partner are connected by an invisible rope — move together, cover the middle.',
    source_ids: [],
    last_reviewed: '2026-06-01',
  },

  // ── Late After Wall ──────────────────────────────────────────
  {
    id: 'pd_early_turn_wall',
    sport_id: 'padel',
    issue_id: 'pd_late_after_wall',
    phase: 'preparation',
    name: 'Early-Turn Off-the-Glass Drill',
    goal: 'Prepare early after the wall read so contact is on time and out front',
    steps: [
      'Partner feeds to the back glass; turn side-on the instant you read it',
      'Set the paddle low and behind the expected rebound point',
      'Move your feet to create space and time, not your arm',
      'Contact the ball out in front after the rebound, never jammed',
      'Build to playing the ball back deep or lobbing to reset',
    ],
    reps_or_duration: '3 sets of 12 off-the-glass reps with early turn',
    skill_level: 'intermediate',
    difficulty: 'intermediate',
    equipment_needed: 'Padel racket, balls, partner, court with glass',
    safety_note: null,
    youtube_search_query: 'padel early preparation back wall timing footwork drill',
    youtube_search_url: ytSearch('padel early preparation back wall timing footwork drill'),
    coach_channel_hint: 'The Padel School',
    focus_feel: 'Turn early and set the paddle — by the time the ball is off the glass you are already ready.',
    source_ids: [],
    last_reviewed: '2026-06-01',
  },

  // ── Bad Court Position ───────────────────────────────────────
  {
    id: 'pd_court_position_zones',
    sport_id: 'padel',
    issue_id: 'pd_bad_court_position',
    phase: 'ready_position',
    name: 'Attack/Defense Zone Positioning Drill',
    goal: 'Know whether to be at the net or back, and commit fully',
    steps: [
      'Play points where you must be fully at the net or fully back — never mid-court',
      'When your team hits a lob or weak ball, retreat together to defend',
      'When you hit an attacking volley or bandeja, hold the net together',
      'Eliminate "no man\'s land" in the middle of the court',
      'Coach or partner calls out any time you are caught mid-court',
    ],
    reps_or_duration: '15-minute zone-discipline points',
    skill_level: 'beginner',
    difficulty: 'intermediate',
    equipment_needed: 'Padel racket, balls, partner, opponents',
    safety_note: null,
    youtube_search_query: 'padel court positioning when to attack net or defend back',
    youtube_search_url: ytSearch('padel court positioning when to attack net or defend back'),
    coach_channel_hint: 'Hello Padel, The Padel School',
    focus_feel: 'Be all the way up or all the way back — the middle of the court is where points are lost.',
    source_ids: [],
    last_reviewed: '2026-06-01',
  },
];

// ──────────────────────────────────────────────────────────────
// Lookup helpers
// ──────────────────────────────────────────────────────────────

export function getPadelDrillsForIssue(issueId: string): SportDrillRecommendation[] {
  return PADEL_DRILLS.filter((d) => d.issue_id === issueId);
}

export function getPadelDrillsForPhase(phase: string): SportDrillRecommendation[] {
  return PADEL_DRILLS.filter((d) => d.phase === phase);
}
