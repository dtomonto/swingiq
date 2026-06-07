// ============================================================
// SwingVantage — Athletic Journey: Tennis configuration
// ------------------------------------------------------------
// All 11 tennis stages (T0–T10), skill branches, classification
// weighting, missing-data prompts, and the optional UTR / USTA-NTRP
// guideposts. Ratings are ONE input, never the sole determinant.
// Official scales: UTR 1.00–16.50; USTA NTRP 1.5–7.0.
// ============================================================

import type {
  PlayerRating,
  SportJourneyConfig,
  StageDefinition,
  SkillBranchDef,
  MissingDataPromptDef,
} from '../types';

const anchors = (utr: string, ntrp: string) => [
  { ratingType: 'utr' as const, label: utr },
  { ratingType: 'ntrp' as const, label: ntrp },
];

const STAGES: StageDefinition[] = [
  {
    code: 'T0',
    order: 0,
    name: 'New Tennis Player',
    tier: 'foundation',
    description:
      'Learning basic contact, grip, stance, swing shape, rallying, serve motion, movement, and ' +
      'scoring.',
    anchors: anchors('No rating or 1.00–2.00', 'No rating or 1.5'),
    primaryGoals: ['Make clean contact', 'Learn grips', 'Learn rally basics', 'Learn the serve motion', 'Learn scoring & build confidence'],
    commonWeaknesses: ['Inconsistent contact', 'Unsure grips', 'No serve motion yet'],
    unlockCriteria: [
      { id: 't0_contact', label: 'Make clean contact on most feeds', category: 'technique' },
      { id: 't0_rally', label: 'Sustain a short cooperative rally', category: 'consistency' },
      { id: 't0_upload', label: 'Upload your first forehand video', category: 'technique' },
    ],
    milestoneTemplates: [
      { id: 't0_first_video', name: 'First stroke on film', description: 'Upload your first forehand video.', category: 'technique' },
      { id: 't0_first_session', name: 'First practice logged', description: 'Complete and log your first practice session.', category: 'practice' },
    ],
  },
  {
    code: 'T1',
    order: 1,
    name: 'Beginner Tennis Player',
    tier: 'foundation',
    description:
      'Can rally briefly but lacks consistency, serve reliability, footwork, and directional control.',
    anchors: anchors('1.00–3.00', '1.5–2.0'),
    primaryGoals: ['Build rally tolerance', 'Improve serve consistency', 'Improve basic footwork', 'Learn the recovery position', 'Reduce unforced errors'],
    commonWeaknesses: ['Short rally tolerance', 'Unreliable serve', 'Late footwork'],
    unlockCriteria: [
      { id: 't1_rally', label: 'Rally 6+ balls cooperatively', category: 'consistency' },
      { id: 't1_serve_in', label: 'Land most first serves in play', metric: 'first_serve_pct', targetValue: 45, comparator: 'gte', unit: '%', category: 'finesse' },
      { id: 't1_matches', label: 'Log your first 3 matches or sets', metric: 'matches_logged', targetValue: 3, comparator: 'gte', unit: 'matches', category: 'scoring' },
    ],
    milestoneTemplates: [
      { id: 't1_log_3_matches', name: 'Log first 3 matches', description: 'Record three matches or practice sets.', category: 'scoring', metric: 'matches_logged', targetValue: 3, comparator: 'gte', unit: 'matches' },
      { id: 't1_rally_bench', name: 'Rally consistency benchmark', description: 'Complete a crosscourt rally tolerance test.', category: 'consistency' },
    ],
  },
  {
    code: 'T2',
    order: 2,
    name: 'Recreational Player',
    tier: 'developing',
    description:
      'Can play points but with inconsistent depth, spin, movement, serve placement, and recovery.',
    anchors: anchors('2.50–4.00', '2.5'),
    primaryGoals: ['Rally with more depth', 'Improve the second serve', 'Improve return consistency', 'Build basic tactics', 'Reduce errors under pressure'],
    commonWeaknesses: ['Shallow rally depth', 'Weak second serve', 'Inconsistent returns'],
    unlockCriteria: [
      { id: 't2_depth', label: 'Rally 10 balls with depth at 70% success', metric: 'rally_tolerance', targetValue: 10, comparator: 'gte', unit: 'balls', category: 'consistency' },
      { id: 't2_double_faults', label: 'Reduce double faults below 5 per match', metric: 'double_faults_per_match', targetValue: 5, comparator: 'lte', unit: '/match', category: 'finesse' },
      { id: 't2_videos', label: 'Upload forehand, backhand, and serve videos', category: 'technique' },
    ],
    milestoneTemplates: [
      { id: 't2_stroke_videos', name: 'Core strokes on film', description: 'Upload forehand, backhand, serve, and return.', category: 'technique' },
      { id: 't2_second_serve', name: 'Reliable second serve', description: 'Complete a second-serve consistency session.', category: 'finesse' },
    ],
  },
  {
    code: 'T3',
    order: 3,
    name: 'Improving Club Player',
    tier: 'developing',
    description:
      'Can sustain rallies and understands basic tactics, but breaks down under pace, movement, or ' +
      'pressure.',
    anchors: anchors('3.50–5.50', '3.0'),
    primaryGoals: ['Build reliable patterns', 'Improve serve-plus-one', 'Improve return depth', 'Improve movement efficiency', 'Compete more consistently'],
    commonWeaknesses: ['Breaks down under pace', 'Pressure errors', 'Recovery after wide balls'],
    unlockCriteria: [
      { id: 't3_first_serve', label: 'Raise first-serve percentage to 55%+', metric: 'first_serve_pct', targetValue: 55, comparator: 'gte', unit: '%', category: 'finesse' },
      { id: 't3_double_faults', label: 'Reduce double faults below 3 per match', metric: 'double_faults_per_match', targetValue: 3, comparator: 'lte', unit: '/match', category: 'finesse' },
      { id: 't3_rally', label: 'Rally 10 balls neutral at 70% success', metric: 'rally_tolerance', targetValue: 10, comparator: 'gte', unit: 'balls', category: 'consistency' },
    ],
    milestoneTemplates: [
      { id: 't3_serve_sessions', name: '5 serve-pattern sessions', description: 'Complete five serve-plus-one sessions.', category: 'finesse' },
      { id: 't3_first_win', name: 'Win a competitive match', description: 'Win a league or ladder match.', category: 'scoring' },
    ],
  },
  {
    code: 'T4',
    order: 4,
    name: 'Competitive Club / League Player',
    tier: 'competent',
    description:
      'Has reliable patterns, better serve/return structure, and developing weapons.',
    anchors: anchors('5.00–7.00', '3.5'),
    primaryGoals: ['Improve tactical point construction', 'Build a stronger second serve', 'Improve the transition game', 'Improve defensive recovery', 'Reduce errors in neutral rallies'],
    commonWeaknesses: ['Neutral-rally errors', 'Transition game', 'Second-serve pressure'],
    unlockCriteria: [
      { id: 't4_second_serve_won', label: 'Win 45%+ of second-serve points', metric: 'second_serve_points_won_pct', targetValue: 45, comparator: 'gte', unit: '%', category: 'finesse' },
      { id: 't4_matches', label: 'Log a block of competitive matches', metric: 'matches_logged', targetValue: 8, comparator: 'gte', unit: 'matches', category: 'scoring' },
      { id: 't4_patterns', label: 'Build reliable serve-plus-one patterns', category: 'tactical' },
    ],
    milestoneTemplates: [
      { id: 't4_league_win', name: 'Win a league match', description: 'Record a league or ladder win.', category: 'scoring' },
      { id: 't4_transition', name: 'Transition-game session', description: 'Complete an approach-and-volley pattern session.', category: 'technique' },
    ],
  },
  {
    code: 'T5',
    order: 5,
    name: 'Advanced League Player',
    tier: 'competent',
    description:
      'Can generate pace and spin, defend well, construct points, and compete in structured leagues.',
    anchors: anchors('6.50–8.50', '4.0'),
    primaryGoals: ['Strengthen weapons', 'Improve return games', 'Improve pressure-point execution', 'Develop match plans', 'Improve physical repeatability'],
    commonWeaknesses: ['Return games', 'Pressure-point execution', 'Physical repeatability'],
    unlockCriteria: [
      { id: 't5_return_won', label: 'Win 35%+ of return points', metric: 'return_points_won_pct', targetValue: 35, comparator: 'gte', unit: '%', category: 'finesse' },
      { id: 't5_break_points', label: 'Convert break points reliably', metric: 'break_point_conversion_pct', targetValue: 40, comparator: 'gte', unit: '%', category: 'mental' },
      { id: 't5_match_plan', label: 'Execute a written match plan', category: 'tactical' },
    ],
    milestoneTemplates: [
      { id: 't5_weapon', name: 'Establish a weapon', description: 'Build one reliable point-ending shot.', category: 'technique' },
      { id: 't5_tournament', name: 'Enter a tournament', description: 'Log a tournament match result.', category: 'scoring', metric: 'matches_logged', targetValue: 12, comparator: 'gte', unit: 'matches' },
    ],
  },
  {
    code: 'T6',
    order: 6,
    name: 'High-Performance / Tournament Player',
    tier: 'advanced',
    description:
      'Has strong weapons, tactical maturity, conditioning, and competitive match experience.',
    anchors: anchors('8.00–10.00', '4.5'),
    primaryGoals: ['Improve weapon reliability', 'Improve serve locations', 'Improve return aggression', 'Build advanced patterns', 'Increase tournament exposure'],
    commonWeaknesses: ['Serve-location precision', 'Return aggression', 'Pattern variety'],
    unlockCriteria: [
      { id: 't6_first_serve', label: 'Sustain 60%+ first serves with locations', metric: 'first_serve_pct', targetValue: 60, comparator: 'gte', unit: '%', category: 'finesse' },
      { id: 't6_events', label: 'Build tournament exposure', metric: 'matches_logged', targetValue: 20, comparator: 'gte', unit: 'matches', category: 'competitive' },
    ],
    milestoneTemplates: [
      { id: 't6_tournament_win', name: 'Win a tournament match', description: 'Record a tournament win.', category: 'scoring' },
      { id: 't6_patterns', name: 'Advanced pattern library', description: 'Document a set of opponent-specific patterns.', category: 'tactical' },
    ],
  },
  {
    code: 'T7',
    order: 7,
    name: 'Elite Club / Open-Level Player',
    tier: 'advanced',
    description:
      'Can compete in open events, high-level leagues, and against former college-level players.',
    anchors: anchors('9.50–11.50', '5.0'),
    primaryGoals: ['Improve high-pressure execution', 'Improve transition offense', 'Improve defensive-to-offensive conversion', 'Build elite physical preparation', 'Track match analytics'],
    commonWeaknesses: ['High-pressure execution', 'Defense-to-offense conversion', 'Analytics tracking'],
    unlockCriteria: [
      { id: 't7_open', label: 'Compete in open-level events', metric: 'matches_logged', targetValue: 30, comparator: 'gte', unit: 'matches', category: 'competitive' },
      { id: 't7_pressure', label: 'Win pressure points at a high rate', metric: 'break_point_conversion_pct', targetValue: 45, comparator: 'gte', unit: '%', category: 'mental' },
    ],
    milestoneTemplates: [
      { id: 't7_open_result', name: 'Open-level result', description: 'Record a result in an open event.', category: 'competitive' },
      { id: 't7_analytics', name: 'Match analytics tracking', description: 'Track serve/return analytics across matches.', category: 'tactical' },
    ],
  },
  {
    code: 'T8',
    order: 8,
    name: 'Collegiate / High-Level Amateur',
    tier: 'elite',
    description:
      'Has advanced patterns, physicality, weapons, match discipline, and tournament experience.',
    anchors: anchors('11.00–13.00', '5.5–6.0'),
    primaryGoals: ['Improve match-plan adaptability', 'Improve high-level serve/return patterns', 'Improve physical durability', 'Build tournament blocks', 'Develop opponent-specific strategy'],
    commonWeaknesses: ['Match-plan adaptability', 'Durability across blocks', 'Elite return patterns'],
    unlockCriteria: [
      { id: 't8_results', label: 'Sustain collegiate-level results', metric: 'matches_logged', targetValue: 40, comparator: 'gte', unit: 'matches', category: 'competitive' },
      { id: 't8_durability', label: 'Compete across a tournament block', category: 'movement' },
    ],
    milestoneTemplates: [
      { id: 't8_block', name: 'Complete a tournament block', description: 'Compete through a multi-event block.', category: 'competitive' },
      { id: 't8_opponent_plan', name: 'Opponent-specific strategy', description: 'Build and execute opponent-specific plans.', category: 'tactical' },
    ],
  },
  {
    code: 'T9',
    order: 9,
    name: 'Elite Amateur / Professional-Track',
    tier: 'elite',
    description:
      'Competes at elite amateur, college, ITF, futures, or pro-development levels. Judged primarily ' +
      'by verified results.',
    anchors: anchors('12.50–14.50', '6.0–6.5'),
    primaryGoals: ['Improve tournament results', 'Improve elite serve/return metrics', 'Improve pressure conversion', 'Build professional training structure', 'Improve travel performance'],
    commonWeaknesses: ['Result variance', 'Travel performance', 'Pressure conversion'],
    unlockCriteria: [
      { id: 't9_results', label: 'Sustain elite competitive results', metric: 'matches_logged', targetValue: 60, comparator: 'gte', unit: 'matches', category: 'competitive' },
      { id: 't9_structure', label: 'Operate a professional training structure', category: 'practice' },
    ],
    milestoneTemplates: [
      { id: 't9_itf', name: 'ITF / pro-development result', description: 'Record a result at a pro-development event.', category: 'competitive' },
      { id: 't9_structure', name: 'Professional training structure', description: 'Run a periodised pro-level training block.', category: 'practice' },
    ],
  },
  {
    code: 'T10',
    order: 10,
    name: 'Professional Player',
    tier: 'professional',
    description:
      'Assessed primarily through verified competitive results, tournament level, match outcomes, ' +
      'and professional status — never self-report or stroke speed alone.',
    anchors: anchors('14.00–16.50', '7.0'),
    primaryGoals: ['Maximize serve/return metrics', 'Win at the highest level entered', 'Operate a professional team', 'Sustain results across the season'],
    commonWeaknesses: ['Marginal gains under scrutiny', 'Season durability'],
    unlockCriteria: [
      { id: 't10_verified', label: 'Verified professional competitive results', category: 'competitive' },
    ],
    milestoneTemplates: [
      { id: 't10_pro_result', name: 'Professional result', description: 'Record a verified professional result.', category: 'competitive' },
    ],
  },
];

