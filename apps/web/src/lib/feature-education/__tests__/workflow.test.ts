import {
  applyReview,
  applyPublish,
  canPublish,
  prepareRegenerated,
  defaultPublishTarget,
  canTransition,
} from '../workflow';
import type { QualityScore } from '../types';
import { makeAsset } from './_factories';

const passingQuality: QualityScore = {
  dimensions: {
    accuracy: 90, completeness: 90, clarity: 90, usefulness: 90, stepQuality: 90,
    technicalCorrectness: 90, brand: 95, accessibility: 90, seo: 80, internalLinks: 85,
    coverage: 90, supportReadiness: 80, releaseReadiness: 90,
  },
  overall: 90,
  passed: true,
  threshold: 70,
  reasons: [],
};

describe('publish targets + transitions', () => {
  it('maps asset types to natural targets', () => {
    expect(defaultPublishTarget(makeAsset({ type: 'video-brief' }))).toBe('video-studio');
    expect(defaultPublishTarget(makeAsset({ type: 'seo-article' }))).toBe('seo');
    expect(defaultPublishTarget(makeAsset({ type: 'release-note' }))).toBe('updates');
    expect(defaultPublishTarget(makeAsset({ type: 'tutorial' }))).toBe('help-center');
  });
  it('enforces the status machine', () => {
    expect(canTransition('approved', 'published')).toBe(true);
    expect(canTransition('draft', 'published')).toBe(false);
  });
});

describe('review', () => {
  it('approve marks approved, clears review flag, and audits', () => {
    const { asset, version, audit } = applyReview(makeAsset({ needsHumanReview: true }), 'approve', { actor: 'dana' });
    expect(asset.status).toBe('approved');
    expect(asset.approvedBy).toBe('dana');
    expect(asset.needsHumanReview).toBe(false);
    expect(version.isCurrent).toBe(true);
    expect(audit.action).toBe('asset_approved');
  });
  it('reject sends back to needs-review', () => {
    const { asset } = applyReview(makeAsset({ status: 'approved' }), 'reject', { note: 'tighten step 2' });
    expect(asset.status).toBe('needs-review');
  });
});

describe('publish gating', () => {
  it('blocks publishing a draft', () => {
    expect(canPublish(makeAsset({ status: 'draft' })).ok).toBe(false);
  });
  it('blocks an approved asset that fails quality', () => {
    const asset = makeAsset({ status: 'approved', quality: { ...passingQuality, passed: false, overall: 40 } });
    expect(canPublish(asset).ok).toBe(false);
  });
  it('allows an approved, passing, safe asset and then publishes it', () => {
    const asset = makeAsset({ status: 'approved', quality: passingQuality });
    expect(canPublish(asset).ok).toBe(true);
    const { asset: published } = applyPublish(asset, undefined, { actor: 'dana' });
    expect(published.status).toBe('published');
    expect(published.publishTarget).toBe('help-center');
  });
});

describe('regeneration', () => {
  it('bumps the version, keeps the id, and marks updated', () => {
    const old = makeAsset({ version: 1 });
    const fresh = makeAsset({ id: 'different', summary: 'reworded' });
    const { asset } = prepareRegenerated(old, fresh);
    expect(asset.id).toBe(old.id);
    expect(asset.version).toBe(2);
    expect(asset.status).toBe('updated');
    expect(asset.summary).toBe('reworded');
  });
});
