import { LOCALIZED_FEATURE_SLUGS } from '../localized-features-data';
import { getFeature } from '@/content/features';

// The localized /es + /fr features hub links each card to the canonical
// (English) /features/<slug> detail page. These slugs are hand-mapped to the
// registry, so guard them: a renamed/removed feature must fail here, not ship a
// broken cross-language link.
describe('LocalizedFeatures → registry slug mapping', () => {
  it('references at least the 30 hub features', () => {
    expect(LOCALIZED_FEATURE_SLUGS.length).toBeGreaterThanOrEqual(30);
  });

  it('every referenced slug resolves to a real feature', () => {
    const dangling = LOCALIZED_FEATURE_SLUGS.filter((s) => !getFeature(s));
    expect(dangling).toEqual([]);
  });

  it('has no duplicate slugs', () => {
    expect(new Set(LOCALIZED_FEATURE_SLUGS).size).toBe(LOCALIZED_FEATURE_SLUGS.length);
  });
});
