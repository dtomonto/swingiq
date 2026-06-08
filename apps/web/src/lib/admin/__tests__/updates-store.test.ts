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

  it('shapes a publish row with the expected fields', () => {
    // Resilient to seed drift: validate the SHAPE of the always-seeded product
    // rows rather than a specific (churn-prone) seed id. Dev rows are optional.
    const row = snap.product[0]!;
    expect(row.kind).toBe('product');
    expect(typeof row.published).toBe('boolean');
    expect(typeof row.title).toBe('string');
    if (snap.dev.length > 0) {
      expect(snap.dev[0]!.kind).toBe('dev');
    }
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
