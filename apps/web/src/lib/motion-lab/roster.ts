// ============================================================
// SwingVantage — Motion Lab: Coach / Team Roster (local-first)
// ------------------------------------------------------------
// A local-first roster so a coach or parent can group Motion Lab
// sessions by athlete and see per-athlete progress + team-level
// aggregates (common weaknesses, who hasn't uploaded lately).
//
// Storage: its OWN localStorage key for the athlete list; sessions are
// linked by an optional `athleteId` on the MotionSession (sessions
// without one are "Unassigned"). It NEVER touches the existing session
// store's shape beyond that optional field, and never throws.
//
// Privacy: everything stays on the device. "Athletes" are labels the
// coach types — no accounts, no server, no sharing unless exported.
//
// The pure aggregation (summarizeAthlete / buildCoachView) is unit-tested
// in __tests__/roster.test.ts; the storage helpers are SSR-safe wrappers.
// ============================================================

import type { MotionSession, MotionSessionSummary, SportId } from './types';
import { loadSessions, toSummary } from './persistence';

const ROSTER_KEY = 'swingiq-motion-roster-v1';
const STALE_DAYS = 14;

export interface Athlete {
  id: string;
  name: string;
  note?: string;
  /** Primary sport, optional. */
  sport?: SportId | null;
  createdAt: string;
}

export interface FaultCount {
  fault: string;
  count: number;
}

export interface AthleteSummary {
  athlete: Athlete;
  sessionCount: number;
  latest: MotionSessionSummary | null;
  averageOverall: number | null;
  bestOverall: number | null;
  /** ISO date of the most recent session, or null. */
  lastActiveAt: string | null;
  daysSinceActive: number | null;
  recurringFaults: FaultCount[];
  /** Oldest → newest overall scores. */
  trend: Array<{ date: string; overall: number }>;
  /** Improvement (latest − first), null when < 2 sessions. */
  improvement: number | null;
  /** True when the athlete hasn't uploaded recently or is trending down. */
  needsAttention: boolean;
}

export interface TeamReport {
  athleteCount: number;
  totalSessions: number;
  averageOverall: number | null;
  /** Most common key faults across the roster (latest session per athlete). */
  aggregateWeaknesses: FaultCount[];
  /** Athletes who uploaded within the last 7 days. */
  recentlyActiveCount: number;
  /** Athletes flagged needsAttention. */
  needsAttention: AthleteSummary[];
}

export interface CoachView {
  athletes: AthleteSummary[];
  team: TeamReport;
  /** Sessions not yet linked to an athlete. */
  unassigned: MotionSessionSummary[];
}

// ── Pure helpers ──────────────────────────────────────────────

