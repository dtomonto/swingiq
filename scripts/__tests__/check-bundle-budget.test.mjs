// Unit tests for the pure core of scripts/check-bundle-budget.mjs.
//
// The size math + violation logic must be correct independent of a real Next
// build, so we exercise it against a synthetic app-build-manifest + a fake
// file-size map. Run with:  node --test scripts/__tests__/
//
// (Repo-root scripts aren't covered by apps/web's jest, so this uses Node's
// built-in test runner — no extra dependencies.)

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeRouteSizes, findViolations } from '../check-bundle-budget.mjs';

// A fake .next manifest: route → first-load chunk files.
const MANIFEST = {
  pages: {
    '/': ['static/chunks/main.js', 'static/chunks/home.js', 'static/css/x.css'],
    '/motion-lab': ['static/chunks/main.js', 'static/chunks/three.js'],
    '/about': ['static/chunks/main.js'],
    '/broken': 'not-an-array',
  },
};

// Fake byte sizes (KB → bytes).
const SIZES = {
  'static/chunks/main.js': 100 * 1024,
  'static/chunks/home.js': 80 * 1024,
  'static/chunks/three.js': 500 * 1024,
  'static/css/x.css': 40 * 1024, // non-JS, must be ignored
};
const sizeOf = (f) => SIZES[f] || 0;

test('computeRouteSizes sums only .js files and ignores css', () => {
  const sizes = computeRouteSizes(MANIFEST, sizeOf);
  assert.equal(sizes['/'], (100 + 80) * 1024); // css excluded
  assert.equal(sizes['/motion-lab'], (100 + 500) * 1024);
  assert.equal(sizes['/about'], 100 * 1024);
});

test('computeRouteSizes skips non-array entries safely', () => {
  const sizes = computeRouteSizes(MANIFEST, sizeOf);
  assert.equal(Object.prototype.hasOwnProperty.call(sizes, '/broken'), false);
});

test('computeRouteSizes handles empty/missing manifest', () => {
  assert.deepEqual(computeRouteSizes(null, sizeOf), {});
  assert.deepEqual(computeRouteSizes({}, sizeOf), {});
});

test('findViolations flags routes over the default budget', () => {
  const sizes = computeRouteSizes(MANIFEST, sizeOf);
  const v = findViolations(sizes, { maxFirstLoadKb: 200 });
  // '/' = 180KB ok, '/motion-lab' = 600KB over, '/about' = 100KB ok
  assert.equal(v.length, 1);
  assert.equal(v[0].route, '/motion-lab');
  assert.equal(v[0].kb, 600);
  assert.equal(v[0].limitKb, 200);
});

test('per-route override raises the limit and clears the violation', () => {
  const sizes = computeRouteSizes(MANIFEST, sizeOf);
  const v = findViolations(sizes, {
    maxFirstLoadKb: 200,
    routeOverridesKb: { '/motion-lab': 700 },
  });
  assert.equal(v.length, 0);
});

test('a tighter override can introduce a violation', () => {
  const sizes = computeRouteSizes(MANIFEST, sizeOf);
  const v = findViolations(sizes, {
    maxFirstLoadKb: 1000,
    routeOverridesKb: { '/': 150 },
  });
  assert.equal(v.length, 1);
  assert.equal(v[0].route, '/');
});

test('violations are sorted largest-first', () => {
  const sizes = { '/a': 500 * 1024, '/b': 900 * 1024, '/c': 600 * 1024 };
  const v = findViolations(sizes, { maxFirstLoadKb: 100 });
  assert.deepEqual(v.map((x) => x.route), ['/b', '/c', '/a']);
});

test('no budget (Infinity default) never falsely fails', () => {
  const sizes = computeRouteSizes(MANIFEST, sizeOf);
  assert.equal(findViolations(sizes, {}).length, 0);
});
