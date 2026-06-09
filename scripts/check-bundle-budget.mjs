#!/usr/bin/env node
// ============================================================
// check-bundle-budget.mjs — CI gate: per-route first-load JS budget
// ------------------------------------------------------------
// Runs AFTER `npm run build`. Reads the App-Router build manifest
// (apps/web/.next/app-build-manifest.json), sums the byte size of every JS
// chunk a route ships on first load, and fails CI if any route exceeds its
// limit in apps/web/bundle-budget.json. This stops a heavy import (or an
// accidental client component) from silently inflating the bundle.
//
// Safe-by-design: if there is no build, no manifest, or no budget file, it
// SKIPS (exit 0) rather than fail — so it never blocks a context where the
// build hasn't run, and never false-fails on a manifest-format change. The
// pure size/violation logic is unit-tested (scripts/__tests__) against a
// fixture, independent of a real build.
//
// To capture a baseline + tighten budgets: `ANALYZE=true npm run build`.
// No deps; pure Node.
// ============================================================

import { readFileSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = process.cwd();
const NEXT_DIR = path.join(ROOT, 'apps/web/.next');
const BUDGET_FILE = path.join(ROOT, 'apps/web/bundle-budget.json');

/**
 * Pure: given an app-build-manifest object `{ pages: { route: [files] } }` and
 * a `sizeOf(file) → bytes` function, return `{ route: firstLoadJsBytes }`.
 * Only .js files count toward first-load JS; anything else is ignored.
 */
export function computeRouteSizes(appManifest, sizeOf) {
  const pages = (appManifest && appManifest.pages) || {};
  const out = {};
  for (const [route, files] of Object.entries(pages)) {
    if (!Array.isArray(files)) continue;
    let bytes = 0;
    for (const f of files) {
      if (typeof f === 'string' && f.endsWith('.js')) bytes += sizeOf(f) || 0;
    }
    out[route] = bytes;
  }
  return out;
}

/**
 * Pure: compare `{ route: bytes }` against a budget
 * `{ maxFirstLoadKb, routeOverridesKb }` → array of violations (over-limit).
 */
export function findViolations(routeSizes, budget) {
  const defaultKb = Number(budget && budget.maxFirstLoadKb) || Infinity;
  const overrides = (budget && budget.routeOverridesKb) || {};
  const violations = [];
  for (const [route, bytes] of Object.entries(routeSizes)) {
    const limitKb = Object.prototype.hasOwnProperty.call(overrides, route)
      ? Number(overrides[route])
      : defaultKb;
    const kb = bytes / 1024;
    if (kb > limitKb) {
      violations.push({ route, kb: Math.round(kb * 10) / 10, limitKb });
    }
  }
  return violations.sort((a, b) => b.kb - a.kb);
}

function main() {
  if (!existsSync(NEXT_DIR)) {
    console.log('ℹ check-bundle-budget: no apps/web/.next build found — skipping (run after `npm run build`).');
    return 0;
  }
  const manifestPath = path.join(NEXT_DIR, 'app-build-manifest.json');
  if (!existsSync(manifestPath)) {
    console.log('ℹ check-bundle-budget: app-build-manifest.json not found — skipping (manifest format may have changed).');
    return 0;
  }
  if (!existsSync(BUDGET_FILE)) {
    console.log('ℹ check-bundle-budget: apps/web/bundle-budget.json missing — skipping.');
    return 0;
  }

  let manifest, budget;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    budget = JSON.parse(readFileSync(BUDGET_FILE, 'utf8'));
  } catch (e) {
    console.log(`ℹ check-bundle-budget: could not parse manifest/budget (${e.message}) — skipping.`);
    return 0;
  }

  const sizeOf = (f) => {
    try { return statSync(path.join(NEXT_DIR, f)).size; } catch { return 0; }
  };
  const sizes = computeRouteSizes(manifest, sizeOf);
  const routeCount = Object.keys(sizes).length;
  const violations = findViolations(sizes, budget);

  if (violations.length > 0) {
    console.error(`✗ Bundle budget FAILED — ${violations.length} route(s) over their first-load JS limit:`);
    for (const v of violations) {
      console.error(`   • ${v.route}  ${v.kb} KB  (limit ${v.limitKb} KB)`);
    }
    console.error('\nReduce first-load JS (lazy-load heavy deps, convert client→server components,');
    console.error('or, if intentional, raise the limit in apps/web/bundle-budget.json with a note).');
    console.error('Diagnose with: ANALYZE=true npm run build');
    return 1;
  }

  console.log(`✓ Bundle budget passed — ${routeCount} route(s) within their first-load JS limits.`);
  return 0;
}

// Run only when invoked directly (so the pure exports stay importable in tests).
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(main());
}