function makeId(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  } catch {
    /* fall through */
  }
  return `ath_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function daysSince(iso: string, now: number): number {
  return Math.floor((now - new Date(iso).getTime()) / 86_400_000);
}

function countFaults(sessions: MotionSession[]): FaultCount[] {
  const map = new Map<string, number>();
  for (const s of sessions) {
    const f = (s.keyFault || '').trim();
    if (!f) continue;
    map.set(f, (map.get(f) ?? 0) + 1);
  }
  return [...map.entries()].map(([fault, count]) => ({ fault, count })).sort((a, b) => b.count - a.count);
}

/** Summarize one athlete from THEIR sessions (any order). Pure. */
export function summarizeAthlete(
  athlete: Athlete,
  sessions: MotionSession[],
  now: number = Date.now(),
): AthleteSummary {
  const sorted = [...sessions].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  const n = sorted.length;
  if (n === 0) {
    return {
      athlete,
      sessionCount: 0,
      latest: null,
      averageOverall: null,
      bestOverall: null,
      lastActiveAt: null,
      daysSinceActive: null,
      recurringFaults: [],
      trend: [],
      improvement: null,
      needsAttention: true, // no uploads yet
    };
  }
  const latest = sorted[n - 1];
  const overalls = sorted.map((s) => s.scoreboard.overall);
  const averageOverall = Math.round(overalls.reduce((s, x) => s + x, 0) / n);
  const bestOverall = Math.max(...overalls);
  const lastActiveAt = latest.createdAt;
  const dsa = daysSince(lastActiveAt, now);
  const improvement = n >= 2 ? overalls[n - 1] - overalls[0] : null;
  const trend = sorted.map((s) => ({ date: s.createdAt, overall: s.scoreboard.overall }));
  const needsAttention = dsa >= STALE_DAYS || (improvement != null && improvement <= -6);

  return {
    athlete,
    sessionCount: n,
    latest: toSummary(latest),
    averageOverall,
    bestOverall,
    lastActiveAt,
    daysSinceActive: dsa,
    recurringFaults: countFaults(sorted).slice(0, 3),
    trend,
    improvement,
    needsAttention,
  };
}

/** Join athletes with sessions and build the full coach view. Pure. */
export function buildCoachView(
  athletes: Athlete[],
  allSessions: MotionSession[],
  now: number = Date.now(),
): CoachView {
  const byAthlete = new Map<string, MotionSession[]>();
  const unassigned: MotionSession[] = [];
  for (const s of allSessions) {
    const id = s.athleteId;
    if (id) {
      const arr = byAthlete.get(id) ?? [];
      arr.push(s);
      byAthlete.set(id, arr);
    } else {
      unassigned.push(s);
    }
  }

  const summaries = athletes
    .map((a) => summarizeAthlete(a, byAthlete.get(a.id) ?? [], now))
    .sort((x, y) => (y.lastActiveAt ?? '').localeCompare(x.lastActiveAt ?? ''));

  const withSessions = summaries.filter((s) => s.sessionCount > 0);
  const totalSessions = summaries.reduce((sum, s) => sum + s.sessionCount, 0);
  const avgList = withSessions.map((s) => s.averageOverall!).filter((v) => v != null);
  const averageOverall = avgList.length ? Math.round(avgList.reduce((s, x) => s + x, 0) / avgList.length) : null;

  // Aggregate weaknesses = key fault of each athlete's LATEST session.
  const latestFaults = withSessions
    .map((s) => s.latest?.keyFault?.trim())
    .filter((f): f is string => !!f);
  const weaknessMap = new Map<string, number>();
  for (const f of latestFaults) weaknessMap.set(f, (weaknessMap.get(f) ?? 0) + 1);
  const aggregateWeaknesses = [...weaknessMap.entries()]
    .map(([fault, count]) => ({ fault, count }))
    .sort((a, b) => b.count - a.count);

  const recentlyActiveCount = withSessions.filter(
    (s) => s.daysSinceActive != null && s.daysSinceActive <= 7,
  ).length;

  return {
    athletes: summaries,
    team: {
      athleteCount: athletes.length,
      totalSessions,
      averageOverall,
      aggregateWeaknesses,
      recentlyActiveCount,
      needsAttention: summaries.filter((s) => s.needsAttention),
    },
    unassigned: unassigned
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map(toSummary),
  };
}

// ── Storage (SSR-safe, never throws) ──────────────────────────

export function loadAthletes(): Athlete[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(ROSTER_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((a): a is Athlete => !!a && typeof a.id === 'string' && typeof a.name === 'string');
  } catch {
    return [];
  }
}

function writeAthletes(list: Athlete[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ROSTER_KEY, JSON.stringify(list));
  } catch {
    /* storage full/unavailable — ignore */
  }
}

/** Create an athlete. Returns the new record (or null off-DOM). */
export function addAthlete(name: string, opts: { note?: string; sport?: SportId | null } = {}): Athlete | null {
  const clean = name.trim();
  if (!clean) return null;
  const athlete: Athlete = {
    id: makeId(),
    name: clean.slice(0, 60),
    note: opts.note?.slice(0, 280),
    sport: opts.sport ?? null,
    createdAt: new Date().toISOString(),
  };
  writeAthletes([...loadAthletes(), athlete]);
  return athlete;
}

export function updateAthlete(id: string, patch: Partial<Pick<Athlete, 'name' | 'note' | 'sport'>>): void {
  const next = loadAthletes().map((a) =>
    a.id === id
      ? { ...a, ...patch, name: (patch.name ?? a.name).trim().slice(0, 60) || a.name }
      : a,
  );
  writeAthletes(next);
}

/** Delete an athlete. Their sessions stay (they become Unassigned). */
export function deleteAthlete(id: string): void {
  writeAthletes(loadAthletes().filter((a) => a.id !== id));
}

/** Read the current coach view from local storage. */
export function loadCoachView(now: number = Date.now()): CoachView {
  return buildCoachView(loadAthletes(), loadSessions(), now);
}
