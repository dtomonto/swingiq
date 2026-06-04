#!/usr/bin/env node
// ============================================================
// SwingIQ — Agent Worktree Helper (worktree-per-agent convention)
//
// Several agents (interactive + scheduled) work on this repo at once. If they
// all edit the SAME working tree they collide: the shared git index races, and
// one agent switching branches yanks it out from under another mid-commit.
//
// The convention: EACH agent works in its OWN git worktree. This script makes
// that one command. node_modules is shared from the main repo via a Windows
// directory JUNCTION so the worktree can type-check/build without a slow,
// multi-GB reinstall.
//
// Usage:
//   node scripts/agent-worktree.mjs create <name>   # make/ensure ../swiq-agents/<name>
//   node scripts/agent-worktree.mjs remove <name>   # tear it down (junction-safe)
//   node scripts/agent-worktree.mjs list            # show agent worktrees
//
// Each worktree is on its own branch `agent/<name>` based on origin/master.
// See docs/AGENT_WORKTREE_CONVENTION.md for the full workflow.
// ============================================================

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// Worktrees live in a sibling folder of the repo (off OneDrive, not nested).
const ROOT = join(dirname(REPO), 'swiq-agents');

const run = (cmd, cwd = REPO) => execSync(cmd, { cwd, stdio: 'inherit' });
const cap = (cmd, cwd = REPO) => execSync(cmd, { cwd, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();

const wtPath = (name) => join(ROOT, name);
const branchOf = (name) => `agent/${name}`;

function ensureNodeModules(p) {
  const nm = join(p, 'node_modules');
  if (existsSync(nm)) return; // already a junction or a real install
  // Windows directory junction — no admin needed, instant, shares the repo deps.
  run(`cmd /c mklink /J "${nm}" "${join(REPO, 'node_modules')}"`);
}

function create(name) {
  if (!name) throw new Error('usage: node scripts/agent-worktree.mjs create <name>');
  run('git fetch origin --quiet');
  const p = wtPath(name);
  if (!existsSync(p)) {
    const br = branchOf(name);
    const exists = cap(`git branch --list ${br}`).length > 0;
    // New branch from origin/master, or reuse the existing agent branch.
    run(`git worktree add ${exists ? '' : '-b ' + br} "${p}" ${exists ? br : 'origin/master'}`);
  }
  ensureNodeModules(p);
  console.log(p); // print the path so callers can cd into it
}

function remove(name) {
  if (!name) throw new Error('usage: node scripts/agent-worktree.mjs remove <name>');
  const p = wtPath(name);
  const nm = join(p, 'node_modules');
  // CRITICAL: drop the junction FIRST (non-recursive rmdir removes only the link,
  // never the repo's real node_modules) so the recursive worktree delete can't
  // follow it into the main repo.
  try { run(`cmd /c rmdir "${nm}"`); } catch { /* not a junction / not empty — fine */ }
  try { run(`git worktree remove --force "${p}"`); } catch { /* already gone */ }
  console.log(`removed ${p}`);
}

function list() {
  run('git worktree list');
}

const [cmd, name] = process.argv.slice(2);
if (cmd === 'create') create(name);
else if (cmd === 'remove') remove(name);
else if (cmd === 'list') list();
else {
  console.log('usage: node scripts/agent-worktree.mjs create|remove|list <name>');
  process.exit(1);
}
