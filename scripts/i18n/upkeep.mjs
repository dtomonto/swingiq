#!/usr/bin/env node
// ============================================================
// SwingVantage — i18n upkeep CLI
//
// Keeps marketing translations honest as English changes. Reads the
// JSON dictionaries under apps/web/src/content/marketing/i18n and the
// committed manifest, then:
//
//   (default)     detect — report current/stale/missing per locale.
//   --bless       record current English hashes for keys that ARE
//                 translated (use after adding/fixing translations by
//                 hand). Writes the manifest.
//   --translate   provider-gated auto-translation of stale/missing
//                 entries. OFF unless TRANSLATE_AI_ENABLED=1 (+ an AI
//                 key). Keyless default = no-op, so there is zero spend.
//
// Exit code is non-zero in detect mode when drift exists, so CI / the
// scheduled task can notice. Never pushes — commits are the owner's.
// ============================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');
const I18N_DIR = join(REPO_ROOT, 'apps', 'web', 'src', 'content', 'marketing', 'i18n');
const MANIFEST_PATH = join(
  REPO_ROOT, 'apps', 'web', 'src', 'content', 'marketing', 'translation-manifest.generated.json',
);
const REPORT_PATH = join(REPO_ROOT, 'docs', 'i18n-upkeep-report.md');

const LOCALES = ['es', 'fr']; // non-English locales we ship dictionaries for

// ── Hashing — MUST stay byte-identical to apps/web/src/lib/i18n-upkeep/hash.ts
function normalize(input) {
  return String(input).replace(/\r\n/g, '\n').trim();
}
function hashString(input) {
  const str = normalize(input);
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash + ((hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24))) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

// ── Flatten — MUST match apps/web/src/lib/marketing-i18n/dict.ts flatten()
function flatten(obj, prefix = '') {
  const out = {};
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    for (const [k, v] of Object.entries(obj)) {
      const key = prefix ? `${prefix}.${k}` : k;
      if (typeof v === 'string') out[key] = v;
      else if (v && typeof v === 'object') Object.assign(out, flatten(v, key));
    }
  }
  return out;
}

function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

// ── Status rule — mirrors statusFor() in i18n-upkeep/detect.ts
function statusFor(key, locale, english, translations, manifest) {
  const en = english[key];
  if (en === undefined) return 'missing';
  const translated = translations[locale]?.[key];
  if (translated === undefined || translated === '') return 'missing';
  const record = manifest.keys[key]?.locales?.[locale];
  if (!record) return 'stale';
  return record.srcHash === hashString(en) ? 'current' : 'stale';
}

function main() {
  const args = process.argv.slice(2);
  const bless = args.includes('--bless');
  const translate = args.includes('--translate');

  const english = flatten(readJson(join(I18N_DIR, 'en.json'), {}));
  const translations = {};
  for (const loc of LOCALES) translations[loc] = flatten(readJson(join(I18N_DIR, loc + '.json'), {}));

  const manifest = readJson(MANIFEST_PATH, { version: 1, generatedAt: new Date(0).toISOString(), keys: {} });
  manifest.keys = manifest.keys || {};

  // Optional AI translation pass (provider-gated; keyless default no-op).
  if (translate) {
    const enabled = process.env.TRANSLATE_AI_ENABLED === '1' && !!process.env.OPENAI_API_KEY;
    if (!enabled) {
      console.log('• --translate requested but TRANSLATE_AI_ENABLED/OPENAI_API_KEY not set — skipping (no spend).');
    } else {
      console.log('• AI translation is enabled but no provider call is wired in this build — skipping safely.');
      // Intentionally a no-op placeholder: wire the existing AI provider here,
      // write results into the locale JSON, then fall through to bless.
    }
  }

  // Compute status for every (key, locale).
  const counts = { current: 0, stale: 0, missing: 0 };
  const drift = [];
  for (const key of Object.keys(english)) {
    for (const loc of LOCALES) {
      const status = statusFor(key, loc, english, translations, manifest);
      counts[status]++;
      if (status !== 'current') drift.push({ key, locale: loc, status });
    }
  }

  // Bless: record current English hash for keys that ARE translated.
  let blessed = 0;
  if (bless) {
    const now = new Date().toISOString();
    for (const key of Object.keys(english)) {
      for (const loc of LOCALES) {
        const translated = translations[loc]?.[key];
        if (translated === undefined || translated === '') continue;
        manifest.keys[key] = manifest.keys[key] || { locales: {} };
        manifest.keys[key].locales = manifest.keys[key].locales || {};
        const prev = manifest.keys[key].locales[loc];
        manifest.keys[key].locales[loc] = {
          srcHash: hashString(english[key]),
          translatedAt: now,
          source: prev?.source ?? 'human',
        };
        blessed++;
      }
    }
    manifest.version = 1;
    manifest.generatedAt = now;
    writeJson(MANIFEST_PATH, manifest);
    console.log(`✓ Blessed ${blessed} (key, locale) pairs → ${MANIFEST_PATH}`);
  }

  // Recompute after bless for an accurate report.
  if (bless) {
    counts.current = 0; counts.stale = 0; counts.missing = 0;
    drift.length = 0;
    for (const key of Object.keys(english)) {
      for (const loc of LOCALES) {
        const status = statusFor(key, loc, english, translations, manifest);
        counts[status]++;
        if (status !== 'current') drift.push({ key, locale: loc, status });
      }
    }
  }

  // Write a human report (the scheduled task commits this).
  const lines = [];
  lines.push('# i18n Upkeep Report');
  lines.push('');
  lines.push('**In Plain English (start here):** this checks whether the translated');
  lines.push('marketing pages still match the English they were translated from. Anything');
  lines.push('listed as *stale* or *missing* is automatically hidden from that language');
  lines.push("(no broken half-Spanish pages get shown) until it's re-translated.");
  lines.push('');
  lines.push(`_Generated ${new Date().toISOString()}._`);
  lines.push('');
  lines.push(`- ✅ current: **${counts.current}**`);
  lines.push(`- ⚠️ stale: **${counts.stale}**`);
  lines.push(`- ❌ missing: **${counts.missing}**`);
  lines.push('');
  if (drift.length === 0) {
    lines.push('All shipped translations are current. 🎉');
  } else {
    lines.push('## Needs attention');
    lines.push('');
    lines.push('| Key | Locale | Status |');
    lines.push('| --- | --- | --- |');
    for (const d of drift.slice(0, 500)) lines.push(`| \`${d.key}\` | ${d.locale} | ${d.status} |`);
  }
  lines.push('');
  writeJson; // (noop reference to keep tree-shakers calm)
  mkdirSync(dirname(REPORT_PATH), { recursive: true });
  writeFileSync(REPORT_PATH, lines.join('\n'), 'utf8');

  console.log(`\ni18n upkeep — current:${counts.current} stale:${counts.stale} missing:${counts.missing}`);
  console.log(`Report: ${REPORT_PATH}`);

  // In pure detect mode, a non-zero exit signals drift to CI / the scheduler.
  if (!bless && drift.length > 0) process.exitCode = 1;
}

main();
