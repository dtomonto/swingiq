// ============================================================
// SwingVantage — Seed demo data into the recording browser state
// ------------------------------------------------------------
// Drives the REAL CSV import wizard with e2e/fixtures/sample-golf.csv
// a few times, then saves the populated localStorage to .work/state.json
// so record-batch runs start data-rich (sessions/diagnose/compare).
//
//   node scripts/video-studio/seed-data.mjs [count]
//
// KEY: drive the wizard with direct DOM .click() (page.evaluate) — it
// fires React onClick regardless of scroll position, the cookie-banner
// overlay, or hydration timing. Playwright's normal/force clicks all
// proved flaky here (buttons below the fold + fixed cookie banner).
// The /diagnose page computes diagnoses live from a session's shots, so
// sessions-with-shots is enough to light up the analysis pages.
// ============================================================

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = process.env.BASE_URL || 'http://localhost:3100';
const HERE = dirname(fileURLToPath(import.meta.url));
const APP = join(HERE, '..', '..');
const WORK = join(HERE, '.work');
const STATE = join(WORK, 'state.json');
const CSV = resolve(APP, 'e2e', 'fixtures', 'sample-golf.csv');
const COUNT = Number(process.argv[2] || 3);

mkdirSync(WORK, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
const page = await ctx.newPage();
const dwell = (ms) => page.waitForTimeout(ms);

// Direct DOM click of an enabled button whose text matches `re`.
const domClick = (re) =>
  page.evaluate((src) => {
    const rx = new RegExp(src, 'i');
    const b = [...document.querySelectorAll('button')].find((x) => rx.test(x.textContent || '') && !x.disabled);
    if (b) { b.click(); return true; }
    return false;
  }, re);
const heading = () => page.evaluate(() => document.querySelector('h2,h3')?.textContent?.trim() || '');
const sessions = () => page.evaluate(() => {
  try { return (JSON.parse(localStorage.getItem('swingiq-store')).state.sessions || []).length; } catch { return 0; }
});
async function until(re, confirm, tries = 14, gap = 500) {
  for (let k = 0; k < tries; k++) { await domClick(re); await dwell(gap); if (await confirm()) return true; }
  return false;
}

// Clear the device persona gate + cookie banner once.
await page.goto(BASE + '/dashboard', { waitUntil: 'domcontentloaded' });
await dwell(1500);
await domClick('Accept');
await domClick('Adult athlete'); await dwell(400);
await domClick('Continue to SwingVantage'); await dwell(500);

for (let i = 0; i < COUNT; i++) {
  const before = await sessions();
  await page.goto(BASE + '/sessions/import', { waitUntil: 'domcontentloaded' });
  await dwell(3000); // hydrate
  await domClick('Accept');
  await until('FlightScope', async () => {
    try { return await page.getByRole('button', { name: /Next: Upload File/i }).isEnabled(); } catch { return false; }
  });
  await until('Next: Upload File', () => page.locator('input[type="file"]').count().then((n) => n > 0));
  await page.locator('input[type="file"]').first().setInputFiles(CSV);
  await dwell(2500);
  await until('Next: Review Warnings', async () => /Warning|Preview|Confirm/i.test(await heading()));
  await until('Next: Preview Shots', async () => /Preview|Name/i.test(await heading()));
  await until('Next: Name Session', async () => /Name Your Session/i.test(await heading()));
  await until('Import Session', async () => (await sessions()) > before || /Imported/i.test(await heading()));
  console.log(`import ${i + 1}/${COUNT}: sessions=${await sessions()}`);
}

await ctx.storageState({ path: STATE });
await browser.close();

console.log('state saved:', STATE);
