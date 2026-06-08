#!/usr/bin/env node
/**
 * SwingVantage — Duplicate-content & SEO-uniqueness honesty gate.
 *
 * Goal: 0% of public pages can be flagged as a duplicate. Google demotes
 * (and AI answer engines distrust) pages whose <title>, meta description, or
 * primary on-page answer is the same as — or near-identical to — another page.
 *
 * This gate walks EVERY indexable page and the SEO content registries, then
 * fails (exit 1) if it finds, among indexable pages:
 *   1. An exact-duplicate <title>.
 *   2. An exact-duplicate meta description.
 *   3. An exact-duplicate registry "direct answer" (the AEO/GEO lead block).
 *   4. A near-duplicate title / description / direct answer (token-set
 *      similarity above NEAR_DUP).
 *   5. An indexable page with no metadata source at all (no title/description).
 *   6. A raw `metadata = {}` page with no canonical and no noindex.
 *   7. A title or description outside the SEO-safe length window (warning).
 *
 * Pages under /admin, the (app) auth-gated group, (auth), /auth, /api, and any
 * page that declares noindex are treated as non-indexable and excluded from the
 * uniqueness comparison (they are not duplicate-content liabilities).
 *
 * Run:  node scripts/check-duplicate-content.mjs
 * Wired into: npm run audit:growth (CI) and the post-commit growth pipeline.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = process.cwd();
const APP_DIR = join(ROOT, 'apps/web/src/app');
const CONTENT_DIR = join(ROOT, 'apps/web/src/content');

// Similarity thresholds (Jaccard over normalized word sets).
const NEAR_DUP = 0.82; // hard fail — practically the same copy
const SOFT_DUP = 0.7; // warning — uncomfortably similar, worth differentiating

// SEO length windows (chars), measured on the RENDERED <title>/description.
// Ideal is ≤60 / ≤155 (Google's pixel truncation). We warn past these slightly
// looser bounds so the gate flags only copy that is meaningfully too long —
// descriptive long-tail titles in the 60s are fine and Google shows them.
// Outside the window → warning, not failure.
const TITLE_MIN = 15;
const TITLE_MAX = 70;
const DESC_MIN = 70;
const DESC_MAX = 175;

// Routes intentionally exempt from the title-length warning (length only — never
// from duplicate/canonical checks). The homepage <title> deliberately names all
// four primary sports for brand positioning; that is an owner decision, not an
// oversight. Keep this list tiny and justified.
const TITLE_LENGTH_EXEMPT = new Set(['/']);

// ── helpers ────────────────────────────────────────────────────────────────

/** Match a single-quoted JS string literal (allowing \' escapes). */
const STR = "'((?:[^'\\\\]|\\\\.)*)'";

function firstString(block, key) {
  const re = new RegExp(`${key}:\\s*(?:\\r?\\n\\s*)?${STR}`);
  const m = re.exec(block);
  return m ? m[1].replace(/\\'/g, "'").replace(/\\"/g, '"').trim() : null;
}

/** Normalize copy to a comparable token set: lowercase, strip punctuation. */
function tokens(s) {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean),
  );
}

function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return inter / (a.size + b.size - inter);
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

/** route path from an app-router page.tsx file path. */
function routeOf(file) {
  let rel = relative(APP_DIR, file).split(sep).slice(0, -1); // drop page.tsx
  rel = rel.filter((seg) => !(seg.startsWith('(') && seg.endsWith(')'))); // route groups
  return '/' + rel.join('/');
}

const NONINDEX_PREFIXES = ['/admin', '/api'];
const NONINDEX_GROUPS = ['(app)', '(auth)', 'auth']; // auth-gated or utility
function isNonIndexableRoute(file, route, src) {
  const relParts = relative(APP_DIR, file).split(sep);
  if (relParts.some((p) => NONINDEX_GROUPS.includes(p))) return true;
  if (NONINDEX_PREFIXES.some((p) => route === p || route.startsWith(p + '/'))) return true;
  // dynamic public profile pages are intentionally noindex
  if (route.includes('[shareSlug]') || route.includes('/player/')) return true;
  // page (or its own layout) declares noindex, in any of the forms next allows.
  if (src && /noindex|index:\s*false/.test(src)) return true;
  const layoutSrc = layoutMetaSrc(file);
  if (layoutSrc && /noindex|index:\s*false/.test(layoutSrc)) return true;
  return false;
}