const BRANCHES: SkillBranchDef[] = [
  { id: 'forehand', name: 'Forehand', category: 'technique', description: 'Consistency, depth, spin, and direction.' },
  { id: 'backhand', name: 'Backhand', category: 'technique', description: 'Consistency, depth, spin, and direction.' },
  { id: 'serve', name: 'Serve', category: 'finesse', description: 'First/second serve reliability, placement, spin.' },
  { id: 'return', name: 'Return', category: 'finesse', description: 'Return depth, consistency, and aggression.' },
  { id: 'movement', name: 'Movement', category: 'movement', description: 'Split-step, first step, and recovery.' },
  { id: 'net_game', name: 'Net Game', category: 'technique', description: 'Volleys, overheads, and transition.' },
  { id: 'tactics', name: 'Tactics', category: 'tactical', description: 'Patterns, shot selection, and adaptability.' },
  { id: 'match_play', name: 'Match Play', category: 'scoring', description: 'Results, closing sets, and break points.' },
  { id: 'mental_game', name: 'Mental Game', category: 'mental', description: 'Pressure points, focus, and resilience.' },
  { id: 'physical_readiness', name: 'Physical Readiness', category: 'movement', description: 'Stamina, deceleration, and durability.' },
];

const MISSING_DATA: MissingDataPromptDef[] = [
  { id: 'tennis_utr', kind: 'rating', ratingType: 'utr', label: 'Add your current UTR', description: 'Optional — used as one guidepost (UTR 1.00–16.50).', href: '/journey?panel=rating', ctaLabel: 'Add UTR', priority: 70 },
  { id: 'tennis_ntrp', kind: 'rating', ratingType: 'ntrp', label: 'Add your current USTA/NTRP rating', description: 'Optional — used as one guidepost (NTRP 1.5–7.0).', href: '/journey?panel=rating', ctaLabel: 'Add NTRP', priority: 66 },
  { id: 'tennis_forehand_video', kind: 'video', branchKey: 'forehand', label: 'Upload a forehand video', description: 'Lets SwingVantage read your stroke technique.', href: '/diagnose', ctaLabel: 'Upload', priority: 88 },
  { id: 'tennis_backhand_video', kind: 'video', branchKey: 'backhand', label: 'Upload a backhand video', description: 'Completes your groundstroke picture.', href: '/diagnose', ctaLabel: 'Upload', priority: 80 },
  { id: 'tennis_serve_video', kind: 'video', branchKey: 'serve', label: 'Upload a serve video', description: 'Serve reliability is a top stage driver.', href: '/diagnose', ctaLabel: 'Upload', priority: 90 },
  { id: 'tennis_log_matches', kind: 'competition_log', label: 'Log your last 3 matches', description: 'Match results sharpen your stage estimate the most.', href: '/sessions/import', ctaLabel: 'Log matches', priority: 86 },
  { id: 'tennis_rally_bench', kind: 'benchmark', label: 'Complete a rally consistency benchmark', description: 'A crosscourt rally test grounds your consistency score.', href: '/retest', ctaLabel: 'Start benchmark', priority: 64 },
];

