import { scanAsset, isSafeToPublish } from '../security';
import { makeAsset } from './_factories';

describe('scanAsset', () => {
  it('passes a clean user asset', () => {
    const result = scanAsset(makeAsset());
    expect(result.findings.length).toBe(0);
    expect(result.safeToPublishPublicly).toBe(true);
  });

  it('catches a planted API secret and redacts it', () => {
    const asset = makeAsset({
      sections: [{ heading: 'Setup', body: ['Use the key sk-ant-ABCDEFGH1234567890XYZ to authenticate.'] }],
    });
    const result = scanAsset(asset);
    const secret = result.findings.find((f) => f.type === 'secret');
    expect(secret).toBeDefined();
    expect(secret!.severity).toBe('block');
    expect(result.safeToPublishPublicly).toBe(false);
    // never echoes the full secret back
    expect(secret!.excerpt).not.toContain('ABCDEFGH1234567890XYZ');
    expect(secret!.excerpt).toMatch(/redacted/);
  });

  it('blocks a secret env var name', () => {
    const asset = makeAsset({ sections: [{ heading: 'x', body: ['Set SUPABASE_SERVICE_ROLE_KEY in your env.'] }] });
    expect(scanAsset(asset).safeToPublishPublicly).toBe(false);
    expect(isSafeToPublish(asset)).toBe(false);
  });

  it('blocks an admin route mentioned in a PUBLIC asset', () => {
    const asset = makeAsset({
      type: 'seo-article',
      visibility: 'public',
      sections: [{ heading: 'x', body: ['Open the dashboard at /admin/secret-tools.'] }],
    });
    const result = scanAsset(asset);
    expect(result.findings.some((f) => f.type === 'admin-only')).toBe(true);
    expect(result.safeToPublishPublicly).toBe(false);
  });

  it('allows an admin route in a NON-public (admin) asset', () => {
    const asset = makeAsset({
      type: 'admin-guide',
      visibility: 'admin',
      sections: [{ heading: 'Setup', body: ['Open /admin/seo to configure.'] }],
    });
    expect(isSafeToPublish(asset)).toBe(true);
  });
});
