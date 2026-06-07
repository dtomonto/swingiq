// ============================================================
// SwingVantage — Athletic Journey: Padel configuration
// ------------------------------------------------------------
// Padel stages (PD0–PD9), skill branches, classification weighting,
// and missing-data prompts. Padel has no single universal numeric
// rating (club / league / national-federation scales vary widely),
// so the journey uses NO primary numeric rating — stage is estimated
// from video analysis, match logs, and practice. Padel is its own
// sport: glass play, the bandeja/víbora overhead family, and doubles
// court positioning drive the progression — NOT tennis mechanics.
// ============================================================

import type {
  PlayerRating,
  SportJourneyConfig,
  StageDefinition,
  SkillBranchDef,
  MissingDataPromptDef,
} from '../types';

const STAGES: StageDefinition[] = [
  {
    code: 'PD0',
    order: 0,
    name: 'New Player',
    tier: 'foundation',
    description:
      'Learning the basics — grip, serve, scoring, the role of the walls, and making clean contact in doubles.',
    anchors: [],
    primaryGoals: ['Make clean contact', 'Learn the serve and scoring', 'Understand the glass is in play', 'Learn basic positioning', 'Build confidence'],
    commonWeaknesses: ['Inconsistent contact', 'Crowds the back glass', 'Square stance on overheads'],
    unlockCriteria: [
      { id: 'pd0_contact', label: 'Rally a few balls cooperatively', category: 'consistency' },
      { id: 'pd0_glass', label: 'Play a ball off the back glass', category: 'technique' },
      { id: 'pd0_video', label: 'Upload your first padel video', category: 'technique' },
    ],
    milestoneTemplates: [
      { id: 'pd0_first_video', name: 'First stroke on film', description: 'Upload your first padel video.', category: 'technique' },
      { id: 'pd0_first_session', name: 'First practice logged', description: 'Complete and log your first session.', category: 'practice' },
    ],
  },
  {
    code: 'PD1',
    order: 1,
    name: 'Recreational Beginner',
    tier: 'foundation',
    description:
      'Can keep a rally going and play points, but struggles with the wall read, the lob, and net positioning.',
    anchors: [],
    primaryGoals: ['Build rally tolerance', 'Read balls off the back glass', 'Start a defensive lob', 'Learn net vs. back positioning', 'Reduce unforced errors'],
    commonWeaknesses: ['Poor wall reads', 'Short lobs', 'Caught in mid-court'],
    unlockCriteria: [
      { id: 'pd1_wall', label: 'Play back-glass rebounds with space at 50%+', metric: 'wall_read_score', targetValue: 0.5, comparator: 'gte', unit: 'score', category: 'technique' },
      { id: 'pd1_lob', label: 'Lob deep enough to push opponents back', category: 'finesse' },
      { id: 'pd1_matches', label: 'Log your first 3 matches', metric: 'matches_logged', targetValue: 3, comparator: 'gte', unit: 'matches', category: 'scoring' },
    ],
    milestoneTemplates: [
      { id: 'pd1_log_matches', name: 'Log first 3 matches', description: 'Record three matches or sessions.', category: 'scoring', metric: 'matches_logged', targetValue: 3, comparator: 'gte', unit: 'matches' },
      { id: 'pd1_wall_bench', name: 'Wall-read benchmark', description: 'Complete a back-glass control test.', category: 'technique' },
    ],
  },
  {
    code: 'PD2',
    order: 2,
    name: 'Developing Club Player',
    tier: 'developing',
    description:
      'Reads the glass and gets to the net, but the bandeja, lob depth, and volleys are inconsistent.',
    anchors: [],
    primaryGoals: ['Build a reliable bandeja', 'Improve lob depth', 'Improve volleys', 'Win the net', 'Improve defensive recovery'],
    commonWeaknesses: ['Weak bandeja', 'Overhits smashes', 'Volley errors'],
    unlockCriteria: [
      { id: 'pd2_bandeja', label: 'Land controlled bandejas at 55%+', metric: 'bandeja_control_score', targetValue: 0.55, comparator: 'gte', unit: 'score', category: 'technique' },
      { id: 'pd2_lob', label: 'Lob deep consistently', metric: 'lob_depth_score', targetValue: 0.55, comparator: 'gte', unit: 'score', category: 'finesse' },
      { id: 'pd2_videos', label: 'Upload bandeja, volley, and wall-play videos', category: 'technique' },
    ],
    milestoneTemplates: [
      { id: 'pd2_shot_videos', name: 'Core shots on film', description: 'Upload bandeja, volley, and back-glass play.', category: 'technique' },
      { id: 'pd2_bandeja_session', name: 'Reliable bandeja', description: 'Complete a bandeja-control session.', category: 'technique' },
    ],
  },
  {
    code: 'PD3',
    order: 3,
    name: 'Consistent Intermediate',
    tier: 'developing',
    description:
      'Holds the net and reads the glass, but breaks down under pace, in long bandeja exchanges, and on the transition.',
    anchors: [],
    primaryGoals: ['Reliable bandeja and víbora', 'Win net exchanges', 'Improve transition to net', 'Improve smash decisions', 'Compete consistently'],
    commonWeaknesses: ['Loses the net under pressure', 'Mistimes after the glass', 'Smashes the wrong balls'],
    unlockCriteria: [
      { id: 'pd3_nethold', label: 'Hold the net at 58%+ through overhead exchanges', metric: 'net_hold_pct', targetValue: 58, comparator: 'gte', unit: '%', category: 'tactical' },
      { id: 'pd3_bandeja', label: 'Bandeja control at 70%+', metric: 'bandeja_control_score', targetValue: 0.7, comparator: 'gte', unit: 'score', category: 'technique' },
      { id: 'pd3_matches', label: 'Log a block of competitive matches', metric: 'matches_logged', targetValue: 8, comparator: 'gte', unit: 'matches', category: 'scoring' },
    ],
    milestoneTemplates: [
      { id: 'pd3_transition', name: 'Net transition session', description: 'Complete a lob-and-advance transition session.', category: 'tactical' },
      { id: 'pd3_first_win', name: 'Win a club match', description: 'Record a club or league win.', category: 'scoring' },
    ],
  },
  {
    code: 'PD4',
    order: 4,
    name: 'Tactical Doubles Player',
    tier: 'competent',
    description:
      'Strong overheads and wall play; constructs points with a partner and competes in club leagues.',
    anchors: [],
    primaryGoals: ['Add the víbora as a weapon', 'Improve smash selection', 'Build doubles patterns', 'Improve partner spacing', 'Reduce neutral errors'],
    commonWeaknesses: ['Partner spacing', 'Pressure-point execution', 'Counterattack off the glass'],
    unlockCriteria: [
      { id: 'pd4_decision', label: 'Strong smash-vs-bandeja decisions (65%+)', metric: 'smash_decision_score', targetValue: 0.65, comparator: 'gte', unit: 'score', category: 'tactical' },
      { id: 'pd4_patterns', label: 'Build reliable doubles patterns', category: 'tactical' },
      { id: 'pd4_matches', label: 'Log competitive matches', metric: 'matches_logged', targetValue: 12, comparator: 'gte', unit: 'matches', category: 'scoring' },
    ],
    milestoneTemplates: [
      { id: 'pd4_league_win', name: 'Win a league match', description: 'Record a league win.', category: 'scoring' },
      { id: 'pd4_vibora', name: 'Víbora session', description: 'Complete a víbora-development session.', category: 'technique' },
    ],
  },
  {
    code: 'PD5',
    order: 5,
    name: 'Advanced Net Player',
    tier: 'competent',
    description:
      'Dominates the net with strong overheads, counters off the glass, and good court coverage with a partner.',
    anchors: [],
    primaryGoals: ['Sharpen weapons (víbora, smash por tres)', 'Improve defensive-to-offensive conversion', 'Improve return depth', 'Develop match plans', 'Improve fitness'],
    commonWeaknesses: ['Counter consistency', 'Pressure-point execution', 'Physical repeatability'],
    unlockCriteria: [
      { id: 'pd5_nethold', label: 'Hold the net at 70%+', metric: 'net_hold_pct', targetValue: 70, comparator: 'gte', unit: '%', category: 'tactical' },
      { id: 'pd5_wall', label: 'Confident double-wall counterattack (80%+)', metric: 'wall_read_score', targetValue: 0.8, comparator: 'gte', unit: 'score', category: 'technique' },
      { id: 'pd5_matches', label: 'Log a competitive block', metric: 'matches_logged', targetValue: 20, comparator: 'gte', unit: 'matches', category: 'competitive' },
    ],
    milestoneTemplates: [
      { id: 'pd5_weapon', name: 'Establish a weapon', description: 'Build one reliable point-ending shot.', category: 'technique' },
      { id: 'pd5_tournament', name: 'Enter a tournament', description: 'Log a tournament result.', category: 'competitive' },
    ],
  },
  {
    code: 'PD6',
    order: 6,
    name: 'Competitive Club Player',
    tier: 'advanced',
    description:
      'Competes in strong club categories with refined weapons, tactical maturity, and tournament experience.',
    anchors: [],
    primaryGoals: ['Improve weapon reliability', 'Improve return aggression', 'Build opponent-specific plans', 'Increase tournament exposure', 'Improve conditioning'],
    commonWeaknesses: ['Consistency vs. higher categories', 'Pattern variety', 'Endurance'],
    unlockCriteria: [
      { id: 'pd6_decision', label: 'Elite shot selection (80%+)', metric: 'smash_decision_score', targetValue: 0.8, comparator: 'gte', unit: 'score', category: 'tactical' },
      { id: 'pd6_events', label: 'Build tournament exposure', metric: 'matches_logged', targetValue: 30, comparator: 'gte', unit: 'matches', category: 'competitive' },
    ],
    milestoneTemplates: [
      { id: 'pd6_podium', name: 'Podium in a category', description: 'Record a podium result in a tournament category.', category: 'competitive' },
      { id: 'pd6_patterns', name: 'Opponent pattern library', description: 'Document opponent-specific patterns.', category: 'tactical' },
    ],
  },
  {
    code: 'PD7',
    order: 7,
    name: 'Tournament Player',
    tier: 'advanced',
    description:
      'Competes in open and first-category events with strong weapons and high-pressure execution.',
    anchors: [],
    primaryGoals: ['High-pressure execution', 'Elite overheads and counters', 'Defense-to-offense conversion', 'Advanced physical preparation', 'Match analytics'],
    commonWeaknesses: ['Margins vs. elite amateurs', 'Analytics tracking', 'Recovery between matches'],
    unlockCriteria: [
      { id: 'pd7_open', label: 'Compete in open / first-category events', metric: 'matches_logged', targetValue: 40, comparator: 'gte', unit: 'matches', category: 'competitive' },
      { id: 'pd7_nethold', label: 'Sustain elite net control (78%+)', metric: 'net_hold_pct', targetValue: 78, comparator: 'gte', unit: '%', category: 'tactical' },
    ],
    milestoneTemplates: [
      { id: 'pd7_open_result', name: 'Open-level result', description: 'Record a result in an open event.', category: 'competitive' },
      { id: 'pd7_analytics', name: 'Match analytics tracking', description: 'Track point construction and error analytics.', category: 'tactical' },
    ],
  },
  {
    code: 'PD8',
    order: 8,
    name: 'Elite Amateur',
    tier: 'elite',
    description:
      'Among the strongest amateurs — competes deep in open brackets and against pro-development players, judged by verified results.',
    anchors: [],
    primaryGoals: ['Improve tournament results', 'Refine elite weapons', 'Improve pressure conversion', 'Professional training structure', 'Travel performance'],
    commonWeaknesses: ['Result variance', 'Durability across events', 'Marginal gains'],
    unlockCriteria: [
      { id: 'pd8_results', label: 'Sustain elite amateur results', metric: 'matches_logged', targetValue: 60, comparator: 'gte', unit: 'matches', category: 'competitive' },
      { id: 'pd8_structure', label: 'Operate a professional training structure', category: 'practice' },
    ],
    milestoneTemplates: [
      { id: 'pd8_open_podium', name: 'Open podium', description: 'Medal in an open-level bracket.', category: 'competitive' },
      { id: 'pd8_structure', name: 'Pro training structure', description: 'Run a periodised training block.', category: 'practice' },
    ],
  },
  {
    code: 'PD9',
    order: 9,
    name: 'Professional-Caliber Player',
    tier: 'professional',
    description:
      'Assessed primarily through verified competitive results, tournament level, and professional status — never self-report or racket speed alone.',
    anchors: [],
    primaryGoals: ['Win at the highest level entered', 'Maximize weapons and consistency', 'Operate a professional team', 'Sustain results across a season'],
    commonWeaknesses: ['Marginal gains under scrutiny', 'Season durability'],
    unlockCriteria: [
      { id: 'pd9_verified', label: 'Verified professional competitive results', category: 'competitive' },
    ],
    milestoneTemplates: [
      { id: 'pd9_pro_result', name: 'Professional result', description: 'Record a verified professional result.', category: 'competitive' },
    ],
  },
];

