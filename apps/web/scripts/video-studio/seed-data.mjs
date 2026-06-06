// ============================================================
// SwingVantage — Seed demo data into the recording browser state
// ------------------------------------------------------------
// Drives the REAL CSV import wizard, then saves the populated
// localStorage to .work/state.json so record-batch runs start
// data-rich (sessions / diagnose / progress / compare).
//
//   node scripts/video-studio/seed-data.mjs            # uses fixtures/*.csv if present
//   node scripts/video-studio/seed-data.mjs 3          # else sample CSV x3
//
// If scripts/video-studio/fixtures/*.csv exist (from
// make-progress-csvs.mjs), each is imported as its own session and the
// sessions are backdated across past weeks so /progress and /arc show a
// real, rising trend instead of a flat same-day line.
//
// KEY: drive the wizard with direct DOM .click() (page.evaluate) — it
// fires React onClick regardless of scroll position, the cookie-banner
// overlay, or hydration timing (Playwright clicks all proved flaky here).
// ============================================================

import { chromium } from 'playwright';
import { mkdirSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = process.env.BASE_URL || 'http://localhost:3100';
const HERE = dirname(fileURLToPath(import.meta.url));
const APP = join(HERE, '..', '..');
const WORK = join(HERE, '.work');
const STATE = join(WORK, 'state.json');
const FIX = join(HERE, 'fixtures');
const SAMPLE = resolve(APP, 'e2e', 'fixtures', 'sample-golf.csv');

// CSV list: prefer generated progress fixtures (one session each), else the
// shared sample CSV repeated `count` times.
let CSVS;
if (existsSync(FIX) && readdirSync(FIX).some((f) => f.endsWith('.csv'))) {
  CSVS = readdirSync(FIX).filter((f) => f.endsWith('.csv')).sort().map((f) => join(FIX, f));
} else {
  CSVS = Array.from({ length: Number(process.argv[2] || 3) }, () => SAMPLE);
}

mkdirSync(WORK, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
const page = await ctx.newPage();
const dwell = (ms) => page.waitForTimeout(ms);

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

for (let i = 0; i < CSVS.length; i++) {
  const before = await sessions();
  await page.goto(BASE + '/sessions/import', { waitUntil: 'domcontentloaded' });
  await dwell(3000);
  await domClick('Accept');
  await until('FlightScope', async () => {
    try { return await page.getByRole('button', { name: /Next: Upload File/i }).isEnabled(); } catch { return false; }
  });
  await until('Next: Upload File', () => page.locator('input[type="file"]').count().then((n) => n > 0));
  await page.locator('input[type="file"]').first().setInputFiles(CSVS[i]);
  await dwell(2500);
  await until('Next: Review Warnings', async () => /Warning|Preview|Confirm/i.test(await heading()));
  await until('Next: Preview Shots', async () => /Preview|Name/i.test(await heading()));
  await until('Next: Name Session', async () => /Name Your Session/i.test(await heading()));
  // Name it (optional input) for nicer session lists.
  try { await page.fill('#import-session-name', `Driver range — session ${i + 1}`, { timeout: 2000 }); } catch {}
  await until('Import Session', async () => (await sessions()) > before || /Imported/i.test(await heading()));
  console.log(`import ${i + 1}/${CSVS.length}: sessions=${await sessions()}`);
}

// Backdate sessions: oldest import (worst) → furthest back, newest (best) → today.
await page.goto(BASE + '/dashboard', { waitUntil: 'domcontentloaded' });
await dwell(800);
const spread = await page.evaluate((weekMs) => {
  const raw = localStorage.getItem('swingiq-store');
  if (!raw) return 0;
  const data = JSON.parse(raw);
  const list = data.state.sessions || [];
  if (!list.length) return 0;
  // import order = ascending created_at
  const ordered = [...list].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const n = ordered.length;
  ordered.forEach((s, j) => {
    const d = new Date(Date.now() - (n - 1 - j) * weekMs).toISOString();
    s.created_at = d;
    s.date = d;
  });
  localStorage.setItem('swingiq-store', JSON.stringify(data));
  return n;
}, 7 * 24 * 60 * 60 * 1000);
await dwell(500);

await ctx.storageState({ path: STATE });
await browser.close();
console.log(`backdated ${spread} sessions across ~${spread - 1} weeks`);
console.log('state saved:', STATE);
