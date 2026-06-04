// ============================================================
// SwingIQ — Folder scan + "continue progress" evaluation
//
// Given the user's chosen folder (e.g. Downloads), find the newest
// valid SwingIQ backup, then decide whether it's worth offering to
// continue from. We reuse the same validator and restore-preview the
// manual Import flow uses, so auto-restore is held to the identical
// safety bar (prototype-pollution guard, size cap, schema migration).
// ============================================================

import type { SwingIQState } from '@/store';
import type { SwingIQBackup, RestorePreview } from '@/lib/backup/schema';
import { parseBackupFile } from '@/lib/backup/validate';
import { isEncryptedBackup } from '@/lib/backup/crypto';
import { previewRestore } from '@/lib/backup/restore';

export interface FoundBackup {
  backup: SwingIQBackup;
  /** `name|lastModified` — identifies a file we've already applied/dismissed. */
  signature: string;
  fileName: string;
  createdAt: string;
}

export interface ScanResult {
  latest: FoundBackup | null;
  /** How many encrypted backups we saw but couldn't read without a password. */
  encryptedSkipped: number;
  totalCandidates: number;
}

export function fileSignature(file: File): string {
  return `${file.name}|${file.lastModified}`;
}

/** Empty enough that auto-continuing is unambiguously safe (additive). */
export function isStateEmpty(state: SwingIQState): boolean {
  return (
    state.sessions.length === 0 &&
    state.video_analyses.length === 0 &&
    state.clubs.length === 0 &&
    !state.profile &&
    Object.keys(state.sportProfiles).length === 0
  );
}

function backupTime(backup: SwingIQBackup, file: File): number {
  const t = Date.parse(backup.createdAt);
  return Number.isNaN(t) ? file.lastModified : t;
}

/**
 * Scan a list of candidate files and return the newest readable SwingIQ
 * backup. Encrypted files are counted but skipped (they need a password,
 * so they can't be applied automatically).
 */
export async function findLatestBackup(files: File[]): Promise<ScanResult> {
  let latest: FoundBackup | null = null;
  let latestTime = -Infinity;
  let encryptedSkipped = 0;
  let totalCandidates = 0;

  for (const file of files) {
    let text: string;
    try {
      text = await file.text();
    } catch {
      continue;
    }
    if (isEncryptedBackup(text)) {
      encryptedSkipped++;
      continue;
    }
    const { backup, error } = await parseBackupFile(file);
    if (error || !backup) continue;
    totalCandidates++;
    const t = backupTime(backup, file);
    if (t > latestTime) {
      latestTime = t;
      latest = {
        backup,
        signature: fileSignature(file),
        fileName: file.name,
        createdAt: backup.createdAt,
      };
    }
  }

  return { latest, encryptedSkipped, totalCandidates };
}

export interface ContinueEvaluation {
  preview: RestorePreview;
  /** The backup contains records the current device is missing. */
  hasNewData: boolean;
  /** Current store is empty → safe to auto-apply without prompting. */
  currentIsEmpty: boolean;
}

export function evaluateContinue(
  backup: SwingIQBackup,
  state: SwingIQState,
): ContinueEvaluation {
  const preview = previewRestore(backup, state);
  const newTotal =
    preview.newRecords.sessions + preview.newRecords.clubs + preview.newRecords.videoAnalyses;
  const hasNewData = newTotal > 0 || preview.categories.length > 0;
  return { preview, hasNewData, currentIsEmpty: isStateEmpty(state) };
}
