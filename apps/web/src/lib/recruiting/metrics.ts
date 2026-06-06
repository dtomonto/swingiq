// ============================================================
// Player Recruiting Hub — sport metric catalog
// ------------------------------------------------------------
// The canonical list of measurable metrics per sport, with units,
// direction (higher-is-better), and grouping. The data dashboard,
// radar chart, and benchmark comparison all read from this catalog
// so a metric is defined in exactly one place.
//
// Reference bands in benchmarks.ts are keyed by these `key`s.
// ============================================================

import type { SportId } from '@swingiq/core';

export type MetricGroup =
  | 'hitting'
  | 'fielding'
  | 'throwing'
  | 'pitching'
  | 'athletic'
  | 'scoring'
  | 'driving'
  | 'approach'
  | 'short_game'
  | 'serve'
  | 'groundstroke'
  | 'movement'
  | 'results';

export interface MetricDef {
  key: string;
  label: string;
  unit: string;
  /** Which sports this metric applies to. */
  sports: SportId[];
  group: MetricGroup;
  /** True when a larger number is better (drives benchmark percentile direction). */
  higherIsBetter: boolean;
  /** Optional short help shown under the field. */
  hint?: string;
}

const BASEBALL_SOFTBALL: SportId[] = ['baseball', 'softball_fast', 'softball_slow'];
const ALL_SOFTBALL: SportId[] = ['softball_fast', 'softball_slow'];

export const METRIC_CATALOG: MetricDef[] = [
  // ── Baseball / Softball — hitting ──
  { key: 'exit_velocity', label: 'Exit velocity', unit: 'mph', sports: BASEBALL_SOFTBALL, group: 'hitting', higherIsBetter: true, hint: 'Ball speed off the bat (max or avg).' },
  { key: 'bat_speed', label: 'Bat speed', unit: 'mph', sports: BASEBALL_SOFTBALL, group: 'hitting', higherIsBetter: true },
  { key: 'attack_angle', label: 'Attack angle', unit: '°', sports: BASEBALL_SOFTBALL, group: 'hitting', higherIsBetter: true },
  { key: 'launch_angle', label: 'Launch angle', unit: '°', sports: BASEBALL_SOFTBALL, group: 'hitting', higherIsBetter: true },
  { key: 'hard_hit_rate', label: 'Hard-hit rate', unit: '%', sports: BASEBALL_SOFTBALL, group: 'hitting', higherIsBetter: true },
  { key: 'contact_rate', label: 'Contact rate', unit: '%', sports: BASEBALL_SOFTBALL, group: 'hitting', higherIsBetter: true },
  { key: 'batting_avg', label: 'Batting average', unit: '', sports: BASEBALL_SOFTBALL, group: 'hitting', higherIsBetter: true },
  { key: 'on_base_pct', label: 'On-base %', unit: '', sports: BASEBALL_SOFTBALL, group: 'hitting', higherIsBetter: true },
  { key: 'slugging_pct', label: 'Slugging %', unit: '', sports: BASEBALL_SOFTBALL, group: 'hitting', higherIsBetter: true },
  // ── Baseball / Softball — athletic / running ──
  { key: 'sixty_yard', label: '60-yard dash', unit: 's', sports: ['baseball'], group: 'athletic', higherIsBetter: false },
  { key: 'home_to_first', label: 'Home-to-first', unit: 's', sports: BASEBALL_SOFTBALL, group: 'athletic', higherIsBetter: false },
  // ── Baseball / Softball — throwing / fielding ──
  { key: 'throwing_velocity', label: 'Throwing velocity', unit: 'mph', sports: BASEBALL_SOFTBALL, group: 'throwing', higherIsBetter: true },
  { key: 'pop_time', label: 'Pop time (catcher)', unit: 's', sports: BASEBALL_SOFTBALL, group: 'throwing', higherIsBetter: false },
  // ── Baseball / Softball — pitching ──
  { key: 'pitch_velocity', label: 'Pitch velocity', unit: 'mph', sports: BASEBALL_SOFTBALL, group: 'pitching', higherIsBetter: true },
  { key: 'spin_rate', label: 'Spin rate', unit: 'rpm', sports: BASEBALL_SOFTBALL, group: 'pitching', higherIsBetter: true },
  { key: 'strike_pct', label: 'Strike %', unit: '%', sports: BASEBALL_SOFTBALL, group: 'pitching', higherIsBetter: true },
  { key: 'era', label: 'ERA', unit: '', sports: BASEBALL_SOFTBALL, group: 'pitching', higherIsBetter: false },

  // ── Golf — scoring ──
  { key: 'handicap', label: 'Handicap index', unit: '', sports: ['golf'], group: 'scoring', higherIsBetter: false },
  { key: 'scoring_average', label: 'Scoring average', unit: '', sports: ['golf'], group: 'scoring', higherIsBetter: false },
  { key: 'tournament_scoring', label: 'Tournament scoring avg', unit: '', sports: ['golf'], group: 'scoring', higherIsBetter: false },
  // ── Golf — driving ──
  { key: 'driver_carry', label: 'Driver carry', unit: 'yds', sports: ['golf'], group: 'driving', higherIsBetter: true },
  { key: 'ball_speed', label: 'Ball speed', unit: 'mph', sports: ['golf'], group: 'driving', higherIsBetter: true },
  { key: 'club_speed', label: 'Club speed', unit: 'mph', sports: ['golf'], group: 'driving', higherIsBetter: true },
  { key: 'smash_factor', label: 'Smash factor', unit: '', sports: ['golf'], group: 'driving', higherIsBetter: true },
  { key: 'golf_launch_angle', label: 'Launch angle', unit: '°', sports: ['golf'], group: 'driving', higherIsBetter: true },
  { key: 'golf_spin_rate', label: 'Spin rate', unit: 'rpm', sports: ['golf'], group: 'driving', higherIsBetter: true },
  { key: 'dispersion', label: 'Dispersion', unit: 'yds', sports: ['golf'], group: 'driving', higherIsBetter: false },
  // ── Golf — approach / scoring stats ──
  { key: 'gir', label: 'Greens in regulation', unit: '%', sports: ['golf'], group: 'approach', higherIsBetter: true },
  { key: 'fairways_hit', label: 'Fairways hit', unit: '%', sports: ['golf'], group: 'approach', higherIsBetter: true },
  { key: 'proximity', label: 'Proximity to hole', unit: 'ft', sports: ['golf'], group: 'approach', higherIsBetter: false },
  // ── Golf — short game ──
  { key: 'scrambling', label: 'Scrambling', unit: '%', sports: ['golf'], group: 'short_game', higherIsBetter: true },
  { key: 'putting_average', label: 'Putts per round', unit: '', sports: ['golf'], group: 'short_game', higherIsBetter: false },
  { key: 'strokes_gained', label: 'Strokes gained (total)', unit: '', sports: ['golf'], group: 'short_game', higherIsBetter: true },

  // ── Tennis — rating / results ──
  { key: 'rating', label: 'Rating (UTR/NTRP/etc.)', unit: '', sports: ['tennis'], group: 'results', higherIsBetter: true },
  { key: 'win_pct', label: 'Win %', unit: '%', sports: ['tennis'], group: 'results', higherIsBetter: true },
  // ── Tennis — serve ──
  { key: 'serve_speed', label: 'Serve speed', unit: 'mph', sports: ['tennis'], group: 'serve', higherIsBetter: true },
  { key: 'first_serve_pct', label: 'First-serve %', unit: '%', sports: ['tennis'], group: 'serve', higherIsBetter: true },
  { key: 'second_serve_won', label: '2nd-serve points won', unit: '%', sports: ['tennis'], group: 'serve', higherIsBetter: true },
  // ── Tennis — groundstrokes / movement ──
  { key: 'forehand_consistency', label: 'Forehand consistency', unit: '%', sports: ['tennis'], group: 'groundstroke', higherIsBetter: true },
  { key: 'backhand_consistency', label: 'Backhand consistency', unit: '%', sports: ['tennis'], group: 'groundstroke', higherIsBetter: true },
  { key: 'rally_tolerance', label: 'Rally tolerance', unit: 'shots', sports: ['tennis'], group: 'groundstroke', higherIsBetter: true },
];

