// ============================================================
// SwingIQ — Auto-save snapshot builder
//
// Turns the current store into the exact bytes we write to the user's
// chosen file, plus a cheap content signature so an unchanged store
// is never re-written (saves disk churn and keeps "last saved" honest).
// ============================================================

import type { SwingIQState } from '@/store';
import { exportUserData, generateBackupFilename } from '@/lib/backup/export';

export interface Snapshot {
  contents: string;
  hash: string;
  filename: string;
  /** Total user records, for status copy ("42 sessions, 8 videos…"). */
  recordTotal: number;
}

/** Fast, stable, non-cryptographic string hash (djb2 xor variant). */
function djb2(str: string): string {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (h * 33) ^ str.charCodeAt(i);
  }
  // >>> 0 → unsigned; base36 keeps it short.
  return (h >>> 0).toString(36);
}

export function buildSnapshot(state: SwingIQState): Snapshot {
  const backup = exportUserData(state);
  const contents = JSON.stringify(backup, null, 2);
  const counts = backup.metadata.recordCounts;
  const recordTotal =
    counts.sessions + counts.clubs + counts.videoAnalyses + (counts.achievementsEarned ?? 0);
  return {
    contents,
    // Hash the data block (not the timestamps in the envelope, which
    // change every export) so identical data yields an identical hash.
    hash: djb2(JSON.stringify(backup.data)),
    filename: generateBackupFilename(backup, false),
    recordTotal,
  };
}
