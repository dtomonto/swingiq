// ============================================================
// SwingVantage — Athletic Journey: Golf configuration
// ------------------------------------------------------------
// All 11 golf stages (G0–G10), skill branches, classification
// weighting, missing-data prompts, and the optional handicap→stage
// guidepost. Handicap is ONE input, never the sole determinant.
// USGA max Handicap Index is 54.0; plus handicaps are negative.
// ============================================================

import type {
  PlayerRating,
  SportJourneyConfig,
  StageDefinition,
  SkillBranchDef,
  MissingDataPromptDef,
} from '../types';

const ha = (label: string) => ({ ratingType: 'golf_handicap' as const, label });

const STAGES: StageDefinition[] = [
  {
    code: 'G0',
    order: 0,
    name: 'New Golfer',
    tier: 'foundation',
    description:
      'A true beginner learning how to hold the club, make contact, and understand stance, ' +
      'posture, ball position, club selection, rules, and basic scoring.',
    anchors: [ha('No handicap or 45–54+')],
    primaryGoals: ['Make consistent contact', 'Learn setup & posture', 'Understand the clubs', 'Build confidence and enjoy the game'],
    commonWeaknesses: ['Frequent complete misses', 'No repeatable setup', 'Unsure of club selection'],
    unlockCriteria: [
      { id: 'g0_contact', label: 'Make solid contact on the majority of full swings', category: 'technique' },
      { id: 'g0_setup', label: 'Build a repeatable setup routine', category: 'technique' },
      { id: 'g0_upload', label: 'Upload your first full-swing video', category: 'technique' },
    ],
    milestoneTemplates: [
      { id: 'g0_first_video', name: 'First swing on film', description: 'Upload your first full-swing video.', category: 'technique' },
      { id: 'g0_first_session', name: 'First practice logged', description: 'Complete and log your first practice session.', category: 'practice' },
    ],
  },
  {
    code: 'G1',
    order: 1,
    name: 'Beginner Golfer',
    tier: 'foundation',
    description:
      'Makes contact inconsistently. Frequent topped shots, chunks, slices, penalty shots, and ' +
      '3-putts, with poor distance control.',
    anchors: [ha('36–54')],
    primaryGoals: ['Build a repeatable setup', 'Improve centered contact', 'Create a basic ball flight', 'Learn short-game & putting fundamentals'],
    commonWeaknesses: ['Topped & chunked shots', 'Big slice or hook', 'Poor putting speed control'],
    unlockCriteria: [
      { id: 'g1_contact_rate', label: 'Center contact on most iron shots', category: 'technique' },
      { id: 'g1_three_putt', label: 'Reduce 3-putts toward 3 or fewer per round', metric: 'three_putts_per_round', targetValue: 3, comparator: 'lte', unit: '/round', category: 'finesse' },
      { id: 'g1_rounds', label: 'Log your first 3 rounds', metric: 'rounds_logged', targetValue: 3, comparator: 'gte', unit: 'rounds', category: 'scoring' },
    ],
    milestoneTemplates: [
      { id: 'g1_log_3_rounds', name: 'Log first 3 rounds', description: 'Record three rounds so SwingVantage can read your scoring.', category: 'scoring', metric: 'rounds_logged', targetValue: 3, comparator: 'gte', unit: 'rounds' },
      { id: 'g1_putting_bench', name: 'Putting distance-control benchmark', description: 'Complete a lag-putting distance ladder.', category: 'finesse' },
    ],
  },
  {
    code: 'G2',
    order: 2,
    name: 'High-Handicap Golfer',
    tier: 'developing',
    description:
      'Can complete rounds but with major inconsistency — tee penalties, weak contact, poor wedge ' +
      'control, poor putting, and limited course strategy.',
    anchors: [ha('25–36')],
    primaryGoals: ['Reduce penalties', 'Improve playable tee shots', 'Stabilize iron contact', 'Improve chipping & putting', 'Reduce blow-up holes'],
    commonWeaknesses: ['Tee-shot penalties', 'Blow-up holes', 'Weak wedge contact'],
    unlockCriteria: [
      { id: 'g2_penalties', label: 'Reduce penalties to 4 or fewer per round', metric: 'penalties_per_round', targetValue: 4, comparator: 'lte', unit: '/round', category: 'scoring' },
      { id: 'g2_playable_tee', label: 'Reach 50%+ playable tee shots', metric: 'driver_playable_pct', targetValue: 50, comparator: 'gte', unit: '%', category: 'technique' },
      { id: 'g2_break_100', label: 'Break 100', metric: 'best_score', targetValue: 99, comparator: 'lte', unit: 'strokes', category: 'scoring' },
    ],
    milestoneTemplates: [
      { id: 'g2_break_100', name: 'Break 100', description: 'Post a round under 100.', category: 'scoring', metric: 'best_score', targetValue: 99, comparator: 'lte', unit: 'strokes' },
      { id: 'g2_wedge_videos', name: 'Wedge on film', description: 'Upload three wedge swings for comparison.', category: 'finesse' },
    ],
  },
  {
    code: 'G3',
    order: 3,
    name: 'Developing Recreational Golfer',
    tier: 'developing',
    description:
      'Can break 100 or approach it. May have one reliable scoring strength but multiple ' +
      'performance leaks.',
    anchors: [ha('18–25')],
    primaryGoals: ['Improve approach consistency', 'Build a wedge matrix', 'Reduce 3-putts', 'Develop fairway-finding strategy', 'Improve decision-making'],
    commonWeaknesses: ['Inconsistent approaches', 'No wedge distances', 'Costly decisions'],
    unlockCriteria: [
      { id: 'g3_three_putt', label: 'Reduce 3-putts to 2 or fewer per round', metric: 'three_putts_per_round', targetValue: 2, comparator: 'lte', unit: '/round', category: 'finesse' },
      { id: 'g3_wedge_matrix', label: 'Build a 3-distance wedge matrix', category: 'finesse' },
      { id: 'g3_break_95', label: 'Shoot in the low 90s consistently', metric: 'average_score', targetValue: 95, comparator: 'lte', unit: 'strokes', category: 'scoring' },
    ],
    milestoneTemplates: [
      { id: 'g3_wedge_matrix', name: 'Build wedge distance matrix', description: 'Establish carry distances for each wedge.', category: 'finesse' },
      { id: 'g3_fairway_sessions', name: '5 fairway-finding sessions', description: 'Complete five tee-shot strategy sessions.', category: 'tactical' },
    ],
  },
  {
    code: 'G4',
    order: 4,
    name: 'Bogey Golfer',
    tier: 'competent',
    description:
      'Often shoots in the 80s or low 90s with playable mechanics, but inconsistent face control, ' +
      'distance control, short-game execution, or tee-shot reliability.',
    anchors: [ha('12–18')],
    primaryGoals: ['Improve dispersion', 'Reduce doubles', 'Improve wedge proximity', 'Convert more up-and-downs', 'Build repeatable scoring patterns'],
    commonWeaknesses: ['Double bogeys', 'Loose wedge proximity', 'Inconsistent face control'],
    unlockCriteria: [
      { id: 'g4_penalties', label: 'Reduce penalties to 2 or fewer per round', metric: 'penalties_per_round', targetValue: 2, comparator: 'lte', unit: '/round', category: 'scoring' },
      { id: 'g4_playable_tee', label: 'Reach 65%+ playable tee shots', metric: 'driver_playable_pct', targetValue: 65, comparator: 'gte', unit: '%', category: 'technique' },
      { id: 'g4_three_putt', label: 'Reduce 3-putts to 2 or fewer per round', metric: 'three_putts_per_round', targetValue: 2, comparator: 'lte', unit: '/round', category: 'finesse' },
      { id: 'g4_up_down', label: 'Reach 40%+ up-and-down conversion', metric: 'up_down_pct', targetValue: 40, comparator: 'gte', unit: '%', category: 'finesse' },
    ],
    milestoneTemplates: [
      { id: 'g4_break_90', name: 'Break 90', description: 'Post a round under 90.', category: 'scoring', metric: 'best_score', targetValue: 89, comparator: 'lte', unit: 'strokes' },
      { id: 'g4_no_lost_tee', name: '5 rounds, no lost tee ball', description: 'Play five rounds without losing a ball off the tee.', category: 'technique' },
    ],
  },
  {
    code: 'G5',
    order: 5,
    name: 'Mid-Handicap Performance Golfer',
    tier: 'competent',
    description:
      'Capable of breaking 85 and occasionally threatening 80. The swing is functional but may ' +
      'break down under pressure.',
    anchors: [ha('8–12')],
    primaryGoals: ['Sharpen approach proximity', 'Improve putting inside 10 feet', 'Build a reliable tee-shot pattern', 'Improve par-5 scoring', 'Reduce avoidable bogeys'],
    commonWeaknesses: ['Pressure breakdowns', 'Mid-range putting', 'Avoidable bogeys'],
    unlockCriteria: [
      { id: 'g5_break_85', label: 'Break 85 consistently', metric: 'average_score', targetValue: 85, comparator: 'lte', unit: 'strokes', category: 'scoring' },
      { id: 'g5_gir', label: 'Reach 40%+ greens in regulation', metric: 'gir_pct', targetValue: 40, comparator: 'gte', unit: '%', category: 'technique' },
      { id: 'g5_short_putts', label: 'Make 85%+ of putts inside 6 feet', metric: 'short_putt_pct', targetValue: 85, comparator: 'gte', unit: '%', category: 'finesse' },
    ],
    milestoneTemplates: [
      { id: 'g5_break_85', name: 'Break 85', description: 'Post a round under 85.', category: 'scoring', metric: 'best_score', targetValue: 84, comparator: 'lte', unit: 'strokes' },
      { id: 'g5_handicap', name: 'Establish a Handicap Index', description: 'Establish or update your official Handicap Index.', category: 'scoring' },
    ],
  },
  {
    code: 'G6',
    order: 6,
    name: 'Low-Handicap Golfer',
    tier: 'advanced',
    description:
      'Often shoots in the 70s or low 80s with strong ball-striking or short-game strengths, ' +
      'needing advanced scoring refinement.',
    anchors: [ha('3–8')],
    primaryGoals: ['Improve strokes-gained approach', 'Improve pressure putting', 'Build advanced wedge control', 'Improve tournament preparation', 'Refine shot shaping & trajectory'],
    commonWeaknesses: ['Pressure putting', 'Trajectory control', 'Tournament prep gaps'],
    unlockCriteria: [
      { id: 'g6_break_80', label: 'Break 80 consistently', metric: 'average_score', targetValue: 80, comparator: 'lte', unit: 'strokes', category: 'scoring' },
      { id: 'g6_gir', label: 'Reach 55%+ greens in regulation', metric: 'gir_pct', targetValue: 55, comparator: 'gte', unit: '%', category: 'technique' },
      { id: 'g6_up_down', label: 'Reach 55%+ up-and-down conversion', metric: 'up_down_pct', targetValue: 55, comparator: 'gte', unit: '%', category: 'finesse' },
    ],
    milestoneTemplates: [
      { id: 'g6_break_80', name: 'Break 80', description: 'Post a round under 80.', category: 'scoring', metric: 'best_score', targetValue: 79, comparator: 'lte', unit: 'strokes' },
      { id: 'g6_wedge_control', name: 'Advanced wedge control', description: 'Dial trajectory and spin across wedge distances.', category: 'finesse' },
    ],
  },
  {
    code: 'G7',
    order: 7,
    name: 'Scratch-Level Golfer',
    tier: 'advanced',
    description:
      'Can play near par on regulation courses with high-level consistency and strong course ' +
      'management.',
    anchors: [ha('+1 to 3')],
    primaryGoals: ['Improve elite scoring skills', 'Tighten dispersion', 'Build pressure-scoring systems', 'Track advanced analytics', 'Compete more seriously'],
    commonWeaknesses: ['Marginal dispersion', 'Scoring under pressure', 'Analytics blind spots'],
    unlockCriteria: [
      { id: 'g7_scratch', label: 'Average near par across rounds', metric: 'average_score', targetValue: 74, comparator: 'lte', unit: 'strokes', category: 'scoring' },
      { id: 'g7_gir', label: 'Reach 65%+ greens in regulation', metric: 'gir_pct', targetValue: 65, comparator: 'gte', unit: '%', category: 'technique' },
      { id: 'g7_compete', label: 'Enter competitive events', category: 'competitive' },
    ],
    milestoneTemplates: [
      { id: 'g7_par_round', name: 'Shoot par or better', description: 'Post a round at par or under.', category: 'scoring' },
      { id: 'g7_first_event', name: 'First tournament logged', description: 'Log a competitive event result.', category: 'competitive', metric: 'competitions_logged', targetValue: 1, comparator: 'gte', unit: 'events' },
    ],
  },
  {
    code: 'G8',
    order: 8,
    name: 'Competitive Amateur',
    tier: 'elite',
    description:
      'Competes in serious amateur events. Performance is judged by tournament results, scoring ' +
      'differential, course difficulty, and consistency under pressure.',
    anchors: [ha('+1 to +4')],
    primaryGoals: ['Improve tournament scoring average', 'Improve par-5 scoring', 'Improve wedge proximity', 'Build advanced mental systems', 'Increase competitive exposure'],
    commonWeaknesses: ['Tournament scoring variance', 'Par-5 conversion', 'Mental systems under pressure'],
    unlockCriteria: [
      { id: 'g8_tourn_scoring', label: 'Lower tournament scoring average', metric: 'tournament_avg', targetValue: 74, comparator: 'lte', unit: 'strokes', category: 'competitive' },
      { id: 'g8_events', label: 'Compete in multiple ranked events', metric: 'competitions_logged', targetValue: 5, comparator: 'gte', unit: 'events', category: 'competitive' },
    ],
    milestoneTemplates: [
      { id: 'g8_top_finish', name: 'Top finish in an event', description: 'Record a strong competitive finish.', category: 'competitive' },
      { id: 'g8_mental_system', name: 'Build a pressure routine', description: 'Document a repeatable pressure-scoring routine.', category: 'mental' },
    ],
  },
  {
    code: 'G9',
    order: 9,
    name: 'Elite Amateur / Collegiate-Level',
    tier: 'elite',
    description:
      'Elite amateur, collegiate, or high-level tournament skill requiring advanced ball-striking, ' +
      'short-game depth, speed, and pressure scoring. Judged primarily by results.',
    anchors: [ha('+3 to +6')],
    primaryGoals: ['Refine elite scoring metrics', 'Improve travel/tournament performance', 'Build professional-quality practice systems', 'Improve statistical weaknesses', 'Strengthen competitive identity'],
    commonWeaknesses: ['Statistical weak links', 'Travel performance', 'Consistency across events'],
    unlockCriteria: [
      { id: 'g9_results', label: 'Sustain elite tournament results', metric: 'tournament_avg', targetValue: 72, comparator: 'lte', unit: 'strokes', category: 'competitive' },
      { id: 'g9_events', label: 'Compete across a full schedule', metric: 'competitions_logged', targetValue: 10, comparator: 'gte', unit: 'events', category: 'competitive' },
    ],
    milestoneTemplates: [
      { id: 'g9_win', name: 'Win or contend in a ranked event', description: 'Record a win or top contention.', category: 'competitive' },
      { id: 'g9_practice_system', name: 'Pro-quality practice system', description: 'Operate a measured, periodised practice system.', category: 'practice' },
    ],
  },
  {
    code: 'G10',
    order: 10,
    name: 'Professional-Track Golfer',
    tier: 'professional',
    description:
      'Assessed primarily through verified tournament results, scoring average, strokes gained, ' +
      'elite ball-striking, short-game metrics, and pressure scoring — never self-report alone.',
    anchors: [ha('+5 or better / professional')],
    primaryGoals: ['Maximize strokes gained across the bag', 'Win at the highest level entered', 'Operate a professional support system', 'Sustain results across seasons'],
    commonWeaknesses: ['Marginal gains under scrutiny', 'Schedule durability'],
    unlockCriteria: [
      { id: 'g10_verified', label: 'Verified elite competitive results', category: 'competitive' },
    ],
    milestoneTemplates: [
      { id: 'g10_pro_result', name: 'Professional-level result', description: 'Record a verified professional-level result.', category: 'competitive' },
    ],
  },
];

