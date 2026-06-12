#!/usr/bin/env node
/**
 * refresh-registries.mjs — the SINGLE-WRITER replacement for the post-commit
 * registry autocommit.
 *
 * WHY THIS EXISTS
 * ---------------
 * The four admin "registry" snapshots —
 *   • apps/web/src/data/feature-registry.json
 *   • apps/web/src/data/setup-registry.json
 *   • apps/web/src/data/audit-reports.json
 *   • apps/web/src/data/changes-feed.generated.json
 * are all DERIVED from global repo state (git log, scanned routes, audit docs).
 *
 * The old design regenerated + auto-committed them inside post-commit, on EVERY
 * commit, in EVERY worktree (worktrees share core.hooksPath). With several
 * agents committing at once that races: each agent regenerates its own version
 * of the same files and commits it, so the ff-push/merge to master collides and
 * leaves conflict markers in the JSON — every OTHER agent's task then gets
 * "caught up" reconciling churn it never authored. ~Half of this repo's commit
 * history was these chore() commits.
 *
 * The fix is to have exactly ONE writer instead of N racing ones: a scheduled
 * CI job (.github/workflows/registry-refresh.yml) runs this on master, plus
 * `npm run registry:refresh` for an on-demand local refresh. Per-commit
 * autocommit stays OFF (see scripts/hooks/post-commit).
 *
 * Honest by design: pure regeneration from files already in the repo — no LLM,
 * no network. Each scan only ever writes its own one JSON file.
 *
 * Usage:
 *   node scripts/refresh-registries.mjs            # regenerate + commit if changed
 *   node scripts/refresh-registries.mjs --no-commit  # regenerate only (CI/PR flows)
 *   node scripts/refresh-registries.mjs --check    # exit 1 if anything is stale
 */

import { execFileSync, execSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const argv = new Set(process.argv.slice(2));
const NO_COMMIT = argv.has('--no-commit');
const CHECK = argv.has('--check');

// Each scan is a pure single-file writer. node path is relative to ROOT.
const SCANS = [
  { script: 'scripts/scan-features.mjs', file: 'apps/web/src/data/feature-registry.json' },
  { script: 'scripts/scan-setup.mjs', file: 'apps/web/src/data/setup-registry.json' },
  { script: 'scripts/sync-audit-reports.mjs', file: 'apps/web/src/data/audit-reports.json' },
  { script: 'apps/web/scripts/scan-changes.mjs', file: 'apps/web/src/data/changes-feed.generated.json' },
];

const run = (cmd, args) =>
  execFileSync(cmd, args, { cwd: ROOT, stdio: ['ignore', 'ignore', 'inherit'] });

const isClean = (file) => {
  try {
    execSync(`git diff --quiet -- ${file}`, { cwd: ROOT, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};

console.error('refresh-registries: regenerating admin registry snapshots…');

for (const { script } of SCANS) {
  try {
    run('node', [script, '--quiet']);
  } catch (err) {
    // Fail open per-scan: a single broken generator must not wedge the others.
    console.error(`  ! ${script} failed (skipped): ${err.message}`);
  }
}

const changed = SCANS.map((s) => s.file).filter((f) => !isClean(f));

if (changed.length === 0) {
  console.error('refresh-registries: all registries already up to date ✓');
  process.exit(0);
}

console.error(`refresh-registries: ${changed.length} registr${changed.length === 1 ? 'y' : 'ies'} changed:`);
for (const f of changed) console.error(`  • ${f}`);

if (CHECK) {
  console.error('refresh-registries: --check set → registries are STALE. Run `npm run registry:refresh`.');
  process.exit(1);
}

if (NO_COMMIT) {
  console.error('refresh-registries: --no-commit set → leaving changes unstaged.');
  process.exit(0);
}

// Single commit, explicit pathspec — records ONLY these files even if something
// else is staged (cannot sweep another agent's in-flight work; see CLAUDE.md §2).
run('git', ['add', '--', ...changed]);
execFileSync(
  'git',
  ['commit', '-m', 'chore(registries): refresh admin registry snapshots', '--', ...changed],
  { cwd: ROOT, stdio: 'inherit' },
);
console.error('refresh-registries: committed. Push when ready (this script never pushes).');
