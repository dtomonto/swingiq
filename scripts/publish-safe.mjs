// ============================================================
// SwingVantage — publish-safe: land local commits on master without
// the #1 footgun of this shared checkout (a destructive force-push).
// ------------------------------------------------------------
// This repo's local `master` is a shared integration branch that many
// agents commit onto. It routinely DIVERGES from origin/master, and the
// same work often lands on origin under a different SHA. So:
//
//   git push --force        ← ERASES origin commits that aren't local. NEVER.
//   git push (plain)        ← rejected as non-fast-forward when diverged.
//
// publish-safe does the right thing instead:
//   1. fetch origin/master
//   2. pick candidate commits (args, or everything in origin/master..master)
//   3. DROP any candidate already on origin *by patch-id* (content, not SHA)
//      — so re-landed duplicates are skipped, never double-pushed
//   4. cherry-pick the genuinely-new commits onto a throwaway worktree based
//      on the CURRENT origin tip (the shared checkout is never touched)
//   5. run the real pre-push gates (junctions node_modules so type-check works)
//   6. fast-forward push to master — verified non-destructive first
//   7. tear everything down (junctions unlinked link-only, worktree removed)
//
// Usage:
//   npm run publish-safe                 # land every genuinely-new local commit
//   npm run publish-safe -- <sha> [<sha>] # land just these (still de-duped)
//   npm run publish-safe -- --dry        # show the plan, push nothing
//
// Never passes --force / --no-verify / SKIP_TSC. If a gate fails, it stops.
// ============================================================

import { execFileSync } from 'node:child_process';
import { existsSync, symlinkSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const WT = resolve(REPO, '..', 'swiq-agents', '.publish-safe');
const BRANCH = 'publish-safe-tmp';

const args = process.argv.slice(2);
const dry = args.includes('--dry') || args.includes('-n');
const wantShas = args.filter((a) => !a.startsWith('-'));

// ── git helpers ─────────────────────────────────────────────
const git = (cwd, ...a) =>
  execFileSync('git', a, { cwd, stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();
const gitShow = (cwd, ...a) => execFileSync('git', a, { cwd, stdio: 'inherit' });
const tryGit = (cwd, ...a) => {
  try { execFileSync('git', a, { cwd, stdio: 'ignore' }); return true; } catch { return false; }
};

/** patch-id of a commit (content fingerprint, ignores SHA/parent/message). */
function patchId(cwd, sha) {
  const show = execFileSync('git', ['show', sha], { cwd, maxBuffer: 1 << 28 });
  const out = execFileSync('git', ['patch-id', '--stable'], { cwd, input: show }).toString().trim();
  return out.split(/\s+/)[0] || `nodiff:${sha}`; // merge/empty commits → unique-ish
}

/** Remove a Windows junction (link only — never recurses into the target). */
function unlinkJunction(p) {
  if (!existsSync(p)) return;
  try { execFileSync('cmd', ['/c', 'rmdir', p.replace(/\//g, '\\')], { stdio: 'ignore' }); }
  catch { /* best effort */ }
}

function cleanup() {
  // Junctions MUST go before the worktree is removed, so removal can't recurse
  // through them into the main checkout's node_modules.
  unlinkJunction(join(WT, 'apps', 'web', 'node_modules'));
  unlinkJunction(join(WT, 'node_modules'));
  tryGit(REPO, 'worktree', 'remove', '--force', WT);
  tryGit(REPO, 'branch', '-D', BRANCH);
  tryGit(REPO, 'worktree', 'prune');
}

function die(msg) { console.error(`\n✗ ${msg}`); cleanup(); process.exit(1); }

// ── 1. fetch ────────────────────────────────────────────────
console.log('publish-safe: fetching origin/master…');
git(REPO, 'fetch', 'origin', 'master');
const originTip = git(REPO, 'rev-parse', 'origin/master');
console.log(`  origin/master = ${originTip.slice(0, 8)}`);

// ── 2. candidate commits (chronological) ────────────────────
let candidates;
if (wantShas.length) {
  candidates = wantShas.map((s) => {
    try { return git(REPO, 'rev-parse', '--verify', `${s}^{commit}`); }
    catch { die(`not a commit: ${s}`); }
  });
} else {
  candidates = git(REPO, 'rev-list', '--reverse', 'origin/master..master')
    .split('\n').filter(Boolean);
}
if (!candidates.length) { console.log('Nothing local is ahead of origin/master. Done.'); process.exit(0); }

// ── 3. drop anything already on origin by patch-id ──────────
const originOnly = git(REPO, 'rev-list', 'master..origin/master').split('\n').filter(Boolean);
const originPids = new Set(originOnly.map((c) => patchId(REPO, c)));

const toLand = [], skipped = [];
for (const sha of candidates) {
  const subj = git(REPO, 'log', '-1', '--format=%h %s', sha);
  (originPids.has(patchId(REPO, sha)) ? skipped : toLand).push({ sha, subj });
}

console.log('\nPlan:');
for (const { subj } of toLand) console.log(`  LAND  ${subj}`);
for (const { subj } of skipped) console.log(`  skip  ${subj}  (already on origin by content)`);

if (!toLand.length) { console.log('\nNothing genuinely new to publish. Done.'); process.exit(0); }
if (dry) { console.log('\n--dry: stopping before any worktree/push.'); process.exit(0); }

// ── 4. isolated worktree off the current origin tip ─────────
cleanup(); // clear any leftovers from a failed run
console.log(`\nCreating isolated worktree at ${WT}…`);
try { gitShow(REPO, 'worktree', 'add', '-b', BRANCH, WT, 'origin/master'); }
catch { die('could not create worktree'); }

try {
  // node_modules junctions so the pre-push type-check gate runs for real
  // (fast; removed link-only in cleanup). Mirrors what a manual run needs.
  for (const rel of ['node_modules', join('apps', 'web', 'node_modules')]) {
    const target = join(REPO, rel);
    if (existsSync(target)) symlinkSync(target, join(WT, rel), 'junction');
  }

  // ── 5. cherry-pick (hooks off so the registry post-commit hook can't
  //       contaminate the commits we are about to publish) ──
  console.log('\nCherry-picking onto origin tip…');
  try { gitShow(WT, '-c', 'core.hooksPath=/dev/null', 'cherry-pick', ...toLand.map((c) => c.sha)); }
  catch { tryGit(WT, 'cherry-pick', '--abort'); die('cherry-pick hit a conflict — resolve manually or pick fewer commits'); }

  // ── 6. fast-forward safety: re-fetch and prove origin tip is an ancestor
  //       so we cannot drop anyone's commits ──
  git(REPO, 'fetch', 'origin', 'master');
  const tipNow = git(REPO, 'rev-parse', 'origin/master');
  if (!tryGit(WT, 'merge-base', '--is-ancestor', tipNow, 'HEAD')) {
    die(`origin/master moved to ${tipNow.slice(0, 8)} mid-run — re-run publish-safe to rebase on it`);
  }

  // ── 7. push (real pre-push gates run; node_modules present) ──
  console.log('\nPushing to master (pre-push gates will run)…');
  try { gitShow(WT, 'push', 'origin', `${BRANCH}:master`); }
  catch { die('push failed (a gate blocked it, or origin moved) — nothing was force-pushed'); }

  console.log('\n✓ Published to master:');
  for (const { subj } of toLand) console.log(`    ${subj}`);
} finally {
  cleanup();
}
console.log('\nDone. Worktree + junctions cleaned up.');
