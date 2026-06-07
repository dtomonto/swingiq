import {
  warrantedAssetTypes,
  gapForFeature,
  computeGaps,
  coverageSummary,
  refreshCoverage,
} from '../coverage';
import { makeFeature, makeAdminFeature, makeAsset } from './_factories';

describe('warrantedAssetTypes', () => {
  it('a public user-facing feature warrants user docs + SEO, not admin guides', () => {
    const w = warrantedAssetTypes(makeFeature());
    expect(w).toEqual(expect.arrayContaining(['tutorial', 'how-to', 'faq', 'video-brief', 'release-note', 'seo-article', 'onboarding']));
    expect(w).not.toContain('admin-guide');
  });

  it('an admin feature warrants an admin guide + academy module, not SEO/tutorial', () => {
    const w = warrantedAssetTypes(makeAdminFeature());
    expect(w).toEqual(expect.arrayContaining(['admin-guide', 'course-module', 'how-to']));
    expect(w).not.toContain('seo-article');
    expect(w).not.toContain('tutorial');
  });

  it('a removed feature warrants only a release note + support enablement', () => {
    const w = warrantedAssetTypes(makeFeature({ status: 'removed', category: 'removed' }));
    expect(w.sort()).toEqual(['release-note', 'support-enablement']);
  });
});

describe('gaps', () => {
  it('a feature with no assets is fully missing with a positive priority', () => {
    const f = makeFeature();
    const gap = gapForFeature(f, []);
    expect(gap).not.toBeNull();
    expect(gap!.missing).toEqual(expect.arrayContaining(warrantedAssetTypes(f)));
    expect(gap!.priorityScore).toBeGreaterThan(0);
  });

  it('computeGaps ranks higher-impact features first', () => {
    const big = makeFeature({ id: 'feat_big', audiences: ['all'], category: 'new-feature' });
    const small = makeFeature({ id: 'feat_small', audiences: ['developer'], category: 'backend-api', routes: [], apiEndpoints: ['/api/x'], evidence: [{ kind: 'api', ref: '/api/x' }] });
    const gaps = computeGaps([small, big], []);
    expect(gaps[0].featureId).toBe('feat_big');
  });

  it('no gap when every warranted asset is published', () => {
    const f = makeFeature();
    const assets = warrantedAssetTypes(f).map((t, i) =>
      makeAsset({ id: `a${i}`, featureId: f.id, type: t, status: 'published' }),
    );
    expect(gapForFeature(f, assets)).toBeNull();
  });
});

describe('refreshCoverage + summary', () => {
  it('reflects a published asset in the coverage matrix', () => {
    const f = makeFeature();
    const a = makeAsset({ featureId: f.id, type: 'tutorial', status: 'published' });
    const updated = refreshCoverage(f, [a]);
    expect(updated.coverage.tutorial?.status).toBe('published');
  });

  it('coverageSummary counts fully/partial/uncovered', () => {
    const covered = refreshCoverage(
      makeFeature({ id: 'feat_c' }),
      warrantedAssetTypes(makeFeature({ id: 'feat_c' })).map((t, i) =>
        makeAsset({ id: `c${i}`, featureId: 'feat_c', type: t, status: 'published' }),
      ),
    );
    const empty = makeFeature({ id: 'feat_e' });
    const s = coverageSummary([covered, empty]);
    expect(s.totalFeatures).toBe(2);
    expect(s.fullyCovered).toBe(1);
    expect(s.uncovered).toBe(1);
  });
});
