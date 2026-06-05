#!/usr/bin/env node
/**
 * generate-updates.mjs — turn opt-in commit trailers into published updates.
 *
 * This is the engine behind the "automatically publish updates when I push"
 * system. It scans recent git commits for two opt-in trailers:
 *
 *   Update:      <one plain-English line for athletes>   → /updates  (product)
 *   Dev-Update:  <one technical line for builders>       → /dev-updates (engineering)
 *
 * A single commit can carry either, both, or neither. Commits with NEITHER
 * trailer are ignored — so refactors, dependency bumps, CI tweaks, and minor
 * fixes never reach the public page unless you explicitly opt them in.
 *
 * Product entries land as DRAFTS (status: draft / visibility: private) so they
 * stay hidden until you flip them live. Developer entries publish immediately
 * because /dev-updates is the engineering log.
 *
 * Optional, finer-grained trailers (all single-line):
 *   Product:  Update-Title, Update-Summary, Update-Category, Update-Sport,
 *             Update-Benefit, Update-Why, Update-Where, Update-Action,
 *             Update-Audience (comma-separated)
 *   Dev:      Dev-Title, Dev-Details, Dev-Category, Dev-Impact (major|notable|
 *             foundational), Dev-Stack (comma-separated),
 *             Dev-Highlights (semicolon-separated), Dev-Milestone (true|false)
 *
 * The script is idempotent: each entry is keyed by its source commit's short
 * SHA, so re-running it never creates duplicates. Run it manually with
 * `npm run updates:generate`, or let the installed git hook run it for you
 * (`npm run hooks:install`).
 *
 * Usage: node scripts/generate-updates.mjs [--quiet] [--limit N]
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const QUIET = args.includes('--quiet');
const LIMIT = (() => {
  const i = args.indexOf('--limit');
  return i !== -1 && args[i + 1] ? parseInt(args[i + 1], 10) : 300;
})();

const PRODUCT_FILE = path.join(ROOT, 'apps/web/src/data/auto-updates.json');
const DEV_FILE = path.join(ROOT, 'apps/web/src/data/auto-dev-updates.json');

// ── Allowed value sets (must mirror the TypeScript unions) ──────────────────

const PRODUCT_CATEGORIES = new Set([
  'New Feature', 'Training Improvement', 'Equipment', 'Data & Insights',
  'Multi-Sport Expansion', 'Golf Training', 'Tennis Training', 'Baseball Training',
  'Softball Training', 'Video & Swing Comparison', 'Progress Tracking',
  'Account & Data', 'Mobile Experience', 'Website', 'SEO & Discoverability',
  'Security & Privacy', 'Product Updates',
]);
const SPORTS = new Set([
  'All Sports', 'Golf', 'Tennis', 'Baseball', 'Slow Pitch Softball', 'Fast Pitch Softball',
]);
const DEV_CATEGORIES = new Set([
  'AI & Vision', 'Motion Intelligence', 'Architecture', 'Platform', 'Performance',
  'Design System', 'Security & Privacy', 'Developer Experience',
]);
const DEV_IMPACTS = new Set(['major', 'notable', 'foundational']);

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// ── Small helpers ───────────────────────────────────────────────────────────

function log(...a) { if (!QUIET) console.log(...a); }
function warn(...a) { console.warn(...a); }

function slugify(s) {
  return String(s)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
    .replace(/^-|-$/g, '');
}

function isoDate(iso) { return iso.slice(0, 10); }
function displayDate(iso) {
  const d = new Date(iso);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function readJsonArray(file) {
  let raw;
  try {
    raw = readFileSync(file, 'utf8').trim();
  } catch {
    return [];
  }
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('not an array');
    return parsed;
  } catch (e) {
    throw new Error(`Refusing to overwrite ${path.relative(ROOT, file)} — it is not valid JSON (${e.message}). Fix it by hand first.`);
  }
}

function writeJsonArray(file, arr) {
  writeFileSync(file, JSON.stringify(arr, null, 2) + '\n');
}

/**
 * Parse our opt-in trailers out of a commit body. Trailers are single-line
 * `Key: value` entries (git-trailer style). First occurrence of a key wins.
 */
function parseTrailers(body) {
  const out = {};
  for (const line of body.split('\n')) {
    const m = line.match(/^([A-Za-z][A-Za-z-]*):\s?(.*)$/);
    if (!m) continue;
    const key = m[1].toLowerCase();
    if (out[key] === undefined) out[key] = m[2].trim();
  }
  return out;
}

function splitList(v, sep = ',') {
  if (!v) return [];
  return v.split(sep).map((s) => s.trim()).filter(Boolean);
}

// ── Read commits ────────────────────────────────────────────────────────────

const US = '\x1f'; // unit separator between fields
const RS = '\x1e'; // record separator between commits

