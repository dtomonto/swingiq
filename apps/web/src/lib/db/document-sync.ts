// ============================================================
// SwingVantage — Secondary-store cloud mirror
//
// A handful of features keep their OWN small localStorage stores outside
// the main Zustand store (retest dismissals, drill feedback, AGI history /
// commitments / insight verdicts, celebration ledger, saved video-analysis
// history, Motion Lab sessions + roster, guide + start-here state).
//
// This module mirrors each of those localStorage keys to a per-(user, key)
// row in `user_documents`, so they follow the account like everything else
// — WITHOUT touching any of those modules. They keep reading/writing
// localStorage exactly as before; we keep localStorage and the cloud in
// step, with a per-key merge so signing in on a new device never loses
// (or duplicates) anything.
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import { djb2 } from './cloud-repo';

const TABLE = 'user_documents';

type Json = unknown;
type Merge = (local: Json, cloud: Json) => Json;

interface DocSpec {
  key: string; // localStorage key === cloud doc_key
  merge: Merge;
}

// ── merge helpers ────────────────────────────────────────────
const asArr = (v: Json): Record<string, unknown>[] => (Array.isArray(v) ? v : []);
const asObj = (v: Json): Record<string, unknown> =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

function unionStrings(a: Json, b: Json, cap?: number): string[] {
  const out = Array.from(
    new Set([
      ...(Array.isArray(a) ? a : []),
      ...(Array.isArray(b) ? b : []),
    ].filter((x): x is string => typeof x === 'string')),
  );
  return cap ? out.slice(-cap) : out;
}

/** Union arrays of objects by an id field; `a` (local) wins on id collisions. */
function unionById(a: Json, b: Json, idKey = 'id', cap?: number): Record<string, unknown>[] {
  const la = asArr(a);
  const seen = new Set(la.map((x) => x[idKey]));
  const merged = [...la, ...asArr(b).filter((x) => !seen.has(x[idKey]))];
  return cap ? merged.slice(-cap) : merged;
}

/** For singletons: keep whichever has the later timestamp field. */
function preferRecent(a: Json, b: Json, tsKey: string): Json {
  const ta = asObj(a)[tsKey];
  const tb = asObj(b)[tsKey];
  if (a && !b) return a;
  if (b && !a) return b;
  if (!a && !b) return a ?? b ?? null;
  return String(ta ?? '') >= String(tb ?? '') ? a : b;
}

