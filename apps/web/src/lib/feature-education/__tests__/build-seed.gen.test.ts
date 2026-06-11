// ============================================================
// Feature-education shipping seed — generator + drift guard.
//
// The committed `data/feature-education-seed.json` is produced by the REAL
// deterministic generators (seed-build.ts). This test:
//   1. proves the generated assets are published, grounded, and safe; and
//   2. asserts the committed JSON is in sync with the generator (drift guard).
//
// Regenerate after a generator/registry change:
//   FEE_BUILD_SEED=1 npx jest build-seed.gen
// ============================================================

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { buildFeatureEducationSeed } from '../server/seed-build';
import { scanAsset } from '../security';
import type { EducationAsset } from '../types';

const SEED_PATH = resolve(__dirname, '../../../data/feature-education-seed.json');

const generated = buildFeatureEducationSeed();

describe('feature-education shipping seed', () => {
  it('publishes grounded, honest assets for a substantial share of the registry', () => {
    expect(generated.length).toBeGreaterThan(100);
    const featureIds = new Set(generated.map((a) => a.featureId));
    expect(featureIds.size).toBeGreaterThan(100);
  });

  it('every seeded asset is published, deterministic, and grounded', () => {
    for (const a of generated) {
      expect(a.status).toBe('published');
      expect(a.generator).toBe('deterministic');
      expect(a.needsHumanReview).toBe(false);
      expect(a.groundedIn.length).toBeGreaterThan(0);
      expect(['in-app-help', 'faq', 'seo-article']).toContain(a.type);
    }
  });

  it('in-app-help is grounded in its own target route (matches the seed-help invariant)', () => {
    for (const a of generated.filter((x) => x.type === 'in-app-help')) {
      expect(a.inAppHelp?.route).toBeTruthy();
      expect(a.groundedIn.some((e) => e.ref === a.inAppHelp?.route)).toBe(true);
    }
  });

  it('public assets are safe to publish publicly (no admin/internal leaks)', () => {
    for (const a of generated.filter((x) => x.visibility === 'public')) {
      expect(scanAsset(a).safeToPublishPublicly).toBe(true);
    }
  });

  it('asset ids are unique + stable', () => {
    const ids = generated.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('the committed seed JSON is in sync with the generator', () => {
    if (process.env.FEE_BUILD_SEED === '1') {
      writeFileSync(SEED_PATH, JSON.stringify(generated, null, 2) + '\n');
    }
    const committed = JSON.parse(readFileSync(SEED_PATH, 'utf8')) as EducationAsset[];
    expect(committed).toEqual(generated);
  });
});
