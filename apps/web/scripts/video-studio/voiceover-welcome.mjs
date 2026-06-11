// ============================================================
// SwingVantage — Welcome tour: AI voiceover (Stage B)
// ------------------------------------------------------------
// Generates a narration track with OpenAI text-to-speech and
// muxes it onto the silent screen recording. Uses the existing
// OPENAI_API_KEY in apps/web/.env.local — no new account, ~$0.
//
//   node scripts/video-studio/voiceover-welcome.mjs
//
// Re-render the silent video first with record-welcome.mjs if the
// tour visuals change.
// ============================================================

import ffmpegPath from 'ffmpeg-static';
import { execFileSync } from 'node:child_process';
import { readFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const APP = join(HERE, '..', '..');
const WORK = join(HERE, '.work');
const SOURCES = join(APP, 'public', 'tutorials', 'sources');
const VIDEO = join(SOURCES, 'welcome.mp4');
const VO = join(WORK, 'welcome-vo.mp3');
const OUT = join(WORK, 'welcome-narrated.mp4');

mkdirSync(WORK, { recursive: true });
if (!existsSync(VIDEO)) throw new Error('Missing ' + VIDEO + ' — run record-welcome.mjs first.');

// Read OPENAI_API_KEY from .env.local without printing it.
function envKey(name) {
  if (process.env[name]) return process.env[name];
  const envPath = join(APP, '.env.local');
  const line = readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .find((l) => l.startsWith(name + '='));
  return line ? line.slice(name.length + 1).trim().replace(/^["']|["']$/g, '') : undefined;
}
const KEY = envKey('OPENAI_API_KEY');
if (!KEY) throw new Error('OPENAI_API_KEY not found in env or .env.local');

// Tour-matched narration — ~2 sentences per on-screen scene so the voice
// fills the ~65s video. Truthful + welcoming (honest about limited data).
const NARRATION = [
  'Welcome to SwingVantage — your personal performance system for golf, tennis, baseball, and softball. Whatever you play, the goal is the same: help you get measurably better, your way.',
  'The idea is simple. Analyze your swing, see the single most important thing to work on, practice it with a focused plan, and watch yourself improve over time.',
  'Every feature works for free, across all seven sports. You get clear, honest feedback — and when the data is limited, SwingVantage tells you, instead of guessing.',
  "Getting started takes about two minutes. Just pick the sport you're working on — no account and no credit card needed — and you'll get your first personalized result right away.",
  'From there, your Today dashboard becomes home base. It shows your main focus, your recent sessions, your scores, and the single best thing to do next.',
  "And as you log more sessions, SwingVantage tracks your progress, so you can see real, lasting improvement. Welcome aboard — let's get started.",
].join(' ');

// Generate via curl: node's fetch (undici) times out reaching the API in
// this environment, but curl is fast and reliable.
const fs = await import('node:fs');
const bodyPath = join(WORK, 'body.json');
fs.writeFileSync(bodyPath, JSON.stringify({ model: 'tts-1', voice: 'nova', input: NARRATION, response_format: 'mp3' }));
rmSync(VO, { force: true });
console.log('Requesting OpenAI TTS via curl…');
// Key goes in a curl config file (-K), never argv, so it can't leak into logs.
const cfgFile = join(WORK, 'curl.cfg');
fs.writeFileSync(cfgFile,
  `url = "https://api.openai.com/v1/audio/speech"\n` +
  `header = "Authorization: Bearer ${KEY}"\n` +
  `header = "Content-Type: application/json"\n` +
  `data = "@${bodyPath.replace(/\\/g, '/')}"\n` +
  `silent\nfail-with-body\nmax-time = 120\n`);
// Retry: the curl→OpenAI call is occasionally flaky here and can produce an
// empty file on the first try (record-batch / record-library already retry 3×).
// A single transient miss must not kill the whole welcome render.
let ok = false;
for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
  rmSync(VO, { force: true });
  try { execFileSync('curl', ['-K', cfgFile, '-o', VO], { stdio: ['ignore', 'ignore', 'ignore'] }); } catch { /* transient — retry */ }
  ok = existsSync(VO) && fs.statSync(VO).size >= 1000;
  if (!ok && attempt < 3) console.log(`  tts retry ${attempt}…`);
}
rmSync(cfgFile, { force: true });
if (!ok) throw new Error('TTS produced no/empty audio at ' + VO + ' (after 3 attempts)');
console.log('voiceover written:', VO, `(${fs.statSync(VO).size} bytes)`);

// ffmpeg prints info to stderr and exits non-zero with just -i; capture safely.
function probeSeconds(file) {
  let stderr = '';
  try {
    execFileSync(ffmpegPath, ['-i', file], { stdio: ['ignore', 'ignore', 'pipe'] });
  } catch (e) {
    stderr = (e.stderr || '').toString();
  }
  const m = stderr.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
  if (!m) return null;
  return (+m[1]) * 3600 + (+m[2]) * 60 + parseFloat(m[3]);
}
const vDur = probeSeconds(VIDEO);
const aDur = probeSeconds(VO);
console.log(`video=${vDur}s  voiceover=${aDur}s`);

// Mux: pad whichever is shorter so both reach the same length; cap at the max.
const target = (Math.max(vDur || 0, aDur || 0) + 0.4).toFixed(2);
console.log('muxing to target length', target, 's');
execFileSync(
  ffmpegPath,
  [
    '-y',
    '-i', VIDEO,
    '-i', VO,
    '-filter_complex',
    '[0:v]tpad=stop_mode=clone:stop_duration=120[v];[1:a]apad[a]',
    '-map', '[v]',
    '-map', '[a]',
    '-t', target,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '30', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '128k',
    '-movflags', '+faststart',
    OUT,
  ],
  { stdio: 'inherit' },
);

if (!existsSync(OUT)) throw new Error('mux failed: ' + OUT);
fs.copyFileSync(OUT, VIDEO);
console.log('\nnarrated video installed at', VIDEO, `(${fs.statSync(VIDEO).size} bytes)`);
