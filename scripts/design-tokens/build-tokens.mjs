#!/usr/bin/env node
/**
 * Design-token interchange builder — the Figma ⇄ code bridge.
 *
 * `globals.css` is the SOURCE OF TRUTH for SwingVantage's tokens: every theme
 * redefines the same semantic CSS variables (`--background`, `--primary`, …)
 * as AA-tuned HSL triplets, plus per-sport identity accents and a static
 * brand/golf hex scale. Designers, however, work in Figma — and the Tokens
 * Studio plugin speaks the W3C Design Tokens (DTCG) JSON format, not CSS.
 *
 * This script extracts the color/dimension tokens out of `globals.css` into a
 * single Tokens-Studio–compatible JSON file. That file is the interchange
 * artifact: import it into Tokens Studio to seed/sync the Figma variables, and
 * (with a future export) round-trip designer edits back. We extract FROM code
 * rather than generate the CSS so the hand-tuned AA palettes, gradients,
 * shadows, motion and SVG textures in `globals.css` stay the authored truth —
 * only the color/radius primitives flow out.
 *
 * Usage:
 *   node scripts/design-tokens/build-tokens.mjs           # write the JSON
 *   node scripts/design-tokens/build-tokens.mjs --check    # fail on drift (CI)
 *
 * The pure core (`parseCss`, `buildTokens`) is exported for unit tests.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..');
const GLOBALS_CSS = resolve(REPO_ROOT, 'apps/web/src/app/globals.css');
const OUT_FILE = resolve(
  REPO_ROOT,
  'apps/web/src/lib/connector-os/design-system/tokens/swingvantage.tokens.json',
);

// Themes whose [data-theme='…'] palette blocks we extract, in catalog order
// (mirrors THEMES in apps/web/src/lib/theme/themes.ts). `:root` carries the
// `standard` palette, and `.dark` aliases `dark-performance`.
const THEME_IDS = [
  'standard',
  'dark-performance',
  'coach-mode',
  'coach-night',
  'heritage-club',
  'field-court',
  'arcade-practice',
  'bird-print',
  'christmas-swing-lab',
];

// [data-sport='…'] identity blocks (the second, theme-agnostic axis).
const SPORT_IDS = [
  'golf',
  'tennis',
  'baseball',
  'softball_slow',
  'softball_fast',
  'pickleball',
  'padel',
];

const HSL_TRIPLET = /^-?\d+(?:\.\d+)?\s+\d+(?:\.\d+)?%\s+\d+(?:\.\d+)?%$/;
const HEX = /^#[0-9a-fA-F]{3,8}$/;
const DIMENSION = /^-?\d+(?:\.\d+)?(?:px|rem|em)$/;

/**
 * Walk a CSS string and collect every custom-property declaration, attributed
 * to the selector of its immediately-enclosing rule. String- and paren-aware so
 * a `;` or brace inside a `url("…")` / gradient value never confuses nesting.
 *
 * @returns {Array<{selector: string, name: string, value: string}>}
 */
export function parseCss(css) {
  // Strip /* … */ comments first (none of our values contain them).
  const src = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const decls = [];
  const stack = []; // selector strings, innermost last
  let buf = ''; // accumulates a selector OR a declaration body
  let inStr = false;
  let quote = '';
  let paren = 0;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inStr) {
      buf += ch;
      if (ch === quote) inStr = false;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inStr = true;
      quote = ch;
      buf += ch;
      continue;
    }
    if (ch === '(') paren++;
    else if (ch === ')') paren && paren--;

    if (ch === '{' && paren === 0) {
      stack.push(buf.trim());
      buf = '';
    } else if (ch === '}' && paren === 0) {
      flush(buf, stack, decls);
      buf = '';
      stack.pop();
    } else if (ch === ';' && paren === 0) {
      flush(buf, stack, decls);
      buf = '';
    } else {
      buf += ch;
    }
  }
  return decls;
}

function flush(body, stack, decls) {
  const text = body.trim();
  if (!text.startsWith('--')) return;
  const idx = text.indexOf(':');
  if (idx === -1) return;
  const name = text.slice(2, idx).trim();
  const value = text.slice(idx + 1).trim();
  if (!name || !value) return;
  decls.push({ selector: stack[stack.length - 1] || '', name, value });
}

/** Classify a raw CSS value into a DTCG token (or null to skip). */
function toToken(value) {
  if (HSL_TRIPLET.test(value)) return { $type: 'color', $value: `hsl(${value})` };
  if (HEX.test(value)) return { $type: 'color', $value: value.toLowerCase() };
  if (DIMENSION.test(value)) return { $type: 'dimension', $value: value };
  return null;
}

// A theme palette is keyed strictly by its [data-theme='…'] attribute. The
// `standard` block is written `:root, [data-theme='standard']`, so it still
// matches — while the OTHER bare `:root` blocks (sport accents, semantic-vocab
// aliases, floating-dock layout vars) are correctly excluded from every theme.
const selectorHasTheme = (sel, id) =>
  new RegExp(`\\[data-theme=['"]${id}['"]\\]`).test(sel);

const selectorHasSport = (sel, id) =>
  new RegExp(`\\[data-sport=['"]${id}['"]\\]`).test(sel);

