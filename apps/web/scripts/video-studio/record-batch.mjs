// ============================================================
// SwingVantage — Tutorial video batch recorder
// ------------------------------------------------------------
// Records, narrates, and wires any number of tutorial videos in
// one pass. Reuses a seeded browser state (persona gate cleared,
// optional demo data) so app pages look ready.
//
//   node scripts/video-studio/record-batch.mjs <id> [<id> ...]
//   node scripts/video-studio/record-batch.mjs group:getting-started
//
// For each id: record the on-screen tour -> transcode -> OpenAI TTS
// narration (curl) -> mux -> poster -> append to
// src/lib/tutorial/recordings.generated.json (auto-wires the card).
//
// Prereqs: dev server in LOCAL mode on BASE_URL (see record-welcome.mjs),
// plus @playwright/test, chromium, ffmpeg-static installed locally.
// ============================================================

import { chromium } from 'playwright';
import ffmpegPath from 'ffmpeg-static';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, statSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VIDEO_CONFIG, GROUPS } from './batch-config.mjs';

const BASE = process.env.BASE_URL || 'http://localhost:3100';
const HERE = dirname(fileURLToPath(import.meta.url));
const APP = join(HERE, '..', '..');
const WORK = join(HERE, '.work');
const SOURCES = join(APP, 'public', 'tutorials', 'sources');
const MANIFEST = join(APP, 'src', 'lib', 'tutorial', 'recordings.generated.json');
const STATE = join(WORK, 'state.json');
const FF = ffmpegPath;

mkdirSync(WORK, { recursive: true });
mkdirSync(SOURCES, { recursive: true });

const HIDE_CSS = `
  nextjs-portal,
  [aria-label="Open AI Coach"],
  [aria-label="Open your guide"],
  [aria-label="Close your guide"],
  [aria-label="Your SwingVantage guide"],
  [aria-label="New here? Watch a quick tutorial"],
  [class*="tsqd-"] { display: none !important; }
`;