const BRANCHES: SkillBranchDef[] = [
  { id: 'tee_shots', name: 'Tee Shots', category: 'technique', description: 'Driver and tee-shot reliability and dispersion.' },
  { id: 'approach', name: 'Approach Play', category: 'technique', description: 'Iron strikes and approach proximity.' },
  { id: 'wedges', name: 'Wedges', category: 'finesse', description: 'Wedge distance control and proximity.' },
  { id: 'short_game', name: 'Short Game', category: 'finesse', description: 'Chipping, pitching, and bunker play.' },
  { id: 'putting', name: 'Putting', category: 'finesse', description: 'Speed control, start line, and make rate.' },
  { id: 'course_management', name: 'Course Management', category: 'tactical', description: 'Strategy, club selection, and risk decisions.' },
  { id: 'mental_game', name: 'Mental Game', category: 'mental', description: 'Routine, pressure scoring, and recovery.' },
  { id: 'physical_readiness', name: 'Physical Readiness', category: 'movement', description: 'Speed, mobility, and durability.' },
  { id: 'equipment_fit', name: 'Equipment Fit', category: 'practice', description: 'Gapping and fit that matches your game.' },
];

const MISSING_DATA: MissingDataPromptDef[] = [
  { id: 'golf_handicap', kind: 'rating', ratingType: 'golf_handicap', label: 'Add your current handicap', description: 'Optional — used as one guidepost, never the only signal.', href: '/journey?panel=rating', ctaLabel: 'Add handicap', priority: 70 },
  { id: 'golf_driver_video', kind: 'video', branchKey: 'tee_shots', label: 'Upload a driver swing', description: 'Lets SwingVantage read your tee-shot technique.', href: '/diagnose', ctaLabel: 'Upload', priority: 90 },
  { id: 'golf_iron_video', kind: 'video', branchKey: 'approach', label: 'Upload a 7-iron swing', description: 'Builds your approach-play picture.', href: '/diagnose', ctaLabel: 'Upload', priority: 82 },
  { id: 'golf_wedge_video', kind: 'video', branchKey: 'wedges', label: 'Upload a wedge swing', description: 'Adds short-game evidence to your journey.', href: '/diagnose', ctaLabel: 'Upload', priority: 74 },
  { id: 'golf_log_rounds', kind: 'competition_log', label: 'Log your last 3 rounds', description: 'Scoring data sharpens your stage estimate the most.', href: '/sessions/import', ctaLabel: 'Log rounds', priority: 88 },
  { id: 'golf_typical_score', kind: 'profile', profileField: 'typicalScore', label: 'Enter your typical score range', description: 'A quick anchor when you have no handicap.', href: '/journey?panel=profile', ctaLabel: 'Add range', priority: 60 },
  { id: 'golf_putting_bench', kind: 'benchmark', label: 'Complete a putting benchmark', description: 'A distance-control ladder grounds your finesse score.', href: '/retest', ctaLabel: 'Start benchmark', priority: 64 },
];

