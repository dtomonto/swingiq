// Shared test factories for the Feature Education Engine.
import type { FeatureRecord, EducationAsset } from '../types';

export function makeFeature(overrides: Partial<FeatureRecord> = {}): FeatureRecord {
  const base: FeatureRecord = {
    id: 'feat_test',
    slug: 'test',
    name: 'Test Feature',
    description: 'A test feature that does a thing.',
    category: 'new-feature',
    audiences: ['new-user', 'returning-user'],
    status: 'active',
    routes: ['/test'],
    components: [],
    apiEndpoints: [],
    dbTables: [],
    permissions: [],
    adminControls: [],
    featureFlags: [],
    owner: 'unassigned',
    detectedFrom: ['route-scan'],
    evidence: [{ kind: 'route', ref: '/test' }],
    confidence: 80,
    needsHumanReview: false,
    coverage: {},
    fingerprint: 'abc12345',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
  return { ...base, ...overrides };
}

export function makeAdminFeature(overrides: Partial<FeatureRecord> = {}): FeatureRecord {
  return makeFeature({
    id: 'feat_admin-seo',
    slug: 'admin-seo',
    name: 'SEO (admin)',
    category: 'admin-capability',
    audiences: ['admin'],
    routes: ['/admin/seo'],
    adminControls: ['/admin/seo'],
    evidence: [{ kind: 'route', ref: '/admin/seo' }],
    ...overrides,
  });
}

export function makeAsset(overrides: Partial<EducationAsset> = {}): EducationAsset {
  const base: EducationAsset = {
    id: 'asset_test_tutorial',
    featureId: 'feat_test',
    type: 'tutorial',
    audience: 'new-user',
    title: 'How to use Test',
    slug: 'test-tutorial',
    summary: 'A short walkthrough.',
    sections: [{ heading: 'What it does', body: ['It does a thing. Open it at /test to start.'] }],
    visibility: 'user',
    status: 'draft',
    version: 1,
    generator: 'deterministic',
    groundedIn: [{ kind: 'route', ref: '/test' }],
    needsHumanReview: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    // Fresh by default so coverage tests don't read assets as "stale".
    updatedAt: new Date().toISOString(),
  };
  return { ...base, ...overrides };
}