const BRANCHES: SkillBranchDef[] = [
  { id: 'serve_return', name: 'Serve & Return', category: 'finesse', description: 'Serve placement and return depth.' },
  { id: 'overheads', name: 'Overheads', category: 'technique', description: 'Bandeja, víbora, and smash control and selection.' },
  { id: 'volleys', name: 'Volleys', category: 'technique', description: 'Net volley stability and placement.' },
  { id: 'wall_play', name: 'Wall Play', category: 'technique', description: 'Reading and recovering balls off the glass.' },
  { id: 'lobs', name: 'Lobs', category: 'finesse', description: 'Lob depth, disguise, and net transition.' },
  { id: 'footwork', name: 'Footwork', category: 'movement', description: 'Split step, backpedaling for lobs, court coverage.' },
  { id: 'doubles_tactics', name: 'Doubles Strategy', category: 'tactical', description: 'Partner spacing, positioning, and point construction.' },
  { id: 'mental_game', name: 'Mental Game', category: 'mental', description: 'Patience, tactical discipline, and pressure points.' },
  { id: 'match_play', name: 'Match Play', category: 'scoring', description: 'Results, closing sets, and competitive exposure.' },
];

const MISSING_DATA: MissingDataPromptDef[] = [
  { id: 'pd_bandeja_video', kind: 'video', branchKey: 'overheads', label: 'Upload a bandeja video', description: 'The bandeja is a top stage driver in padel.', href: '/diagnose', ctaLabel: 'Upload', priority: 90 },
  { id: 'pd_wall_video', kind: 'video', branchKey: 'wall_play', label: 'Upload a back-glass play video', description: 'Lets SwingVantage read your wall timing.', href: '/diagnose', ctaLabel: 'Upload', priority: 84 },
  { id: 'pd_volley_video', kind: 'video', branchKey: 'volleys', label: 'Upload a net volley video', description: 'Volleys hold the net you fight to win.', href: '/diagnose', ctaLabel: 'Upload', priority: 78 },
  { id: 'pd_log_matches', kind: 'competition_log', label: 'Log your last 3 matches', description: 'Match results sharpen your stage estimate the most.', href: '/sessions/import', ctaLabel: 'Log matches', priority: 84 },
  { id: 'pd_wall_bench', kind: 'benchmark', label: 'Complete a wall-read benchmark', description: 'A back-glass control test grounds your technique score.', href: '/retest', ctaLabel: 'Start benchmark', priority: 62 },
];

/** Padel has no universal numeric rating — stage is data-driven only. */
function padelRatingToOrder(_rating: PlayerRating): number | null {
  return null;
}

export const PADEL_CONFIG: SportJourneyConfig = {
  sport: 'padel',
  ratingLabel: 'Club / league rating (optional)',
  ratingType: null,
  secondaryRatingType: null,
  categories: ['scoring', 'technique', 'consistency', 'finesse', 'movement', 'tactical', 'practice', 'mental'],
  weights: {
    scoring: 0.2,
    technique: 0.25,
    finesse: 0.15,
    consistency: 0.1,
    movement: 0.1,
    tactical: 0.15,
    practice: 0.025,
    mental: 0.025,
  },
  stages: STAGES,
  branches: BRANCHES,
  missingDataPrompts: MISSING_DATA,
  ratingToStageOrder: padelRatingToOrder,
};
