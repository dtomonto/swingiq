// ============================================================
// SwingVantage — Athletic Journey: Pickleball configuration
// ------------------------------------------------------------
// Pickleball stages (PB0–PB9), skill branches, classification
// weighting, missing-data prompts, and the optional DUPR / self-
// rating guideposts. Ratings are ONE input, never the sole
// determinant. DUPR scale: ~1.00–8.00; self-rating 2.0–5.0+.
// Pickleball is its own sport: the kitchen (non-volley zone), the
// third-shot drop, dinking, and resets drive the progression —
// NOT tennis groundstroke mechanics.
// ============================================================

import type {
  PlayerRating,
  SportJourneyConfig,
  StageDefinition,
  SkillBranchDef,
  MissingDataPromptDef,
} from '../types';

const anchors = (dupr: string) => [{ ratingType: 'dupr' as const, label: dupr }];

const STAGES: StageDefinition[] = [
  {
    code: 'PB0',
    order: 0,
    name: 'New Player',
    tier: 'foundation',
    description:
      'Learning the basics — grip, serve, the kitchen (non-volley zone) rules, scoring, and making clean contact.',
    anchors: anchors('No rating or 2.0'),
    primaryGoals: ['Make clean contact', 'Learn the kitchen rules', 'Learn to serve and return', 'Learn scoring', 'Build confidence in doubles'],
    commonWeaknesses: ['Inconsistent contact', 'Foot faults at the kitchen', 'No third shot yet'],
    unlockCriteria: [
      { id: 'pb0_contact', label: 'Rally a few balls cooperatively', category: 'consistency' },
      { id: 'pb0_serve', label: 'Get most serves in play', category: 'finesse' },
      { id: 'pb0_video', label: 'Upload your first dink or drive video', category: 'technique' },
    ],
    milestoneTemplates: [
      { id: 'pb0_first_video', name: 'First stroke on film', description: 'Upload your first pickleball video.', category: 'technique' },
      { id: 'pb0_first_session', name: 'First practice logged', description: 'Complete and log your first session.', category: 'practice' },
    ],
  },
  {
    code: 'PB1',
    order: 1,
    name: 'Recreational Beginner',
    tier: 'foundation',
    description:
      'Can keep a rally going and play games, but lacks a reliable third shot, consistent dinks, and kitchen-line positioning.',
    anchors: anchors('2.0–2.5'),
    primaryGoals: ['Build rally tolerance', 'Get to the kitchen line', 'Start a basic dink', 'Reduce unforced errors', 'Learn the third-shot concept'],
    commonWeaknesses: ['Stays back from the kitchen', 'Pops up dinks', 'Drives everything'],
    unlockCriteria: [
      { id: 'pb1_kitchen', label: 'Advance to and hold the kitchen line', category: 'movement' },
      { id: 'pb1_dink', label: 'Dink 6+ balls cooperatively', metric: 'dink_rally_length', targetValue: 6, comparator: 'gte', unit: 'balls', category: 'consistency' },
      { id: 'pb1_games', label: 'Log your first 3 games', metric: 'games_logged', targetValue: 3, comparator: 'gte', unit: 'games', category: 'scoring' },
    ],
    milestoneTemplates: [
      { id: 'pb1_log_games', name: 'Log first 3 games', description: 'Record three games or sessions.', category: 'scoring', metric: 'games_logged', targetValue: 3, comparator: 'gte', unit: 'games' },
      { id: 'pb1_dink_bench', name: 'Dink consistency benchmark', description: 'Complete a cross-court dink tolerance test.', category: 'consistency' },
    ],
  },
  {
    code: 'PB2',
    order: 2,
    name: 'Developing Player',
    tier: 'developing',
    description:
      'Plays the soft game and gets to the kitchen, but the third-shot drop, resets, and patience are inconsistent.',
    anchors: anchors('2.5–3.0'),
    primaryGoals: ['Build a reliable third-shot drop', 'Improve dink consistency', 'Stop popping up dinks', 'Learn to reset', 'Choose drops vs. drives'],
    commonWeaknesses: ['Nets third-shot drops', 'Speeds up the wrong balls', 'Weak resets'],
    unlockCriteria: [
      { id: 'pb2_drop', label: 'Land third-shot drops at 40%+', metric: 'third_shot_drop_success_pct', targetValue: 40, comparator: 'gte', unit: '%', category: 'finesse' },
      { id: 'pb2_dink', label: 'Sustain a 10-ball cross-court dink', metric: 'dink_rally_length', targetValue: 10, comparator: 'gte', unit: 'balls', category: 'consistency' },
      { id: 'pb2_videos', label: 'Upload dink, drop, and drive videos', category: 'technique' },
    ],
    milestoneTemplates: [
      { id: 'pb2_shot_videos', name: 'Core shots on film', description: 'Upload dink, third-shot drop, and drive.', category: 'technique' },
      { id: 'pb2_drop_session', name: 'Reliable third-shot drop', description: 'Complete a drop-consistency session.', category: 'finesse' },
    ],
  },
  {
    code: 'PB3',
    order: 3,
    name: 'Consistent Club Player',
    tier: 'developing',
    description:
      'Holds the kitchen and plays the soft game, but breaks down under pace, in fast hands battles, and in the transition zone.',
    anchors: anchors('3.0–3.5'),
    primaryGoals: ['Reliable third-shot drop', 'Win dink rallies', 'Improve transition-zone resets', 'Recognize attackable balls', 'Compete consistently'],
    commonWeaknesses: ['Rushes the transition zone', 'Loses hands battles', 'Speed-up errors'],
    unlockCriteria: [
      { id: 'pb3_drop', label: 'Land third-shot drops at 60%+', metric: 'third_shot_drop_success_pct', targetValue: 60, comparator: 'gte', unit: '%', category: 'finesse' },
      { id: 'pb3_reset', label: 'Reset hard balls at 55%+ from transition', metric: 'reset_success_pct', targetValue: 55, comparator: 'gte', unit: '%', category: 'consistency' },
      { id: 'pb3_games', label: 'Log a block of competitive games', metric: 'games_logged', targetValue: 8, comparator: 'gte', unit: 'games', category: 'scoring' },
    ],
    milestoneTemplates: [
      { id: 'pb3_reset_session', name: 'Transition reset session', description: 'Complete a transition-zone reset session.', category: 'consistency' },
      { id: 'pb3_first_win', name: 'Win a rec-league match', description: 'Record a league or ladder win.', category: 'scoring' },
    ],
  },
  {
    code: 'PB4',
    order: 4,
    name: 'Competitive Intermediate',
    tier: 'competent',
    description:
      'Has a soft game and reliable drops; developing speed-ups, counters, and doubles strategy with a partner.',
    anchors: anchors('3.5–4.0'),
    primaryGoals: ['Add controlled speed-ups', 'Improve counters', 'Build doubles patterns', 'Improve transition play', 'Reduce neutral-rally errors'],
    commonWeaknesses: ['Inconsistent counters', 'Partner spacing', 'Patience under pressure'],
    unlockCriteria: [
      { id: 'pb4_reset', label: 'Reset under pace at 65%+', metric: 'reset_success_pct', targetValue: 65, comparator: 'gte', unit: '%', category: 'consistency' },
      { id: 'pb4_patterns', label: 'Build reliable stacking / doubles patterns', category: 'tactical' },
      { id: 'pb4_games', label: 'Log competitive games', metric: 'games_logged', targetValue: 12, comparator: 'gte', unit: 'games', category: 'scoring' },
    ],
    milestoneTemplates: [
      { id: 'pb4_tournament', name: 'Enter a tournament', description: 'Log a sanctioned tournament result.', category: 'competitive' },
      { id: 'pb4_speedup', name: 'Controlled speed-up session', description: 'Complete an attackable-ball recognition session.', category: 'technique' },
    ],
  },
  {
    code: 'PB5',
    order: 5,
    name: 'Advanced Doubles Player',
    tier: 'competent',
    description:
      'Strong soft game and hands; constructs points, stacks effectively, and competes in 4.0-level events.',
    anchors: anchors('4.0–4.5'),
    primaryGoals: ['Sharpen the speed-up/counter game', 'Improve return depth and serve placement', 'Master stacking', 'Win the kitchen battle', 'Develop match plans'],
    commonWeaknesses: ['Hands speed vs. 4.5s', 'Pressure-point execution', 'Serve/return weapons'],
    unlockCriteria: [
      { id: 'pb5_handsplus', label: 'Win the majority of hands battles', category: 'technique' },
      { id: 'pb5_dupr', label: 'Reach a verified DUPR around 4.0+', metric: 'dupr', targetValue: 4.0, comparator: 'gte', unit: 'DUPR', category: 'competitive' },
      { id: 'pb5_events', label: 'Log tournament exposure', metric: 'games_logged', targetValue: 20, comparator: 'gte', unit: 'games', category: 'competitive' },
    ],
    milestoneTemplates: [
      { id: 'pb5_weapon', name: 'Establish a weapon', description: 'Build one reliable point-ending pattern.', category: 'technique' },
      { id: 'pb5_tournament_win', name: 'Win a tournament match', description: 'Record a tournament win.', category: 'competitive' },
    ],
  },
  {
    code: 'PB6',
    order: 6,
    name: 'Tournament Competitor',
    tier: 'advanced',
    description:
      'Competes in 4.5 brackets with strong weapons, tactical maturity, and consistent tournament experience.',
    anchors: anchors('4.5–5.0'),
    primaryGoals: ['Improve weapon reliability', 'Improve return aggression', 'Build opponent-specific plans', 'Increase tournament exposure', 'Improve fitness'],
    commonWeaknesses: ['Consistency vs. 5.0s', 'Pattern variety', 'Endurance across a tournament day'],
    unlockCriteria: [
      { id: 'pb6_dupr', label: 'Sustain a verified DUPR around 4.5+', metric: 'dupr', targetValue: 4.5, comparator: 'gte', unit: 'DUPR', category: 'competitive' },
      { id: 'pb6_events', label: 'Build tournament exposure', metric: 'games_logged', targetValue: 30, comparator: 'gte', unit: 'games', category: 'competitive' },
    ],
    milestoneTemplates: [
      { id: 'pb6_medal', name: 'Medal in a bracket', description: 'Record a podium result in a tournament bracket.', category: 'competitive' },
      { id: 'pb6_patterns', name: 'Opponent pattern library', description: 'Document opponent-specific patterns.', category: 'tactical' },
    ],
  },
  {
    code: 'PB7',
    order: 7,
    name: 'High-Level Competitive Player',
    tier: 'advanced',
    description:
      'Competes in open and 5.0 events with refined weapons, elite hands, and strong shot selection under pressure.',
    anchors: anchors('5.0–5.5'),
    primaryGoals: ['High-pressure execution', 'Elite hands and counters', 'Defense-to-offense conversion', 'Advanced physical preparation', 'Match analytics'],
    commonWeaknesses: ['Margins vs. pros', 'Analytics tracking', 'Recovery between matches'],
    unlockCriteria: [
      { id: 'pb7_open', label: 'Compete in open / 5.0 events', metric: 'games_logged', targetValue: 40, comparator: 'gte', unit: 'games', category: 'competitive' },
      { id: 'pb7_dupr', label: 'Sustain a verified DUPR around 5.0+', metric: 'dupr', targetValue: 5.0, comparator: 'gte', unit: 'DUPR', category: 'competitive' },
    ],
    milestoneTemplates: [
      { id: 'pb7_open_result', name: 'Open-level result', description: 'Record a result in an open event.', category: 'competitive' },
      { id: 'pb7_analytics', name: 'Match analytics tracking', description: 'Track serve/return and error analytics across matches.', category: 'tactical' },
    ],
  },
  {
    code: 'PB8',
    order: 8,
    name: 'Elite Amateur',
    tier: 'elite',
    description:
      'Among the strongest amateurs — competes deep in open brackets and against pro-development players, judged by verified results.',
    anchors: anchors('5.5–6.0'),
    primaryGoals: ['Improve tournament results', 'Refine elite weapons', 'Improve pressure conversion', 'Professional training structure', 'Travel performance'],
    commonWeaknesses: ['Result variance', 'Durability across events', 'Marginal gains'],
    unlockCriteria: [
      { id: 'pb8_results', label: 'Sustain elite amateur results', metric: 'games_logged', targetValue: 60, comparator: 'gte', unit: 'games', category: 'competitive' },
      { id: 'pb8_structure', label: 'Operate a professional training structure', category: 'practice' },
    ],
    milestoneTemplates: [
      { id: 'pb8_open_podium', name: 'Open podium', description: 'Medal in an open-level bracket.', category: 'competitive' },
      { id: 'pb8_structure', name: 'Pro training structure', description: 'Run a periodised training block.', category: 'practice' },
    ],
  },
  {
    code: 'PB9',
    order: 9,
    name: 'Professional-Caliber Player',
    tier: 'professional',
    description:
      'Assessed primarily through verified competitive results, tournament level, and professional status — never self-report or paddle speed alone.',
    anchors: anchors('6.0+'),
    primaryGoals: ['Win at the highest level entered', 'Maximize weapons and consistency', 'Operate a professional team', 'Sustain results across a season'],
    commonWeaknesses: ['Marginal gains under scrutiny', 'Season durability'],
    unlockCriteria: [
      { id: 'pb9_verified', label: 'Verified professional competitive results', category: 'competitive' },
    ],
    milestoneTemplates: [
      { id: 'pb9_pro_result', name: 'Professional result', description: 'Record a verified professional result.', category: 'competitive' },
    ],
  },
];