// ── what to mirror, and how to merge each ────────────────────
const DOC_SPECS: DocSpec[] = [
  // retest dismissals/acknowledgments — union both id lists
  {
    key: 'swingiq-retests-v1',
    merge: (l, c) => ({
      version: 1,
      dismissedTargetIds: unionStrings(asObj(l).dismissedTargetIds, asObj(c).dismissedTargetIds, 50),
      acknowledgedResultIds: unionStrings(asObj(l).acknowledgedResultIds, asObj(c).acknowledgedResultIds, 50),
    }),
  },
  // (drill-effectiveness feedback is now promoted to its own columned
  //  drill_feedback table — see lib/db/drillFeedbackSync.ts.)
  // AGI keystone commitment (single) — keep the most recently committed
  { key: 'swingiq-agi-commitment-v1', merge: (l, c) => preferRecent(l, c, 'committedAt') },
  // AGI daily snapshot history — one per day, latest wins, cap 90
  {
    key: 'swingiq-agi-history-v1',
    merge: (l, c) => {
      const byDay = new Map<string, Record<string, unknown>>();
      for (const s of [...asArr(c), ...asArr(l)]) {
        const at = String(s.at ?? '');
        const day = at.slice(0, 10);
        const existing = byDay.get(day);
        if (!existing || at >= String(existing.at ?? '')) byDay.set(day, s);
      }
      return [...byDay.values()].sort((a, b) => String(a.at).localeCompare(String(b.at))).slice(-90);
    },
  },
  // AGI insight verdicts (map id → up/down) — merge, local wins
  {
    key: 'swingiq-agi-insight-feedback-v1',
    merge: (l, c) => ({ ...asObj(c), ...asObj(l) }),
  },
  // celebration ledger — OR the initialized flag, union the ids
  {
    key: 'swingiq-celebrated-v1',
    merge: (l, c) => ({
      initialized: asObj(l).initialized === true || asObj(c).initialized === true,
      ids: unionStrings(asObj(l).ids, asObj(c).ids),
    }),
  },
  // saved video-analysis history — union by id, keep 25 newest
  { key: 'swingiq-video-analyses-v1', merge: (l, c) => unionById(l, c, 'id', 25) },
  // Motion Lab sessions — union by id, keep 30 newest
  { key: 'swingiq-motion-sessions-v1', merge: (l, c) => unionById(l, c, 'id', 30) },
  // Motion Lab roster (athletes) — union by id
  { key: 'swingiq-motion-roster-v1', merge: (l, c) => unionById(l, c, 'id') },
  // Start-Here record (single) — keep the most recently completed
  { key: 'swingiq-start-here-v1', merge: (l, c) => preferRecent(l, c, 'completedAt') },
  // Guide companion — prefer this device's toggles, union seen pages
  {
    key: 'swingiq-guide-v1',
    merge: (l, c) => {
      const lo = asObj(l); const co = asObj(c);
      return {
        version: 1,
        autoOpen: lo.autoOpen ?? co.autoOpen ?? true,
        hidden: lo.hidden ?? co.hidden ?? false,
        seenPages: unionStrings(lo.seenPages, co.seenPages, 60),
      };
    },
  },
  // BodySync (health-performance) — union check-ins by date (latest createdAt
  // wins), union connections by provider, keep earliest consent, prefer this
  // device's permission/baseline choices.
  {
    key: 'swingiq-bodysync-v1',
    merge: (l, c) => {
      const lo = asObj(l); const co = asObj(c);
      const checkinsById = new Map<string, Record<string, unknown>>();
      for (const ck of [...asArr(co.checkins), ...asArr(lo.checkins)]) {
        const date = String(ck.date);
        const prev = checkinsById.get(date);
        if (!prev || String(ck.createdAt ?? '') >= String(prev.createdAt ?? '')) {
          checkinsById.set(date, ck);
        }
      }
      const checkins = [...checkinsById.values()]
        .sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 400);

      const connById = new Map<string, Record<string, unknown>>();
      for (const cn of [...asArr(co.connections), ...asArr(lo.connections)]) {
        const p = String(cn.provider);
        const prev = connById.get(p);
        if (!prev || String(cn.lastSyncAt ?? '') >= String(prev.lastSyncAt ?? '')) connById.set(p, cn);
      }

      // Daily device summaries — union by date+metric (import/newer wins).
      const summByKey = new Map<string, Record<string, unknown>>();
      for (const sm of [...asArr(co.summaries), ...asArr(lo.summaries)]) {
        summByKey.set(`${sm.date}|${sm.metricType}`, sm);
      }
      const summaries = [...summByKey.values()]
        .sort((a, b) => String(a.date).localeCompare(String(b.date))).slice(-2000);

      const ls = asObj(lo.settings); const cs = asObj(co.settings);
      const consentDates = [ls.consentedAt, cs.consentedAt].filter(Boolean) as string[];
      return {
        version: 1,
        settings: {
          ...cs, ...ls, // prefer this device's settings…
          enabled: ls.enabled === true || cs.enabled === true, // …but never lose "enabled"
          ageConfirmed18: ls.ageConfirmed18 === true || cs.ageConfirmed18 === true, // …or the 18+ attestation
          consentedAt: consentDates.length ? consentDates.sort()[0] : null, // earliest consent
        },
        permissions: { ...asObj(co.permissions), ...asObj(lo.permissions) }, // prefer local
        connections: [...connById.values()],
        checkins,
        summaries,
        baselines:
          String(asObj(lo.baselines).updatedAt ?? '') >= String(asObj(co.baselines).updatedAt ?? '')
            ? lo.baselines : co.baselines,
      };
    },
  },
  // ReferralOS — keep one stable invite code (earliest createdAt wins),
  // union shares + credited signups by id, union acknowledged tiers.
  {
    key: 'swingiq-referral-v1',
    merge: (l, c) => {
      const lo = asObj(l); const co = asObj(c);
      const lCreated = String(lo.createdAt ?? '');
      const cCreated = String(co.createdAt ?? '');
      const earlierIsLocal = !cCreated || (lCreated && lCreated <= cCreated);
      return {
        version: 1,
        code: (earlierIsLocal ? lo.code : co.code) ?? lo.code ?? co.code,
        shares: unionById(lo.shares, co.shares, 'id', 500),
        credited: unionById(lo.credited, co.credited, 'id', 1000),
        acknowledgedTiers: unionStrings(lo.acknowledgedTiers, co.acknowledgedTiers, 50),
        settings: { ...asObj(co.settings), ...asObj(lo.settings) },
        createdAt: earlierIsLocal ? (lo.createdAt ?? co.createdAt) : (co.createdAt ?? lo.createdAt),
      };
    },
  },
];

