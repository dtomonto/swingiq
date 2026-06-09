import { test, expect } from '@playwright/test';

// Money-path data endpoints (export your data + delete your account) must NEVER
// hand back user data without authentication. Whatever the deploy mode:
//   • keyless / no Supabase → 503 (no server account; client-side fallback), or
//   • cloud but no session   → 401 (auth required).
// A regression that started returning 200 (or a 500 on the happy keyless path)
// would mean data leaks or the erasure path broke — this guards both. Request-
// level so it is deterministic regardless of browser/auth state.
test.describe('data export & deletion endpoints stay locked down', () => {
  test('GET /api/user/export never returns data unauthenticated', async ({ request }) => {
    const res = await request.get('/api/user/export');
    expect([401, 503]).toContain(res.status());
    const body = await res.json().catch(() => ({}));
    // It must not return an assembled backup payload.
    expect(body).not.toHaveProperty('sessions');
    expect(body).toHaveProperty('error');
  });

  test('POST /api/user/delete never deletes unauthenticated', async ({ request }) => {
    const res = await request.post('/api/user/delete');
    expect([401, 503]).toContain(res.status());
    const body = await res.json().catch(() => ({}));
    // A successful deletion would report { deleted: true }; it must not here.
    expect(body.deleted).not.toBe(true);
  });

  test('keyless delete points the user at the local clear path', async ({ request }) => {
    const res = await request.post('/api/user/delete');
    if (res.status() === 503) {
      const body = await res.json().catch(() => ({}));
      // In keyless/local-only mode the response steers to the on-device wipe.
      expect(['local-only', 'no-service-role']).toContain(body.mode);
    }
  });
});
