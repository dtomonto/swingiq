// ============================================================
// SwingVantage — BodySync: self-contained local-first store (pure module)
//
// Lives in its OWN localStorage key (swingiq-bodysync-v1), like the retest /
// motion-lab / AGI stores. It never touches the main Zustand store. The
// document-sync layer (lib/db/documentSync) mirrors this key to the user's
// account, so BodySync follows them across devices automatically. SSR-safe,
// never throws. No React/JSX deps live here — the hook is in ./useBodySync.
// ============================================================

import type {
  BodySyncState, ManualCheckin, HealthPermissions, BodySyncSettings,
  HealthConnection, HealthBaselines, HealthProviderId, HealthDailySummary,
  HealthMetricSample, HealthCategory,
} from './types';
import { DEFAULT_BODYSYNC_STATE } from './constants';

export const BODYSYNC_KEY = 'swingiq-bodysync-v1';
const KEY = BODYSYNC_KEY;
const EVENT = 'swingvantage:bodysync-change';

const hasWindow = () => typeof window !== 'undefined';
const newId = () => `bsc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ── read (cached so useSyncExternalStore gets a stable reference) ──
let cache: { raw: string | null; value: BodySyncState } | null = null;

export function read(): BodySyncState {
  if (!hasWindow()) return DEFAULT_BODYSYNC_STATE;
  let raw: string | null = null;
  try { raw = window.localStorage.getItem(KEY); } catch { /* private mode */ }
  if (cache && cache.raw === raw) return cache.value;
  let value: BodySyncState = DEFAULT_BODYSYNC_STATE;
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<BodySyncState>;
      value = {
        version: 1,
        settings: { ...DEFAULT_BODYSYNC_STATE.settings, ...parsed.settings },
        permissions: { ...DEFAULT_BODYSYNC_STATE.permissions, ...parsed.permissions },
        connections: Array.isArray(parsed.connections) ? parsed.connections : [],
        checkins: Array.isArray(parsed.checkins) ? parsed.checkins : [],
        baselines: { ...DEFAULT_BODYSYNC_STATE.baselines, ...parsed.baselines },
        summaries: Array.isArray(parsed.summaries) ? parsed.summaries : [],
      };
    } catch { value = DEFAULT_BODYSYNC_STATE; }
  }
  cache = { raw, value };
  return value;
}

function write(next: BodySyncState): void {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
    cache = null; // invalidate so the next read reparses
    window.dispatchEvent(new Event(EVENT));
    // Notify the cloud document-mirror (same-tab listeners watch 'storage').
    try { window.dispatchEvent(new StorageEvent('storage', { key: KEY })); } catch { /* ignore */ }
  } catch { /* quota / private mode — non-critical */ }
}

export function subscribe(cb: () => void): () => void {
  if (!hasWindow()) return () => {};
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) cb(); };
  window.addEventListener(EVENT, cb);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener('storage', onStorage);
  };
}

// ── mutations (pure read-modify-write) ───────────────────────
export function saveCheckin(input: Omit<ManualCheckin, 'id' | 'createdAt'>): void {
  const state = read();
  const existing = state.checkins.find((c) => c.date === input.date);
  const record: ManualCheckin = {
    ...input,
    id: existing?.id ?? newId(),
    createdAt: new Date().toISOString(),
  };
  const checkins = [record, ...state.checkins.filter((c) => c.date !== input.date)]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 400); // bounded history
  write({ ...state, checkins });
}

export function deleteCheckin(date: string): void {
  const state = read();
  write({ ...state, checkins: state.checkins.filter((c) => c.date !== date) });
}

export function setPermissions(patch: Partial<HealthPermissions>): void {
  const state = read();
  write({ ...state, permissions: { ...state.permissions, ...patch } });
}

export function setSettings(patch: Partial<BodySyncSettings>): void {
  const state = read();
  write({ ...state, settings: { ...state.settings, ...patch } });
}

export function consent(): void {
  const state = read();
  write({
    ...state,
    settings: { ...state.settings, enabled: true, consentedAt: new Date().toISOString() },
  });
}

export function setBaselines(patch: Partial<HealthBaselines>): void {
  const state = read();
  write({
    ...state,
    baselines: { ...state.baselines, ...patch, updatedAt: new Date().toISOString() },
  });
}

export function upsertConnection(conn: HealthConnection): void {
  const state = read();
  const connections = [conn, ...state.connections.filter((c) => c.provider !== conn.provider)];
  write({ ...state, connections });
}

export function disconnectProvider(provider: HealthProviderId): void {
  const state = read();
  write({ ...state, connections: state.connections.filter((c) => c.provider !== provider) });
}

const median = (xs: number[]): number | null => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const round1 = (n: number | null) => (n == null ? null : Math.round(n * 10) / 10);

/**
 * Ingest normalized daily summaries from a device import (Apple Health, Health
 * Connect, …): merge by date+metric, learn objective baselines (median resting
 * HR / HRV / sleep), enable the covered consent categories, and mark the
 * provider connected. Returns nothing; the store notifies subscribers.
 */
export function importDailySummaries(
  incoming: HealthDailySummary[], provider: HealthProviderId, method: HealthConnection['method'] = 'file_import',
): void {
  const state = read();
  const byKey = new Map<string, HealthDailySummary>();
  for (const s of state.summaries) byKey.set(`${s.date}|${s.metricType}`, s);
  for (const s of incoming) byKey.set(`${s.date}|${s.metricType}`, s); // import wins

  // Keep ~180 days, newest last.
  const merged = [...byKey.values()].sort((a, b) => a.date.localeCompare(b.date));
  const cutoff = merged.length
    ? new Date(Date.parse(merged[merged.length - 1].date) - 180 * 86_400_000).toISOString().slice(0, 10)
    : '';
  const summaries = merged.filter((s) => s.date >= cutoff);

  const valuesFor = (mt: HealthDailySummary['metricType']) =>
    summaries.filter((s) => s.metricType === mt).map((s) => s.value);
  const baselines: HealthBaselines = {
    restingHr: round1(median(valuesFor('resting_hr'))) ?? state.baselines.restingHr,
    hrv: round1(median(valuesFor('hrv'))) ?? state.baselines.hrv,
    sleepHours: round1(median(valuesFor('sleep_duration'))) ?? state.baselines.sleepHours,
    updatedAt: new Date().toISOString(),
  };

  // The act of importing is consent to use the covered categories.
  const cats = new Set<HealthCategory>(incoming.map((s) => s.category));
  const permissions = { ...state.permissions };
  for (const c of cats) permissions[c] = true;

  const now = new Date().toISOString();
  const connection: HealthConnection = {
    provider, status: 'connected', method,
    connectedAt: state.connections.find((c) => c.provider === provider)?.connectedAt ?? now,
    lastSyncAt: now,
    note: `${incoming.length} daily summaries imported`,
  };
  const connections = [connection, ...state.connections.filter((c) => c.provider !== provider)];

  write({ ...state, summaries, baselines, permissions, connections });
}

/** Build the recent objective samples the scoring engine reads (newest per metric). */
export function samplesFromSummaries(summaries: HealthDailySummary[], days = 10): HealthMetricSample[] {
  if (!summaries.length) return [];
  const newest = summaries.reduce((max, s) => (s.date > max ? s.date : max), summaries[0].date);
  const cutoff = new Date(Date.parse(newest) - days * 86_400_000).toISOString().slice(0, 10);
  return summaries
    .filter((s) => s.date >= cutoff)
    .map((s) => ({
      provider: s.provider, category: s.category, metricType: s.metricType,
      value: s.value, unit: s.unit, confidence: s.confidence,
      windowStart: `${s.date}T00:00:00Z`, windowEnd: `${s.date}T23:59:59Z`,
      timestamp: `${s.date}T12:00:00Z`,
    }));
}

/** Full erase — the user-controlled "delete my health data" action. */
export function clearAllHealthData(): void {
  write({ ...DEFAULT_BODYSYNC_STATE });
}

/** Export the user's BodySync data (for the data-portability requirement). */
export function exportBodySync(): BodySyncState {
  return read();
}