/** Map an optional handicap index to an approximate stage order (guidepost). */
function golfHandicapToOrder(rating: PlayerRating): number | null {
  if (rating.ratingType !== 'golf_handicap') return null;
  const h = rating.value; // lower is better; plus handicaps are negative
  if (!Number.isFinite(h)) return null;
  if (h >= 45) return 0;
  if (h >= 36) return 1;
  if (h >= 25) return 2;
  if (h >= 18) return 3;
  if (h >= 12) return 4;
  if (h >= 8) return 5;
  if (h >= 3) return 6;
  if (h >= -1) return 7;
  if (h >= -4) return 8;
  if (h >= -6) return 9;
  return 10;
}

export const GOLF_CONFIG: SportJourneyConfig = {
  sport: 'golf',
  ratingLabel: 'USGA Handicap Index (optional)',
  ratingType: 'golf_handicap',
  secondaryRatingType: null,
  categories: ['scoring', 'technique', 'consistency', 'finesse', 'practice', 'tactical', 'competitive'],
  weights: {
    scoring: 0.25,
    technique: 0.25,
    consistency: 0.15,
    finesse: 0.15,
    practice: 0.1,
    tactical: 0.05,
    competitive: 0.05,
  },
  stages: STAGES,
  branches: BRANCHES,
  missingDataPrompts: MISSING_DATA,
  ratingToStageOrder: golfHandicapToOrder,
};