// The theme-agnostic per-sport accent swatches live in a dedicated bare `:root`
// block (`--sport-golf`, `--sport-tennis-foreground`, …) — never a [data-theme]
// or [data-sport] block, and never the layout/alias roots.
const isSportAccentRoot = (sel) =>
  /(^|,)\s*:root\s*$/.test(sel.trim()) && !/data-theme|data-sport/.test(sel);

/**
 * Build the Tokens-Studio single-file token document from parsed declarations.
 * Returns a plain object ready to `JSON.stringify`.
 */
export function buildTokens(decls) {
  const out = {};

  // ── Global primitives: the static brand + golf hex scales and fonts that
  //    live in the @theme block (not per-theme). Keyed under `primitives`.
  const primitives = { brand: {}, golf: {}, font: {} };
  for (const { selector, name, value } of decls) {
    if (selector !== '@theme') continue;
    let m;
    if ((m = name.match(/^color-brand-(\d+)$/))) {
      const tok = toToken(value);
      if (tok) primitives.brand[m[1]] = tok;
    } else if ((m = name.match(/^color-golf-(.+)$/))) {
      const tok = toToken(value);
      if (tok) primitives.golf[m[1]] = tok;
    } else if ((m = name.match(/^font-(sans|mono)$/))) {
      primitives.font[m[1]] = { $type: 'fontFamilies', $value: value };
    }
  }
  out.primitives = primitives;

  // ── Per-theme semantic palettes. Each [data-theme] block's color + radius
  //    tokens become a `theme/<id>` set, keyed by the bare CSS var name so the
  //    mapping back to `globals.css` is 1:1.
  for (const id of THEME_IDS) {
    const set = {};
    for (const { selector, name, value } of decls) {
      if (name.startsWith('color-')) continue; // @theme utility aliases only
      if (!selectorHasTheme(selector, id)) continue;
      const tok = toToken(value);
      if (tok) set[name] = tok;
    }
    if (Object.keys(set).length) out[`theme/${id}`] = set;
  }

  // ── Per-sport identity accents. One `sport/<id>` set per [data-sport] block.
  for (const id of SPORT_IDS) {
    const set = {};
    for (const { selector, name, value } of decls) {
      if (!selectorHasSport(selector, id)) continue;
      const tok = toToken(value);
      if (tok) set[name] = tok;
    }
    if (Object.keys(set).length) out[`sport/${id}`] = set;
  }

  // ── Theme-agnostic sport identity swatches (the canonical per-sport accent +
  //    foreground pairs shared by every theme). A single global `sport-accents`
  //    set so Figma carries one identity color per sport.
  const sportAccents = {};
  for (const { selector, name, value } of decls) {
    if (!isSportAccentRoot(selector)) continue;
    if (!name.startsWith('sport-')) continue;
    const tok = toToken(value);
    if (tok) sportAccents[name] = tok;
  }
  if (Object.keys(sportAccents).length) out['sport-accents'] = sportAccents;

  // ── Tokens Studio orchestration metadata. `primitives` + sports are global
  //    "source" sets; exactly one theme set is "enabled" per Figma theme, so
  //    swapping themes in the plugin restyles the whole library.
  const sportSets = SPORT_IDS.map((id) => `sport/${id}`).filter((s) => out[s]);
  const themeSets = THEME_IDS.map((id) => `theme/${id}`).filter((s) => out[s]);
  const globalSets = ['primitives', 'sport-accents'].filter((s) => out[s]);

  out.$themes = themeSets.map((set) => {
    const selectedTokenSets = {};
    for (const s of [...globalSets, ...sportSets]) selectedTokenSets[s] = 'source';
    selectedTokenSets[set] = 'enabled';
    return {
      id: set.replace('theme/', ''),
      name: set.replace('theme/', ''),
      group: 'theme',
      selectedTokenSets,
    };
  });

  out.$metadata = {
    tokenSetOrder: [...globalSets, ...themeSets, ...sportSets],
    generatedBy: 'scripts/design-tokens/build-tokens.mjs',
    source: 'apps/web/src/app/globals.css',
  };

  return out;
}

/** Read globals.css and produce the token document. */
export function generate() {
  const css = readFileSync(GLOBALS_CSS, 'utf8');
  return buildTokens(parseCss(css));
}

function serialize(doc) {
  return JSON.stringify(doc, null, 2) + '\n';
}

function main() {
  const check = process.argv.includes('--check');
  const next = serialize(generate());

  if (check) {
    let current = '';
    try {
      current = readFileSync(OUT_FILE, 'utf8');
    } catch {
      /* missing file → drift */
    }
    if (current !== next) {
      console.error(
        '✖ design tokens are out of sync with globals.css.\n' +
          '  Run `npm run tokens:build` and commit the result.',
      );
      process.exit(1);
    }
    console.log('✓ design tokens are in sync with globals.css');
    return;
  }

  writeFileSync(OUT_FILE, next);
  const doc = generate();
  const themes = Object.keys(doc).filter((k) => k.startsWith('theme/')).length;
  const sports = Object.keys(doc).filter((k) => k.startsWith('sport/')).length;
  console.log(
    `✓ wrote ${OUT_FILE.replace(REPO_ROOT + '/', '')} ` +
      `(${themes} themes, ${sports} sports)`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) main();
