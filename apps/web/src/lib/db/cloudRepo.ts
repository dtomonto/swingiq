// ============================================================
// SwingVantage — Relational cloud repository
//
// Two operations against the Supabase relational tables:
//
//   • loadAll(userId)      — fetch every row the user owns and assemble
//                            it back into a store-shaped snapshot.
//   • reconcile(state)     — diff the current store against what we last
//                            wrote and push the MINIMAL set of inserts /
//                            updates / deletes. Each entity is a real row,
//                            so this is true relational persistence (not a
//                            blob), while still being cheap on every change.
//
// The store stays the working copy + offline cache (localStorage); this
// module makes the account the source of truth and keeps both in step.
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type { SwingVantageState } from '@/store';
import {
  DEFAULT_SETTINGS, DEFAULT_SPORT_EQUIPMENT, DEFAULT_TRAINING,
  DEFAULT_AGENT_STATE, DEFAULT_COMMUNITY_STATE, DEFAULT_TUTORIAL_PROGRESS,
} from '@/store';
import * as P from './projection';
import type { Row } from './projection';

/** Every table the relational sync owns (children before parents for deletes). */
export const ALL_TABLES = [
  'shots', 'sessions', 'clubs', 'tennis_rackets', 'baseball_bats', 'softball_bats',
  'video_analyses', 'sport_profiles', 'golfer_profiles', 'training_progress',
  'app_settings', 'community_state', 'tutorial_progress', 'agent_state',
] as const;

/** Build a complete store state from a partial load, filling absent domains. */
export function fillDefaults(partial: Partial<SwingVantageState>): SwingVantageState {
  return {
    profile: partial.profile ?? null,
    sportProfiles: partial.sportProfiles ?? {},
    clubs: partial.clubs ?? [],
    sportEquipment: partial.sportEquipment ?? DEFAULT_SPORT_EQUIPMENT,
    sessions: partial.sessions ?? [],
    video_analyses: partial.video_analyses ?? [],
    training: partial.training ?? DEFAULT_TRAINING,
    settings: partial.settings ?? DEFAULT_SETTINGS,
    community: partial.community ?? DEFAULT_COMMUNITY_STATE,
    tutorialProgress: partial.tutorialProgress ?? DEFAULT_TUTORIAL_PROGRESS,
    agent: partial.agent ?? DEFAULT_AGENT_STATE,
    setup_step: 'complete',
  };
}

/** Delete every row this user owns across all synced tables (for 'replace'). */
export async function deleteAllForUser(client: SupabaseClient, userId: string): Promise<void> {
  for (const table of ALL_TABLES) {
    const { error } = await client.from(table).delete().eq('user_id', userId);
    if (error) throw error;
  }
}

// ── Sync caches: what we believe the DB currently holds, per table ──
// Collections map id → row-hash; singletons store a single hash under '@'.
export interface SyncCaches {
  collections: Map<string, Map<string, string>>;
  singletons: Map<string, string>;
  /** Global data-hash short-circuit so an unchanged store does no work. */
  lastGlobalHash: string;
}

export function freshCaches(): SyncCaches {
  return { collections: new Map(), singletons: new Map(), lastGlobalHash: '' };
}

/** Fast non-cryptographic hash (djb2 xor) — matches the backup snapshot hash. */
export function djb2(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return (h >>> 0).toString(36);
}

// A "table missing" error means the migration hasn't been applied yet.
export function isSchemaMissing(err: unknown): boolean {
  const e = err as { code?: string; message?: string } | null;
  if (!e) return false;
  return e.code === '42P01' || /relation .* does not exist/i.test(e.message ?? '');
}

// ── Declarative table specs ──────────────────────────────────
interface CollectionSpec {
  table: string;
  /** Column used as the per-row identity (PK for the diff + delete filter). */
  idKey: string;
  /** Upsert conflict target. */
  onConflict: string;
  rows: (state: SwingVantageState, userId: string) => Row[];
}

interface SingletonSpec {
  table: string;
  /** Returns the single row, or null when it should be absent (e.g. no profile). */
  row: (state: SwingVantageState, userId: string) => Row | null;
}

