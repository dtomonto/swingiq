// ============================================================
// SwingVantage — DrillMatch: Drill Effectiveness Feedback Loop
// ------------------------------------------------------------
// "Did this drill help?" — the signal that makes DrillMatch get
// smarter every time the user returns. Stored LOCAL-FIRST in its
// own localStorage namespace (like the agent cache): it does NOT
// touch the main store or the backup file, so it is fully additive
// and cannot corrupt user data.
//
// The repository is an interface so a cloud-backed adapter can be
// dropped in later without changing any scoring code.
// ============================================================

import type {
  DrillFeedbackRecord,
  DrillFeedbackRepository,
  DrillFeedbackValue,
} from './types';
import type { SportId } from '@swingiq/core';

const NAMESPACE = 'swingiq-drill-feedback-v1';
const MAX_RECORDS = 200;

function read(): DrillFeedbackRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(NAMESPACE);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? (parsed as DrillFeedbackRecord[]) : [];
  } catch {
    return [];
  }
}

function write(records: DrillFeedbackRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    // Keep the most recent records if we exceed the cap.
    const trimmed =
      records.length > MAX_RECORDS ? records.slice(records.length - MAX_RECORDS) : records;
    window.localStorage.setItem(NAMESPACE, JSON.stringify(trimmed));
  } catch {
    // Quota or unavailable — feedback is best-effort, never fatal.
  }
}

/**
 * Read / replace the whole local feedback array. Used by the cloud-sync layer
 * (lib/db/drillFeedbackSync) to merge in records pulled from the account,
 * without the scoring code knowing storage exists.
 */
export function readAllDrillFeedback(): DrillFeedbackRecord[] {
  return read();
}
export function replaceAllDrillFeedback(records: DrillFeedbackRecord[]): void {
  write(records);
}

/** Local-first repository backed by localStorage. SSR-safe. */
export const localDrillFeedbackRepo: DrillFeedbackRepository = {
  record(input) {
    const rec: DrillFeedbackRecord = { ...input, recordedAt: new Date().toISOString() };
    const all = read();
    all.push(rec);
    write(all);
    return rec;
  },
  getFor(drillId, faultId) {
    return read().filter(
      (r) => r.drillId === drillId && (faultId === undefined || r.faultId === faultId),
    );
  },
  latestFor(drillId, faultId) {
    const matches = this.getFor(drillId, faultId);
    if (matches.length === 0) return null;
    return matches.reduce((latest, r) =>
      r.recordedAt > latest.recordedAt ? r : latest,
    );
  },
  all() {
    return read();
  },
  clear() {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(NAMESPACE);
    } catch {
      // ignore
    }
  },
};

// ── Scoring input derived from feedback ───────────────────────

/** Numeric score nudge a drill earns from the user's prior verdict on it. */
export const FEEDBACK_WEIGHTS: Record<DrillFeedbackValue, number> = {
  helped: 22,
  no_change: -6,
  hurt: -60, // effectively retires a drill the user found unhelpful/uncomfortable
};

/**
 * The most recent feedback verdict for a drill+fault pair (fault-specific
 * preferred, otherwise the drill's latest verdict for any fault). Returns
 * `null` when there is no history (and therefore no nudge).
 */
export function latestFeedbackValue(
  drillId: string,
  faultId: string | undefined,
  repo: DrillFeedbackRepository = localDrillFeedbackRepo,
): DrillFeedbackValue | null {
  const specific = faultId ? repo.latestFor(drillId, faultId) : null;
  const chosen = specific ?? repo.latestFor(drillId);
  return chosen?.value ?? null;
}

/** Convenience wrapper used by the UI to record a verdict + return the record. */
export function recordDrillFeedback(
  drillId: string,
  faultId: string,
  sport: SportId,
  value: DrillFeedbackValue,
  notes?: string,
  repo: DrillFeedbackRepository = localDrillFeedbackRepo,
): DrillFeedbackRecord {
  return repo.record({ drillId, faultId, sport, value, notes });
}