function readCommits() {
  let raw;
  try {
    raw = execSync(
      `git log -n ${LIMIT} --no-merges --pretty=format:%H${US}%h${US}%cI${US}%B${RS}`,
      { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
    );
  } catch (e) {
    throw new Error(`Could not read git history: ${e.message}`);
  }
  return raw
    .split(RS)
    .map((r) => r.replace(/^\n/, ''))
    .filter(Boolean)
    .map((rec) => {
      const [fullHash, shortHash, date, ...rest] = rec.split(US);
      const body = rest.join(US); // body may legitimately be empty
      return { fullHash, shortHash, date, body: body ?? '' };
    });
}

// ── Build entries ───────────────────────────────────────────────────────────

function buildProductEntry(commit, t, nextSortOrder) {
  const summary = t['update-summary'] || t['update'];
  const title = t['update-title'] || t['update'];
  if (!title) return null;

  let category = t['update-category'] || 'Product Updates';
  if (!PRODUCT_CATEGORIES.has(category)) {
    warn(`  ! ${commit.shortHash}: unknown Update-Category "${category}" → using "Product Updates"`);
    category = 'Product Updates';
  }

  const entry = {
    id: `update-c-${commit.shortHash}`,
    title,
    slug: slugify(title) || `update-${commit.shortHash}`,
    summary,
    releaseDate: isoDate(commit.date),
    displayDate: displayDate(commit.date),
    category,
    status: 'draft',
    visibility: 'private',
    sortOrder: nextSortOrder,
    audience: splitList(t['update-audience']).length ? splitList(t['update-audience']) : ['all athletes'],
    userBenefit: t['update-benefit'] || summary,
    whyItMatters: t['update-why'] || '',
    isFeatured: false,
    isMajorMilestone: false,
    createdAt: isoDate(commit.date),
    updatedAt: isoDate(commit.date),
    autoGenerated: true,
    sourceCommit: commit.shortHash,
  };

  if (t['update-sport']) {
    if (SPORTS.has(t['update-sport'])) entry.sport = t['update-sport'];
    else warn(`  ! ${commit.shortHash}: unknown Update-Sport "${t['update-sport']}" → omitted`);
  }
  if (t['update-where']) entry.whereToFindIt = t['update-where'];
  if (t['update-action']) entry.userActionRequired = t['update-action'];

  return entry;
}

function buildDevEntry(commit, t) {
  const headline = t['dev-update'];
  if (!headline) return null;

  let category = t['dev-category'] || 'Platform';
  if (!DEV_CATEGORIES.has(category)) {
    warn(`  ! ${commit.shortHash}: unknown Dev-Category "${category}" → using "Platform"`);
    category = 'Platform';
  }
  let impact = (t['dev-impact'] || 'notable').toLowerCase();
  if (!DEV_IMPACTS.has(impact)) {
    warn(`  ! ${commit.shortHash}: unknown Dev-Impact "${impact}" → using "notable"`);
    impact = 'notable';
  }

  const entry = {
    id: `dev-c-${commit.shortHash}`,
    title: t['dev-title'] || headline,
    date: isoDate(commit.date),
    displayDate: displayDate(commit.date),
    category,
    impact,
    headline,
    details: t['dev-details'] || headline,
    autoGenerated: true,
    sourceCommit: commit.shortHash,
  };

  const highlights = splitList(t['dev-highlights'], ';');
  if (highlights.length) entry.highlights = highlights;
  const stack = splitList(t['dev-stack']);
  if (stack.length) entry.stack = stack;
  if ((t['dev-milestone'] || '').toLowerCase() === 'true') entry.isMilestone = true;

  return entry;
}

// ── Main ────────────────────────────────────────────────────────────────────

function main() {
  const commits = readCommits();
  const product = readJsonArray(PRODUCT_FILE);
  const dev = readJsonArray(DEV_FILE);

  const productIds = new Set(product.map((e) => e.id));
  const devIds = new Set(dev.map((e) => e.id));
  const usedSlugs = new Set(product.map((e) => e.slug));

  let nextSortOrder = product.reduce((max, e) => Math.max(max, e.sortOrder || 0), 0);
  nextSortOrder = Math.max(nextSortOrder + 1, 1000);

  const newProduct = [];
  const newDev = [];

  // Walk oldest → newest so sortOrder increases with recency.
  for (const commit of [...commits].reverse()) {
    const t = parseTrailers(commit.body);

    if (t['update'] && !productIds.has(`update-c-${commit.shortHash}`)) {
      const entry = buildProductEntry(commit, t, nextSortOrder++);
      if (entry) {
        // Guarantee a unique slug.
        if (usedSlugs.has(entry.slug)) entry.slug = `${entry.slug}-${commit.shortHash}`;
        usedSlugs.add(entry.slug);
        productIds.add(entry.id);
        newProduct.push(entry);
      }
    }

    if (t['dev-update'] && !devIds.has(`dev-c-${commit.shortHash}`)) {
      const entry = buildDevEntry(commit, t);
      if (entry) {
        devIds.add(entry.id);
        newDev.push(entry);
      }
    }
  }

  if (newProduct.length) {
    writeJsonArray(PRODUCT_FILE, [...product, ...newProduct]);
  }
  if (newDev.length) {
    writeJsonArray(DEV_FILE, [...dev, ...newDev]);
  }

  // ── Report ────────────────────────────────────────────────────────────────
  if (!newProduct.length && !newDev.length) {
    log('No new update trailers found. Nothing to publish.');
    return;
  }

  log('');
  if (newProduct.length) {
    log(`✓ ${newProduct.length} product update${newProduct.length !== 1 ? 's' : ''} → ${path.relative(ROOT, PRODUCT_FILE)} (DRAFT)`);
    for (const e of newProduct) log(`    • ${e.sourceCommit}  ${e.title}`);
  }
  if (newDev.length) {
    log(`✓ ${newDev.length} developer update${newDev.length !== 1 ? 's' : ''} → ${path.relative(ROOT, DEV_FILE)} (LIVE)`);
    for (const e of newDev) log(`    • ${e.sourceCommit}  ${e.title}`);
  }
  if (newProduct.length) {
    log('');
    log('  Product updates are DRAFTS — they stay hidden from /updates until you');
    log('  flip "status" to "published" and "visibility" to "public" in:');
    log(`    ${path.relative(ROOT, PRODUCT_FILE)}`);
  }
  log('');
}

// Exported for tests; main() only runs when invoked directly.
export { slugify, displayDate, parseTrailers, splitList, buildProductEntry, buildDevEntry };

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  try {
    main();
  } catch (e) {
    warn(`generate-updates: ${e.message}`);
    process.exitCode = 1;
  }
}
