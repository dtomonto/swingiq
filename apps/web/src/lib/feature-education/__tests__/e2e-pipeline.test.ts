// End-to-end "sample run" (spec acceptance criteria):
//   1. an EXISTING feature (from the committed registry snapshot), and
//   2. a SIMULATED new feature (from a fake commit)
// each go all the way through detect → generate → quality → security →
// approve → publish, with a real repo round-trip.

import { detectFromChanges } from '../detection';
import { generatePackage } from '../generators';
import { withQuality } from '../quality';
import { applyReview, applyPublish, canPublish } from '../workflow';
import { warrantedAssetTypes } from '../coverage';
import { __setInMemoryRepoForTests } from '../repo';
import type { FeatureRecord } from '../types';
import REGISTRY from '@/data/feature-registry.json';

describe('end-to-end pipeline', () => {
  it('runs an EXISTING feature from the registry through to published', async () => {
    const features = (REGISTRY as { features: FeatureRecord[] }).features;
    const feature =
      features.find((f) => f.id === 'feat_motion-lab') ?? features.find((f) => f.routes.length > 0);
    expect(feature).toBeTruthy();

    const repo = __setInMemoryRepoForTests();
    await repo.upsertFeatures([feature!]);

    // Generate the full package, score + scan each, persist.
    const drafts = generatePackage(feature!).map((a) => withQuality(a));
    expect(drafts.length).toBe(warrantedAssetTypes(feature!).length);
    for (const a of drafts) {
      expect(a.quality).toBeDefined();
      expect(a.security).toBeDefined();
      expect(a.groundedIn.length).toBeGreaterThan(0); // anti-hallucination
      await repo.saveAsset(a);
    }

    // Walk a passing draft all the way to published.
    const tutorial = drafts.find((a) => a.type === 'tutorial' && a.quality!.passed);
    expect(tutorial).toBeTruthy();

    const approved = applyReview(tutorial!, 'approve', { actor: 'test' }).asset;
    expect(canPublish(approved).ok).toBe(true);

    const published = applyPublish(approved, undefined, { actor: 'test' }).asset;
    await repo.saveAsset(published);

    const fromRepo = await repo.getAsset(published.id);
    expect(fromRepo!.status).toBe('published');
    expect(fromRepo!.publishTarget).toBeTruthy();
  });

  it('detects a SIMULATED new feature from a commit and packages it', () => {
    const [feature] = detectFromChanges([
      { path: 'apps/web/src/app/(app)/streak-tracker/page.tsx', sha: 'sim123', message: 'feat: streak tracker', status: 'A' },
    ]);
    expect(feature.routes).toContain('/streak-tracker');
    expect(feature.category).toBe('new-feature');

    const pkg = generatePackage(feature).map((a) => withQuality(a));
    expect(pkg.some((a) => a.type === 'tutorial')).toBe(true);
    expect(pkg.some((a) => a.type === 'video-brief')).toBe(true);
    expect(pkg.every((a) => a.groundedIn.length > 0)).toBe(true);
  });
});
