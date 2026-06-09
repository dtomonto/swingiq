// ============================================================
// BranchGuardianOS — snapshot loader (SERVER-ONLY)
// ------------------------------------------------------------
// The ONE place the engine's git inventory is read. The inventory is produced
// out-of-band by scripts/scan-branches.mjs and committed as JSON, so the app
// never shells out to git (production has no .git and a read-only FS). This
// loader reads that committed JSON, validates it defensively, and reports how
// stale it is so the UI can show an honest "as of" banner.
// ============================================================

import 'server-only';

import rawSnapshot from '@/data/branch-guardian-snapshot.json';
import type { BranchGuardianSnapshot } from './types';

/** An empty, honest snapshot used when the committed file is missing/invalid. */
export const EMPTY_SNAPSHOT: BranchGuardianSnapshot = {
  schemaVersion: 0,
  generatedAt: '',
  git: false,
  note: 'No snapshot found. Run `npm run scan:branches` to generate one.',
  mainBranch: null,
  currentBranch: null,
  inProgressOp: null,
  currentDirty: null,
  branches: [],
  remoteBranches: [],
  remoteBranchCount: 0,
  worktrees: [],
  stashes: [],
  stashCount: 0,
};

/** Validate + normalize the imported JSON into a typed snapshot (never throws). */
export function loadSnapshot(): BranchGuardianSnapshot {
  try {
    const s = rawSnapshot as Partial<BranchGuardianSnapshot> | null | undefined;
    if (!s || typeof s !== 'object' || !Array.isArray(s.branches)) return EMPTY_SNAPSHOT;
    return {
      ...EMPTY_SNAPSHOT,
      ...s,
      branches: Array.isArray(s.branches) ? s.branches : [],
      worktrees: Array.isArray(s.worktrees) ? s.worktrees : [],
      stashes: Array.isArray(s.stashes) ? s.stashes : [],
      remoteBranches: Array.isArray(s.remoteBranches) ? s.remoteBranches : [],
    } as BranchGuardianSnapshot;
  } catch {
    return EMPTY_SNAPSHOT;
  }
}
