// ============================================================
// SwingVantage — Drill-feedback cloud sync (promoted columned table)
//
// "Did this drill help?" verdicts are kept locally for instant, offline,
// synchronous scoring reads (lib/drillmatch/feedback). This layer mirrors
// them to the COLUMNED `drill_feedback` table — one real row per verdict —
// so they survive across devices AND become queryable for cross-user
// drill-effectiveness analytics / a "most-effective drills" leaderboard.
//
// The scoring code is untouched: it keeps using the local repo. We just
// keep the local array and the cloud table in step.
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type { SportId } from '@swingiq/core';
import { djb2, isSchemaMissing } from './cloudRepo';
import { readAllDrillFeedback, replaceAllDrillFeedback } from '@/lib/drillmatch/feedback';
import type { DrillFeedbackRecord, DrillFeedbackValue } from '@/lib/drillmatch/types';

const TABLE = 'drill_feedback';
const CAP = 200;

interface Row {
  id: string;
  user_id: string;
  drill_id: string;
  fault_id: string;
  sport: string;
  value: string;
  notes: string;
  recorded_at: string;
}

/** Stable row id derived from content (records have no id of their own). */
export function recordId(r: DrillFeedbackRecord): string {
  return `df_${djb2(`${r.drillId}|${r.faultId}|${r.value}|${r.recordedAt}`)}`;
}

function toRow(r: DrillFeedbackRecord, userId: string): Row {
  return {
    id: recordId(r),
    user_id: userId,
    drill_id: r.drillId,
    fault_id: r.faultId,
    sport: r.sport,
    value: r.value,
    notes: r.notes ?? '',
    recorded_at: r.recordedAt,
  };
}

function fromRow(row: Row): DrillFeedbackRecord {
  return {
    drillId: row.drill_id,
    faultId: row.fault_id,
    sport: row.sport as SportId,
    value: row.value as DrillFeedbackValue,
    notes: row.notes || undefined,
    recordedAt: row.recorded_at,
  };
}

/** Union local + cloud by derived id (local wins ties), keep the newest CAP. Pure. */
export function mergeDrillFeedback(
  local: DrillFeedbackRecord[], cloud: DrillFeedbackRecord[],
): DrillFeedbackRecord[] {
  const byId = new Map<string, DrillFeedbackRecord>();
  for (const r of [...cloud, ...local]) byId.set(recordId(r), r);
  return [...byId.values()]
    .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt))
    .slice(-CAP);
}

export interface DrillFeedbackSyncState {
  primed: boolean;
  available: boolean;
  ids: Map<string, string>;
}

export function freshDrillFeedbackSync(): DrillFeedbackSyncState {
  return { primed: false, available: true, ids: new Map() };
}

function snapshotIds(records: DrillFeedbackRecord[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const r of records) m.set(recordId(r), djb2(JSON.stringify(r)));
  return m;
}

async function pullMerge(
  client: SupabaseClient, userId: string, s: DrillFeedbackSyncState,
): Promise<void> {
  const { data, error } = await client.from(TABLE).select('*').eq('user_id', userId);
  if (error) throw error;
  const rows = (data ?? []) as Row[];
  const merged = mergeDrillFeedback(readAllDrillFeedback(), rows.map(fromRow));
  replaceAllDrillFeedback(merged);

  // Push anything we now hold that the cloud doesn't.
  const cloudIds = new Set(rows.map((r) => r.id));
  const upserts = merged.filter((r) => !cloudIds.has(recordId(r))).map((r) => toRow(r, userId));
  if (upserts.length) {
    const { error: e2 } = await client.from(TABLE).upsert(upserts, { onConflict: 'id' });
    if (e2) throw e2;
  }
  s.ids = snapshotIds(merged);
}

async function pushChanged(
  client: SupabaseClient, userId: string, s: DrillFeedbackSyncState,
): Promise<boolean> {
  const local = readAllDrillFeedback();
  const next = snapshotIds(local);
  const upserts: Row[] = [];
  for (const r of local) {
    const id = recordId(r);
    if (s.ids.get(id) !== djb2(JSON.stringify(r))) upserts.push(toRow(r, userId));
  }
  const removed = [...s.ids.keys()].filter((id) => !next.has(id));

  let wrote = false;
  if (upserts.length) {
    const { error } = await client.from(TABLE).upsert(upserts, { onConflict: 'id' });
    if (error) throw error;
    wrote = true;
  }
  if (removed.length) {
    const { error } = await client.from(TABLE).delete().eq('user_id', userId).in('id', removed);
    if (error) throw error;
    wrote = true;
  }
  s.ids = next;
  return wrote;
}

/**
 * Sync drill feedback to/from the account. First call pulls + merges (never
 * lose); later calls push local changes. Tolerates a missing drill_feedback
 * table on its own (sets available=false), so the rest of sync is unaffected.
 */
export async function syncDrillFeedback(
  client: SupabaseClient, userId: string, s: DrillFeedbackSyncState,
): Promise<boolean> {
  if (!s.available) return false;
  try {
    if (!s.primed) {
      await pullMerge(client, userId, s);
      s.primed = true;
      return true;
    }
    return await pushChanged(client, userId, s);
  } catch (err) {
    if (isSchemaMissing(err)) { s.available = false; return false; }
    throw err;
  }
}