const BRANCHES: SkillBranchDef[] = [
  { id: 'serve_return', name: 'Serve & Return', category: 'finesse', description: 'Deep serves and returns that set up the point.' },
  { id: 'third_shot', name: 'Third Shot', category: 'finesse', description: 'Drop and drive consistency to win the kitchen.' },
  { id: 'dinking', name: 'Dinking', category: 'consistency', description: 'Soft-game control, height, and patience.' },
  { id: 'resets', name: 'Resets', category: 'consistency', description: 'Absorbing pace from the transition zone.' },
  { id: 'volleys', name: 'Volleys & Hands', category: 'technique', description: 'Speed-ups, counters, and hands battles.' },
  { id: 'footwork', name: 'Footwork', category: 'movement', description: 'Split step, kitchen line, and transition movement.' },
  { id: 'doubles_tactics', name: 'Doubles Strategy', category: 'tactical', description: 'Stacking, spacing, shot selection, and patterns.' },
  { id: 'mental_game', name: 'Mental Game', category: 'mental', description: 'Patience, shot discipline, and pressure points.' },
  { id: 'match_play', name: 'Match Play', category: 'scoring', description: 'Results, closing games, and competitive exposure.' },
];

const MISSING_DATA: MissingDataPromptDef[] = [
  { id: 'pb_dupr', kind: 'rating', ratingType: 'dupr', label: 'Add your current DUPR', description: 'Optional — used as one guidepost (DUPR ~1.0–8.0).', href: '/journey?panel=rating', ctaLabel: 'Add DUPR', priority: 70 },
  { id: 'pb_dink_video', kind: 'video', branchKey: 'dinking', label: 'Upload a dink video', description: 'Lets SwingVantage read your paddle-face control.', href: '/diagnose', ctaLabel: 'Upload', priority: 86 },
  { id: 'pb_drop_video', kind: 'video', branchKey: 'third_shot', label: 'Upload a third-shot drop video', description: 'The third shot is a top stage driver.', href: '/diagnose', ctaLabel: 'Upload', priority: 90 },
  { id: 'pb_reset_video', kind: 'video', branchKey: 'resets', label: 'Upload a transition reset video', description: 'Resets separate club from competitive players.', href: '/diagnose', ctaLabel: 'Upload', priority: 78 },
  { id: 'pb_log_games', kind: 'competition_log', label: 'Log your last 3 games', description: 'Game results sharpen your stage estimate the most.', href: '/sessions/import', ctaLabel: 'Log games', priority: 84 },
  { id: 'pb_dink_bench', kind: 'benchmark', label: 'Complete a dink consistency benchmark', description: 'A cross-court dink test grounds your consistency score.', href: '/retest', ctaLabel: 'Start benchmark', priority: 62 },
];

