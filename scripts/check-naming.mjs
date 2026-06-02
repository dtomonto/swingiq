#!/usr/bin/env node
/**
 * Naming-convention guardrail (audit finding AA-6).
 *
 * Enforces kebab-case for module files under apps/web/src/lib. Exempt:
 *   - React hooks (useThing.ts)
 *   - index.ts / types.ts barrels
 *   - test files (*.test.ts, __tests__/)
 * A small allowlist of pre-existing camelCase files is tracked for incremental
 * migration; NEW camelCase lib modules fail the check. Do not grow the allowlist.
 */
import { readdirSync, statSync } from 'node:fs';
import { join, basename, extname } from 'node:path';

const LIB_DIR = 'apps/web/src/lib';

// Pre-existing camelCase files (repo-root-relative, forward slashes), tracked
// for incremental cleanup. New files must be kebab-case — do not add here.
const LEGACY_ALLOWLIST = new Set([
  'apps/web/src/lib/auth/localAuth.ts',
  'apps/web/src/lib/coaching/fixFraming.ts',
  'apps/web/src/lib/coaching/fixFramingI18n.ts',
  'apps/web/src/lib/import/ocrClient.ts',
  'apps/web/src/lib/motion/onDevicePoseProvider.ts',
  'apps/web/src/lib/onboarding/quickStart.ts',
  'apps/web/src/lib/seo/jsonLd.ts',
  'apps/web/src/lib/share/shareCard.ts',
]);

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (entry === '__tests__' || entry === 'node_modules') continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) {
      out.push(...walk(p));
    } else if (/\.(ts|tsx)$/.test(entry) && !/\.test\.(ts|tsx)$/.test(entry)) {
      out.push(p.split('\\').join('/'));
    }
  }
  return out;
}

const files = walk(LIB_DIR);
const violations = [];
for (const f of files) {
  const base = basename(f, extname(f));
  if (base === 'index' || base === 'types') continue;
  if (/^use[A-Z]/.test(base)) continue; // React hooks
  if (/[A-Z]/.test(base) && !LEGACY_ALLOWLIST.has(f)) violations.push(f);
}

if (violations.length) {
  console.error('✖ Non-kebab-case lib module filenames (audit AA-6):');
  for (const v of violations) console.error('  - ' + v);
  console.error('\nRename to kebab-case (e.g. fooBar.ts -> foo-bar.ts). Hooks (useX.ts) are exempt.');
  process.exit(1);
}
console.log(`✓ naming: ${files.length} lib module files are kebab-case (or allowlisted legacy).`);
