// ============================================================
// SwingVantage — Welcome tour recorder
// ------------------------------------------------------------
// Drives the RUNNING app (local/guest mode) through a real
// click-through tour and records it to MP4 for the "welcome"
// tutorial card. No API keys, no spend — this is the screen
// capture half of "screen recording + AI voiceover".
//
// One-time local setup (these dev tools are intentionally NOT in
// package.json so prod deploys don't download an ffmpeg binary):
//   npm i -D @playwright/test ffmpeg-static
//   npx playwright install chromium
//
// Then start a dev server in LOCAL mode (blank Supabase env so the
// guest experience is reachable without a login wall):
//   NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_ANON_KEY= npx next dev -p 3100
//
//   BASE_URL=http://localhost:3100 node scripts/video-studio/record-welcome.mjs
//
// Output: public/tutorials/sources/welcome.mp4 (+ .webm kept for re-encode)
// ============================================================

import { chromium } from 'playwright';
import ffmpegPath from 'ffmpeg-static';
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = process.env.BASE_URL || 'http://localhost:3100';
const HERE = dirname(fileURLToPath(import.meta.url));
const WORK = join(HERE, '.work');
const OUT_DIR = join(HERE, '..', '..', 'public', 'tutorials', 'sources');
const OUT_MP4 = join(OUT_DIR, 'welcome.mp4');

rmSync(WORK, { recursive: true, force: true });
mkdirSync(WORK, { recursive: true });
mkdirSync(OUT_DIR, { recursive: true });

// Hide dev-only / floating chrome + onboarding nudges so the capture is clean.
const HIDE_CSS = `
  nextjs-portal,
  [aria-label="Open AI Coach"],
  [aria-label="Open your guide"],
  [aria-label="Close your guide"],
  [aria-label="Your SwingVantage guide"],
  [aria-label="New here? Watch a quick tutorial"],
  [class*="tsqd-"] { display: none !important; }
`;

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: { dir: WORK, size: { width: 1280, height: 720 } },
  deviceScaleFactor: 1,
});
await context.addInitScript((css) => {
  const apply = () => {
    const s = document.createElement('style');
    s.setAttribute('data-tour-hide', '');
    s.textContent = css;
    (document.head || document.documentElement).appendChild(s);
  };
  if (document.head) apply();
  else document.addEventListener('DOMContentLoaded', apply);
}, HIDE_CSS);

const page = await context.newPage();

const dwell = (ms) => page.waitForTimeout(ms);

async function go(path) {
  await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 60000 });
  // Settle: wait for first heading or just give the route a beat to paint.
  await page.waitForLoadState('load').catch(() => {});
  await dwell(900);
}

// Eased scroll down to `frac` of the page, captured smoothly by the recorder.
async function gentleScroll(ms = 5000, frac = 0.82) {
  await page.evaluate(
    ({ ms, frac }) =>
      new Promise((res) => {
        const dist = Math.max(0, (document.body.scrollHeight - window.innerHeight) * frac);
        const start = performance.now();
        const tick = (now) => {
          const t = Math.min(1, (now - start) / ms);
          const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // easeInOutQuad
          window.scrollTo(0, dist * e);
          if (t < 1) requestAnimationFrame(tick);
          else res();
        };
        requestAnimationFrame(tick);
      }),
    { ms, frac },
  );
}

async function scrollTop(ms = 1200) {
  await page.evaluate(
    (ms) =>
      new Promise((res) => {
        const from = window.scrollY;
        const start = performance.now();
        const tick = (now) => {
          const t = Math.min(1, (now - start) / ms);
          window.scrollTo(0, from * (1 - t));
          if (t < 1) requestAnimationFrame(tick);
          else res();
        };
        requestAnimationFrame(tick);
      }),
    ms,
  );
}

async function tryClick(locator, timeout = 2500) {
  try {
    await locator.click({ timeout });
    return true;
  } catch {
    return false;
  }
}

// ── The tour ────────────────────────────────────────────────

// Scene 1 — Home hero: what SwingVantage is.
await go('/');
await tryClick(page.getByRole('button', { name: 'Accept' }), 2500); // cookie
await tryClick(page.locator('[aria-label="Dismiss"]').first(), 1200); // pwa banner (if any)
await dwell(2600);
await gentleScroll(4800, 0.55);
await dwell(1600);

// Scene 2 — How it works: the 4-step process.
await go('/how-it-works');
await dwell(2400);
await gentleScroll(6000, 0.8);
await dwell(1400);

// Scene 3 — Features: everything it does, free.
await go('/features');
await dwell(2200);
await gentleScroll(6000, 0.7);
await dwell(1400);

// Scene 4 — Start Here: pick your sport, no account.
await go('/start');
await dwell(2400);
await tryClick(page.getByText('Golf', { exact: true }), 1500);
await dwell(700);
await tryClick(page.getByText('Tennis', { exact: true }), 1500);
await dwell(1600);

// Scene 5 — Dashboard: the welcome beat, then the real Today home.
await go('/dashboard');
await dwell(2600); // show the "Welcome to SwingVantage" persona modal
if (await tryClick(page.getByRole('button', { name: /Adult athlete/i }), 3000)) {
  await dwell(700);
  await tryClick(page.getByRole('button', { name: /Continue to SwingVantage/i }), 3000);
}
await page.waitForLoadState('load').catch(() => {});
await dwell(2600);
await gentleScroll(5500, 0.8);
await dwell(1200);
await scrollTop(1000);

// Scene 6 — Progress: watch yourself improve over time.
await go('/progress');
await dwell(2600);
await gentleScroll(5500, 0.8);
await dwell(1600);

// ── Finalize ────────────────────────────────────────────────
const video = page.video();
await context.close(); // flushes the .webm
await browser.close();

const webm = await video.path();
console.log('recorded webm:', webm);

// Transcode to a lean, web-friendly MP4 (H.264, faststart, no audio —
// narration is muxed in later by the voiceover step). crf 30 keeps flat
// UI footage small (~4 MB for ~65s) with no visible loss.
execFileSync(
  ffmpegPath,
  [
    '-y',
    '-i', webm,
    '-c:v', 'libx264',
    '-preset', 'slow',
    '-crf', '30',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    '-r', '30',
    '-an',
    OUT_MP4,
  ],
  { stdio: 'inherit' },
);

if (!existsSync(OUT_MP4)) throw new Error('ffmpeg did not produce ' + OUT_MP4);
console.log('\nwrote', OUT_MP4);
