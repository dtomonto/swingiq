#!/usr/bin/env node
// ============================================================
// prune-merged-branches — safely delete local branches fully merged into master
// ------------------------------------------------------------
// Operationalizes the BranchGuardianOS recommendation: the dashboard flags the
// sprawl; this actually clears it — but ONLY branches that are 100% safe to drop:
//   • fully merged into master (their commits live in master), AND
//   • not checked out in any worktree, AND
//   • not protected (master, current branch, backup/*, integration/* by default).
//
// Uses `git branch -d` (never -D), which itself refuses anything not merged, so a
// bug here can't lose work. Recoverable via reflog regardless.
//
// Usage:
//   node scripts/prune-merged-branches.mjs            # dry-run (lists candidates)
//   node scripts/prune-merged-branches.mjs --apply    # actually delete
// ============================================================

import { execSync } from 'node:child_process';

const APPLY = process.argv.includes('--apply');

function git(args) {
  return execSync(`git ${args}`, { encoding: 'utf8' }).trim();
}

// Branches we never delete even when merged.
const PROTECTED = [/^master$/, /^main$/, /^backup\//, /^integration\//];

let candidates = [];
try {
  // `git branch --merged master` already prefixes the CURRENT branch with "*"
  // and any WORKTREE-checked-out branch with "+", so we can classify without a
  // (Windows-fragile) --format string.
  candidates = git('branch --merged master')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('*') && !line.startsWith('+'))
    .map((name) => name.trim())
    .filter((name) => name && !PROTECTED.some((re) => re.test(name)));
} catch (e) {
  console.error('✗ Could not read branches:', e.message.split('\n')[0]);
  process.exit(1);
}

if (candidates.length === 0) {
  console.log('✓ No merged, non-checked-out branches to prune. Tree is tidy.');
  process.exit(0);
}

console.log(`${APPLY ? 'Pruning' : 'Would prune'} ${candidates.length} merged branch(es):`);
let deleted = 0;
for (const b of candidates) {
  if (!APPLY) {
    console.log('   • ' + b);
    continue;
  }
  try {
    git(`branch -d ${b}`);
    console.log('   ✓ deleted ' + b);
    deleted += 1;
  } catch {
    console.log('   ⊘ skipped (not safely deletable) ' + b);
  }
}

if (!APPLY) {
  console.log('\nRun again with --apply to delete them (safe: git branch -d refuses unmerged work).');
} else {
  console.log(`\nDone — deleted ${deleted} branch(es). Recoverable via: git reflog`);
}
