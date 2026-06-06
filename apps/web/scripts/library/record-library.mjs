// ============================================================
// SwingVantage — Library training-video recorder
// ------------------------------------------------------------
// Records, narrates (AI voiceover), captions, and wires the
// Video Library's training videos. Self-contained so it never
// collides with the tutorial recorder.
//
//   # 1) start a LOCAL-mode dev server (no login wall) on :3100
//   NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_ANON_KEY= npx next dev -p 3100
//
//   # 2) (recommended) seed demo data so Diagnose/Progress look real
//   BASE_URL=http://localhost:3100 node scripts/video-studio/seed-data.mjs
//
//   # 3) record one or more training ids
//   BASE_URL=http://localhost:3100 node scripts/library/record-library.mjs swing-path launch-monitor-workflow
//
// For each id: record the on-screen tour -> transcode -> OpenAI TTS (curl)
// -> mux -> poster -> WebVTT captions -> append to
// src/lib/library/recordings.generated.json (auto-wires the library card).
//
// Prereqs (local dev tools, intentionally NOT in package.json):
//   npm i -D @playwright/test ffmpeg-static && npx playwright install chromium
// ============================================================

import { chromium } from 'playwright';
import ffmpegPath from 'ffmpeg-static';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIBRARY_CONFIG } from './library-config.mjs';

const BASE = process.env.BASE_URL || 'http://localhost:3100';
const HERE = dirname(fileURLToPath(import.meta.url));
const APP = join(HERE, '..', '..'); // apps/web
const WORK = join(HERE, '.work');
const OUT = join(APP, 'public', 'library');
const MANIFEST = join(APP, 'src', 'lib', 'library', 'recordings.generated.json');
// Reuse the tutorial recorder's seeded (data-rich) browser state when present.
const SHARED_STATE = join(APP, 'scripts', 'video-studio', '.work', 'state.json');
const STATE = existsSync(SHARED_STATE) ? SHARED_STATE : join(WORK, 'state.json');
const FF = ffmpegPath;

mkdirSync(WORK, { recursive: true });
mkdirSync(OUT, { recursive: true });

const HIDE_CSS = `
  nextjs-portal,
  [aria-label="Open AI Coach"],
  [aria-label="Open your guide"],
  [aria-label="Close your guide"],
  [aria-label="Your SwingVantage guide"],
  [aria-label="New here? Watch a quick tutorial"],
  [class*="tsqd-"] { display: none !important; }
`;

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

// Minimal state if no shared (seeded) state exists: clear the persona gate.
async function ensureState() {
  if (existsSync(STATE)) return;
  console.log('no shared state — seeding minimal persona gate (data may be empty)…');
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
    try {
      const line = readFileSync(join(APP, '.env.local'), 'utf8').split(/\r?\n/).find((l) => l.startsWith('OPENAI_API_KEY='));
      return line ? line.slice('OPENAI_API_KEY='.length).trim().replace(/^["']|["']$/g, '') : undefined;
    } catch { return undefined; }
  })();
  if (!key) throw new Error('OPENAI_API_KEY not found (env or apps/web/.env.local)');
  const body = join(WORK, 'body.json');
  writeFileSync(body, JSON.stringify({ model: 'tts-1', voice: 'nova', input: narration, response_format: 'mp3' }));
  // API key stays in a curl config file (-K), never in argv/logs. .work is gitignored.
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
    try { execFileSync('curl', ['-K', cfgFile, '-o', mp3Path], { stdio: ['ignore', 'ignore', 'ignore'] }); } catch { /* retry */ }
    ok = existsSync(mp3Path) && statSync(mp3Path).size >= 1000;
    if (!ok && attempt < 3) console.log(`  tts retry ${attempt}…`);
  }
  rmSync(cfgFile, { force: true });
  if (!ok) throw new Error('TTS failed after 3 attempts (no audio)');
}

