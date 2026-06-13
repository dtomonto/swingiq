// ============================================================
// SwingVantage — Figma token sync (advisory / non-destructive)
// ------------------------------------------------------------
// Closes the "design truth" side of the Figma integration WITHOUT touching
// Code Connect: it compares the design tokens defined in Figma (Variables, or a
// Tokens Studio export) against the live CSS tokens in `globals.css` and reports
// the DRIFT. It never writes to globals.css — those values are hand-tuned to
// pass the enforced WCAG-AA gates, so promotion to code stays a reviewed, manual
// step. "Figma is the design source of truth; values flow Figma → code, never
// the reverse" (see lib/connector-os/design-system/README.md).
//
//   node scripts/figma-tokens-sync.mjs                 # default theme: standard
//   node scripts/figma-tokens-sync.mjs --theme=dark-performance
//   node scripts/figma-tokens-sync.mjs --check         # exit 1 if any drift (CI)
//   npm run figma:tokens
//
// Token source resolution (first that applies):
//   1. --source=<path>             explicit export file
//   2. ./figma.tokens.json         a Tokens Studio / Variables export you drop in
//   3. FIGMA_ACCESS_TOKEN + FIGMA_FILE_KEY → Figma Variables REST API
//   4. none → keyless no-op (prints how to enable, exits 0) — CI-safe
//
// Output: a human summary on stdout + a `.figma-ds-state.json` snapshot
// (gitignored, per-session state) recording what was compared and the drift.
// ============================================================

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..'); // apps/web
const GLOBALS = join(ROOT, 'src', 'app', 'globals.css');
const STATE = join(ROOT, '.figma-ds-state.json');
const LOCAL_EXPORT = join(ROOT, 'figma.tokens.json');

// ── CLI args ────────────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const theme = getArg('theme', 'standard');
const checkMode = args.includes('--check');
const explicitSource = getArg('source', null);

// ── Figma token-path → CSS variable name convention ─────────
// Maps a Figma variable/token PATH (case-insensitive, '/' or '.' separated) to
// the `globals.css` channel variable it should mirror. Extend this as the Figma
// file grows — anything unmapped is reported as "unmapped" rather than dropped.
const NAME_MAP = {
  'brand/background': '--background',
  'brand/foreground': '--foreground',
  'brand/primary': '--primary',
  'brand/primary-foreground': '--primary-foreground',
  'brand/secondary': '--secondary',
  'brand/accent': '--accent',
  'brand/accent-secondary': '--accent-secondary',
  'brand/muted': '--muted',
  'brand/card': '--card',
  'brand/border': '--border',
  'status/success': '--success',
  'status/warning': '--warning',
  'status/error': '--error',
  'sport/golf': '--sport-golf',
  'sport/tennis': '--sport-tennis',
  'sport/pickleball': '--sport-pickleball',
  'sport/padel': '--sport-padel',
  'sport/baseball': '--sport-baseball',
  'sport/softball-slow': '--sport-softball-slow',
  'sport/softball-fast': '--sport-softball-fast',
};

function mapToCssVar(path) {
  const key = path.toLowerCase().replace(/\./g, '/');
  if (NAME_MAP[key]) return NAME_MAP[key];
  // Convention fallback: "Foo/Bar Baz" → "--foo-bar-baz"
  const slug = key.replace(/[\s_]+/g, '-').replace(/[^a-z0-9/-]/g, '').replace(/\//g, '-');
  return slug ? `--${slug}` : null;
}

// ── Color normalization → "H S% L%" channels (the globals.css format) ───────
function hexToHslChannels(hex) {
  let h = hex.replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length !== 6) return null;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return rgbToHslChannels(r, g, b);
}
function rgbToHslChannels(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let hue = 0;
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) {
    if (max === r) hue = ((g - b) / d) % 6;
    else if (max === g) hue = (b - r) / d + 2;
    else hue = (r - g) / d + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
  }
  return `${Math.round(hue)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
function normalizeColor(value) {
  if (typeof value !== 'string') return null;
  const v = value.trim();
  if (v.startsWith('#')) return hexToHslChannels(v);
  let m = v.match(/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
  if (m) return rgbToHslChannels(+m[1] / 255, +m[2] / 255, +m[3] / 255);
  m = v.match(/^hsla?\(\s*([\d.]+)[,\s]+([\d.]+)%[,\s]+([\d.]+)%/i);
  if (m) return `${Math.round(+m[1])} ${Math.round(+m[2])}% ${Math.round(+m[3])}%`;
  if (/^\d+\s+\d+%\s+\d+%$/.test(v)) return v; // already channels
  return null;
}

// ── Parse the code tokens for one theme out of globals.css ──────────────────
function loadCodeTokens(themeId) {
  const css = readFileSync(GLOBALS, 'utf8');
  const start = css.indexOf(`[data-theme='${themeId}']`);
  if (start === -1) return null;
  const open = css.indexOf('{', start);
  const close = css.indexOf('\n  }', open); // blocks are 2-space indented
  const block = css.slice(open + 1, close === -1 ? css.length : close);
  const tokens = {};
  for (const line of block.split('\n')) {
    const m = line.match(/^\s*(--[a-z0-9-]+):\s*([^;]+);/i);
    if (!m) continue;
    const norm = normalizeColor(m[2]);
    if (norm) tokens[m[1]] = norm; // colors only — skip shadows/gradients/radii
  }
  return tokens;
}

// ── Flatten a token source into { path: rawValue } ──────────────────────────
function flattenTokensStudio(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === 'object' && 'value' in v && typeof v.value !== 'object') {
      out[prefix ? `${prefix}/${k}` : k] = v.value;
    } else if (v && typeof v === 'object') {
      flattenTokensStudio(v, prefix ? `${prefix}/${k}` : k, out);
    }
  }
  return out;
}
function flattenFigmaVariables(json) {
  const vars = json?.meta?.variables;
  if (!vars) return null;
  const out = {};
  for (const v of Object.values(vars)) {
    if (v.resolvedType !== 'COLOR') continue;
    const modeVal = Object.values(v.valuesByMode || {})[0];
    if (!modeVal || typeof modeVal !== 'object' || !('r' in modeVal)) continue;
    out[v.name] = rgbToHslChannels(modeVal.r, modeVal.g, modeVal.b);
  }
  return out;
}

async function resolveSource() {
  if (explicitSource) {
    const p = resolve(explicitSource);
    return { kind: 'file', label: explicitSource, json: JSON.parse(readFileSync(p, 'utf8')) };
  }
  if (existsSync(LOCAL_EXPORT)) {
    return { kind: 'file', label: 'figma.tokens.json', json: JSON.parse(readFileSync(LOCAL_EXPORT, 'utf8')) };
  }
  const token = process.env.FIGMA_ACCESS_TOKEN;
  const fileKey = process.env.FIGMA_FILE_KEY;
  if (token && fileKey) {
    const url = `https://api.figma.com/v1/files/${fileKey}/variables/local`;
    const res = await fetch(url, { headers: { 'X-Figma-Token': token } });
    if (!res.ok) {
      const hint = res.status === 403
        ? ' (the Variables REST API needs a Figma Enterprise plan — or export a Tokens Studio JSON to ./figma.tokens.json instead)'
        : '';
      throw new Error(`Figma API ${res.status} ${res.statusText}${hint}`);
    }
    return { kind: 'api', label: `Figma file ${fileKey}`, json: await res.json() };
  }
  return null;
}

