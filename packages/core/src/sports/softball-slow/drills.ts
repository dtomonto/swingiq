// ============================================================
// SwingIQ — Slow Pitch Softball Drill Library
// All YouTube links are SEARCH LINKS only — never hardcoded.
// ============================================================

import type { SportDrillRecommendation } from '../types';

function ytSearch(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

export const SLOW_PITCH_DRILLS: SportDrillRecommendation[] = [
  {
    id: 'sp_arc_contact_tee',
    sport_id: 'softball_slow',
    issue_id: 'dropping_back_shoulder',
    phase: 'contact_arc',
    name: 'High-Tee Arc Contact Drill',
    goal: 'Train contact on a descending arc ball with slight upward bat angle',
    steps: [
      'Set batting tee at shoulder height — mimicking the high arc of a slow pitch',
      'Practice hitting through the ball at this high contact point',
      'Focus on matching the ball\'s downward trajectory at contact',
      'Drive the ball at a low outfield line-drive trajectory, not straight up',
      'Vary tee heights (shoulder → belt) to simulate different pitch arcs',
    ],
    reps_or_duration: '4 sets of 15 per tee height',
    skill_level: 'beginner',
    difficulty: 'beginner',
    equipment_needed: 'Bat, adjustable batting tee, balls',
    safety_note: null,
    youtube_search_query: 'slow pitch softball batting tee high contact arc drill',
    youtube_search_url: ytSearch('slow pitch softball batting tee high contact arc drill'),
    coach_channel_hint: 'Softball Spot',
    focus_feel: 'Contact feels like driving through the top of a tennis ball — firm and through.',
    source_ids: [],
    last_reviewed: '2024-01-01',
  },
  {
    id: 'sp_hip_rotation_step',
    sport_id: 'softball_slow',
    issue_id: 'no_hip_drive_soft',
    phase: 'hip_fire',
    name: 'Step-and-Fire Hip Rotation Drill',
    goal: 'Establish hip rotation as the power source, not the arms',
    steps: [
      'Start with your weight loaded on the back foot',
      'Step forward with the front foot and immediately fire the hips open',
      'Arms follow — do NOT swing the arms first',
      'Hold the finish: belt buckle must face the pitcher',
      'Repeat 10 times without a ball, then add tee work',
    ],
    reps_or_duration: '3 sets of 15 — hold finish 2 seconds',
    skill_level: 'beginner',
    difficulty: 'beginner',
    equipment_needed: 'Bat',
    safety_note: null,
    youtube_search_query: 'slow pitch softball hip rotation drill power hitting',
    youtube_search_url: ytSearch('slow pitch softball hip rotation drill power hitting'),
    coach_channel_hint: 'Softball Excellence',
    focus_feel: 'Hips drag the arms through — not the other way around.',
    source_ids: [],
    last_reviewed: '2024-01-01',
  },
  {
    id: 'sp_stay_back_soft',
    sport_id: 'softball_slow',
    issue_id: 'lunging_forward',
    phase: 'stride',
    name: 'Patience Drill — Watch It Drop',
    goal: 'Train patience on the slow pitch arc — do not commit weight until ball drops into zone',
    steps: [
      'Have a partner lob slow-pitch style tosses from 30 feet',
      'Your only job: do NOT swing until the ball drops below the peak of its arc',
      'Watch the ball arc and peak — only begin load as it starts down',
      'Practice soft, late weight transfer to avoid lunging',
      'Start with just observing (no swing), then progress to contact',
    ],
    reps_or_duration: '3 sets of 20 pitches — call out "now" when you start load',
    skill_level: 'beginner',
    difficulty: 'beginner',
    equipment_needed: 'Bat, partner, softballs',
    safety_note: null,
    youtube_search_query: 'slow pitch softball patience drill timing arc pitch',
    youtube_search_url: ytSearch('slow pitch softball patience drill timing arc pitch'),
    coach_channel_hint: 'Softball Tutor',
    focus_feel: 'Wait, wait, wait — then fire.',
    source_ids: [],
    last_reviewed: '2024-01-01',
  },
  {
    id: 'sp_follow_through_full',
    sport_id: 'softball_slow',
    issue_id: 'arm_short_follow',
    phase: 'follow_through',
    name: 'Full Finish Pose Hold',
    goal: 'Reinforce complete follow-through to proper high finish',
    steps: [
      'After each swing (on tee or live), hold your finish position for 3 seconds',
      'Bat should be over your front shoulder, weight on front foot',
      'Take a photo or have a partner check your finish',
      'If you can\'t hold the finish steadily, you stopped the swing too early',
    ],
    reps_or_duration: '3 sets of 12 — 3-second holds',
    skill_level: 'beginner',
    difficulty: 'beginner',
    equipment_needed: 'Bat, tee',
    safety_note: null,
    youtube_search_query: 'slow pitch softball follow through finish high drill',
    youtube_search_url: ytSearch('slow pitch softball follow through finish high drill'),
    coach_channel_hint: 'Softball Excellence',
    focus_feel: 'Bat over the shoulder, weight forward, face the pitcher.',
    source_ids: [],
    last_reviewed: '2024-01-01',
  },
  {
    id: 'sp_opposite_field_tee',
    sport_id: 'softball_slow',
    issue_id: 'early_shoulder_pull',
    phase: 'hip_fire',
    name: 'Opposite Field Tee Drill',
    goal: 'Eliminate early shoulder opening by training opposite-field contact',
    steps: [
      'Set tee deep in the contact zone (back half of plate)',
      'Drive the ball to the opposite field gap',
      'Front shoulder must stay closed until hips clear — only then release',
      'Opposite-field contact forces hips to lead and shoulders to stay back',
    ],
    reps_or_duration: '3 sets of 15 opposite-field contact swings',
    skill_level: 'intermediate',
    difficulty: 'intermediate',
    equipment_needed: 'Bat, tee, balls',
    safety_note: null,
    youtube_search_query: 'slow pitch softball opposite field drill shoulder stay closed',
    youtube_search_url: ytSearch('slow pitch softball opposite field drill shoulder stay closed'),
    coach_channel_hint: 'Softball Excellence',
    focus_feel: 'Keep the shoulder in — drive the outside pitch the other way.',
    source_ids: [],
    last_reviewed: '2024-01-01',
  },
];

export function getSlowPitchDrillsForIssue(issueId: string): SportDrillRecommendation[] {
  return SLOW_PITCH_DRILLS.filter((d) => d.issue_id === issueId);
}

export function getSlowPitchDrillsForPhase(phase: string): SportDrillRecommendation[] {
  return SLOW_PITCH_DRILLS.filter((d) => d.phase === phase);
}
