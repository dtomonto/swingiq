import {
  classifyPath,
  detectFromChanges,
  keyForRoute,
  routeFromAppPath,
  apiFromPath,
  fingerprintFeature,
  mergeFeatures,
  featureFromSurface,
  featureFromNav,
} from '../detection';
import { makeFeature } from './_factories';

const P = 'apps/web/src/';

describe('classifyPath', () => {
  it('classifies a user-facing page as a new feature with a clean route', () => {
    const c = classifyPath(`${P}app/(app)/motion-lab/page.tsx`);
    expect(c).not.toBeNull();
    expect(c!.route).toBe('/motion-lab');
    expect(c!.key).toBe('motion-lab');
    expect(c!.category).toBe('new-feature');
    expect(c!.isPublic).toBe(true);
    expect(c!.evidenceKind).toBe('route');
  });

  it('classifies an admin page as an admin capability', () => {
    const c = classifyPath(`${P}app/admin/seo/page.tsx`);
    expect(c!.route).toBe('/admin/seo');
    expect(c!.key).toBe('admin/seo');
    expect(c!.category).toBe('admin-capability');
    expect(c!.isPublic).toBe(false);
    expect(c!.adminControl).toBe('/admin/seo');
  });

  it('classifies an API route as backend-api with an endpoint', () => {
    const c = classifyPath(`${P}app/api/social/list/route.ts`);
    expect(c!.apiEndpoint).toBe('/api/social/list');
    expect(c!.key).toBe('api/social');
    expect(c!.evidenceKind).toBe('api');
  });

  it('does NOT misclassify admin as monetization (ad/ads word-boundary)', () => {
    const c = classifyPath(`${P}app/admin/users/page.tsx`);
    expect(c!.category).toBe('admin-capability');
  });

  it('detects monetization from a billing path', () => {
    const c = classifyPath(`${P}app/api/billing/checkout/route.ts`);
    expect(c!.category).toBe('monetization');
  });

  it('treats a .sql file as a data-model signal', () => {
    const c = classifyPath('apps/web/supabase-feature-education.sql');
    expect(c!.key).toBe('data-model');
    expect(c!.evidenceKind).toBe('db');
  });

  it('ignores tests, docs, configs and node_modules', () => {
    expect(classifyPath(`${P}lib/x/__tests__/x.test.ts`)).toBeNull();
    expect(classifyPath('docs/THING.md')).toBeNull();
    expect(classifyPath('package.json')).toBeNull();
    expect(classifyPath('node_modules/foo/index.js')).toBeNull();
  });
});

describe('route + key helpers', () => {
  it('routeFromAppPath strips route groups and dynamic segments', () => {
    expect(routeFromAppPath(`${P}app/(app)/player/[slug]/page.tsx`)).toBe('/player/:slug');
  });
  it('apiFromPath builds the endpoint', () => {
    expect(apiFromPath(`${P}app/api/agents/dispatch/send/route.ts`)).toBe('/api/agents/dispatch/send');
  });
  it('keyForRoute matches the classifier key scheme', () => {
    expect(keyForRoute('/admin/seo')).toBe('admin/seo');
    expect(keyForRoute('/video')).toBe('video');
    expect(keyForRoute('/api/social/x')).toBe('api/social');
  });
});

describe('detectFromChanges', () => {
  it('groups related files into one feature with evidence (anti-hallucination)', () => {
    const features = detectFromChanges([
      { path: `${P}app/(app)/video/page.tsx`, sha: 'aaa111', message: 'feat: analyzer', status: 'A' },
      { path: `${P}components/video/Player.tsx`, sha: 'aaa111', status: 'M' },
    ]);
    const video = features.find((f) => f.routes.includes('/video'));
    expect(video).toBeDefined();
    expect(video!.evidence.length).toBeGreaterThan(0);
    expect(video!.detectedFrom).toContain('aaa111');
  });

  it('marks a feature removed when all its files are deleted', () => {
    const [f] = detectFromChanges([
      { path: `${P}app/(app)/growth-agents/page.tsx`, sha: 'del1', status: 'D', message: 'remove page' },
    ]);
    expect(f.status).toBe('removed');
    expect(f.category).toBe('removed');
  });

  it('every detected feature is grounded in real evidence', () => {
    const features = detectFromChanges([
      { path: `${P}app/(app)/drills/page.tsx`, sha: 'b', status: 'A' },
      { path: `${P}app/api/ai-coach/route.ts`, sha: 'c', status: 'A' },
    ]);
    expect(features.length).toBeGreaterThan(0);
    for (const f of features) expect(f.evidence.length).toBeGreaterThan(0);
  });
});

describe('fingerprint + merge', () => {
  it('fingerprint is stable and changes when surfaces change', () => {
    const a = fingerprintFeature({ routes: ['/x'], components: [], apiEndpoints: [], featureFlags: [] });
    const same = fingerprintFeature({ routes: ['/x'], components: [], apiEndpoints: [], featureFlags: [] });
    const diff = fingerprintFeature({ routes: ['/x', '/y'], components: [], apiEndpoints: [], featureFlags: [] });
    expect(a).toBe(same);
    expect(a).not.toBe(diff);
  });

  it('mergeFeatures preserves createdAt + coverage on re-detect', () => {
    const prev = makeFeature({ createdAt: '2020-01-01T00:00:00.000Z', coverage: { tutorial: { status: 'published' } } });
    const fresh = makeFeature({ createdAt: '2026-06-07T00:00:00.000Z', coverage: {} });
    const [merged] = mergeFeatures([prev], [fresh]);
    expect(merged.createdAt).toBe('2020-01-01T00:00:00.000Z');
    expect(merged.coverage.tutorial?.status).toBe('published');
  });
});

describe('structure builders', () => {
  it('featureFromSurface keys by route so it merges with route-scan', () => {
    const f = featureFromSurface({
      id: 'motion-lab-intro', page: '/motion-lab', label: 'Motion Lab', description: '3D analysis', audience: 'athlete',
    });
    expect(f.id).toBe('feat_motion-lab');
    expect(f.name).toBe('Motion Lab');
  });
  it('featureFromNav builds an admin capability keyed by href', () => {
    const f = featureFromNav({ id: 'seo', label: 'SEO', href: '/admin/seo', blurb: 'manage seo', built: true });
    expect(f.id).toBe('feat_admin-seo');
    expect(f.category).toBe('admin-capability');
  });
});
