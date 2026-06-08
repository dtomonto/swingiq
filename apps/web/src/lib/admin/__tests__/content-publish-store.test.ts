import {
  readSeoRows,
  readBlogRows,
  setContentPublishState,
} from '../content-publish-store';

// Non-destructive: reads real data; only exercises setContentPublishState paths
// that return BEFORE writing (unknown slug, read-only env).

describe('content-publish-store reads', () => {
  it('returns SEO rows shaped as kind=seo', () => {
    const rows = readSeoRows();
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0].kind).toBe('seo');
    expect(typeof rows[0].published).toBe('boolean');
  });

  it('returns blog rows shaped as kind=blog', () => {
    const rows = readBlogRows();
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0].kind).toBe('blog');
  });
});

describe('setContentPublishState guards (no file writes)', () => {
  it('returns not-found for an unknown slug', () => {
    expect(setContentPublishState('blog', 'does-not-exist-xyz', false)).toEqual({
      ok: false,
      reason: 'not-found',
    });
  });

  it('refuses to write in production (read-only FS)', () => {
    const orig = process.env.NODE_ENV;
    const origAllow = process.env.ALLOW_UPDATES_WRITE;
    try {
      // @ts-expect-error - override for the test
      process.env.NODE_ENV = 'production';
      delete process.env.ALLOW_UPDATES_WRITE;
      expect(setContentPublishState('blog', 'how-to-fix-a-golf-slice', false)).toEqual({
        ok: false,
        reason: 'read-only',
      });
    } finally {
      // @ts-expect-error - restore
      process.env.NODE_ENV = orig;
      if (origAllow === undefined) delete process.env.ALLOW_UPDATES_WRITE;
      else process.env.ALLOW_UPDATES_WRITE = origAllow;
    }
  });
});
