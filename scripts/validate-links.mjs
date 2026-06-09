#!/usr/bin/env node
/**
 * SwingVantage — Internal link checker.
 *
 * Scans static internal links (href="/literal") in app + components and
 * verifies each resolves to a real App Router route. Conservative: only
 * flags plain string literals (not template literals), ignores anchors,
 * query strings, mailto:, tel:, and external URLs.
 *
 * Exit 1 on confirmed broken internal links. Run: npm run validate:links
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { walk, collectAppRoutes } from './lib/fsutil.mjs';

const ROOT = process.cwd();
const APP_DIR = join(ROOT, 'apps/web/src/app');
const SCAN_DIRS = ['apps/web/src/app', 'apps/web/src/components'];

const { staticRoutes, dynamicBases } = collectAppRoutes(APP_DIR);

// Known-good routes that exist but aren't pages (or are intentionally external-ish).
const ALLOW = new Set(['/sitemap.xml', '/robots.txt', '/manifest.json']);

function resolves(path) {
  if (staticRoutes.has(path) || ALLOW.has(path)) return true;
  // Dynamic route: path under a dynamic base (e.g. /blog/x under /blog).
  return dynamicBases.some((base) => base !== '/' && (path === base || path.startsWith(base + '/')));
}

const linkRe = /(?:href|to)=(?:"(\/[^"#?]*)(?:[#?][^"]*)?"|\{'(\/[^'#?]*)(?:[#?][^']*)?'\})/g;
const broken = [];

for (const rel of SCAN_DIRS) {
  for (const file of walk(join(ROOT, rel), ['.tsx', '.ts'])) {
    const txt = readFileSync(file, 'utf8');
    let m;
    while ((m = linkRe.exec(txt)) !== null) {
      const path = (m[1] || m[2]).replace(/\/$/, '') || '/';
      if (path.startsWith('//')) continue; // protocol-relative external
      if (!resolves(path)) {
        broken.push({ file: file.slice(ROOT.length + 1), path });
      }
    }
  }
}

// Registry-style links: content modules store links as object props
// (`href: '/path'`) rather than JSX `href="/path"`, so the JSX regex misses
// them. The feature registry's relatedLinks + CTAs are real internal links
// rendered on /features/[slug] — validate them too so a stale slug (e.g. a
// renamed SEO page) is caught in CI, not by a 404 on a live authority page.
const PROP_SCAN_DIRS = ['apps/web/src/content/features'];
const hrefPropRe = /href:\s*'(\/[^'#?]*)(?:[#?][^']*)?'/g;
for (const rel of PROP_SCAN_DIRS) {
  for (const file of walk(join(ROOT, rel), ['.ts', '.tsx'])) {
    const txt = readFileSync(file, 'utf8');
    let m;
    while ((m = hrefPropRe.exec(txt)) !== null) {
      const path = m[1].replace(/\/$/, '') || '/';
      if (path.startsWith('//')) continue;
      if (!resolves(path)) {
        broken.push({ file: file.slice(ROOT.length + 1), path });
      }
    }
  }
}

if (broken.length) {
  console.error(`❌ Found ${broken.length} internal link(s) with no matching route:\n`);
  broken.forEach((b) => console.error(`  • ${b.path}   (${b.file})`));
  process.exit(1);
}
console.log(`✅ Internal link check passed — ${staticRoutes.size} static routes, ${dynamicBases.length} dynamic bases.`);
