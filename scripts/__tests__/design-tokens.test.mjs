// Unit tests for the pure core of scripts/design-tokens/build-tokens.mjs, plus
// a drift guard that proves the committed token JSON still matches globals.css.
//
// Run with:  node --test scripts/__tests__/
//
// (Repo-root scripts aren't covered by apps/web's jest, so this uses Node's
// built-in test runner — no extra dependencies.)

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { parseCss, buildTokens, generate } from '../design-tokens/build-tokens.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..', '..');
const OUT_FILE = resolve(
  REPO_ROOT,
  'apps/web/src/lib/connector-os/design-system/tokens/swingvantage.tokens.json',
);

test('parseCss attributes declarations to their enclosing selector', () => {
  const decls = parseCss(`
    [data-theme='standard'] { --primary: 142 64% 26%; --card-radius: 0.75rem; }
    :root { --fab-size: 3.5rem; }
  `);
  const primary = decls.find((d) => d.name === 'primary');
  assert.equal(primary.value, '142 64% 26%');
  assert.match(primary.selector, /data-theme='standard'/);
});

test('parseCss is string/paren-aware (a url() value never breaks nesting)', () => {
  const decls = parseCss(`
    [data-sport='golf'] {
      --sport-pattern: url("data:image/svg+xml,%3Csvg width='10'%3E%3C/svg%3E");
      --sport-accent: 142 64% 30%;
    }
  `);
  // The accent AFTER the gnarly url() value must still be captured correctly.
  const accent = decls.find((d) => d.name === 'sport-accent');
  assert.ok(accent, 'declaration after a url() value was lost');
  assert.equal(accent.value, '142 64% 30%');
});

test('buildTokens classifies HSL / hex / dimension and skips var()/gradients', () => {
  const doc = buildTokens([
    { selector: '@theme', name: 'color-brand-500', value: '#22c55e' },
    { selector: "[data-theme='standard']", name: 'primary', value: '142 64% 26%' },
    { selector: "[data-theme='standard']", name: 'card-radius', value: '0.75rem' },
    // derived alias — must NOT become a token
    { selector: ':root', name: 'nav-bg', value: 'var(--secondary)' },
    { selector: "[data-theme='standard']", name: 'gradient-primary', value: 'linear-gradient(0deg, red, blue)' },
  ]);
  assert.deepEqual(doc.primitives.brand['500'], { $type: 'color', $value: '#22c55e' });
  assert.deepEqual(doc['theme/standard'].primary, { $type: 'color', $value: 'hsl(142 64% 26%)' });
  assert.deepEqual(doc['theme/standard']['card-radius'], { $type: 'dimension', $value: '0.75rem' });
  assert.equal(doc['theme/standard']['gradient-primary'], undefined);
  assert.equal(doc['theme/standard']['nav-bg'], undefined);
});

test('bare :root layout/alias vars never leak into theme/standard', () => {
  const doc = buildTokens([
    { selector: ":root, [data-theme='standard']", name: 'primary', value: '142 64% 26%' },
    { selector: ':root', name: 'fab-size', value: '3.5rem' },
    { selector: ':root', name: 'surface-scrim', value: '0 0% 0%' },
    { selector: ':root', name: 'sport-golf', value: '142 64% 30%' },
  ]);
  assert.ok(doc['theme/standard'].primary, 'standard palette token missing');
  assert.equal(doc['theme/standard']['fab-size'], undefined);
  assert.equal(doc['theme/standard']['surface-scrim'], undefined);
  assert.equal(doc['theme/standard']['sport-golf'], undefined);
  // sport accents land in their own dedicated global set instead
  assert.deepEqual(doc['sport-accents']['sport-golf'], {
    $type: 'color',
    $value: 'hsl(142 64% 30%)',
  });
});

test('$themes enables exactly one theme set and keeps globals/sports as source', () => {
  const doc = generate();
  for (const t of doc.$themes) {
    const enabled = Object.entries(t.selectedTokenSets).filter(([, v]) => v === 'enabled');
    assert.equal(enabled.length, 1, `${t.id} must enable exactly one set`);
    assert.equal(enabled[0][0], `theme/${t.id}`);
    assert.equal(t.selectedTokenSets.primitives, 'source');
  }
});

test('committed token JSON is in sync with globals.css (run `npm run tokens:build`)', () => {
  const current = readFileSync(OUT_FILE, 'utf8');
  const expected = JSON.stringify(generate(), null, 2) + '\n';
  assert.equal(
    current,
    expected,
    'design tokens are stale — run `npm run tokens:build` and commit the result',
  );
});
