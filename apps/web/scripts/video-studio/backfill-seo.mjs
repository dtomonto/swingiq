// ============================================================
// SwingVantage — one-time SEO backfill for existing recordings
// ------------------------------------------------------------
// The first batch of tutorial recordings shipped before captions + SEO dates
// were generated during recording. This brings them up to the strict bar
// WITHOUT re-recording (no TTS spend):
//   1. Writes /public/tutorials/sources/<id>.vtt for every recorded tutorial,
//      from the actual spoken narration (batch-config.mjs), timed across the
//      recorded duration — identical cue model to the library recorder.
//   2. Stamps a real `uploadDate` onto every entry in BOTH recordings manifests
//      (tutorial + library) that lacks one, using a single honest baseline (the
//      date these recordings were produced). `dateModified` is left unset until
//      a clip is actually re-recorded.
//
// Idempotent: existing .vtt files and existing uploadDates are left untouched.
// Run once:  node scripts/video-studio/backfill-seo.mjs
// ============================================================

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VIDEO_CONFIG } from './batch-config.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const APP = join(HERE, '..', '..');
const BASELINE = '2026-06-11'; // when the current committed recordings were produced

// Narration for recordings that live OUTSIDE batch-config (the homepage
// "welcome" video has its own recorder, voiceover-welcome.mjs, which runs TTS
// on import so it can't be imported here — mirror its NARRATION verbatim).
const EXTRA_NARRATION = {
  welcome: [
    'Welcome to SwingVantage — your personal performance system for golf, tennis, baseball, and softball. Whatever you play, the goal is the same: help you get measurably better, your way.',
    'The idea is simple. Analyze your swing, see the single most important thing to work on, practice it with a focused plan, and watch yourself improve over time.',
    'Every feature works for free, across all seven sports. You get clear, honest feedback — and when the data is limited, SwingVantage tells you, instead of guessing.',
    "Getting started takes about two minutes. Just pick the sport you're working on — no account and no credit card needed — and you'll get your first personalized result right away.",
    'From there, your Today dashboard becomes home base. It shows your main focus, your recent sessions, your scores, and the single best thing to do next.',
    "And as you log more sessions, SwingVantage tracks your progress, so you can see real, lasting improvement. Welcome aboard — let's get started.",
  ].join(' '),
};

const TUT_MANIFEST = join(APP, 'src', 'lib', 'tutorial', 'recordings.generated.json');
const LIB_MANIFEST = join(APP, 'src', 'lib', 'library', 'recordings.generated.json');
const TUT_SOURCES = join(APP, 'public', 'tutorials', 'sources');

function fmtVtt(sec) {
  const ms = Math.round((sec - Math.floor(sec)) * 1000);
  const s = Math.floor(sec) % 60;
  const m = Math.floor(sec / 60) % 60;
  const h = Math.floor(sec / 3600);
  const p = (n, l = 2) => String(n).padStart(l, '0');
  return `${p(h)}:${p(m)}:${p(s)}.${p(ms, 3)}`;
}

function captionLines(narration) {
  return narration
    .split(/(?<=[.!?])\s+/)
    .map((l) => l.trim())
    .filter(Boolean);
}

function vtt(narration, audioSec) {
  const lines = captionLines(narration);
  const per = audioSec / Math.max(1, lines.length);
  let t = 0;
  const cues = ['WEBVTT', ''];
  for (let i = 0; i < lines.length; i++) {
    const start = t;
    const end = i === lines.length - 1 ? audioSec : t + per;
    t = end;
    cues.push(String(i + 1), `${fmtVtt(start)} --> ${fmtVtt(end)}`, lines[i], '');
  }
  return cues.join('\n');
}

/** Add `uploadDate` to manifest entries that lack one. Returns count changed. */
function stampDates(manifestPath) {
  if (!existsSync(manifestPath)) return 0;
  const m = JSON.parse(readFileSync(manifestPath, 'utf8'));
  let n = 0;
  for (const id of Object.keys(m)) {
    if (!m[id].uploadDate) {
      m[id] = { ...m[id], uploadDate: BASELINE };
      n++;
    }
  }
  if (n) writeFileSync(manifestPath, JSON.stringify(m, null, 2) + '\n');
  return n;
}

// 1. Captions for recorded tutorials.
let wrote = 0;
if (existsSync(TUT_MANIFEST)) {
  const rec = JSON.parse(readFileSync(TUT_MANIFEST, 'utf8'));
  for (const [id, meta] of Object.entries(rec)) {
    const narration = VIDEO_CONFIG[id]?.narration ?? EXTRA_NARRATION[id];
    if (!narration) {
      console.log(`  skip ${id}: no narration found`);
      continue;
    }
    const out = join(TUT_SOURCES, `${id}.vtt`);
    if (existsSync(out)) continue; // idempotent
    writeFileSync(out, vtt(narration, meta.durationSec || 12));
    wrote++;
  }
}
console.log(`captions: wrote ${wrote} tutorial .vtt file(s)`);

// 2. SEO dates on both manifests.
console.log(`dates: stamped ${stampDates(TUT_MANIFEST)} tutorial + ${stampDates(LIB_MANIFEST)} library entr(ies)`);
