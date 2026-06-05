#!/usr/bin/env node
/**
 * optimize-tutorial-video.mjs
 * ---------------------------------------------------------------------------
 * In plain English: point this at a raw screen-recording and a video id, and it
 * produces every file the tutorial player needs — a compressed desktop MP4, a
 * smaller WebM, a mobile MP4, a poster image, and a thumbnail — named after the
 * id and dropped into apps/web/public/tutorials/<folder>/.
 *
 * It uses FFmpeg (https://ffmpeg.org). If FFmpeg isn't installed, or you pass
 * --dry-run, it just prints the exact commands so you can run them yourself.
 *
 * Usage:
 *   node scripts/optimize-tutorial-video.mjs <input> <id> [--poster-at=SS] [--dry-run]
 *
 * Examples:
 *   node scripts/optimize-tutorial-video.mjs raw/welcome.mov welcome
 *   node scripts/optimize-tutorial-video.mjs raw/upload.mp4 video-analysis --poster-at=2
 *   node scripts/optimize-tutorial-video.mjs raw/x.mov welcome --dry-run
 *
 * After it runs, set the matching fields in apps/web/src/lib/tutorial/videos.ts:
 *   mp4Src:      '/tutorials/sources/<id>.mp4'
 *   webmSrc:     '/tutorials/sources/<id>.webm'
 *   mobileSrc:   '/tutorials/mobile/<id>.mp4'
 *   poster:      '/tutorials/posters/<id>.jpg'
 *   thumbnail:   '/tutorials/thumbnails/<id>.jpg'
 *   captionsSrc: '/tutorials/captions/<id>.vtt'   (author this by hand)
 */

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, '..', 'apps', 'web', 'public', 'tutorials');

function fail(msg) {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
}

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith('--')));
const positional = args.filter((a) => !a.startsWith('--'));
const [input, id] = positional;
const dryRun = flags.has('--dry-run');
const posterAt = (args.find((a) => a.startsWith('--poster-at=')) || '--poster-at=1').split('=')[1];

if (!input || !id) {
  fail('Usage: node scripts/optimize-tutorial-video.mjs <input> <id> [--poster-at=SS] [--dry-run]');
}
if (!dryRun && !existsSync(input)) {
  fail(`Input not found: ${input}`);
}

const out = {
  mp4: path.join(PUBLIC, 'sources', `${id}.mp4`),
  webm: path.join(PUBLIC, 'sources', `${id}.webm`),
  mobile: path.join(PUBLIC, 'mobile', `${id}.mp4`),
  poster: path.join(PUBLIC, 'posters', `${id}.jpg`),
  thumb: path.join(PUBLIC, 'thumbnails', `${id}.jpg`),
};

// FFmpeg argument lists (kept as arrays so paths with spaces are safe).
const jobs = [
  {
    label: 'Desktop MP4 (H.264, 1280×720, CRF 23, faststart)',
    args: ['-y', '-i', input, '-vf', 'scale=-2:720', '-c:v', 'libx264', '-profile:v', 'high',
      '-crf', '23', '-preset', 'slow', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', out.mp4],
  },
  {
    label: 'WebM (VP9, 1280×720, CRF 34)',
    args: ['-y', '-i', input, '-vf', 'scale=-2:720', '-c:v', 'libvpx-vp9', '-crf', '34', '-b:v', '0',
      '-row-mt', '1', '-c:a', 'libopus', '-b:a', '96k', out.webm],
  },
  {
    label: 'Mobile MP4 (H.264, 854×480, CRF 26)',
    args: ['-y', '-i', input, '-vf', 'scale=-2:480', '-c:v', 'libx264', '-crf', '26', '-preset', 'slow',
      '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', out.mobile],
  },
  {
    label: `Poster (frame at ${posterAt}s, 1280×720)`,
    args: ['-y', '-ss', String(posterAt), '-i', input, '-vframes', '1', '-vf', 'scale=-2:720', '-q:v', '3', out.poster],
  },
  {
    label: `Thumbnail (frame at ${posterAt}s, 640×360)`,
    args: ['-y', '-ss', String(posterAt), '-i', input, '-vframes', '1', '-vf', 'scale=-2:360', '-q:v', '4', out.thumb],
  },
];

function ensureDirs() {
  for (const dir of ['sources', 'mobile', 'posters', 'thumbnails', 'captions']) {
    mkdirSync(path.join(PUBLIC, dir), { recursive: true });
  }
}

function hasFfmpeg() {
  const r = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' });
  return r.status === 0;
}

console.log(`\nTutorial video optimizer — id: "${id}"\n`);

if (dryRun || !hasFfmpeg()) {
  if (!dryRun) console.log('FFmpeg not found on PATH — printing commands instead.\n');
  for (const job of jobs) {
    console.log(`# ${job.label}`);
    console.log(`ffmpeg ${job.args.map((a) => (/\s/.test(a) ? JSON.stringify(a) : a)).join(' ')}\n`);
  }
  console.log('Tip: install FFmpeg, then re-run without --dry-run to generate the files.\n');
  process.exit(0);
}

ensureDirs();
for (const job of jobs) {
  console.log(`→ ${job.label}`);
  const r = spawnSync('ffmpeg', job.args, { stdio: 'inherit' });
  if (r.status !== 0) fail(`FFmpeg failed on: ${job.label}`);
}

console.log(`\n✓ Done. Files written under apps/web/public/tutorials/ for id "${id}".`);
console.log('  Next: set mp4Src/webmSrc/mobileSrc/poster/thumbnail on the manifest entry,');
console.log('  and author captions at /tutorials/captions/' + id + '.vtt.\n');