/** Map an optional DUPR rating to an approximate stage order (guidepost). */
function pickleballRatingToOrder(rating: PlayerRating): number | null {
  const v = rating.value;
  if (!Number.isFinite(v)) return null;
  if (rating.ratingType !== 'dupr') return null;
  if (v < 2.5) return 1;
  if (v < 3.0) return 2;
  if (v < 3.5) return 3;
  if (v < 4.0) return 4;
  if (v < 4.5) return 5;
  if (v < 5.0) return 6;
  if (v < 5.5) return 7;
  if (v < 6.0) return 8;
  return 9;
}

export const PICKLEBALL_CONFIG: SportJourneyConfig = {
  sport: 'pickleball',
  ratingLabel: 'DUPR (optional)',
  ratingType: 'dupr',
  secondaryRatingType: null,
  categories: ['scoring', 'technique', 'consistency', 'finesse', 'movement', 'tactical', 'practice', 'mental'],
  weights: {
    scoring: 0.2,
    technique: 0.2,
    finesse: 0.2,
    consistency: 0.15,
    movement: 0.1,
    tactical: 0.1,
    practice: 0.025,
    mental: 0.025,
  },
  stages: STAGES,
  branches: BRANCHES,
  missingDataPrompts: MISSING_DATA,
  ratingToStageOrder: pickleballRatingToOrder,
};
