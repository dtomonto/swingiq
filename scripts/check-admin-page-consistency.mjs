#!/usr/bin/env node
// ============================================================
// check-admin-page-consistency — advisory UX/consistency gate
// ------------------------------------------------------------
// Scans every admin page (apps/web/src/app/admin/**/page.tsx) and flags
// top-level section pages that don't use the shared <PageHeader>, which is the
// pattern that gives the admin a consistent title/description/actions bar.
//
// Advisory by design: detail/dynamic routes ([id], [slug]) and a small set of
// intentionally-custom shells are exempted, and the script exits 0 (it reports,
// it doesn't block CI). Run: npm run check:admin-consistency
// ============================================================

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const ADMIN_DIR = join(ROOT, 'apps', 'web', 'src', 'app', 'admin');

// Pages that legitimately render their own full-screen shell instead of PageHeader.
const EXEMPT = new Set([
  'page.tsx', // /admin command center (custom hero layout)
]);

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (name === 'page.tsx') out.push(full);
  }
  return out;
}

function isDynamicOrDetail(rel) {
  // Skip dynamic ([id]) routes and known detail patterns — they're sub-views.
  return /\[[^\]]+\]/.test(rel);
}

let pages = [];
try {
  pages = walk(ADMIN_DIR);
} catch {
  console.error('admin dir not found:', ADMIN_DIR);
  process.exit(0);
}

const missing = [];
for (const file of pages) {
  const rel = relative(ROOT, file).replace(/\\/g, '/');
  const adminRel = relative(ADMIN_DIR, file).replace(/\\/g, '/');
  if (isDynamicOrDetail(adminRel)) continue;
  if (EXEMPT.has(adminRel)) continue;
  const src = readFileSync(file, 'utf8');
  const usesHeader = /PageHeader/.test(src);
  if (!usesHeader) missing.push(rel);
}

const total = pages.length;
console.log(`Scanned ${total} admin page(s).`);
if (missing.length === 0) {
  console.log('✅ Every top-level admin section page uses <PageHeader> — consistent.');
} else {
  console.log(`\n⚠️  ${missing.length} section page(s) don't use <PageHeader> (consider adding for a consistent title/description bar):`);
  for (const m of missing.sort()) console.log('   • ' + m);
  console.log('\n(Advisory — this does not fail the build.)');
}
process.exit(0);
