#!/usr/bin/env node
/**
 * SwingIQ — Sitemap route check.
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

const { staticRoutes, dynamicBases } = collectAppRoutes(APP_DIR);
const src = readFileSync(SITEMAP, 'utf8');

const paths = new Set();
// `${BASE_URL}/some/path`
for (const m of src.matchAll(/\$\{BASE_URL\}(\/[A-Za-z0-9/_-]*)/g)) paths.add(m[1] || '/');
// array string literals like '/tools/golf-slice-fixer'
for (const m of src.matchAll(/'(\/[A-Za-z0-9/_-]+)'/g)) paths.add(m[1]);

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