function flatten(source) {
  // Prefer Figma Variables API shape; else treat as Tokens Studio export.
  return flattenFigmaVariables(source.json) ?? flattenTokensStudio(source.json);
}

// ── Main ────────────────────────────────────────────────────
async function main() {
  const source = await resolveSource().catch((e) => {
    console.error(`✗ ${e.message}`);
    process.exit(1);
  });

  if (!source) {
    console.log('Figma token sync — no source configured (keyless no-op).\n');
    console.log('To enable, do ONE of:');
    console.log('  • Export your Figma Variables/Tokens Studio set to apps/web/figma.tokens.json');
    console.log('  • Or set FIGMA_ACCESS_TOKEN + FIGMA_FILE_KEY (Enterprise Variables API)');
    console.log('\nThen re-run `npm run figma:tokens`. Nothing was changed.');
    return;
  }

  const codeTokens = loadCodeTokens(theme);
  if (!codeTokens) {
    console.error(`✗ Theme '${theme}' not found in globals.css.`);
    process.exit(1);
  }

  const figmaFlat = flatten(source);
  const figmaColors = {};
  for (const [path, raw] of Object.entries(figmaFlat)) {
    const norm = normalizeColor(raw);
    if (norm) figmaColors[path] = norm;
  }

  const rows = [];
  const seenCssVars = new Set();
  for (const [path, value] of Object.entries(figmaColors)) {
    const cssVar = mapToCssVar(path);
    if (!cssVar) { rows.push({ path, status: 'unmapped', figma: value }); continue; }
    if (!(cssVar in codeTokens)) {
      rows.push({ path, cssVar, status: 'missing-in-code', figma: value });
      continue;
    }
    seenCssVars.add(cssVar);
    const code = codeTokens[cssVar];
    rows.push({ path, cssVar, status: code === value ? 'in-sync' : 'drift', figma: value, code });
  }
  // Code color tokens with no Figma counterpart (informational).
  const missingInFigma = Object.keys(codeTokens).filter((v) => !seenCssVars.has(v));

  const counts = rows.reduce((a, r) => ((a[r.status] = (a[r.status] || 0) + 1), a), {});
  const drift = counts.drift || 0;

  // ── Report ──
  console.log(`Figma token sync — theme '${theme}' vs ${source.label}\n`);
  const order = ['drift', 'missing-in-code', 'unmapped', 'in-sync'];
  for (const status of order) {
    const group = rows.filter((r) => r.status === status);
    if (!group.length) continue;
    console.log(`${status} (${group.length}):`);
    for (const r of group.slice(0, status === 'in-sync' ? 0 : 50)) {
      if (status === 'drift') console.log(`  ${r.cssVar}  figma:[${r.figma}]  code:[${r.code}]`);
      else if (status === 'unmapped') console.log(`  ${r.path}  →  (no CSS var; add to NAME_MAP)`);
      else console.log(`  ${r.path}  →  ${r.cssVar}  [${r.figma}]`);
    }
    console.log('');
  }
  console.log(
    `Summary: ${counts['in-sync'] || 0} in sync · ${drift} drift · ` +
    `${counts['missing-in-code'] || 0} missing-in-code · ${counts.unmapped || 0} unmapped · ` +
    `${missingInFigma.length} code tokens not in Figma.`,
  );
  console.log('Note: code values are AA-tuned — review drift by hand; this tool never edits globals.css.');

  // ── State snapshot (gitignored) ──
  const state = {
    syncedAt: new Date().toISOString(),
    theme,
    source: source.label,
    sourceKind: source.kind,
    counts: { ...counts, missingInFigma: missingInFigma.length },
    drift: rows.filter((r) => r.status === 'drift'),
    unmapped: rows.filter((r) => r.status === 'unmapped').map((r) => r.path),
    missingInFigma,
  };
  writeFileSync(STATE, JSON.stringify(state, null, 2) + '\n');
  console.log(`\nWrote ${STATE} (gitignored).`);

  if (checkMode && drift > 0) {
    console.error(`\n✗ --check: ${drift} token(s) drifted from Figma.`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
