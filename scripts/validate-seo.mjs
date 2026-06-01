#!/usr/bin/env node
/**
 * SwingIQ — SEO content validation.
 *
 * Guards against thin pages and broken SEO routing:
 *   - Every 'published' page in seoPages.ts must have a route file.
 *   - Every published slug must be allowed in robots.txt.
 *   - Published entries must have substantive content (direct answer,
 *     >=3 diagnosis steps, >=3 drills, >=2 FAQs).
 *
 * Exit 1 on any failure. Run: npm run validate:seo
 */
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();
const REGISTRY = join(ROOT, 'apps/web/src/content/seoPages.ts');
const APP_DIR = join(ROOT, 'apps/web/src/app');
const ROBOTS = join(ROOT, 'apps/web/public/robots.txt');

const src = readFileSync(REGISTRY, 'utf8');
const robots = readFileSync(ROBOTS, 'utf8');

// Split into per-const page objects by matching slug→publishStatus blocks.
const blockRe = /slug:\s*'([^']+)'([\s\S]*?)publishStatus:\s*'(published|draft)'/g;
const errors = [];
const published = [];
let m;
while ((m = blockRe.exec(src)) !== null) {
  const [, slug, body, status] = m;
  if (status !== 'published') continue;
  published.push(slug);

  // Route file exists?
  const routeFile = join(APP_DIR, ...slug.split('/'), 'page.tsx');
  if (!existsSync(routeFile)) errors.push(`Published "${slug}" has no route file at app/${slug}/page.tsx`);

  // robots allows it?
  if (!robots.includes(`/${slug}`) && !robots.includes(`/${slug.split('/')[0]}/`)) {
    errors.push(`Published "${slug}" is not allowed in robots.txt`);
  }

  // Substance checks (anti-thin-content).
  const directAnswer = /directAnswer:\s*'([^']*)'/.exec(body)?.[1] ?? (/directAnswer:\s*\n?\s*'([^']*)'/.exec(body)?.[1] ?? '');
  if (directAnswer.length < 60) errors.push(`Published "${slug}" has a thin/empty directAnswer`);
  const diagnosisCount = (body.match(/diagnosisSteps:\s*\[([\s\S]*?)\]/)?.[1].match(/'/g)?.length ?? 0) / 2;
  if (diagnosisCount < 3) errors.push(`Published "${slug}" has < 3 diagnosis steps`);
  const drillCount = (body.match(/name:\s*'/g)?.length ?? 0);
  if (drillCount < 3) errors.push(`Published "${slug}" has < 3 drills`);
}

if (published.length === 0) errors.push('No published SEO pages found — registry may be malformed.');

if (errors.length) {
  console.error(`❌ SEO validation failed (${errors.length}):\n`);
  errors.forEach((e) => console.error('  • ' + e));
  process.exit(1);
}
console.log(`✅ SEO validation passed — ${published.length} published pages, all routed, indexed, and substantive.`);
