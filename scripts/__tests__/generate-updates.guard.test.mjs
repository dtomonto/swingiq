// Leak-guard tests for scripts/generate-updates.mjs.
//
// These cover the safety net that stops a stray commit trailer from publishing a
// secret, key, source path, or scratch note to the public /updates or
// /dev-updates pages. Run with:  node --test scripts/__tests__/
//
// (Repo-root scripts aren't covered by apps/web's jest, so this uses Node's
// built-in test runner — no extra dependencies.)

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findLeak, buildDevEntry, buildProductEntry } from '../generate-updates.mjs';

// ── Things that MUST be caught (a leak → returns a reason) ───────────────────
//
// Secret-shaped fixtures are assembled from split parts via j() so no contiguous
// token literal ever appears in this source file — that keeps GitHub's
// push-protection secret scanner happy while the ASSEMBLED runtime string still
// exercises the guard's regex exactly as a real leak would.
const j = (...parts) => parts.join('');

const LEAKS = [
  ['OpenAI key', `We shipped ${j('sk-', 'proj-', 'AbCdEf0123456789ZyXw987')} today`],
  ['Stripe live key', `key is ${j('sk', '_live_', '51AbCdEfGhIjKlMnOpQrStUv')}`],
  ['Stripe webhook secret', j('whsec', '_', '1a2b3c4d5e6f7g8h9i0j1k2l3m')],
  ['Resend key', `set ${j('re', '_', 'AbCd1234EfGh5678IjKl')}`],
  ['AWS access key', `${j('AKIA', 'IOSFODNN7EXAMPLE')} in the config`],
  ['GitHub token', `token ${j('ghp', '_', '16C7e42F292c6912E7710c838347Ae178B4a')}`],
  ['Supabase service key', j('sb', '_secret_', 'abcd1234efgh5678ijkl')],
  ['JWT', j('eyJ', 'hbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9', '.eyJzdWIiOiIxMjM0NTY3ODkwIn0', '.dozjgNryP4J3jVmNHl0w')],
  ['bearer token', `Authorization: ${j('Bearer ', 'abcdef0123456789abcdef0123456789')}`],
  ['env assignment', j('OPENAI_API_KEY=', 'sk-', 'supersecretvalue123')],
  ['generic secret assignment', 'DB_PASSWORD: hunter2longvalue'],
  ['repo source path', 'fixed apps/web/src/lib/ai-budget.ts'],
  ['src path', 'see src/components/Foo.tsx for details'],
  ['file with code ext', 'updated lib/social/engine.ts'],
  ['windows path', 'wrote C:\\Users\\owner\\secret.txt'],
  ['unix home path', 'cached under /home/deploy/.env'],
  ['TODO marker', 'New dashboard card. TODO: wire analytics'],
  ['FIXME marker', 'Shipped the thing FIXME this is hacky'],
  // Proprietary / implementation tells — must be kept off public pages.
  ['env or config flag', 'Flip ENABLE_AIO_COACH_SYNTHESIS to turn it on'],
  ['internal codename', 'Shipped GrowthOS for sustainable growth'],
  ['vendor / infra name', 'Now backed by Supabase and Upstash for sync'],
  ['library / framework name', 'Built on Next.js and React; runs on Node.js client-side.'],
  ['AI vendor name', 'Coaching now uses OpenAI for vision'],
];

for (const [label, text] of LEAKS) {
  test(`flags ${label}`, () => {
    const hit = findLeak(text);
    assert.ok(hit, `expected a leak for: ${text}`);
    assert.equal(typeof hit.name, 'string');
  });
}

// ── Things that MUST NOT be caught (legitimate update copy) ──────────────────

const CLEAN = [
  'SwingVantage now supports seven sports — pickleball and padel are here.',
  'Open Athletic Journey from the sidebar (/journey), pick your sport.',
  'Go to Analyze > Motion Lab (3D) in the menu, then upload a clip.',
  'See the simplified plans on the pricing page (/pricing).',
  'Your swing is analyzed in 3D right in your browser — no upload needed.',
  'Optional handicap, UTR/NTRP, or DUPR sharpen the read but are never required.',
  'Read the explainer at /athlete-general-intelligence.',
  'The new /api/ai-coach route now uses your real training data.',
  'Key takeaway: practice one fix at a time and retest.',
  'Carry distance is 150 mph for intermediate golfers.',
];

for (const text of CLEAN) {
  test(`allows clean copy: "${text.slice(0, 40)}…"`, () => {
    assert.equal(findLeak(text), null, `false positive on: ${text}`);
  });
}

// ── Integration: a clean trailer still builds; the builders feed findLeak ─────

test('a clean dev trailer builds an entry that passes the guard', () => {
  const commit = { shortHash: 'abc1234', date: '2026-06-07T00:00:00Z', body: '' };
  const entry = buildDevEntry(commit, { 'dev-update': 'Shipped a faster 3D pose pipeline.' });
  assert.ok(entry);
  assert.equal(entry.status, 'draft'); // draft-gated by default
  assert.equal(findLeak(entry.title, entry.headline, entry.details), null);
});

test('a leaky dev trailer is detectable from the built entry', () => {
  const commit = { shortHash: 'def5678', date: '2026-06-07T00:00:00Z', body: '' };
  const entry = buildDevEntry(commit, { 'dev-update': 'Rotated OPENAI_API_KEY=sk-leakedsecret12345' });
  assert.ok(entry);
  assert.ok(findLeak(entry.title, entry.headline, entry.details));
});

test('a clean product trailer builds a draft entry that passes the guard', () => {
  const commit = { shortHash: 'aaa1111', date: '2026-06-07T00:00:00Z', body: '' };
  const entry = buildProductEntry(commit, { update: 'You can now record your swing in-app.' }, 1000);
  assert.ok(entry);
  assert.equal(entry.status, 'draft');
  assert.equal(entry.visibility, 'private');
  assert.equal(findLeak(entry.title, entry.summary, entry.userBenefit), null);
});
