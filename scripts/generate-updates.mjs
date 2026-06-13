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
 * BOTH product and developer entries land as DRAFTS (hidden) so nothing reaches
 * the public /updates or /dev-updates pages until you flip it live — either by
 * hand in the data file, or from the admin Publishing screen at /admin/updates.
 *
 * A leak guard also refuses to emit any entry whose text looks like it contains
 * a secret, an API key, a source-file path, a scratch marker (TODO/FIXME), OR a
 * proprietary/implementation tell — an env/config-flag name, an internal system
 * codename, or a vendor/library/infra name. /updates and especially /dev-updates
 * are public, competitor-readable pages: they must describe WHAT shipped and WHY
 * it matters for athletes, never HOW it is built. Trailers that trip the guard
 * are skipped with a warning; reword them in plain English and re-run.
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

// Proprietary / implementation terms that must never appear in public update
// copy: internal system codenames plus the vendors, libraries, and infra we
// build on. Distinctive tokens only — words that collide with ordinary English
// (e.g. "react", "node", "sharp") are deliberately omitted to avoid false
// positives; the editorial rule (describe the benefit, not the tech) is the
// primary control and this list is a backstop. Extend it as the stack grows.
const PROPRIETARY_TERMS = [
  // Internal system codenames
  'AIO-4', 'BranchGuardianOS', 'GrowthOS', 'CentralIntelligenceOS', 'securityOS',
  'PublishingOS', 'MotionLab',
  // Vendors / libraries / models / infra
  'Next.js', 'MediaPipe', 'MoveNet', 'Upstash', 'PostHog', 'Supabase',
  'PostgreSQL', 'Postgres', 'Resend', 'OpenAI', 'Gemini', 'Anthropic', 'Claude',
  'Three.js', 'WebGPU', 'WebNN', 'Turborepo', 'IndexedDB', 'localStorage',
  'Redis', 'Tokens Studio',
];

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Case-insensitive, word-bounded alternation over PROPRIETARY_TERMS. */
function proprietaryTermsRegex() {
  return new RegExp(`\\b(?:${PROPRIETARY_TERMS.map(escapeRegex).join('|')})\\b`, 'i');
}

// ── Safety guard: never let a secret or internal detail reach a public page ──
//
// /updates and /dev-updates are public, search-indexed pages. Everything that
// publishes here is opt-in trailer prose YOU write — but a slip (pasting a key,
// a file path, or a scratch note into a trailer) would still become a public
// URL. These patterns are a last line of defence: an entry that trips one is
// skipped with a warning. The commit still lands; reword the trailer and re-run.
const LEAK_PATTERNS = [
  // Vendor API keys / tokens: OpenAI, Stripe, Resend, AWS, GitHub, Supabase, Slack.
  { name: 'API key or token', re: /\b(?:sk-[A-Za-z0-9_-]{16,}|(?:sk|pk|rk)_(?:live|test)_[A-Za-z0-9]{12,}|whsec_[A-Za-z0-9]{16,}|re_[A-Za-z0-9]{12,}|AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{20,}|sb(?:p|_secret)_[A-Za-z0-9_-]{12,}|xox[baprs]-[A-Za-z0-9-]{10,})/ },
  // JSON Web Tokens (e.g. a Supabase anon/service key).
  { name: 'JWT', re: /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{6,}/ },
  // Authorization: Bearer <token>.
  { name: 'bearer token', re: /\bBearer\s+[A-Za-z0-9._~+/-]{20,}/i },
  // KEY=secret / SECRET: value style assignments (env leaks).
  { name: 'secret assignment', re: /\b[A-Z][A-Z0-9_]*(?:KEY|SECRET|TOKEN|PASSWORD|PASSWD|PWD|CREDENTIALS?)\s*[:=]\s*\S{6,}/ },
  // Repo-relative source paths (apps/web/..., src/lib/..., or any file with a code ext).
  { name: 'source file path', re: /\b(?:apps|packages|server|scripts|node_modules)\/[\w./-]+|(?:^|[\s("'])src\/[\w./-]+|(?:[\w-]+\/)+[\w-]+\.(?:tsx?|jsx?|mjs|cjs|sql|env|py)\b/ },
  // Absolute OS paths that should never appear in user-facing copy.
  { name: 'filesystem path', re: /[A-Za-z]:\\[\\\w .-]{3,}|\/(?:home|Users|root|var|etc)\/[\w./-]+/ },
  // Developer scratch markers left in by mistake.
  { name: 'TODO/FIXME marker', re: /\b(?:TODO|FIXME|HACK|XXX|WIP)\b/ },
  // Env / config flag names (ALL_CAPS_WITH_UNDERSCORES). These are pure
  // implementation detail and never belong in athlete-facing copy.
  { name: 'env or config flag name', re: /\b[A-Z][A-Z0-9]{2,}(?:_[A-Z0-9]+)+\b/ },
  // Proprietary / implementation tells: internal system codenames and the
  // vendors, libraries, and infrastructure we build on. We do not name our stack
  // on public pages — describe the benefit, not the technology. (Built from
  // PROPRIETARY_TERMS below so the list stays easy to extend.)
  { name: 'proprietary tool, vendor, or internal codename', re: proprietaryTermsRegex() },
];

/**
 * Scan publishable strings for anything that looks like a secret or an internal
 * detail. Returns `{ name, sample }` for the first match, or null when clean.
 * Exported for tests.
 */
function findLeak(...parts) {
  const text = parts.filter((p) => typeof p === 'string' && p).join('\n');
  for (const { name, re } of LEAK_PATTERNS) {
    const m = text.match(re);
    if (m) return { name, sample: m[0].slice(0, 48) };
  }
  return null;
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
    // Draft by default — hidden from the public /dev-updates page until you flip
    // it live (in the data file or from /admin/updates). Mirrors product updates.
    status: 'draft',
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
      const entry = buildProductEntry(commit, t, nextSortOrder);
      if (entry) {
        const leak = findLeak(
          entry.title, entry.summary, entry.userBenefit, entry.whyItMatters,
          entry.whereToFindIt, entry.userActionRequired, ...(entry.audience || []),
        );
        if (leak) {
          warn(`  ✗ ${commit.shortHash}: SKIPPED product update — text looks like it contains a ${leak.name} ("${leak.sample}…"). Reword the Update: trailer and re-run; nothing was published.`);
        } else {
          nextSortOrder++;
          // Guarantee a unique slug.
          if (usedSlugs.has(entry.slug)) entry.slug = `${entry.slug}-${commit.shortHash}`;
          usedSlugs.add(entry.slug);
          productIds.add(entry.id);
          newProduct.push(entry);
        }
      }
    }

    if (t['dev-update'] && !devIds.has(`dev-c-${commit.shortHash}`)) {
      const entry = buildDevEntry(commit, t);
      if (entry) {
        const leak = findLeak(
          entry.title, entry.headline, entry.details,
          ...(entry.highlights || []), ...(entry.stack || []),
        );
        if (leak) {
          warn(`  ✗ ${commit.shortHash}: SKIPPED dev update — text looks like it contains a ${leak.name} ("${leak.sample}…"). Reword the Dev-Update: trailer and re-run; nothing was published.`);
        } else {
          devIds.add(entry.id);
          newDev.push(entry);
        }
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
export { slugify, displayDate, parseTrailers, splitList, buildProductEntry, buildDevEntry, findLeak };

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  try {
    main();
  } catch (e) {
    warn(`generate-updates: ${e.message}`);
    process.exitCode = 1;
  }
}
