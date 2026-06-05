#!/usr/bin/env node
/**
 * install-hooks.mjs — point git at the committed hooks in scripts/hooks.
 *
 * Run once per clone: `npm run hooks:install`. This sets the repo-local
 * `core.hooksPath` to `scripts/hooks` so the committed post-commit hook (which
 * auto-publishes update entries from commit trailers) runs after each commit.
 *
 * It's idempotent and only touches this repository's local git config.
 */

import { execSync } from 'node:child_process';
import { chmodSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

try {
  execSync('git rev-parse --is-inside-work-tree', { cwd: ROOT, stdio: 'ignore' });
} catch {
  console.error('✗ Not inside a git repository — nothing to install.');
  process.exit(1);
}

execSync('git config core.hooksPath scripts/hooks', { cwd: ROOT });

// Make the hook executable (matters on macOS/Linux; harmless on Windows).
const hook = path.join(ROOT, 'scripts/hooks/post-commit');
if (existsSync(hook)) {
  try { chmodSync(hook, 0o755); } catch { /* non-fatal */ }
}

console.log('✓ Git hooks installed: core.hooksPath = scripts/hooks');
console.log('  After each commit, "Update:" / "Dev-Update:" trailers auto-publish to');
console.log('  /updates (draft) and /dev-updates (live). Nothing is ever pushed for you.');
console.log('');
console.log('  To disable: git config --unset core.hooksPath');