const BY_KEY = new Map(METRIC_CATALOG.map((m) => [m.key, m]));

export function getMetricDef(key: string): MetricDef | undefined {
  return BY_KEY.get(key);
}

/** Metrics that apply to a sport, in catalog order. */
export function metricsForSport(sport: SportId): MetricDef[] {
  return METRIC_CATALOG.filter((m) => m.sports.includes(sport));
}

/** Metrics for a sport grouped by their `group`, preserving catalog order. */
export function groupedMetricsForSport(sport: SportId): { group: MetricGroup; metrics: MetricDef[] }[] {
  const out: { group: MetricGroup; metrics: MetricDef[] }[] = [];
  for (const m of metricsForSport(sport)) {
    let bucket = out.find((b) => b.group === m.group);
    if (!bucket) {
      bucket = { group: m.group, metrics: [] };
      out.push(bucket);
    }
    bucket.metrics.push(m);
  }
  return out;
}

export const METRIC_GROUP_LABEL: Record<MetricGroup, string> = {
  hitting: 'Hitting',
  fielding: 'Fielding',
  throwing: 'Throwing & arm',
  pitching: 'Pitching',
  athletic: 'Athleticism',
  scoring: 'Scoring',
  driving: 'Driving / ball striking',
  approach: 'Approach',
  short_game: 'Short game',
  serve: 'Serve',
  groundstroke: 'Groundstrokes',
  movement: 'Movement',
  results: 'Results',
};