/** Map an optional UTR or NTRP rating to an approximate stage order (guidepost). */
function tennisRatingToOrder(rating: PlayerRating): number | null {
  const v = rating.value;
  if (!Number.isFinite(v)) return null;
  if (rating.ratingType === 'utr') {
    if (v < 2.0) return 0;
    if (v < 2.75) return 1;
    if (v < 3.9) return 2;
    if (v < 5.25) return 3;
    if (v < 6.75) return 4;
    if (v < 8.25) return 5;
    if (v < 9.75) return 6;
    if (v < 11.25) return 7;
    if (v < 12.75) return 8;
    if (v < 14.25) return 9;
    return 10;
  }
  if (rating.ratingType === 'ntrp') {
    if (v < 2.25) return 1;
    if (v < 2.75) return 2;
    if (v < 3.25) return 3;
    if (v < 3.75) return 4;
    if (v < 4.25) return 5;
    if (v < 4.75) return 6;
    if (v < 5.25) return 7;
    if (v < 5.75) return 8;
    if (v < 6.75) return 9;
    return 10;
  }
  return null;
}

export const TENNIS_CONFIG: SportJourneyConfig = {
  sport: 'tennis',
  ratingLabel: 'UTR (optional)',
  ratingType: 'utr',
  secondaryRatingType: 'ntrp',
  categories: ['scoring', 'technique', 'consistency', 'finesse', 'movement', 'tactical', 'practice', 'mental'],
  weights: {
    scoring: 0.25,
    technique: 0.25,
    finesse: 0.15,
    movement: 0.15,
    tactical: 0.1,
    practice: 0.05,
    mental: 0.05,
  },
  stages: STAGES,
  branches: BRANCHES,
  missingDataPrompts: MISSING_DATA,
  ratingToStageOrder: tennisRatingToOrder,
};