// ── localStorage helpers ─────────────────────────────────────
function readLocal(key: string): Json | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? undefined : JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function writeLocal(key: string, value: Json): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    // Notify same-tab listeners (the modules subscribe to 'storage' by key).
    try {
      window.dispatchEvent(new StorageEvent('storage', { key }));
    } catch {
      /* StorageEvent ctor unsupported — modules pick it up on next read */
    }
  } catch {
    /* quota / private mode — non-critical */
  }
}

const hashOf = (v: Json | undefined): string => (v === undefined ? '∅' : djb2(JSON.stringify(v)));

export interface DocSyncState {
  hashes: Map<string, string>;
}

export function freshDocSyncState(): DocSyncState {
  return { hashes: new Map() };
}

/**
 * On sign-in: pull every mirrored document, MERGE it with whatever is on the
 * device (never lose), write the merged result back to localStorage, and push
 * the union back up so the cloud holds it too. Primes the change hashes.
 */
export async function pullAndMergeDocuments(
  client: SupabaseClient, userId: string, state: DocSyncState,
): Promise<void> {
  const { data, error } = await client.from(TABLE).select('doc_key, data').eq('user_id', userId);
  if (error) throw error;

  const cloudByKey = new Map<string, Json>();
  for (const row of (data ?? []) as { doc_key: string; data: Json }[]) {
    cloudByKey.set(row.doc_key, row.data);
  }

  const upserts: { user_id: string; doc_key: string; data: Json }[] = [];
  for (const spec of DOC_SPECS) {
    const local = readLocal(spec.key);
    const cloud = cloudByKey.get(spec.key);
    if (local === undefined && cloud === undefined) {
      state.hashes.set(spec.key, '∅');
      continue;
    }
    const merged = spec.merge(local ?? null, cloud ?? null);
    writeLocal(spec.key, merged);
    state.hashes.set(spec.key, hashOf(merged));
    if (hashOf(cloud) !== hashOf(merged)) {
      upserts.push({ user_id: userId, doc_key: spec.key, data: merged });
    }
  }
  if (upserts.length) {
    const { error: e2 } = await client.from(TABLE).upsert(upserts, { onConflict: 'user_id,doc_key' });
    if (e2) throw e2;
  }
}

/**
 * Push any mirrored documents whose localStorage value changed since the last
 * sync. Deletes the cloud row when a document was cleared locally. Returns
 * true if anything was written.
 */
export async function pushChangedDocuments(
  client: SupabaseClient, userId: string, state: DocSyncState,
): Promise<boolean> {
  const upserts: { user_id: string; doc_key: string; data: Json }[] = [];
  const deletes: string[] = [];

  for (const spec of DOC_SPECS) {
    const local = readLocal(spec.key);
    const h = hashOf(local);
    if (state.hashes.get(spec.key) === h) continue;
    const had = (state.hashes.get(spec.key) ?? '∅') !== '∅';
    state.hashes.set(spec.key, h);
    if (local === undefined) {
      if (had) deletes.push(spec.key); // cleared locally → remove from cloud
    } else {
      upserts.push({ user_id: userId, doc_key: spec.key, data: local });
    }
  }

  let wrote = false;
  if (upserts.length) {
    const { error } = await client.from(TABLE).upsert(upserts, { onConflict: 'user_id,doc_key' });
    if (error) throw error;
    wrote = true;
  }
  if (deletes.length) {
    const { error } = await client.from(TABLE).delete().eq('user_id', userId).in('doc_key', deletes);
    if (error) throw error;
    wrote = true;
  }
  return wrote;
}
