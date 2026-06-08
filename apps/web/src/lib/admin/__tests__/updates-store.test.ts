import {
  readPublishSnapshot,
  setPublishState,
  canWriteUpdates,
} from '../updates-store';

// These tests are non-destructive: they read the real data files and only
// exercise setPublishState paths that return BEFORE writing (bad id, read-only).

describe('readPublishSnapshot', () => {
  const snap = readPublishSnapshot();

  it('returns product and dev rows', () => {
    expect(Array.isArray(snap.product)).toBe(true);
    expect(Array.isArray(snap.dev)).toBe(true);
    expect(snap.product.length).toBeGreaterThan(0);
  });

  it('shapes a dev row with the expected fields', () => {
    const row = snap.dev.find((r) => r.id === 'dev-c-6ed09e0');
    expect(row).toBeDefined();
    expect(row?.kind).toBe('dev');
    // No explicit status on that seed-style entry → treated as published/live.
    expect(row?.published).toBe(true);
    expect(typeof row?.title).toBe('string');
  });

  it('reports writable in a non-production test env', () => {
    expect(snap.writable).toBe(true);
  });
});

describe('setPublishState guards (no file writes)', () => {
  it('returns not-found for an unknown id', () => {
    const res = setPublishState('dev', 'does-not-exist-xyz', true);
    expect(res).toEqual({ ok: false, reason: 'not-found' });
  });

  it('refuses to write in production (read-only FS)', () => {
    const orig = process.env.NODE_ENV;
    const origAllow = process.env.ALLOW_UPDATES_WRITE;
    try {
      // @ts-expect-error - override for the duration of the test
      process.env.NODE_ENV = 'production';
      delete process.env.ALLOW_UPDATES_WRITE;
      expect(canWriteUpdates()).toBe(false);
      const res = setPublishState('dev', 'dev-c-6ed09e0', false);
      expect(res).toEqual({ ok: false, reason: 'read-only' });
    } finally {
      // @ts-expect-error - restore
      process.env.NODE_ENV = orig;
      if (origAllow === undefined) delete process.env.ALLOW_UPDATES_WRITE;
      else process.env.ALLOW_UPDATES_WRITE = origAllow;
    }
  });
});
