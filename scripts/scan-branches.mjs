#!/usr/bin/env node
/**
 * scan-branches.mjs — produce the BranchGuardianOS git/worktree snapshot.
 *
 * IN PLAIN ENGLISH: this is the ONLY place BranchGuardianOS touches git. It runs
 * a fixed set of READ-ONLY git inspection commands, parses their output, and
 * writes a committed JSON snapshot to
 * apps/web/src/data/branch-guardian-snapshot.json. The Next.js app NEVER shells
 * out to git (production has no .git and a read-only filesystem); it reads this
 * snapshot instead — exactly the pattern scan-setup.mjs / sync-audit-reports.mjs
 * already use.
 *
 * SAFETY:
 *   • Read-only. It never checks out, deletes, prunes, pushes or mutates git.
 *   • Fixed command templates only — no user-provided shell ever runs here.
 *   • Stores METADATA only. Untracked files that look risky (.env, *.key, dumps)
 *     are recorded BY PATH/NAME only, never by content, and every free-text
 *     field is run through a conservative secret redactor before it is written.
 *
 * CADENCE: run manually (`npm run scan:branches`), on the monthly hygiene
 * cadence (docs/scheduled-audits-registry.md), or as the one-time initial scan.
 * It is intentionally NOT wired into the post-commit hook — capturing HEAD on
 * every commit would churn a new snapshot commit each time.
 *
 * Usage: node scripts/scan-branches.mjs [--quiet] [--print] [--no-write] [--main <name>]
 */