function fmtVtt(sec) {
  const ms = Math.round((sec - Math.floor(sec)) * 1000);
  const s = Math.floor(sec) % 60;
  const m = Math.floor(sec / 60) % 60;
  const h = Math.floor(sec / 3600);
  const p = (n, l = 2) => String(n).padStart(l, '0');
  return `${p(h)}:${p(m)}:${p(s)}.${p(ms, 3)}`;
}

// Distribute caption lines evenly across the spoken (audio) duration.
function writeVtt(vttPath, lines, audioSec) {
  const per = audioSec / Math.max(1, lines.length);
  let t = 0;
  const cues = ['WEBVTT', ''];
  for (let i = 0; i < lines.length; i++) {
    const start = t;
    const end = i === lines.length - 1 ? audioSec : t + per;
    t = end;
    cues.push(String(i + 1), `${fmtVtt(start)} --> ${fmtVtt(end)}`, lines[i], '');
  }
  writeFileSync(vttPath, cues.join('\n'));
}

async function recordOne(id) {
  const cfg = LIBRARY_CONFIG[id];
  if (!cfg) throw new Error(`No library config for "${id}"`);
  console.log(`\n=== ${id} ===`);
  const rawDir = join(WORK, id);
  rmSync(rawDir, { recursive: true, force: true });
  mkdirSync(rawDir, { recursive: true });

  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: rawDir, size: { width: 1280, height: 720 } },
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
  await cfg.scenes(makeHelpers(page));
  const video = page.video();
  await ctx.close();
  await browser.close();
  const webm = await video.path();

  const silent = join(WORK, `${id}-silent.mp4`);
  execFileSync(FF, ['-y', '-i', webm, '-c:v', 'libx264', '-preset', 'slow', '-crf', '30',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-r', '30', '-an', silent], { stdio: 'ignore' });

  const narration = cfg.lines.join(' ');
  const vo = join(WORK, `${id}-vo.mp3`);
  console.log('  tts…');
  ttsTo(vo, narration);

  const vDur = probeSeconds(silent);
  const aDur = probeSeconds(vo) || vDur || 30;
  const target = (Math.max(vDur || 0, aDur || 0) + 0.4).toFixed(2);
  console.log(`  video=${vDur}s voice=${aDur}s -> ${target}s`);

  const outMp4 = join(OUT, `${id}.mp4`);
  execFileSync(FF, ['-y', '-i', silent, '-i', vo,
    '-filter_complex', '[0:v]tpad=stop_mode=clone:stop_duration=120[v];[1:a]apad[a]',
    '-map', '[v]', '-map', '[a]', '-t', target,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '30', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', outMp4], { stdio: 'ignore' });

  const posterAt = Math.min(3, Math.max(1, (vDur || 4) / 3));
  execFileSync(FF, ['-y', '-loglevel', 'error', '-ss', String(posterAt), '-i', outMp4,
    '-frames:v', '1', '-q:v', '3', join(OUT, `${id}-poster.jpg`)]);

  // Captions track from the narration lines, timed to the voice.
  writeVtt(join(OUT, `${id}.vtt`), cfg.lines, aDur);

  const finalSec = Math.round(probeSeconds(outMp4));
  const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {};
  manifest[id] = { durationSec: finalSec };
  writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`  installed ${outMp4} (${statSync(outMp4).size} bytes, ${finalSec}s) + poster + captions`);
}

// ── main ────────────────────────────────────────────────────
const ids = process.argv.slice(2);
if (!ids.length) {
  console.error('usage: record-library.mjs <id> [<id> ...]  (ids: ' + Object.keys(LIBRARY_CONFIG).join(', ') + ')');
  process.exit(1);
}
await ensureState();
const done = [], failed = [];
for (const id of ids) {
  try { await recordOne(id); done.push(id); }
  catch (e) { failed.push(id); console.log(`  !! ${id} failed: ${e.message.split('\n')[0]}`); }
}
console.log('\nDONE:', done.join(', ') || '(none)');
if (failed.length) console.log('FAILED:', failed.join(', '));
