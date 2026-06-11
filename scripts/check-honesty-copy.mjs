#!/usr/bin/env node
// ============================================================
// Honesty-copy guard (Design V2 guardrail).
//
// The redesign restyles the report + upload surfaces behind a flag. The
// "honesty copy is locked" rule says confidence labels, limitation/"what
// this can't know" signals, and privacy/consent lines may MOVE but never
// DISAPPEAR. This guard asserts those markers are still PRESENT on the
// surfaces a restyle is most likely to strip — so a className/markup pass
// that drops a confidence label or a consent line turns CI red.
//
// Complements the inverse guard test (no-heuristic-copy.test.ts), which
// asserts forbidden "estimated/simulated" language is ABSENT.
//
// Pure Node, no deps. Comments are stripped before matching so a developer
// comment can't satisfy a marker — only real user-facing copy counts.
//
//   node scripts/check-honesty-copy.mjs
// ============================================================

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const web = (p) => resolve(ROOT, 'apps/web/src', p);

/**
 * Each surface lists the marker CATEGORIES it must keep. A category passes
 * when ANY of its patterns matches the comment-stripped source. Add a surface
 * here when a phase introduces a new report/upload screen.
 */
const SURFACES = [
  {
    label: 'AI report / diagnosis (confidence + limitation transparency)',
    file: web('app/(app)/diagnose/DiagnoseContent.tsx'),
    requires: [
      { name: 'confidence label', any: [/confidence/i] },
      {
        name: 'limitation / "more shots" transparency',
        any: [/higher-confidence read/i, /more shots/i, /transparency/i],
      },
    ],
  },
  {
    label: 'Video upload (privacy line)',
    file: web('components/video/VideoUpload.tsx'),
    requires: [
      {
        name: 'privacy / on-device / never-trained line',
        any: [/never used to train/i, /in your browser/i, /never (sold|shared)/i, /stays? (private|on)/i],
      },
    ],
  },
  {
    label: 'Safe-upload explainer (consent + youth safety)',
    file: web('components/trust/SafeUploadExplainer.tsx'),
    requires: [
      { name: 'consent', any: [/consent/i] },
      { name: 'youth / guardian safety', any: [/parent or guardian/i, /guardian/i] },
    ],
  },
];

/** Strip block + line comments so only user-facing copy is inspected. */
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

let failures = 0;
for (const surface of SURFACES) {
  if (!existsSync(surface.file)) {
    console.error(`✗ MISSING SURFACE  ${surface.label}\n    expected at: ${surface.file}\n    (renamed/removed? re-point this guard at the new file)`);
    failures++;
    continue;
  }
  const code = stripComments(readFileSync(surface.file, 'utf8'));
  const missing = surface.requires.filter((req) => !req.any.some((re) => re.test(code)));
  if (missing.length) {
    failures++;
    console.error(`✗ ${surface.label}`);
    for (const req of missing) console.error(`    missing honesty marker: ${req.name}`);
  } else {
    console.log(`✓ ${surface.label}`);
  }
}

if (failures) {
  console.error(`\nHonesty-copy guard FAILED (${failures} surface${failures > 1 ? 's' : ''}).`);
  console.error('Confidence labels, limitation signals, and privacy/consent lines must stay on report + upload surfaces — move them, never remove them.');
  process.exit(1);
}
console.log('\nHonesty-copy guard passed — all report + upload surfaces keep their honesty markers.');