/** Read the nearest ancestor layout.tsx (within the app dir) that sets metadata. */
function layoutMetaSrc(file) {
  let dir = join(file, '..');
  while (dir.startsWith(APP_DIR)) {
    const layout = join(dir, 'layout.tsx');
    if (existsSync(layout)) {
      const s = readFileSync(layout, 'utf8');
      if (/export const metadata|generateMetadata|buildMetadata\(/.test(s)) return s;
    }
    const parent = join(dir, '..');
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

// ── 1. parse the SEO registries (registry-backed pages) ─────────────────────

function parseRegistry(file) {
  if (!existsSync(file)) return [];
  const src = readFileSync(file, 'utf8');
  const entries = [];
  // Split into blocks by slug markers; a block runs to the next slug or EOF.
  const slugRe = new RegExp(`slug:\\s*${STR}`, 'g');
  const marks = [];
  let m;
  while ((m = slugRe.exec(src)) !== null) marks.push({ slug: m[1], idx: m.index });
  for (let i = 0; i < marks.length; i++) {
    const block = src.slice(marks[i].idx, i + 1 < marks.length ? marks[i + 1].idx : src.length);
    entries.push({
      slug: marks[i].slug,
      title: firstString(block, 'title'),
      metaDescription: firstString(block, 'metaDescription'),
      directAnswer: firstString(block, 'directAnswer'),
      publishStatus: firstString(block, 'publishStatus') || 'published',
      source: relative(ROOT, file),
    });
  }
  return entries;
}

const registryFiles = ['seoPages.ts', 'seoPagesWedges.ts', 'seoPagesRacket.ts'].map((f) =>
  join(CONTENT_DIR, f),
);
const registry = registryFiles.flatMap(parseRegistry);
// slug → entry (published only) for resolving registry-backed route files.
const publishedRegistry = new Map();
for (const e of registry) if (e.publishStatus === 'published') publishedRegistry.set(e.slug, e);

// ── 2. walk page files, resolve metadata ────────────────────────────────────

const pages = []; // { route, file, title, description, indexable, canonical, hasMeta, dynamic }
const issues = []; // hard failures
const warnings = [];

for (const file of walk(APP_DIR)) {
  if (!file.endsWith('page.tsx')) continue;
  const route = routeOf(file);
  const src = readFileSync(file, 'utf8');
  const indexable = !isNonIndexableRoute(file, route, src);

  const layoutSrc = layoutMetaSrc(file);
  const usesBuildMeta = /buildMetadata\(/.test(src);
  const rawMeta = /export const metadata\b/.test(src);
  const dynamic = /export async function generateMetadata|export function generateMetadata/.test(src);
  // A 'use client' page can't export metadata — its sibling/ancestor layout does.
  const metaFromLayout = !usesBuildMeta && !rawMeta && !dynamic && !!layoutSrc;
  const noindexInFile = /noindex:\s*true|index:\s*false|noindex/.test(src);

  // Resolve title/description. Registry-backed files reference page.title /
  // page.metaDescription — pull the real strings from the registry by slug.
  let title = null;
  let description = null;
  const slugMatch = /const SLUG\s*=\s*['"]([^'"]+)['"]/.exec(src);
  const regSlug = slugMatch?.[1] || route.replace(/^\//, '');
  const regEntry = publishedRegistry.get(regSlug);

  if (/title:\s*page\.title/.test(src) && regEntry) {
    title = regEntry.title;
    description = regEntry.metaDescription;
  } else {
    title = firstString(src, 'title');
    description = firstString(src, 'description');
  }
  // Client-component pages carry their metadata in a layout — read it there.
  if (!title && metaFromLayout && layoutSrc) {
    title = firstString(layoutSrc, 'title');
    description = firstString(layoutSrc, 'description');
  }

  // canonical: buildMetadata derives it from `path` (string literal, template,
  // or an identifier like PATH/SLUG); raw metadata must declare
  // alternates.canonical (or be noindex). Layout-provided metadata carries it.
  const hasPath = /\bpath:\s*[`'"A-Za-z_]/.test(src);
  const layoutHasCanonical =
    !!layoutSrc && (/buildMetadata\(/.test(layoutSrc) || /alternates:\s*\{[^}]*canonical/.test(layoutSrc));
  const hasCanonical = usesBuildMeta
    ? hasPath
    : /alternates:\s*\{[^}]*canonical/.test(src) || (metaFromLayout && layoutHasCanonical);

  const hasMeta = usesBuildMeta || rawMeta || dynamic || metaFromLayout;

  const page = {
    route,
    file: relative(ROOT, file),
    title,
    description,
    indexable,
    dynamic,
    hasMeta,
    hasCanonical: hasCanonical || dynamic, // dynamic pages set canonical at runtime
    noindexInFile,
  };
  pages.push(page);

  if (!indexable) continue;

  // 5. indexable with no metadata source.
  if (!hasMeta) {
    issues.push(`No metadata export on indexable page ${route}  (${page.file})`);
    continue;
  }
  // 6. raw metadata, no canonical, not noindex.
  if (rawMeta && !usesBuildMeta && !page.hasCanonical && !noindexInFile && !dynamic) {
    issues.push(`Missing canonical on indexable page ${route}  (${page.file})`);
  }
  // 6b. page has NO own metadata and only inherits a layout that itself sets no
  // canonical → it gets a generic, non-unique title and no self-canonical.
  if (metaFromLayout && !layoutHasCanonical && !noindexInFile) {
    issues.push(
      `Indexable page ${route} has no own metadata — inherits a generic, non-canonical title (${page.file})`,
    );
  }
  // buildMetadata without an explicit path → canonical silently defaults to '/'.
  if (usesBuildMeta && !hasPath && route !== '/') {
    issues.push(`buildMetadata() without path: on ${route} → canonical defaults to "/"  (${page.file})`);
  }
  // 7. length warnings (only when we could resolve the literal).
  // buildMetadata appends " | SwingVantage" unless the title already contains
  // the brand — measure the TRUE rendered <title> length, not the raw string.
  const rendered =
    (usesBuildMeta || dynamic) && title && !title.includes('SwingVantage')
      ? `${title} | SwingVantage`
      : title;
  if (rendered && rendered.length > TITLE_MAX && !TITLE_LENGTH_EXEMPT.has(route)) {
    warnings.push(`Title ${rendered.length} chars (>${TITLE_MAX}) on ${route}: "${rendered}"`);
  }
  if (description && (description.length < DESC_MIN || description.length > DESC_MAX)) {
    warnings.push(
      `Description ${description.length} chars (want ${DESC_MIN}-${DESC_MAX}) on ${route}`,
    );
  }
}

// ── 3. duplicate detection over indexable pages ─────────────────────────────

const indexablePages = pages.filter((p) => p.indexable && (p.title || p.description));

function reportDuplicates(field, label) {
  const exact = new Map(); // value → [routes]
  for (const p of indexablePages) {
    const v = p[field];
    if (!v) continue;
    const key = v.trim().toLowerCase();
    if (!exact.has(key)) exact.set(key, []);
    exact.get(key).push(p.route);
  }
  for (const [, routes] of exact) {
    if (routes.length > 1) {
      issues.push(`Duplicate ${label} shared by ${routes.length} pages: ${routes.join(', ')}`);
    }
  }
  // near-duplicates (skip pairs already flagged as exact)
  const withField = indexablePages.filter((p) => p[field]);
  const toks = withField.map((p) => tokens(p[field]));
  for (let i = 0; i < withField.length; i++) {
    for (let j = i + 1; j < withField.length; j++) {
      if (withField[i][field].trim().toLowerCase() === withField[j][field].trim().toLowerCase())
        continue;
      const sim = jaccard(toks[i], toks[j]);
      if (sim >= NEAR_DUP) {
        issues.push(
          `Near-duplicate ${label} (${(sim * 100) | 0}% similar): ${withField[i].route}  ↔  ${withField[j].route}`,
        );
      } else if (sim >= SOFT_DUP) {
        warnings.push(
          `Similar ${label} (${(sim * 100) | 0}%): ${withField[i].route}  ↔  ${withField[j].route}`,
        );
      }
    }
  }
}

reportDuplicates('title', 'title');
reportDuplicates('description', 'meta description');

// registry direct-answer uniqueness (published only)
const da = [...publishedRegistry.values()].filter((e) => e.directAnswer);
const daExact = new Map();
for (const e of da) {
  const k = e.directAnswer.trim().toLowerCase();
  if (!daExact.has(k)) daExact.set(k, []);
  daExact.get(k).push(e.slug);
}
for (const [, slugs] of daExact)
  if (slugs.length > 1) issues.push(`Duplicate direct answer shared by: ${slugs.join(', ')}`);
const daTok = da.map((e) => tokens(e.directAnswer));
for (let i = 0; i < da.length; i++) {
  for (let j = i + 1; j < da.length; j++) {
    if (da[i].directAnswer.trim().toLowerCase() === da[j].directAnswer.trim().toLowerCase()) continue;
    const sim = jaccard(daTok[i], daTok[j]);
    if (sim >= NEAR_DUP)
      issues.push(
        `Near-duplicate direct answer (${(sim * 100) | 0}%): ${da[i].slug}  ↔  ${da[j].slug}`,
      );
    else if (sim >= SOFT_DUP)
      warnings.push(`Similar direct answer (${(sim * 100) | 0}%): ${da[i].slug}  ↔  ${da[j].slug}`);
  }
}

// ── 4. report ───────────────────────────────────────────────────────────────

console.log(
  `Scanned ${pages.length} page routes (${indexablePages.length} indexable with resolvable metadata) + ${publishedRegistry.size} published registry pages.\n`,
);

if (warnings.length) {
  console.log(`⚠️  ${warnings.length} warning(s):`);
  warnings.forEach((w) => console.log('   • ' + w));
  console.log('');
}

if (issues.length) {
  console.error(`❌ Duplicate-content audit FAILED — ${issues.length} issue(s):\n`);
  issues.forEach((e) => console.error('   • ' + e));
  console.error('\nEvery indexable page must have a unique title, description, and lead answer.');
  process.exit(1);
}

console.log('✅ Duplicate-content audit passed — every indexable page is unique and canonical.');