import { execSync } from 'node:child_process';
import { writeFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_FILE = path.join(ROOT, 'apps/web/src/data/branch-guardian-snapshot.json');
const SCHEMA_VERSION = 1;

const args = process.argv.slice(2);
const QUIET = args.includes('--quiet');
const PRINT = args.includes('--print');
const NO_WRITE = args.includes('--no-write');
const MAIN_OVERRIDE = (() => {
  const i = args.indexOf('--main');
  return i !== -1 && args[i + 1] ? args[i + 1] : null;
})();

const log = (...a) => { if (!QUIET) console.log(...a); };
const warn = (...a) => console.warn(...a);

// Field/record separators (control chars never appear in branch names/subjects).
const US = '\x1f';

// ── secret redaction (mirrors lib/security-os/redaction ethic, JS port) ──────
// Conservative: would rather over-mask than ever leak a credential into the
// committed snapshot. Snapshot fields are paths/names/subjects, but a stray
// token in a commit subject must never survive.
const SECRET_PATTERNS = [
  [/-----BEGIN[\s\S]*?PRIVATE KEY-----[\s\S]*?-----END[\s\S]*?PRIVATE KEY-----/g, '[redacted:private-key]'],
  [/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, '[redacted:jwt]'],
  [/\b(?:sk|pk|rk)-[A-Za-z0-9]{16,}\b/g, '[redacted:api-key]'],
  [/\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g, '[redacted:token]'],
  [/\bghp_[A-Za-z0-9]{20,}\b/g, '[redacted:token]'],
  [/\bAKIA[0-9A-Z]{16}\b/g, '[redacted:aws-key]'],
  [/\bBearer\s+[A-Za-z0-9._-]{12,}\b/gi, 'Bearer [redacted]'],
  [/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '[redacted:email]'],
  [/\b([A-Za-z0-9_-]{40,})\b/g, '[redacted:secret]'],
];
function redact(input) {
  let out = String(input ?? '');
  for (const [re, label] of SECRET_PATTERNS) out = out.replace(re, label);
  return out;
}

// ── risky untracked-file classification (by NAME only) ───────────────────────
const RISKY_FILE = [
  { re: /(^|[\\/])\.env(\.|$)/i, kind: 'env-file' },
  { re: /\.(pem|key|p12|pfx|keystore|jks)$/i, kind: 'private-key' },
  { re: /(^|[\\/])id_rsa(\.|$)|(^|[\\/])id_ed25519/i, kind: 'ssh-key' },
  { re: /\.(sql|dump|bak)$/i, kind: 'db-dump' },
  { re: /\.(log)$/i, kind: 'log-file' },
  { re: /(secret|credential|password|token)s?\.[a-z0-9]+$/i, kind: 'secret-name' },
];
function classifyRisky(filePath) {
  for (const { re, kind } of RISKY_FILE) if (re.test(filePath)) return kind;
  return null;
}

// ── git helpers (every failure degrades to null — never throws upward) ────────
function git(cmdArgs, cwd = ROOT) {
  try {
    return execSync(`git ${cmdArgs}`, {
      cwd,
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trimEnd();
  } catch {
    return null;
  }
}
/** Quote a git-provided path safely; reject the (impossible) case of a quote. */
function q(p) {
  if (typeof p !== 'string' || p.includes('"')) return null;
  return `"${p}"`;
}

function isGitRepo() {
  return git('rev-parse --is-inside-work-tree') === 'true';
}

function detectMainBranch() {
  if (MAIN_OVERRIDE) return MAIN_OVERRIDE;
  // Prefer a real LOCAL main/master ref first — origin/HEAD can be stale and
  // point at a long-gone branch (it did in this repo), so it's a last resort.
  for (const name of ['main', 'master']) {
    if (git(`rev-parse --verify --quiet refs/heads/${name}`) !== null) return name;
  }
  const remoteHead = git('symbolic-ref --quiet refs/remotes/origin/HEAD');
  if (remoteHead) {
    const m = remoteHead.match(/refs\/remotes\/origin\/(.+)$/);
    // Only trust it if the matching local branch actually exists.
    if (m && git(`rev-parse --verify --quiet refs/heads/${m[1]}`) !== null) return m[1];
  }
  return git('rev-parse --abbrev-ref HEAD') || 'main';
}

/** Parse `git status --porcelain` into modified + untracked (+ risky) counts. */
function parseStatus(cwd) {
  const raw = git('status --porcelain', cwd);
  if (raw === null) return null;
  const lines = raw.split('\n').filter(Boolean);
  let modified = 0;
  const untrackedRisky = [];
  let untracked = 0;
  for (const line of lines) {
    const code = line.slice(0, 2);
    const file = line.slice(3);
    if (code === '??') {
      untracked += 1;
      const kind = classifyRisky(file);
      if (kind) untrackedRisky.push({ path: redact(file), kind });
    } else {
      modified += 1;
    }
  }
  return { modified, untracked, untrackedRisky: untrackedRisky.slice(0, 25) };
}

/** Detect an in-progress merge/rebase/cherry-pick from git's own state files. */
function detectInProgressOp() {
  const checks = [
    ['MERGE_HEAD', 'merge'],
    ['rebase-merge', 'rebase'],
    ['rebase-apply', 'rebase'],
    ['CHERRY_PICK_HEAD', 'cherry-pick'],
    ['REVERT_HEAD', 'revert'],
    ['BISECT_LOG', 'bisect'],
  ];
  for (const [marker, label] of checks) {
    const p = git(`rev-parse --git-path ${marker}`);
    if (p && existsSync(path.isAbsolute(p) ? p : path.join(ROOT, p))) return label;
  }
  return null;
}

// ── inventory builders ───────────────────────────────────────────────────────

function collectLocalBranches(mainBranch, worktreeByBranch) {
  const fmt = ['%(refname:short)', '%(committerdate:iso8601-strict)', '%(authorname)',
    '%(upstream:short)', '%(upstream:track)', '%(objectname:short)', '%(contents:subject)'].join(US);
  const raw = git(`for-each-ref --sort=-committerdate --format=${q(fmt)} refs/heads`);
  if (raw === null) return [];

  // Branches fully merged into main (local detection, no network).
  const mergedRaw = git(`branch --merged ${q(mainBranch) ?? mainBranch} --format=%(refname:short)`);
  const merged = new Set((mergedRaw ?? '').split('\n').map((s) => s.trim()).filter(Boolean));

  const current = git('rev-parse --abbrev-ref HEAD');

  const out = [];
  for (const line of raw.split('\n').filter(Boolean)) {
    const [name, date, author, upstream, track, sha, subject] = line.split(US);
    if (!name) continue;

    // Ahead/behind vs MAIN (local-only). Format: "<behind>\t<ahead>".
    let aheadOfMain = null;
    let behindMain = null;
    if (name !== mainBranch) {
      const rl = git(`rev-list --left-right --count ${q(mainBranch) ?? mainBranch}...${q(name) ?? name}`);
      if (rl) {
        const [behind, ahead] = rl.split(/\s+/).map((n) => parseInt(n, 10));
        if (Number.isFinite(behind)) behindMain = behind;
        if (Number.isFinite(ahead)) aheadOfMain = ahead;
      }
    } else {
      aheadOfMain = 0;
      behindMain = 0;
    }

    const wt = worktreeByBranch.get(name) ?? null;
    out.push({
      name,
      lastCommitISO: date || null,
      author: redact(author || ''),
      subject: redact((subject || '').slice(0, 140)),
      sha: sha || null,
      upstream: upstream || null,
      upstreamGone: /\bgone\b/.test(track || ''),
      aheadOfMain,
      behindMain,
      merged: merged.has(name),
      isCurrent: name === current,
      hasWorktree: Boolean(wt),
      worktreePath: wt,
    });
  }
  return out;
}

function collectRemoteBranches() {
  const raw = git('for-each-ref --format=%(refname:short) refs/remotes');
  if (raw === null) return { names: [], count: 0 };
  const names = raw.split('\n').map((s) => s.trim()).filter((s) => s && !/\/HEAD$/.test(s));
  return { names: names.slice(0, 200), count: names.length };
}

/** Parse `git worktree list --porcelain` into structured worktree records. */
function collectWorktrees() {
  const raw = git('worktree list --porcelain');
  if (raw === null) return [];
  const blocks = raw.split('\n\n').map((b) => b.trim()).filter(Boolean);
  const out = [];
  let first = true;
  for (const block of blocks) {
    const rec = { path: null, branch: null, head: null, isPrimary: first, locked: false, prunable: false };
    for (const line of block.split('\n')) {
      if (line.startsWith('worktree ')) rec.path = line.slice('worktree '.length);
      else if (line.startsWith('HEAD ')) rec.head = line.slice('HEAD '.length, line.length).slice(0, 12);
      else if (line.startsWith('branch ')) rec.branch = line.slice('branch '.length).replace(/^refs\/heads\//, '');
      else if (line === 'detached') rec.branch = null;
      else if (line.startsWith('locked')) rec.locked = true;
      else if (line.startsWith('prunable')) rec.prunable = true;
    }
    first = false;
    if (!rec.path) continue;
    const missingPath = !existsSync(rec.path);
    const status = missingPath ? null : parseStatus(rec.path);
    // git emits forward slashes; resolve both sides so Windows comparisons work.
    const isCurrent = path.resolve(rec.path) === path.resolve(ROOT);
    const rel = path.relative(ROOT, rec.path);
    out.push({
      path: redact(isCurrent ? '.' : rel || rec.path),
      branch: rec.branch,
      head: rec.head,
      isPrimary: rec.isPrimary,
      isCurrent,
      locked: rec.locked,
      prunable: rec.prunable,
      missingPath,
      dirty: status,
    });
  }
  return out;
}

function collectStashes() {
  const raw = git('stash list --format=%gd%x1f%gs');
  if (raw === null) return { items: [], count: 0 };
  const items = raw.split('\n').filter(Boolean).map((line) => {
    const [ref, subject] = line.split(US);
    return { ref: ref || '', subject: redact((subject || '').slice(0, 120)) };
  });
  return { items: items.slice(0, 50), count: items.length };
}

// ── main ─────────────────────────────────────────────────────────────────────
function build() {
  if (!isGitRepo()) {
    return {
      schemaVersion: SCHEMA_VERSION,
      generatedAt: new Date().toISOString(),
      git: false,
      note: 'Not a git repository (or git unavailable). BranchGuardianOS has no data to show.',
      mainBranch: null,
      currentBranch: null,
      branches: [],
      remoteBranches: [],
      remoteBranchCount: 0,
      worktrees: [],
      stashes: [],
      stashCount: 0,
      inProgressOp: null,
      currentDirty: null,
    };
  }

  const mainBranch = detectMainBranch();
  const currentBranch = git('rev-parse --abbrev-ref HEAD');
  const worktrees = collectWorktrees();

  // Map branch → worktree display path (for the "hasWorktree" flag on branches).
  const worktreeByBranch = new Map();
  for (const w of worktrees) {
    if (w.branch) worktreeByBranch.set(w.branch, w.path);
  }

  const branches = collectLocalBranches(mainBranch, worktreeByBranch);
  const remote = collectRemoteBranches();
  const stashes = collectStashes();

  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    git: true,
    note:
      'AUTO-GENERATED by scripts/scan-branches.mjs — do not edit by hand. ' +
      'Read-only git inventory for BranchGuardianOS (/admin/branch-guardian). ' +
      'Metadata only; risky untracked files are listed by path, never by content.',
    repoRoot: redact(path.basename(ROOT)),
    mainBranch,
    currentBranch,
    inProgressOp: detectInProgressOp(),
    currentDirty: parseStatus(ROOT),
    branches,
    remoteBranches: remote.names,
    remoteBranchCount: remote.count,
    worktrees,
    stashes: stashes.items,
    stashCount: stashes.count,
  };
}

function main() {
  const snapshot = build();
  if (PRINT) console.log(JSON.stringify(snapshot, null, 2));
  if (!NO_WRITE) writeFileSync(OUT_FILE, JSON.stringify(snapshot, null, 2) + '\n');

  log('');
  if (!snapshot.git) {
    log('✓ BranchGuardian snapshot: not a git repo — wrote an empty snapshot.');
  } else {
    const dirtyWt = snapshot.worktrees.filter((w) => w.dirty && (w.dirty.modified || w.dirty.untracked)).length;
    log(`✓ BranchGuardian snapshot: ${snapshot.branches.length} branch(es), ` +
        `${snapshot.worktrees.length} worktree(s) (${dirtyWt} with changes), ` +
        `${snapshot.stashCount} stash(es), ${snapshot.remoteBranchCount} remote ref(s) ` +
        `→ ${path.relative(ROOT, OUT_FILE)}`);
    log(`  main: ${snapshot.mainBranch} · current: ${snapshot.currentBranch}` +
        (snapshot.inProgressOp ? ` · in-progress: ${snapshot.inProgressOp}` : ''));
  }
  log('  Review at /admin/branch-guardian.');
  log('');
}

export { redact, classifyRisky, parseStatus, detectMainBranch, build };

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  try { main(); } catch (e) { warn(`scan-branches: ${e.message}`); process.exitCode = 1; }
}
