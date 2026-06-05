// Tests for the shared rate-limit abstraction (lib/rate-limit.ts).
// The mechanics (allow/deny contract, window expiry, eviction) are tested
// against the synchronous in-memory primitive. The async entry point is
// tested for its fallback behaviour when Upstash isn't configured.

import { checkRateLimit, checkRateLimitInMemory, __test__ } from '@/lib/rate-limit';

beforeEach(() => {
  __test__.reset();
});

describe('checkRateLimitInMemory — core contract', () => {
  it('allows up to the limit, then denies', () => {
    const cfg = { limit: 3, windowMs: 60_000 };

    const a = checkRateLimitInMemory('ip-a:endpoint', cfg);
    const b = checkRateLimitInMemory('ip-a:endpoint', cfg);
    const c = checkRateLimitInMemory('ip-a:endpoint', cfg);
    const d = checkRateLimitInMemory('ip-a:endpoint', cfg);

    expect(a.allowed).toBe(true);
    expect(a.remaining).toBe(2);
    expect(b.remaining).toBe(1);
    expect(c.remaining).toBe(0);
    expect(c.allowed).toBe(true);
    expect(d.allowed).toBe(false);
    expect(d.remaining).toBe(0);
  });

  it('isolates separate keys', () => {
    const cfg = { limit: 1, windowMs: 60_000 };
    expect(checkRateLimitInMemory('ip-a:e', cfg).allowed).toBe(true);
    expect(checkRateLimitInMemory('ip-b:e', cfg).allowed).toBe(true);
    expect(checkRateLimitInMemory('ip-a:e', cfg).allowed).toBe(false);
  });

  it('starts a fresh window once the previous one has expired', () => {
    const cfg = { limit: 1, windowMs: 60_000 };
    // Seed an already-expired entry for this key.
    __test__.seed('ip-a:e', Date.now() - 1_000);
    // The next call sees the expired window and resets, so it is allowed.
    expect(checkRateLimitInMemory('ip-a:e', cfg).allowed).toBe(true);
  });
});

describe('checkRateLimitInMemory — eviction (no unbounded growth)', () => {
  it('drops expired entries on sweep but keeps live ones', () => {
    const now = Date.now();
    __test__.seed('expired-1', now - 10_000);
    __test__.seed('expired-2', now - 1);
    __test__.seed('live-1', now + 60_000);
    expect(__test__.storeSize()).toBe(3);

    __test__.runSweep(now);

    expect(__test__.storeSize()).toBe(1);
    // The live key survived with its prior count intact (the seed counted as
    // one request), so a second request leaves remaining = 5 - 2 = 3. If the
    // sweep had wrongly evicted it, this would reset to remaining = 4.
    const r = checkRateLimitInMemory('live-1', { limit: 5, windowMs: 60_000 });
    expect(r.remaining).toBe(3);
  });

  it('enforces a hard cap when many windows are live at once', () => {
    const now = Date.now();
    // Seed more live entries than the store should ever retain.
    for (let i = 0; i < 10_050; i++) {
      __test__.seed(`k-${i}`, now + 60_000);
    }
    __test__.runSweep(now);
    expect(__test__.storeSize()).toBeLessThanOrEqual(10_000);
  });
});

describe('checkRateLimit — async entry point', () => {
  const prevUrl = process.env.UPSTASH_REDIS_REST_URL;
  const prevToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  afterEach(() => {
    process.env.UPSTASH_REDIS_REST_URL = prevUrl;
    process.env.UPSTASH_REDIS_REST_TOKEN = prevToken;
  });

  it('falls back to the in-memory limiter when Upstash is not configured', async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;

    const cfg = { limit: 2, windowMs: 60_000 };
    expect((await checkRateLimit('ip-z:e', cfg)).allowed).toBe(true);
    expect((await checkRateLimit('ip-z:e', cfg)).allowed).toBe(true);
    expect((await checkRateLimit('ip-z:e', cfg)).allowed).toBe(false);
  });

  it('treats placeholder Upstash creds as not configured (no network call)', async () => {
    process.env.UPSTASH_REDIS_REST_URL = 'your-db.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'your-rest-token-here';

    // 'your-...' placeholders are rejected by isConfigured, so this must use
    // the in-memory path and resolve without attempting a fetch.
    const r = await checkRateLimit('ip-placeholder:e', { limit: 1, windowMs: 60_000 });
    expect(r.allowed).toBe(true);
  });
});
