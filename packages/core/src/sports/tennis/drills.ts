// ============================================================
// SwingIQ — Tennis Drill Library
// Drills mapped to visual swing issues and phases.
// All YouTube links are SEARCH LINKS only — never hardcoded video IDs.
// ============================================================

import type { SportDrillRecommendation } from '../types';

function ytSearch(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

export const TENNIS_DRILLS: SportDrillRecommendation[] = [
  // ── Late Contact ─────────────────────────────────────────────
  {
    id: 'tennis_feed_out_front',
    sport_id: 'tennis',
    issue_id: 'late_contact',
    phase: 'contact_zone',
    name: 'Toss-and-Hit Contact Point Drill',
    goal: 'Train consistent forward contact point in front of the hip',
    steps: [
      'Stand at baseline with no racket — just your non-dominant hand holding a ball',
      'Toss the ball to exactly the spot you want to contact it (in front and out)',
      'Then add the racket — toss and hit, focusing on reaching forward',
      'Place a cone at your ideal contact point; hit over the cone',
      'Progress: have a partner feed balls to that spot',
    ],
    reps_or_duration: '3 sets of 20 feeds, focus on contact position',
    skill_level: 'beginner',
    difficulty: 'beginner',
    equipment_needed: 'Racket, balls, cone',
    safety_note: null,
    youtube_search_query: 'tennis forehand contact point drill forward',
    youtube_search_url: ytSearch('tennis forehand contact point drill forward'),
    coach_channel_hint: 'Essential Tennis, Top Tennis Training',
    focus_feel: 'Feel your arm fully extending to reach for the ball out in front of you.',
    source_ids: [],
    last_reviewed: '2024-01-01',
  },

  // ── Wrist Rollover ───────────────────────────────────────────
  {
    id: 'tennis_windshield_wiper',
    sport_id: 'tennis',
    issue_id: 'wrist_rollover',
    phase: 'contact_zone',
    name: 'Windshield Wiper Follow-Through Drill',
    goal: 'Teach low-to-high brushing contact without premature rollover',
    steps: [
      'Drop-feed balls at hip height from inside the baseline',
      'Focus on brushing up the back of the ball — 6 o\'clock to 12 o\'clock',
      'Racket face stays perpendicular at contact — no rollover until well after contact',
      'Feel the windshield-wiper motion as racket goes from low to high',
      'Practice in slow motion first, then at match pace',
    ],
    reps_or_duration: '3 sets of 15, slow then full speed',
    skill_level: 'beginner',
    difficulty: 'beginner',
    equipment_needed: 'Racket, balls',
    safety_note: null,
    youtube_search_query: 'tennis topspin windshield wiper drill forehand',
    youtube_search_url: ytSearch('tennis topspin windshield wiper drill forehand'),
    coach_channel_hint: 'Jeff Salzenstein, Intuitive Tennis',
    focus_feel: 'Brush up the back of the ball — feel the strings grip and spin it forward.',
    source_ids: [],
    last_reviewed: '2024-01-01',
  },

  // ── Bent Arm at Contact ───────────────────────────────────────
  {
    id: 'tennis_extension_shadow',
    sport_id: 'tennis',
    issue_id: 'bent_arm_contact',
    phase: 'contact_zone',
    name: 'Shadow Swing Extension Drill',
    goal: 'Develop arm extension through the contact zone',
    steps: [
      'Stand in front of a full-length mirror or glass',
      'Shadow-swing in slow motion — pause at contact',
      'Check that hitting arm is at about 80% extension at contact (not fully locked)',
      'Feel the reach — arm should be visibly longer than at address',
      'Add a wall touch: place hand on wall at correct contact point, feel the reach',
    ],
    reps_or_duration: '3 minutes of shadow swings, 10 wall touches',
    skill_level: 'beginner',
    difficulty: 'beginner',
    equipment_needed: 'Racket (no ball needed), mirror or wall',
    safety_note: 'Do not lock elbow at contact — slight bend is normal and healthy.',
    youtube_search_query: 'tennis forehand arm extension drill reach',
    youtube_search_url: ytSearch('tennis forehand arm extension drill reach'),
    coach_channel_hint: 'Essential Tennis',
    focus_feel: 'Reach out and shake hands — your arm should feel long and extended.',
    source_ids: [],
    last_reviewed: '2024-01-01',
  },

  // ── Head Pull ─────────────────────────────────────────────────
  {
    id: 'tennis_head_still_drill',
    sport_id: 'tennis',
    issue_id: 'head_pull_tennis',
    phase: 'contact_zone',
    name: 'Head Down — Eyes on Contact Drill',
    goal: 'Keep head still through contact to improve strike consistency',
    steps: [
      'Drop-feed balls at a comfortable height',
      'Hit each ball while consciously keeping your chin down',
      'After contact, hold the head-down position for a 1-second count',
      'Only look up after that count — you should "see" where the ball went in your peripheral',
      'Progression: have a partner call the direction after you hit (you cannot look)',
    ],
    reps_or_duration: '4 sets of 10 feeds',
    skill_level: 'beginner',
    difficulty: 'beginner',
    equipment_needed: 'Racket, balls',
    safety_note: null,
    youtube_search_query: 'tennis keep head down contact drill eyes on ball',
    youtube_search_url: ytSearch('tennis keep head down contact drill eyes on ball'),
    coach_channel_hint: 'Top Tennis Training',
    focus_feel: 'See the strings hit the ball. Hold your head still for a full second after.',
    source_ids: [],
    last_reviewed: '2024-01-01',
  },

  // ── Short Follow-Through ──────────────────────────────────────
  {
    id: 'tennis_full_finish_drill',
    sport_id: 'tennis',
    issue_id: 'follow_through_short',
    phase: 'follow_through',
    name: 'Full Finish Pose Drill',
    goal: 'Reinforce complete follow-through to proper finish position',
    steps: [
      'Hit a ball, then hold your finish position for 3 full seconds',
      'Racket should finish by your non-dominant shoulder or wrapped around body',
      'Have a training partner check your finish — take a photo',
      'If you can\'t hold the finish, you decelerated before contact',
      'Progression: Rally and call out "finish!" every rep you complete properly',
    ],
    reps_or_duration: '3 sets of 15 — hold each finish for 3 seconds',
    skill_level: 'beginner',
    difficulty: 'beginner',
    equipment_needed: 'Racket, balls, optional camera',
    safety_note: null,
    youtube_search_query: 'tennis follow through finish drill topspin',
    youtube_search_url: ytSearch('tennis follow through finish drill topspin'),
    coach_channel_hint: 'Intuitive Tennis',
    focus_feel: 'Finish feels like you\'re catching your racket over your shoulder.',
    source_ids: [],
    last_reviewed: '2024-01-01',
  },

  // ── Unit Turn / Late Preparation ─────────────────────────────
  {
    id: 'tennis_unit_turn_shadow',
    sport_id: 'tennis',
    issue_id: null,
    phase: 'unit_turn',
    name: 'Unit Turn Shadow Drill',
    goal: 'Build automatic shoulder-hip unit turn as first movement',
    steps: [
      'Stand in ready position at the baseline',
      'Have a partner point left or right randomly',
      'On their signal, complete a full unit turn in that direction — no racket swing',
      'Focus: shoulders and hips move together, non-dominant hand guides',
      'Add a crossover step after the turn to simulate moving to the ball',
    ],
    reps_or_duration: '3 sets of 20 random signals',
    skill_level: 'beginner',
    difficulty: 'beginner',
    equipment_needed: 'Racket',
    safety_note: null,
    youtube_search_query: 'tennis unit turn drill preparation split step',
    youtube_search_url: ytSearch('tennis unit turn drill preparation split step'),
    coach_channel_hint: 'Essential Tennis',
    focus_feel: 'Your chest should feel like it turns toward the back fence instantly.',
    source_ids: [],
    last_reviewed: '2024-01-01',
  },

  // ── Open Hips Early ───────────────────────────────────────────
  {
    id: 'tennis_closed_stance_rally',
    sport_id: 'tennis',
    issue_id: 'open_hips_early',
    phase: 'loading',
    name: 'Closed Stance Baseline Rally',
    goal: 'Teach hip coil before hip release — building topspin torque',
    steps: [
      'Use a closed or semi-open stance for every forehand in the rally',
      'Front foot must be parallel or slightly angled closed at loading',
      'Hips stay closed until front foot pushes — then hips fire',
      'Feel the hip coil and delay before explosion',
      'Compare power to your normal open-stance shots',
    ],
    reps_or_duration: '20 minutes closed-stance forehand rally',
    skill_level: 'intermediate',
    difficulty: 'intermediate',
    equipment_needed: 'Racket, court, partner',
    safety_note: null,
    youtube_search_query: 'tennis hip coil closed stance forehand drill',
    youtube_search_url: ytSearch('tennis hip coil closed stance forehand drill'),
    coach_channel_hint: 'Jeff Salzenstein',
    focus_feel: 'Feel your hips trying to stay closed as long as possible before unleashing.',
    source_ids: [],
    last_reviewed: '2024-01-01',
  },

  // ── Loop Timing ───────────────────────────────────────────────
  {
    id: 'tennis_loop_timing_rally',
    sport_id: 'tennis',
    issue_id: 'loop_timing_off',
    phase: 'backswing',
    name: 'Rhythmic Loop Timing Drill',
    goal: 'Build consistent racket loop that arrives at contact without rushing',
    steps: [
      'Stand at the service line and have a partner soft-feed balls',
      'Start your loop as soon as the ball bounces on the other side',
      'Do not rush — the loop should arrive at the loading position by the time the ball reaches you',
      'Count "bounce-loop-hit" rhythmically as you drill',
      'Increase ball pace progressively when timing feels solid',
    ],
    reps_or_duration: '3 sets of 20 feeds, call out "bounce-loop-hit"',
    skill_level: 'intermediate',
    difficulty: 'intermediate',
    equipment_needed: 'Racket, balls, partner or ball machine',
    safety_note: null,
    youtube_search_query: 'tennis forehand loop timing drill bounce hit rhythm',
    youtube_search_url: ytSearch('tennis forehand loop timing drill bounce hit rhythm'),
    coach_channel_hint: 'Top Tennis Training',
    focus_feel: 'Feel the loop falling naturally into place — never rushed, always ready.',
    source_ids: [],
    last_reviewed: '2024-01-01',
  },
];

// ──────────────────────────────────────────────────────────────
// Lookup helpers
// ──────────────────────────────────────────────────────────────

export function getTennisDrillsForIssue(issueId: string): SportDrillRecommendation[] {
  return TENNIS_DRILLS.filter((d) => d.issue_id === issueId);
}

export function getTennisDrillsForPhase(phase: string): SportDrillRecommendation[] {
  return TENNIS_DRILLS.filter((d) => d.phase === phase);
}