// ── helpers passed to each scene function ───────────────────
function makeHelpers(page) {
  const dwell = (ms) => page.waitForTimeout(ms);
  const go = async (path) => {
    await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForLoadState('load').catch(() => {});
    await dwell(900);
  };
  const gentleScroll = (ms = 5000, frac = 0.82) =>
    page.evaluate(
      ({ ms, frac }) =>
        new Promise((res) => {
          const dist = Math.max(0, (document.body.scrollHeight - window.innerHeight) * frac);
          const start = performance.now();
          const tick = (now) => {
            const t = Math.min(1, (now - start) / ms);
            const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
            window.scrollTo(0, dist * e);
            if (t < 1) requestAnimationFrame(tick);
            else res();
          };
          requestAnimationFrame(tick);
        }),
      { ms, frac },
    );
  const scrollTop = (ms = 1000) =>
    page.evaluate(
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
  const tryClick = async (locator, timeout = 2500) => {
    try { await locator.click({ timeout }); return true; } catch { return false; }
  };
  const clickText = (text, timeout = 2500) => tryClick(page.getByText(text, { exact: true }).first(), timeout);
  return { page, dwell, go, gentleScroll, scrollTop, tryClick, clickText };
}

// ── one-time seed: clear the persona gate, save storage state ──
async function ensureState() {
  if (existsSync(STATE)) return;
  console.log('seeding browser state (persona gate)…');
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/dashboard', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  try { await page.getByRole('button', { name: 'Accept' }).click({ timeout: 2500 }); } catch {}
  try {
    await page.getByRole('button', { name: /Adult athlete/i }).click({ timeout: 3000 });
    await page.getByRole('button', { name: /Continue to SwingVantage/i }).click({ timeout: 3000 });
  } catch {}
  await page.waitForTimeout(800);
  await ctx.storageState({ path: STATE });
  await browser.close();
  console.log('state saved:', STATE);
}

function probeSeconds(file) {
  let stderr = '';
  try { execFileSync(FF, ['-i', file], { stdio: ['ignore', 'ignore', 'pipe'] }); }
  catch (e) { stderr = (e.stderr || '').toString(); }
  const m = stderr.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
  return m ? +m[1] * 3600 + +m[2] * 60 + parseFloat(m[3]) : null;
}

function ttsTo(mp3Path, narration) {
  const key = (() => {
    if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
    const line = readFileSync(join(APP, '.env.local'), 'utf8').split(/\r?\n/).find((l) => l.startsWith('OPENAI_API_KEY='));
    return line ? line.slice('OPENAI_API_KEY='.length).trim().replace(/^["']|["']$/g, '') : undefined;
  })();
  if (!key) throw new Error('OPENAI_API_KEY not found');
  const body = join(WORK, 'body.json');
  writeFileSync(body, JSON.stringify({ model: 'tts-1', voice: 'nova', input: narration, response_format: 'mp3' }));
  // Keep the API key in a curl config file (-K), NEVER in argv, so it can't
  // leak into error messages or logs. The .work dir is gitignored.
  const cfgFile = join(WORK, 'curl.cfg');
  writeFileSync(cfgFile,
    `url = "https://api.openai.com/v1/audio/speech"\n` +
    `header = "Authorization: Bearer ${key}"\n` +
    `header = "Content-Type: application/json"\n` +
    `data = "@${body.replace(/\\/g, '/')}"\n` +
    `silent\nfail-with-body\nmax-time = 120\n`);
  let ok = false;
  for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
    rmSync(mp3Path, { force: true });
    try { execFileSync('curl', ['-K', cfgFile, '-o', mp3Path], { stdio: ['ignore', 'ignore', 'ignore'] }); } catch { /* transient — retry */ }
    ok = existsSync(mp3Path) && statSync(mp3Path).size >= 1000;
    if (!ok && attempt < 3) console.log(`  tts retry ${attempt}…`);
  }
  rmSync(cfgFile, { force: true });
  if (!ok) throw new Error('TTS failed after 3 attempts (no audio)');
}

async function recordOne(id) {
  const cfg = VIDEO_CONFIG[id];
  if (!cfg) throw new Error(`No batch config for "${id}"`);
  console.log(`\n=== ${id} ===`);
  const rawWebmDir = join(WORK, id);
  rmSync(rawWebmDir, { recursive: true, force: true });
  mkdirSync(rawWebmDir, { recursive: true });

  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: rawWebmDir, size: { width: 1280, height: 720 } },
    storageState: existsSync(STATE) ? STATE : undefined,
  });
  await ctx.addInitScript((css) => {
    const apply = () => {
      const s = document.createElement('style');
      s.textContent = css;
      (document.head || document.documentElement).appendChild(s);
    };
    if (document.head) apply(); else document.addEventListener('DOMContentLoaded', apply);
  }, HIDE_CSS);

  const page = await ctx.newPage();
  const h = makeHelpers(page);
  await cfg.scenes(h);

  const video = page.video();
  await ctx.close();
  await browser.close();
  const webm = await video.path();

  const silent = join(WORK, `${id}-silent.mp4`);
  execFileSync(FF, ['-y', '-i', webm, '-c:v', 'libx264', '-preset', 'slow', '-crf', '30',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-r', '30', '-an', silent], { stdio: 'ignore' });

  // Narration
  const vo = join(WORK, `${id}-vo.mp3`);
  console.log('  tts…');
  ttsTo(vo, cfg.narration);

  const vDur = probeSeconds(silent);
  const aDur = probeSeconds(vo);
  const target = (Math.max(vDur || 0, aDur || 0) + 0.4).toFixed(2);
  console.log(`  video=${vDur}s voice=${aDur}s -> ${target}s`);

  const outMp4 = join(SOURCES, `${id}.mp4`);
  execFileSync(FF, ['-y', '-i', silent, '-i', vo,
    '-filter_complex', '[0:v]tpad=stop_mode=clone:stop_duration=120[v];[1:a]apad[a]',
    '-map', '[v]', '-map', '[a]', '-t', target,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '30', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', outMp4], { stdio: 'ignore' });

  // Poster. A fixed early offset is unsafe: in dev mode the first route can
  // still be compiling (blank near-black frame), which is how 25 clips once
  // shipped a ~5.6KB black poster. So unless a clip pins cfg.posterAt, sample
  // several offsets deeper into the clip and keep the frame with the most
  // content (largest JPEG — a flat dark frame compresses to ~5-6KB).
  const posterPath = join(SOURCES, `${id}-poster.jpg`);
  if (cfg.posterAt != null) {
    execFileSync(FF, ['-y', '-loglevel', 'error', '-ss', String(cfg.posterAt), '-i', outMp4,
      '-frames:v', '1', '-q:v', '3', posterPath]);
  } else {
    const dur = probeSeconds(outMp4) || vDur || 12;
    let best = null, bestSize = 0;
    for (const frac of [0.4, 0.55, 0.7, 0.85]) {
      const cand = join(WORK, `${id}-poster-${frac}.jpg`);
      execFileSync(FF, ['-y', '-loglevel', 'error', '-ss', (dur * frac).toFixed(1), '-i', outMp4,
        '-frames:v', '1', '-q:v', '3', cand]);
      const size = existsSync(cand) ? statSync(cand).size : 0;
      if (size > bestSize) { bestSize = size; best = cand; }
    }
    if (best) copyFileSync(best, posterPath);
    if (bestSize < 15000) console.log(`  !! poster for ${id} looks blank (${bestSize}B) — check the recording`);
  }

  // Update manifest
  const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {};
  manifest[id] = { durationSec: Math.round(probeSeconds(outMp4)) };
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`  installed ${outMp4} (${statSync(outMp4).size} bytes), manifest updated`);
}

// ── main ────────────────────────────────────────────────────
const args = process.argv.slice(2);
let ids = [];
for (const a of args) {
  if (a === 'group:all') ids.push(...Object.values(GROUPS).flat()); // every tutorial, one pass
  else if (a.startsWith('group:')) ids.push(...(GROUPS[a.slice(6)] || []));
  else ids.push(a);
}
ids = [...new Set(ids)]; // de-dupe if groups overlap
if (!ids.length) { console.error('usage: record-batch.mjs <id|group:name|group:all> ...'); process.exit(1); }

await ensureState();
const done = [], failed = [];
for (const id of ids) {
  try { await recordOne(id); done.push(id); }
  catch (e) { failed.push(id); console.log(`  !! ${id} failed: ${e.message.split('\n')[0]}`); }
}
console.log('\nDONE:', done.join(', '));
if (failed.length) console.log('FAILED:', failed.join(', '));
