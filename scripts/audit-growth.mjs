#!/usr/bin/env node
/**
 * SwingVantage — Growth audit orchestrator.
 *
 * Runs every growth/trust validation in sequence and summarizes.
 * Exit 1 if any check fails. Run: npm run audit:growth
 */
import { spawnSync } from 'child_process';

const checks = [
  ['Placeholders', 'scripts/scan-placeholders.mjs'],
  ['SEO content', 'scripts/validate-seo.mjs'],
  ['Growth content', 'scripts/validate-content.mjs'],
  ['Internal links', 'scripts/validate-links.mjs'],
  ['Sitemap routes', 'scripts/check-sitemap.mjs'],
  ['Sitemap coverage', 'scripts/check-sitemap-coverage.mjs'],
];

let failed = 0;
for (const [name, script] of checks) {
  const res = spawnSync(process.execPath, [script], { stdio: 'inherit' });
  if (res.status !== 0) failed++;
}

console.log('\n' + '─'.repeat(50));
if (failed) {
  console.error(`❌ Growth audit: ${failed}/${checks.length} check(s) failed.`);
  process.exit(1);
}
console.log(`✅ Growth audit: all ${checks.length} checks passed.`);