const COLLECTIONS: CollectionSpec[] = [
  { table: 'sport_profiles', idKey: 'sport', onConflict: 'user_id,sport',
    rows: (s, u) => P.sportProfileRows(s.sportProfiles, u) },
  { table: 'clubs', idKey: 'id', onConflict: 'id',
    rows: (s, u) => s.clubs.map((c) => P.clubRow(c, u)) },
  { table: 'tennis_rackets', idKey: 'id', onConflict: 'id',
    rows: (s, u) => s.sportEquipment.tennis.map((r) => P.tennisRacketRow(r, u)) },
  { table: 'baseball_bats', idKey: 'id', onConflict: 'id',
    rows: (s, u) => s.sportEquipment.baseball.map((b) => P.baseballBatRow(b, u)) },
  { table: 'softball_bats', idKey: 'id', onConflict: 'id',
    rows: (s, u) => [
      ...s.sportEquipment.softball_slow.map((b) => P.softballBatRow(b, 'slow', u)),
      ...s.sportEquipment.softball_fast.map((b) => P.softballBatRow(b, 'fast', u)),
    ] },
  { table: 'sessions', idKey: 'id', onConflict: 'id',
    rows: (s, u) => s.sessions.map((sess) => P.sessionRow(sess, u)) },
  { table: 'shots', idKey: 'id', onConflict: 'id',
    rows: (s, u) => P.allShotRows(s.sessions, u) },
  { table: 'video_analyses', idKey: 'id', onConflict: 'id',
    rows: (s, u) => s.video_analyses.map((v) => P.videoAnalysisRow(v, u)) },
];

const SINGLETONS: SingletonSpec[] = [
  { table: 'golfer_profiles', row: (s, u) => (s.profile ? P.golferProfileRow(s.profile, u) : null) },
  { table: 'training_progress', row: (s, u) => P.trainingRow(s.training, u) },
  { table: 'app_settings', row: (s, u) => P.settingsRow(s.settings, u) },
  { table: 'community_state', row: (s, u) => P.communityRow(s.community, u) },
  { table: 'tutorial_progress', row: (s, u) => P.tutorialRow(s.tutorialProgress, u) },
  { table: 'agent_state', row: (s, u) => P.agentRow(s.agent, u) },
];

// ════════════════════════════════════════════════════════════
//  LOAD
// ════════════════════════════════════════════════════════════

/** Which singleton rows actually exist in the cloud (absent ≠ reset-to-default). */
export interface SingletonPresence {
  training: boolean;
  settings: boolean;
  community: boolean;
  tutorial: boolean;
  agent: boolean;
}

export interface LoadResult {
  state: Partial<SwingVantageState>;
  caches: SyncCaches;
  /** True when the account has no stored data yet (first sign-in). */
  isEmpty: boolean;
  /** Per-singleton existence, so the 3-way merge can tell absent from default. */
  presence: SingletonPresence;
}

async function selectAll(client: SupabaseClient, table: string, userId: string): Promise<Row[]> {
  const { data, error } = await client.from(table).select('*').eq('user_id', userId);
  if (error) throw error;
  return (data ?? []) as Row[];
}

export async function loadAll(client: SupabaseClient, userId: string): Promise<LoadResult> {
  const [
    profileRows, sportProfileRows, clubRows, tennisRows, baseballRows, softballRows,
    sessionRows, shotRows, videoRows, trainingRows, settingsRows, communityRows,
    tutorialRows, agentRows,
  ] = await Promise.all([
    selectAll(client, 'golfer_profiles', userId),
    selectAll(client, 'sport_profiles', userId),
    selectAll(client, 'clubs', userId),
    selectAll(client, 'tennis_rackets', userId),
    selectAll(client, 'baseball_bats', userId),
    selectAll(client, 'softball_bats', userId),
    selectAll(client, 'sessions', userId),
    selectAll(client, 'shots', userId),
    selectAll(client, 'video_analyses', userId),
    selectAll(client, 'training_progress', userId),
    selectAll(client, 'app_settings', userId),
    selectAll(client, 'community_state', userId),
    selectAll(client, 'tutorial_progress', userId),
    selectAll(client, 'agent_state', userId),
  ]);

  const sessions = P.rowsToSessions(sessionRows, shotRows);

  const state: Partial<SwingVantageState> = {
    profile: P.rowToGolferProfile(profileRows[0] ?? null),
    sportProfiles: P.rowsToSportProfiles(sportProfileRows),
    clubs: clubRows.map(P.rowToClub),
    sportEquipment: P.rowsToSportEquipment(tennisRows, baseballRows, softballRows),
    sessions,
    video_analyses: videoRows.map(P.rowToVideoAnalysis),
    training: P.rowToTraining(trainingRows[0] ?? null),
    settings: P.rowToSettings(settingsRows[0] ?? null),
    community: P.rowToCommunity(communityRows[0] ?? null),
    tutorialProgress: P.rowToTutorial(tutorialRows[0] ?? null),
    agent: P.rowToAgent(agentRows[0] ?? null),
  };

  const caches = freshCaches();

  const isEmpty =
    !state.profile &&
    sportProfileRows.length === 0 &&
    clubRows.length === 0 &&
    tennisRows.length === 0 && baseballRows.length === 0 && softballRows.length === 0 &&
    sessionRows.length === 0 &&
    videoRows.length === 0 &&
    trainingRows.length === 0 && settingsRows.length === 0 &&
    communityRows.length === 0 && tutorialRows.length === 0 && agentRows.length === 0;

  const presence: SingletonPresence = {
    training: trainingRows.length > 0,
    settings: settingsRows.length > 0,
    community: communityRows.length > 0,
    tutorial: tutorialRows.length > 0,
    agent: agentRows.length > 0,
  };

  return { state, caches, isEmpty, presence };
}

