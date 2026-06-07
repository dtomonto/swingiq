// ============================================================
// Player Recruiting Hub — platform import bridge (pure)
// ------------------------------------------------------------
// The "intelligence layer" link: turns the athlete's EXISTING
// SwingVantage data (main `swingiq-store`) into a recruiting head
// start. Launch-monitor numbers from real sessions import as
// `device_imported` (verified) — exactly the kind of data coaches
// trust — while user-entered figures (handicap, scoring average)
// import honestly as `self_reported`.
//
// Pure + decoupled: the component reads the main store and passes a
// minimal typed payload in, so this stays framework-free + testable.
// ============================================================

import type { SportId } from '@swingiq/core';
import type { DataSource } from './types';
import { getMetricDef } from './metrics';

export interface PlatformShot {
  clubCategory: string;
  ballSpeed: number | null;
  carryDistance: number | null;
  clubSpeed: number | null;
  smashFactor: number | null;
  launchAngle: number | null;
  spinRate: number | null;
}

export interface PlatformSession {
  sport: SportId;
  shots: PlatformShot[];
}

export interface PlatformImportData {
  name?: string;
  handedness?: 'right' | 'left';
  handicap?: number | null;
  scoringAverage?: number | null;
  sessions: PlatformSession[];
  /** Count of existing SwingVantage video analyses (context only). */
  analysisCount?: number;
}

export interface PlatformMetricImport {
  metricKey: string;
  sport: SportId;
  value: number;
  unit: string;
  source: DataSource;
}

export interface PlatformImportResult {
  available: boolean;
  profilePatch: { athleteName?: string; primarySport?: SportId; dominantHand?: 'right' | 'left' };
  golfSportPatch?: { handicap?: number | null; scoringAverage?: number | null };
  metrics: PlatformMetricImport[];
  notes: string[];
}

const num = (xs: (number | null | undefined)[]): number[] =>
  xs.filter((x): x is number => typeof x === 'number' && Number.isFinite(x));

const maxOf = (xs: number[]): number | null => (xs.length ? Math.max(...xs) : null);
const median = (xs: number[]): number | null => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};
const round = (v: number, dp = 0): number => {
  const f = 10 ** dp;
  return Math.round(v * f) / f;
};

function unitFor(key: string): string {
  return getMetricDef(key)?.unit ?? '';
}

/** Which sport has the most sessions (drives the suggested primary sport). */
function dominantSport(sessions: PlatformSession[]): SportId | undefined {
  if (!sessions.length) return undefined;
  const counts = new Map<SportId, number>();
  for (const s of sessions) counts.set(s.sport, (counts.get(s.sport) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
}

export function buildPlatformImport(data: PlatformImportData): PlatformImportResult {
  const metrics: PlatformMetricImport[] = [];
  const notes: string[] = [];
  const primarySport = dominantSport(data.sessions) ?? 'golf';

  const profilePatch: PlatformImportResult['profilePatch'] = {};
  if (data.name?.trim()) profilePatch.athleteName = data.name.trim();
  if (primarySport) profilePatch.primarySport = primarySport;
  if (data.handedness) profilePatch.dominantHand = data.handedness;

  // ── Golf launch-monitor metrics (device verified) ──
  const golfDriverShots = data.sessions
    .filter((s) => s.sport === 'golf')
    .flatMap((s) => s.shots)
    .filter((sh) => sh.clubCategory === 'driver');

  if (golfDriverShots.length) {
    const ballSpeed = maxOf(num(golfDriverShots.map((s) => s.ballSpeed)));
    const clubSpeed = maxOf(num(golfDriverShots.map((s) => s.clubSpeed)));
    const smash = maxOf(num(golfDriverShots.map((s) => s.smashFactor)));
    const carry = maxOf(num(golfDriverShots.map((s) => s.carryDistance)));
    const launch = median(num(golfDriverShots.map((s) => s.launchAngle)));
    const spin = median(num(golfDriverShots.map((s) => s.spinRate)));

    const push = (key: string, value: number | null, dp = 0) => {
      if (value == null) return;
      metrics.push({ metricKey: key, sport: 'golf', value: round(value, dp), unit: unitFor(key), source: 'device_imported' });
    };
    push('driver_carry', carry);
    push('ball_speed', ballSpeed, 1);
    push('club_speed', clubSpeed, 1);
    push('smash_factor', smash, 2);
    push('golf_launch_angle', launch, 1);
    push('golf_spin_rate', spin);

    if (metrics.length) notes.push(`${metrics.length} verified launch-monitor metric(s) from your driver sessions.`);
  }

  // ── User-entered golf figures (self-reported) ──
  const golfSportPatch: { handicap?: number | null; scoringAverage?: number | null } = {};
  if (typeof data.handicap === 'number') {
    golfSportPatch.handicap = data.handicap;
    metrics.push({ metricKey: 'handicap', sport: 'golf', value: data.handicap, unit: unitFor('handicap'), source: 'self_reported' });
  }
  if (typeof data.scoringAverage === 'number') {
    golfSportPatch.scoringAverage = data.scoringAverage;
    metrics.push({ metricKey: 'scoring_average', sport: 'golf', value: data.scoringAverage, unit: unitFor('scoring_average'), source: 'self_reported' });
  }

  if (data.analysisCount && data.analysisCount > 0) {
    notes.push(`You have ${data.analysisCount} SwingVantage analysis session(s) — add your best as film for coaches.`);
  }

  return {
    available: !!profilePatch.athleteName || metrics.length > 0,
    profilePatch,
    golfSportPatch: Object.keys(golfSportPatch).length ? golfSportPatch : undefined,
    metrics,
    notes,
  };
}
