import { describe, it, expect, afterEach } from '@jest/globals';
import {
  isAuditAccessConfigured,
  extractPresentedToken,
  verifyAuditToken,
} from '../token';
import { buildAuditBundle, AUDIT_SCHEMA_VERSION } from '../bundle';
import {
  AUDIT_BARRIERS,
  APP_SURFACE,
  STILL_CANNOT_PROVIDE,
  barrierSummary,
} from '../barriers';
import type { AuditBundleInput } from '../types';

const ORIGINAL = process.env.AUDIT_ACCESS_TOKEN;
afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.AUDIT_ACCESS_TOKEN;
  else process.env.AUDIT_ACCESS_TOKEN = ORIGINAL;
});

function req(headers: Record<string, string> = {}, url = 'https://x.test/api/audit'): Request {
  return new Request(url, { headers });
}

describe('audit-access token gate', () => {
  it('is not configured when the env var is unset/placeholder', () => {
    delete process.env.AUDIT_ACCESS_TOKEN;
    expect(isAuditAccessConfigured()).toBe(false);
    process.env.AUDIT_ACCESS_TOKEN = 'your-token';
    expect(isAuditAccessConfigured()).toBe(false);
    process.env.AUDIT_ACCESS_TOKEN = 'real-secret-123';
    expect(isAuditAccessConfigured()).toBe(true);
  });

  it('extracts a token from a Bearer header or ?token query', () => {
    expect(extractPresentedToken(req({ authorization: 'Bearer abc123' }))).toBe('abc123');
    expect(extractPresentedToken(req({}, 'https://x.test/api/audit?token=qry'))).toBe('qry');
    expect(extractPresentedToken(req())).toBeNull();
  });

  it('fails closed when not configured (verify is false even with a token)', () => {
    delete process.env.AUDIT_ACCESS_TOKEN;
    expect(verifyAuditToken(req({ authorization: 'Bearer anything' }))).toBe(false);
  });

  it('verifies a correct token and rejects a wrong one', () => {
    process.env.AUDIT_ACCESS_TOKEN = 'super-secret-token';
    expect(verifyAuditToken(req({ authorization: 'Bearer super-secret-token' }))).toBe(true);
    expect(verifyAuditToken(req({}, 'https://x.test/api/audit?token=super-secret-token'))).toBe(true);
    expect(verifyAuditToken(req({ authorization: 'Bearer wrong' }))).toBe(false);
    expect(verifyAuditToken(req())).toBe(false);
  });
});

describe('audit barriers', () => {
  it('covers every reported barrier with a resolution and section refs', () => {
    expect(AUDIT_BARRIERS.length).toBeGreaterThanOrEqual(5);
    for (const b of AUDIT_BARRIERS) {
      expect(b.barrier.length).toBeGreaterThan(0);
      expect(b.resolution.length).toBeGreaterThan(0);
      expect(b.sections.length).toBeGreaterThan(0);
      expect(['cleared', 'partial', 'manual']).toContain(b.status);
    }
  });

  it('clears the sitemap/robots barrier specifically', () => {
    const robots = AUDIT_BARRIERS.find((b) => b.id === 'sitemap-robots');
    expect(robots?.status).toBe('cleared');
    expect(robots?.sections).toContain('crawl');
  });

  it('summarizes barrier counts', () => {
    const s = barrierSummary();
    expect(s.total).toBe(AUDIT_BARRIERS.length);
    expect(s.cleared + s.partial + s.manual).toBe(s.total);
  });
});

describe('buildAuditBundle (pure)', () => {
  const input: AuditBundleInput = {
    site: 'https://swingvantage.com',
    generatedAt: '2026-06-08T00:00:00.000Z',
    capabilities: {
      auth: true, aiCoach: false, aiVision: false, ocr: false,
      email: false, billing: false, ads: false, auditAccess: true,
    },
    crawl: {
      robotsTxt: 'User-agent: *\nAllow: /',
      sitemapXml: '<urlset></urlset>',
      llmsTxt: null,
      sitemapEntryCount: 42,
      errors: {},
    },
    publicRoutes: ['/', '/pricing'],
    seo: { publishedPageCount: 3, samplePaths: ['/golf/fix-slice'] },
    analytics: { configured: false, stillNeedsManual: ['GA4'], note: 'no key' },
  };

  it('assembles a read-only packet with all sections', () => {
    const bundle = buildAuditBundle(input);
    expect(bundle.meta.readOnly).toBe(true);
    expect(bundle.meta.schemaVersion).toBe(AUDIT_SCHEMA_VERSION);
    expect(bundle.meta.site).toBe(input.site);
    expect(bundle.crawl.sitemapXml).toContain('urlset');
    expect(bundle.routes.public).toEqual(['/', '/pricing']);
    expect(bundle.routes.authenticated).toBe(APP_SURFACE);
    expect(bundle.barriersAddressed).toBe(AUDIT_BARRIERS);
    expect(bundle.stillCannotProvide).toBe(STILL_CANNOT_PROVIDE);
  });

  it('never echoes a secret-looking value (structural only)', () => {
    const json = JSON.stringify(buildAuditBundle(input));
    expect(json).not.toMatch(/AUDIT_ACCESS_TOKEN/);
  });
});
