#!/usr/bin/env node
/**
 * SwingVantage — Sitemap COVERAGE check (the honesty gate).
 *
 * check-sitemap.mjs guards one direction (every sitemap entry resolves to a
 * real route — no 404s). This guards the OTHER direction: every public
 * marketing page is accounted for, so a new page is never silently left out
 * of the sitemap.
 *
 * IMPORTANT — this is a *review gate*, not an auto-include. By policy the
 * sitemap only lists pages that help SEO / credibility / trust; we never
 * blanket-add every route. So when a new public page appears this check
 * FAILS and asks you to make one explicit choice:
 *
 *   (a) the page is trust-positive  → add it to the sitemap (or its registry:
 *       BLOG_POSTS / CHALLENGES / seoPages.ts), or
 *   (b) the page is not for the index → add its path to EXCLUDE below with a
 *       one-line reason.
 *
 * A page counts as "covered" (no action needed) when it is:
 *   • a literal path already in app/sitemap.ts, OR
 *   • a registry-driven SEO page (its page.tsx imports @/content/seoPages —
 *     so it is in PUBLISHED_SEO_PAGES and therefore already in the sitemap), OR
 *   • under a section the sitemap enumerates from a registry (/blog, /challenges).
 *
 * Only PUBLIC pages are considered: the (marketing) route group. Auth-gated
 * (app)/(auth) routes, /admin, /api and dynamic [param] routes are out of scope.
 *
 * Exit 1 on any unreviewed public page. Run: npm run check:sitemap:coverage
 */
import { readFileSync } from 'fs';
import { join, sep } from 'path';
import { walk } from './lib/fsutil.mjs';

const ROOT = process.cwd();
const APP_DIR = join(ROOT, 'apps/web/src/app');
const MARKETING_DIR = join(APP_DIR, '(marketing)');
const SITEMAP = join(APP_DIR, 'sitemap.ts');
// Curated static URLs now live in this registry (shared with the HTML sitemap),
// so the literals below are read from BOTH it and sitemap.ts.
const SITE_SECTIONS = join(ROOT, 'apps/web/src/lib/seo/site-sections.ts');

// ── Intentionally NOT in the sitemap (each needs a reason) ─────────────────
// Public pages that exist but are deliberately kept out of the index because
// listing them would not help — or could hurt — SEO / brand trust.
const EXCLUDE = new Map([
  ['/sports', 'Client-side sport launcher that reads the store and routes into the app — no indexable content; the per-sport *-swing-analysis pages are the SEO entries.'],
  ['/swinglab', 'Admin-only while in development — the public sees a noindex "in development" placeholder, so it is not a public indexable surface yet.'],
]);

// Sections the sitemap emits one entry per child from a list/registry (blog ←
// BLOG_POSTS, challenges ← CHALLENGES, sample-report ← the sport list), so any
// child route is covered by construction — no per-page literal needed. These
// are also detected automatically below from `${BASE_URL}/seg/${…}` patterns;
// the explicit list documents intent and covers anything phrased differently.
const ENUMERATED_SECTIONS = ['/blog', '/challenges', '/sample-report'];

// ── Collect public marketing routes from the filesystem ────────────────────
function marketingRoutes() {
  const out = [];
  for (const file of walk(MARKETING_DIR, ['page.tsx', 'page.ts', 'page.jsx', 'page.js'])) {
    const rel = file.slice(MARKETING_DIR.length).split(sep).filter(Boolean);
    rel.pop(); // drop page.*
    const segments = rel.filter((s) => !(s.startsWith('(') && s.endsWith(')'))); // drop nested groups
    if (segments.some((s) => s.startsWith('['))) continue; // dynamic routes handled by their registry
    out.push({ path: '/' + segments.join('/') || '/', file });
  }
  return out;
}

// ── What the sitemap already covers ────────────────────────────────────────
const sitemapSrc = readFileSync(SITEMAP, 'utf8');
const registrySrc = readFileSync(SITE_SECTIONS, 'utf8');
const literalPaths = new Set(['/']);
for (const src of [sitemapSrc, registrySrc]) {
  // `${BASE_URL}/some/path` (sitemap route) and `path: '/some/path'` (registry).
  for (const m of src.matchAll(/\$\{BASE_URL\}(\/[A-Za-z0-9/_-]*)/g)) literalPaths.add(m[1] || '/');
  for (const m of src.matchAll(/'(\/[A-Za-z0-9/_-]+)'/g)) literalPaths.add(m[1]);
}

// Sections enumerated via a template variable, e.g. `${BASE_URL}/sample-report/${s}`.
// The static prefix before `/${` is a covered section (children come from a list).
const enumeratedSections = new Set(ENUMERATED_SECTIONS);
for (const m of sitemapSrc.matchAll(/\$\{BASE_URL\}(\/[A-Za-z0-9/_-]*?)\/\$\{/g)) {
  if (m[1]) enumeratedSections.add(m[1]);
}

function isRegistrySeoPage(file) {
  try {
    return /@\/content\/seoPages/.test(readFileSync(file, 'utf8'));
  } catch {
    return false;
  }
}

function covered(path, file) {
  if (path === '/') return true; // homepage (BASE_URL)
  if (literalPaths.has(path)) return true;
  if ([...enumeratedSections].some((s) => path === s || path.startsWith(s + '/'))) return true;
  if (isRegistrySeoPage(file)) return true;
  return false;
}

// ── Report ─────────────────────────────────────────────────────────────────
const routes = marketingRoutes();
const unreviewed = [];
for (const { path, file } of routes) {
  if (EXCLUDE.has(path)) continue;
  if (!covered(path, file)) unreviewed.push(path);
}

if (unreviewed.length) {
  console.error(
    `\n❌ ${unreviewed.length} public page(s) are neither in the sitemap nor explicitly excluded:\n`,
  );
  unreviewed.sort().forEach((p) => console.error('  • ' + p));
  console.error(
    '\nDecide for each:\n' +
      '  (a) trust-positive → add to app/sitemap.ts (or BLOG_POSTS / CHALLENGES / seoPages.ts), or\n' +
      '  (b) not for the index → add the path to EXCLUDE in scripts/check-sitemap-coverage.mjs with a reason.\n',
  );
  process.exit(1);
}

console.log(
  `✅ Sitemap coverage passed — ${routes.length} public marketing pages, ` +
    `all in the sitemap or intentionally excluded (${EXCLUDE.size}).`,
);