/**
 * Prime the caches to match a known-synced state WITHOUT writing. Used right
 * after we hydrate the store from the cloud so the next reconcile only pushes
 * genuine subsequent edits.
 */
export function primeCaches(state: SwingVantageState, userId: string, caches: SyncCaches): void {
  for (const spec of COLLECTIONS) {
    const map = new Map<string, string>();
    for (const row of spec.rows(state, userId)) {
      map.set(String(row[spec.idKey]), djb2(JSON.stringify(row)));
    }
    caches.collections.set(spec.table, map);
  }
  for (const spec of SINGLETONS) {
    const row = spec.row(state, userId);
    caches.singletons.set(spec.table, row ? djb2(JSON.stringify(row)) : '∅');
  }
  caches.lastGlobalHash = globalHash(state, userId);
}

function globalHash(state: SwingVantageState, userId: string): string {
  // Cheap fingerprint of everything we'd write; lets reconcile no-op fast.
  const parts: string[] = [];
  for (const spec of COLLECTIONS) parts.push(spec.table, JSON.stringify(spec.rows(state, userId)));
  for (const spec of SINGLETONS) parts.push(spec.table, JSON.stringify(spec.row(state, userId)));
  return djb2(parts.join('|'));
}

// ════════════════════════════════════════════════════════════
//  RECONCILE (store → cloud, minimal diff)
// ════════════════════════════════════════════════════════════

async function reconcileCollection(
  client: SupabaseClient, userId: string, spec: CollectionSpec,
  state: SwingVantageState, caches: SyncCaches,
): Promise<void> {
  const prev = caches.collections.get(spec.table) ?? new Map<string, string>();
  const next = new Map<string, string>();
  const toUpsert: Row[] = [];

  for (const row of spec.rows(state, userId)) {
    const id = String(row[spec.idKey]);
    const h = djb2(JSON.stringify(row));
    next.set(id, h);
    if (prev.get(id) !== h) toUpsert.push(row);
  }
  const removed = [...prev.keys()].filter((id) => !next.has(id));

  if (toUpsert.length) {
    const { error } = await client.from(spec.table).upsert(toUpsert, { onConflict: spec.onConflict });
    if (error) throw error;
  }
  if (removed.length) {
    const { error } = await client
      .from(spec.table).delete().eq('user_id', userId).in(spec.idKey, removed);
    if (error) throw error;
  }
  caches.collections.set(spec.table, next);
}

async function reconcileSingleton(
  client: SupabaseClient, userId: string, spec: SingletonSpec,
  state: SwingVantageState, caches: SyncCaches,
): Promise<void> {
  const row = spec.row(state, userId);
  const h = row ? djb2(JSON.stringify(row)) : '∅';
  if (caches.singletons.get(spec.table) === h) return;

  if (row) {
    const { error } = await client.from(spec.table).upsert(row, { onConflict: 'user_id' });
    if (error) throw error;
  } else {
    const { error } = await client.from(spec.table).delete().eq('user_id', userId);
    if (error) throw error;
  }
  caches.singletons.set(spec.table, h);
}

/**
 * Push the minimal diff of the current store to Supabase. Throws on the
 * first hard error (network / schema) so the caller can mark offline + retry.
 * Caches are updated incrementally, so a mid-way failure simply resumes next time.
 */
export async function reconcile(
  client: SupabaseClient, userId: string, state: SwingVantageState, caches: SyncCaches,
): Promise<boolean> {
  const gh = globalHash(state, userId);
  if (gh === caches.lastGlobalHash) return false; // nothing changed

  // Parent rows (sessions) before children (shots) so FK references resolve;
  // singletons + other collections order-independent.
  for (const spec of COLLECTIONS) {
    await reconcileCollection(client, userId, spec, state, caches);
  }
  for (const spec of SINGLETONS) {
    await reconcileSingleton(client, userId, spec, state, caches);
  }
  caches.lastGlobalHash = gh;
  return true;
}
