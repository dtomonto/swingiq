// ============================================================
// SwingVantage — Sign-in merge decision (pure)
//
// Extracted from RelationalSyncProvider so the "what does signing in do to
// my on-device data" decision is a pure, unit-testable function instead of
// being buried inside a React effect. Given the device's local state, the
// account's loaded state, and the last-agreed base, it returns:
//
//   • apply     — the partial state to push into the store via setState
//                 (shallow-merged over local), or `null` when the account is
//                 empty and we should keep local as-is and migrate it up.
//   • cloudFull — the account state with defaults filled (for priming the
//                 reconcile caches), or `null` for an empty account.
//
// The three branches mirror the documented lifecycle exactly:
//   1. Empty account      → keep local, push it up (guest → account migration).
//   2. Returning device    → 3-way merge against the base (deletes propagate,
//      (base present)        new items on either side survive, no resurrection).
//   3. First sign-in here  → non-destructive union so nothing is ever lost; a
//      (no base)             base is saved right after the first sync.
// ============================================================

import type { SwingVantageState, SportEquipment } from '@/store';
import { exportUserData } from '@/lib/backup/export';
import { mergeRestore } from '@/lib/backup/restore';
import { fillDefaults, type LoadResult } from './cloud-repo';
import { threeWayMerge } from './three-way-merge';
import type { SyncBase } from './sync-base';

function mergeById<T extends { id: string }>(a: T[], b: T[]): T[] {
  const seen = new Set(a.map((i) => i.id));
  return [...a, ...b.filter((i) => !seen.has(i.id))];
}

/** Union two sport-equipment bags by id (used only on the no-base first sign-in). */
export function mergeSportEquipment(a: SportEquipment, b: SportEquipment): SportEquipment {
  return {
    tennis: mergeById(a.tennis, b.tennis),
    pickleball: mergeById(a.pickleball, b.pickleball),
    padel: mergeById(a.padel, b.padel),
    baseball: mergeById(a.baseball, b.baseball),
    softball_slow: mergeById(a.softball_slow, b.softball_slow),
    softball_fast: mergeById(a.softball_fast, b.softball_fast),
  };
}

export interface SignInMergeResult {
  /**
   * State to apply via `store.setState` (shallow-merged over local), or `null`
   * to leave local untouched (empty account → the local data is migrated up by
   * the reconcile that follows).
   */
  apply: Partial<SwingVantageState> | null;
  /** Cloud state with defaults filled, for priming the caches; `null` if empty. */
  cloudFull: SwingVantageState | null;
}

/**
 * Decide what signing in does to the device's data. Pure: no client, no store,
 * no React — just the merge math, so it can be exhaustively unit-tested for the
 * one thing that must never happen here — silently losing a user's progress.
 */
export function mergeOnSignIn(
  local: SwingVantageState,
  load: LoadResult,
  base: SyncBase | null,
): SignInMergeResult {
  if (load.isEmpty) {
    // Brand-new account: keep this device's data; the reconcile pushes it all up.
    return { apply: null, cloudFull: null };
  }

  const cloudFull = fillDefaults(load.state);

  if (base) {
    // Returning device: 3-way merge against the last agreed base so deletes on
    // either device propagate (no resurrection) while new items survive.
    return { apply: threeWayMerge(base, local, cloudFull, load.presence), cloudFull };
  }

  // First sign-in on this device with no base → non-destructive union so
  // nothing is lost; a base is saved after this sync.
  const cloudBackup = exportUserData({ ...local, ...load.state } as SwingVantageState);
  const merged = mergeRestore(cloudBackup, local);
  return {
    apply: {
      ...merged,
      sportEquipment: mergeSportEquipment(local.sportEquipment, cloudFull.sportEquipment),
    },
    cloudFull,
  };
}
