#!/usr/bin/env node
/**
 * generate-social-queue.mjs — flag newly-published blog posts for social.
 *
 * Part of the Blog → Social system. After a commit that ADDS a blog post,
 * this records that post's slug in a small "pending social" queue so the
 * admin Studio (/admin/social) can surface "new posts → generate social".
 *
 * It does NOT generate posts or call any AI — git hooks must stay fast and
 * offline, and Vercel's runtime FS is read-only. The queue file is written
 * at commit time (then committed + shipped) and only READ by the app.
 *
 * Two ways a slug gets queued:
 *   1. Auto-detect: a `slug: '…'` line ADDED to data/blog-posts.ts in HEAD.
 *   2. Explicit trailer: `Social: my-slug, other-slug` in the commit body.
 *
 * Idempotent: keyed by slug; re-running never duplicates. Capped to the most
 * recent entries so the file can't grow without bound.
 *
 * Usage: node scripts/generate-social-queue.mjs [--quiet]
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const QUIET = process.argv.slice(2).includes('--quiet');

const BLOG_FILE = 'apps/web/src/data/blog-posts.ts';
const QUEUE_FILE = path.join(ROOT, 'apps/web/src/data/social-pending.json');
const MAX_ENTRIES = 30;

function log(...a) { if (!QUIET) console.log(...a); }

/** Pure: slugs added (and not also removed) in a unified diff. Exported for tests. */
export function addedSlugsFromDiff(diff) {
  const added = new Set();
  const removed = new Set();
  for (const line of String(diff).split('\n')) {
    if (line.startsWith('+++') || line.startsWith('---')) continue;
    const m = line.match(/^([+-])\s*slug:\s*['"]([a-z0-9-]+)['"]/i);
    if (!m) continue;
    if (m[1] === '+') added.add(m[2]);
    else removed.add(m[2]);
  }
  return [...added].filter((s) => !removed.has(s));
}

/** Pure: parse `Social:` trailer slugs from a commit body. Exported for tests. */
export function socialTrailerSlugs(body) {
  const out = [];
  for (const line of String(body).split('\n')) {
    const m = line.match(/^social:\s*(.+)$/i);
    if (!m) continue;
    for (const s of m[1].split(',').map((x) => x.trim()).filter(Boolean)) out.push(s);
  }
  return out;
}

function readQueue() {
  try {
    const raw = readFileSync(QUEUE_FILE, 'utf8').trim();
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function main() {
  let headHash = '';
  let headDate = new Date().toISOString().slice(0, 10);
  let body = '';
  try {
    headHash = execSync('git log -1 --pretty=%h', { cwd: ROOT, encoding: 'utf8' }).trim();
    headDate = execSync('git log -1 --pretty=%cI', { cwd: ROOT, encoding: 'utf8' }).trim().slice(0, 10);
    body = execSync('git log -1 --pretty=%B', { cwd: ROOT, encoding: 'utf8' });
  } catch {
    /* not in git / no commits — nothing to do */
  }

  let diff = '';
  try {
    diff = execSync(`git diff HEAD~1 HEAD -- ${BLOG_FILE}`, { cwd: ROOT, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  } catch {
    diff = ''; // first commit, or file untouched
  }

  // Only queue slugs that actually exist in the current blog data.
  let blogSrc = '';
  try {
    blogSrc = readFileSync(path.join(ROOT, BLOG_FILE), 'utf8');
  } catch {
    /* ignore */
  }
  const existsInBlog = (slug) => blogSrc.includes(`slug: '${slug}'`) || blogSrc.includes(`slug: "${slug}"`);

  const candidates = Array.from(
    new Set([...addedSlugsFromDiff(diff), ...socialTrailerSlugs(body)]),
  ).filter((s) => (blogSrc ? existsInBlog(s) : true));

  const queue = readQueue();
  const have = new Set(queue.map((e) => e.slug));
  const fresh = candidates.filter((s) => !have.has(s));

  if (fresh.length === 0) {
    log('social-queue: no new blog posts to flag.');
    return;
  }

  for (const slug of fresh) {
    queue.push({ slug, addedAt: headDate, sourceCommit: headHash, status: 'pending' });
  }
  // Keep only the most recent MAX_ENTRIES (newest at the end).
  const trimmed = queue.slice(-MAX_ENTRIES);
  writeFileSync(QUEUE_FILE, JSON.stringify(trimmed, null, 2) + '\n');

  log(`✓ social-queue: flagged ${fresh.length} new post(s) for social → ${path.relative(ROOT, QUEUE_FILE)}`);
  for (const s of fresh) log(`    • ${s}`);
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  try {
    main();
  } catch (e) {
    console.warn(`generate-social-queue: ${e.message}`);
    // Fail open — never block anything.
  }
}
