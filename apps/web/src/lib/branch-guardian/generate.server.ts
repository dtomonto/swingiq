// ============================================================
// BranchGuardianOS — server generation entry (SERVER-ONLY)
// ------------------------------------------------------------
// Thin wiring: load the committed snapshot, then delegate to the PURE
// scanSnapshot() assembly (lib/branch-guardian/scan). Keeping the scoring pure
// + isomorphic lets the dashboard re-run the exact same scan client-side when
// the operator changes thresholds, so settings are live. Owner state
// (recommendation status / history / audit log) is applied client-side, so this
// stays stateless and works in production's read-only FS.
// ============================================================

import 'server-only';

import { loadSnapshot } from './snapshot.server';
import { scanSnapshot, type BranchGuardianScanResult } from './scan';
import { DEFAULT_SETTINGS, type BranchGuardianSettings, type BranchGuardianSnapshot } from './types';

export type { BranchGuardianScanResult } from './scan';

/** Run the full BranchGuardian scan over the committed snapshot. */
export function runBranchGuardianScan(
  settings: BranchGuardianSettings = DEFAULT_SETTINGS,
  now: Date = new Date(),
): BranchGuardianScanResult {
  return scanSnapshot(loadSnapshot(), settings, now);
}

/** The raw committed snapshot, for passing to the client to re-score live. */
export function getSnapshot(): BranchGuardianSnapshot {
  return loadSnapshot();
}
