// ============================================================
// BranchGuardianOS — safe command generator (PURE)
// ------------------------------------------------------------
// Produces copy-paste git COMMAND TEXT, each tagged with a safety level so the
// UI can colour-code it. CRITICAL: nothing here (or anywhere in the app) ever
// EXECUTES git. These strings are for the operator to run themselves in a
// terminal after an explicit approval step. Read-only/dry-run commands are
// always safe to share; destructive ones carry approvalRequired upstream.
//
// PURE + deterministic. Branch/worktree names come from the committed snapshot
// (git's own output), never from free-form UI input, so there is no injection
// surface — but we still quote paths and refuse anything with a shell quote.
// ============================================================

import type { CommandSuggestion } from './types';

/** Quote a value for inclusion in a command; returns null if unsafe. */
function safeArg(v: string): string | null {
  if (typeof v !== 'string' || v.length === 0) return null;
  if (/["'`$\\\n\r]/.test(v)) return null; // refuse shell metacharacters outright
  return /\s/.test(v) ? `"${v}"` : v;
}

/** Read-only inspection commands every recommendation can offer. */
export function inspectionCommands(branch: string): CommandSuggestion[] {
  const b = safeArg(branch);
  if (!b) return [];
  return [
    { label: 'See its status', command: `git log --oneline -5 ${b}`, safety: 'read-only' },
    { label: 'Ahead/behind main', command: `git rev-list --left-right --count main...${b}`, safety: 'read-only', note: 'Replace "main" with your trunk if different.' },
  ];
}

/** Recovery/backup commands to run BEFORE any cleanup (all safe). */
export function backupCommands(branch: string): CommandSuggestion[] {
  const b = safeArg(branch);
  if (!b) return [];
  const safeName = safeArg(`backup/${branch}`);
  return [
    ...(safeName ? [{ label: 'Make a backup branch', command: `git branch ${safeName} ${b}`, safety: 'read-only' as const, note: 'Keeps a recoverable pointer to the work.' }] : []),
    { label: 'Save a patch file', command: `git diff main...${b} > ${b.replace(/"/g, '')}-backup.patch`, safety: 'read-only', note: 'A portable archive of the branch diff.' },
  ];
}

/** Commands to clean up a MERGED branch (destructive delete is gated). */
export function mergedCleanupCommands(branch: string): CommandSuggestion[] {
  const b = safeArg(branch);
  if (!b) return [];
  return [
    { label: 'Confirm it is merged', command: 'git branch --merged main', safety: 'read-only', note: 'The branch should appear in this list.' },
    ...backupCommands(branch),
    { label: 'Delete the merged branch', command: `git branch -d ${b}`, safety: 'destructive', note: '-d only deletes if fully merged (git refuses otherwise).' },
  ];
}

/** Commands to clean up an UNMERGED (stale/abandoned) branch. */
export function unmergedCleanupCommands(branch: string): CommandSuggestion[] {
  const b = safeArg(branch);
  if (!b) return [];
  return [
    { label: 'Inspect before deciding', command: `git log --oneline -10 ${b}`, safety: 'read-only' },
    ...backupCommands(branch),
    { label: 'Force-delete (NOT merged)', command: `git branch -D ${b}`, safety: 'destructive', note: 'DANGER: -D discards unmerged commits. Back up first.' },
  ];
}

/** Commands to rebase a branch that is far behind main. */
export function rebaseCommands(branch: string): CommandSuggestion[] {
  const b = safeArg(branch);
  if (!b) return [];
  return [
    { label: 'See how far behind', command: `git rev-list --left-right --count main...${b}`, safety: 'read-only' },
    ...backupCommands(branch),
    { label: 'Rebase onto main', command: `git switch ${b} && git rebase main`, safety: 'caution', note: 'Rewrites history — coordinate if the branch is shared.' },
  ];
}

/** Commands to publish a branch that has no upstream. */
export function publishCommands(branch: string): CommandSuggestion[] {
  const b = safeArg(branch);
  if (!b) return [];
  return [{ label: 'Publish to origin', command: `git push -u origin ${b}`, safety: 'caution', note: 'Publishes the branch and sets its upstream.' }];
}

/** Commands to prune stale remote-tracking refs (no deletion of local work). */
export function remotePruneCommands(): CommandSuggestion[] {
  return [
    { label: 'Preview stale remotes', command: 'git remote prune origin --dry-run', safety: 'dry-run' },
    { label: 'Prune stale remotes', command: 'git remote prune origin', safety: 'caution', note: 'Only removes local remote-tracking refs for deleted remote branches.' },
    { label: 'Fetch + prune', command: 'git fetch --prune', safety: 'caution' },
  ];
}

/** Commands to review/remove a worktree (removal is gated). */
export function worktreeCleanupCommands(relPath: string, missingOrPrunable: boolean): CommandSuggestion[] {
  const p = safeArg(relPath);
  const cmds: CommandSuggestion[] = [
    { label: 'List all worktrees', command: 'git worktree list', safety: 'read-only' },
    { label: 'Preview prunable worktrees', command: 'git worktree prune --dry-run', safety: 'dry-run' },
  ];
  if (missingOrPrunable) {
    cmds.push({ label: 'Prune stale worktree admin files', command: 'git worktree prune', safety: 'caution', note: 'Only clears bookkeeping for already-missing worktrees.' });
  }
  if (p) {
    cmds.push({ label: 'Check its working tree', command: `git -C ${p} status --short`, safety: 'read-only' });
    cmds.push({ label: 'Remove the worktree', command: `git worktree remove ${p}`, safety: 'destructive', note: 'Refuses if there are uncommitted changes (use --force only after backing up).' });
  }
  return cmds;
}

/** Commands to save working-tree changes before any cleanup. */
export function stashWorkCommands(label: string): CommandSuggestion[] {
  const safeLabel = label.replace(/["'`$\\\n\r]/g, '').slice(0, 60) || 'backup before cleanup';
  return [
    { label: 'See what is uncommitted', command: 'git status --short', safety: 'read-only' },
    { label: 'Stash the work (recoverable)', command: `git stash push -m "${safeLabel}"`, safety: 'caution', note: 'Recover later with git stash pop.' },
  ];
}

/** Commands to inspect the stash backlog (read-only). */
export function stashInspectCommands(): CommandSuggestion[] {
  return [
    { label: 'List stashes', command: 'git stash list', safety: 'read-only' },
    { label: 'Show the latest stash', command: 'git stash show -p stash@{0}', safety: 'read-only' },
  ];
}
