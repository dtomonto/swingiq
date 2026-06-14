#!/usr/bin/env node
// ============================================================
// SwingVantage — Vendor MediaPipe pose assets for self-hosting
// ------------------------------------------------------------
// Copies the on-device pose engine's runtime + models into /public so
// they're served SAME-ORIGIN instead of from third-party CDNs. After
// running this and setting the two env vars it prints, you can:
//   • drop https://cdn.jsdelivr.net + https://storage.googleapis.com from the
//     CSP (next.config.mjs),
//   • run fully offline / behind a strict network policy,
//   • stop making any third-party request for pose (privacy + reliability).
//
// The WASM runtime is COPIED from the installed @mediapipe/tasks-vision
// package (no network). The model .task files are downloaded once from
// Google Cloud Storage. Output lives under public/mediapipe/ (gitignored —
// these are large generated binaries, vendored per-environment at deploy time).
//
// Usage:
//   node scripts/vendor-mediapipe.mjs            # wasm + lite/full/heavy models
//   node scripts/vendor-mediapipe.mjs --tiers=lite        # just the lite model
//   npm run mediapipe:vendor
// ============================================================

import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { mkdir, readdir, copyFile, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(here, '..');
const publicDir = path.join(webRoot, 'public', 'mediapipe');

const MODEL_HOST = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker';
const ALL_TIERS = ['lite', 'full', 'heavy'];

function parseTiers() {
  const arg = process.argv.find((a) => a.startsWith('--tiers='));
  if (!arg) return ALL_TIERS;
  const tiers = arg
    .slice('--tiers='.length)
    .split(',')
    .map((t) => t.trim())
    .filter((t) => ALL_TIERS.includes(t));
  return tiers.length ? tiers : ALL_TIERS;
}

/** Find the installed package root (the dir that contains the `wasm/` folder). */
function findPackageDir() {
  // require.resolve('.') honours the package's exports map; walk up to the root.
  let dir = path.dirname(require.resolve('@mediapipe/tasks-vision'));
  for (let i = 0; i < 6; i++) {
    if (existsSync(path.join(dir, 'wasm'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error('Could not locate @mediapipe/tasks-vision/wasm — is the package installed?');
}

async function copyWasm() {
  const pkgDir = findPackageDir();
  const wasmSrc = path.join(pkgDir, 'wasm');
  const wasmDest = path.join(publicDir, 'wasm');
  await mkdir(wasmDest, { recursive: true });
  const files = await readdir(wasmSrc);
  let copied = 0;
  for (const f of files) {
    await copyFile(path.join(wasmSrc, f), path.join(wasmDest, f));
    copied++;
  }
  let version = 'unknown';
  try {
    version = JSON.parse(await readFile(path.join(pkgDir, 'package.json'), 'utf8')).version;
  } catch {
    /* version is cosmetic */
  }
  console.log(`✓ WASM runtime: copied ${copied} files from @mediapipe/tasks-vision@${version}`);
  return wasmDest;
}

async function downloadModel(tier) {
  const url = `${MODEL_HOST}/pose_landmarker_${tier}/float16/1/pose_landmarker_${tier}.task`;
  const destDir = path.join(publicDir, 'models', 'pose_landmarker', `pose_landmarker_${tier}`, 'float16', '1');
  const dest = path.join(destDir, `pose_landmarker_${tier}.task`);
  await mkdir(destDir, { recursive: true });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  const mb = (buf.length / (1024 * 1024)).toFixed(1);
  console.log(`✓ Model: ${tier} (${mb} MB)`);
}

async function main() {
  const tiers = parseTiers();
  console.log(`Vendoring MediaPipe pose assets → ${path.relative(webRoot, publicDir)}/`);
  await mkdir(publicDir, { recursive: true });

  await copyWasm();
  for (const tier of tiers) {
    try {
      await downloadModel(tier);
    } catch (err) {
      console.error(`✗ Model ${tier} failed: ${err.message}`);
      process.exitCode = 1;
    }
  }

  console.log('\nDone. To serve these same-origin, set in your env:');
  console.log('  NEXT_PUBLIC_MEDIAPIPE_WASM_BASE=/mediapipe/wasm');
  console.log('  NEXT_PUBLIC_MEDIAPIPE_MODEL_BASE=/mediapipe/models/pose_landmarker');
  console.log('Then you may drop cdn.jsdelivr.net + storage.googleapis.com from the CSP.');
}

main().catch((err) => {
  console.error('vendor-mediapipe failed:', err);
  process.exit(1);
});
