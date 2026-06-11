// ============================================================
// SwingVantage — "What changed" scanner
// ------------------------------------------------------------
// Snapshots the last 30 days of commits on the current branch into a
// committed JSON the admin dashboard reads (same pattern as
// scan-branches.mjs → BranchGuardian). The app NEVER runs git; this
// script does, at commit/CI time. Conventional-commit fields only —
// the plain-English summary is derived at runtime by lib/admin/changes.
//
//   node scripts/scan-changes.mjs
//   npm run changes:scan
//
// Wire into the post-commit hook to keep it "automatic" on every commit.
// Entries are pruned to the 30-day window again at runtime, so a stale
// snapshot can only ever show LESS, never fabricate.
// ============================================================

import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, '..', 'src', 'data', 'changes-feed.generated.json');
const WINDOW_DAYS = 30;
const MAX_ENTRIES = 80; // cap the snapshot — the scroller shows ~24, the window prunes the rest
const SEP = '\x1f'; // unit separator — safe inside commit subjects

const fmt = ['%H', '%aI', '%s'].join(SEP);
let raw = '';
try {
  raw = execFileSync('git', ['log', `--since=${WINDOW_DAYS} days ago`, `--pretty=format:${fmt}`], {
    encoding: 'utf8',
  });
} catch (e) {
  console.error('scan-changes: git log failed —', e.message);
  process.exit(1);
}

// Keep in sync with lib/admin/changes/laymanize.ts parseConventional().
const CONV = /^(\w+)(?:\(([^)]+)\))?!?:\s*(.+)$/;
// Drop the auto-generated registry-refresh chores so the feed stays signal.
const NOISE = /^chore\(registry|^chore: (?:refresh|regenerate) (?:registr|feature|setup|audit)/i;

const rows = raw
  .split('\n')
  .filter(Boolean)
  .map((line) => {
    const [sha, at, subject = ''] = line.split(SEP);
    const s = subject.trim();
    const m = CONV.exec(s);
    return m
      ? { sha, at, type: m[1].toLowerCase(), scope: m[2] || undefined, subject: m[3], _raw: s }
      : { sha, at, type: 'other', subject: s, _raw: s };
  })
  .filter((r) => !NOISE.test(r._raw))
  .slice(0, MAX_ENTRIES) // git log is newest-first
  .map(({ _raw, ...r }) => r);

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(rows, null, 2) + '\n');
console.log(`scan-changes: wrote ${rows.length} commits (last ${WINDOW_DAYS}d) → ${OUT}`);
