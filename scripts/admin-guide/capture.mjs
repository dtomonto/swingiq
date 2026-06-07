/**
 * Admin guide screenshot capture.
 *
 * Captures one screenshot per admin section (defined in sections.json) from a
 * locally-running dev server, into .cache/shots/<id>.png. The companion
 * build-pdf.py turns those into docs/SwingVantage-Admin-Dashboard-Guide.pdf.
 *
 * Why this is more involved than a plain screenshot run (learned the hard way):
 *   - /admin/* is gated by middleware (a Supabase session) AND the admin layout
 *     (which allows in dev). So when Supabase is configured we log in via the real
 *     /login form using a THROWAWAY confirmed user (created + deleted via the
 *     service-role key); when Supabase is NOT configured the admin is open in dev
 *     and we skip login.
 *   - The cached ms-playwright chromium can fail to spawn on this machine, so we
 *     drive SYSTEM Chrome/Edge via executablePath instead (override: CHROME_PATH).
 *   - `next dev` bloats under compile load, so capture in small batches; pass
 *     section numbers/ids as args, e.g.  node capture.mjs 01 02 03   (no args = all).
 *
 * Prereqs (one-time):  npm i -D playwright-core         (@supabase/supabase-js is already a dep)
 * Usage:               npm run dev        # in another terminal (port 3000)
 *                      node scripts/admin-guide/capture.mjs [ids...]
 */
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import crypto from 'node:crypto';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..');
const SECTIONS = JSON.parse(readFileSync(path.join(HERE, 'sections.json'), 'utf8'));
const OUT = path.join(HERE, '.cache', 'shots');
const BASE = process.env.BASE_URL || SECTIONS.meta.baseUrl || 'http://localhost:3000';

function findChrome() {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const cands = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/microsoft-edge',
  ];
  return cands.find((p) => existsSync(p)) || null;
}

function parseEnv(p) {
  const map = {};
  if (!existsSync(p)) return map;
  for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) map[m[1]] = m[2];
  }
  return map;
}

async function main() {
  const chromium = (await import('playwright-core').catch(() => {
    console.error('Missing dependency. Run:  npm i -D playwright-core');
    process.exit(2);
  })).chromium;

  const chrome = findChrome();
  if (!chrome) { console.error('No system Chrome/Edge found. Set CHROME_PATH.'); process.exit(2); }

  const env = parseEnv(path.join(REPO, 'apps', 'web', '.env.local'));
  const URL = env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;
  const useAuth = Boolean(URL && SERVICE);

  const argv = process.argv.slice(2);
  const want = (id) => argv.length === 0 || argv.includes(id) || argv.includes(id.split('-')[0]);
  const todo = SECTIONS.sections.filter((s) => want(s.id));
  mkdirSync(OUT, { recursive: true });
  console.log(`base=${BASE} auth=${useAuth} routes=${todo.length}`);

  let admin = null, userId = null, email = null, password = null;
  if (useAuth) {
    const { createClient } = await import('@supabase/supabase-js');
    admin = createClient(URL, SERVICE, { auth: { autoRefreshToken: false, persistSession: false } });
    email = `admin-guide-shots+${Date.now()}@example.com`;
    password = 'GuideShots!' + crypto.randomBytes(9).toString('hex');
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (error) { console.error('createUser failed:', error.message); process.exit(2); }
    userId = data.user.id;
    console.log('throwaway user created');
  }

  const browser = await chromium.launch({ executablePath: chrome, headless: true });
  const results = [];
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1024 }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    page.setDefaultNavigationTimeout(180000);

    async function dismissBanner() {
      for (const sel of ['button:has-text("Accept")', 'button:has-text("Got it")', 'button:has-text("OK")', 'button:has-text("Dismiss")']) {
        try {
          const b = page.locator(sel).first();
          if (await b.isVisible({ timeout: 800 })) { await b.click({ timeout: 2000 }); await page.waitForTimeout(300); return true; }
        } catch {}
      }
      return false;
    }

    if (useAuth) {
      let ok = false;
      for (let a = 1; a <= 2 && !ok; a++) {
        try {
          await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 120000 });
          await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
          await page.waitForSelector('#login-email', { state: 'visible', timeout: 60000 });
          await page.waitForTimeout(2000);
          await page.fill('#login-email', email);
          await page.fill('#login-password', password);
          await page.waitForTimeout(300);
          await page.click('button[type="submit"]');
          await page.waitForURL(/\/dashboard/, { timeout: 150000 });
          ok = true;
        } catch (e) { console.log(`login attempt ${a} failed: ${(e && e.message) || e}`); if (a < 2) await page.waitForTimeout(3000); }
      }
      if (!ok) throw new Error('login failed');
    } else {
      await page.goto(`${BASE}/admin`, { waitUntil: 'domcontentloaded' }).catch(() => {});
    }
    console.log('banner dismissed:', await dismissBanner());

    for (const s of todo) {
      let ok = false, lastErr = null;
      for (let attempt = 1; attempt <= 2 && !ok; attempt++) {
        try {
          const resp = await page.goto(`${BASE}${s.route}`, { waitUntil: 'domcontentloaded', timeout: 180000 });
          await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
          await page.evaluate(() => (document.fonts ? document.fonts.ready : null)).catch(() => {});
          await page.waitForTimeout(2500);
          await dismissBanner();
          const redirected = /\/login/.test(page.url());
          await page.screenshot({ path: path.join(OUT, s.id + '.png'), fullPage: false, animations: 'disabled', caret: 'hide', timeout: 90000 });
          results.push({ id: s.id, status: resp ? resp.status() : 0, redirected });
          console.log(`shot ${s.id}${redirected ? ' (REDIRECTED TO LOGIN)' : ''}${attempt > 1 ? ' (retry)' : ''}`);
          ok = true;
        } catch (e) { lastErr = (e && e.message) || String(e); console.log(`attempt ${attempt} FAIL ${s.id}: ${lastErr}`); if (attempt < 2) await page.waitForTimeout(4000); }
      }
      if (!ok) results.push({ id: s.id, error: lastErr });
      await page.waitForTimeout(1500);
    }
  } finally {
    await browser.close().catch(() => {});
    if (admin && userId) {
      const { error } = await admin.auth.admin.deleteUser(userId);
      console.log(error ? 'cleanup deleteUser FAILED: ' + error.message : 'throwaway user deleted');
    }
    writeFileSync(path.join(OUT, '_results.json'), JSON.stringify(results, null, 2));
  }
  const failed = results.filter((r) => r.error || r.redirected);
  console.log(`done: ${results.length - failed.length}/${results.length} ok`);
  if (failed.length) process.exitCode = 1;
}

main();
