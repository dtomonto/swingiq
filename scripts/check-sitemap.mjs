#!/usr/bin/env node
/**
 * SwingVantage — Sitemap route check.
 *
 * Extracts the paths referenced by app/sitemap.ts (both `${BASE_URL}/x`
 * template paths and `/x` string literals in the route arrays) and
 * verifies each resolves to a real App Router route. Catches sitemap
 * entries that 404.
 *
 * Exit 1 on any unresolved sitemap path. Run: npm run generate:sitemap
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { collectAppRoutes } from './lib/fsutil.mjs';

const ROOT = process.cwd();
const APP_DIR = join(ROOT, 'apps/web/src/app');
const SITEMAP = join(ROOT, 'apps/web/src/app/sitemap.ts');
// Curated static URLs moved to this registry (shared with the HTML sitemap);
// scan it too so every curated path is verified to resolve to a real route.
const SITE_SECTIONS = join(ROOT, 'apps/web/src/lib/seo/site-sections.ts');

const { staticRoutes, dynamicBases } = collectAppRoutes(APP_DIR);
const src = readFileSync(SITEMAP, 'utf8');
const registrySrc = readFileSync(SITE_SECTIONS, 'utf8');

const paths = new Set();
for (const s of [src, registrySrc]) {
  // `${BASE_URL}/some/path`
  for (const m of s.matchAll(/\$\{BASE_URL\}(\/[A-Za-z0-9/_-]*)/g)) paths.add(m[1] || '/');
  // string literals like '/tools/golf-slice-fixer' and registry `path: '/x'`.
  for (const m of s.matchAll(/'(\/[A-Za-z0-9/_-]+)'/g)) paths.add(m[1]);
}

// Registry-driven SEO slugs are validated by validate-seo.mjs; here we
// only check the literal paths present in sitemap.ts.
const ALLOW = new Set(['/']);
function resolves(p) {
  const path = p.replace(/\/$/, '') || '/';
  if (staticRoutes.has(path) || ALLOW.has(path)) return true;
  return dynamicBases.some((b) => b !== '/' && (path === b || path.startsWith(b + '/')));
}

const missing = [...paths].filter((p) => !resolves(p));
if (missing.length) {
  console.error(`❌ Sitemap references ${missing.length} path(s) with no route:\n`);
  missing.forEach((p) => console.error('  • ' + p));
  process.exit(1);
}
console.log(`✅ Sitemap check passed — ${paths.size} literal paths all resolve to routes.`);
