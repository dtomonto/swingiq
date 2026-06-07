import { test, expect } from '@playwright/test';

// A3 — privacy-by-default guard. With no analytics provider configured (the
// default), NO third-party analytics script should load. This protects the
// cookieless / youth-safe positioning: measurement only turns on when an env
// var is set (NEXT_PUBLIC_PLAUSIBLE_DOMAIN / GA_ID / POSTHOG_KEY).
//
// (The analytics *abstraction* itself — that events route to a provider when
// present — is unit-tested deterministically in src/lib/__tests__/analytics.test.ts.)
test.describe('analytics privacy-by-default', () => {
  test('no third-party analytics script loads without a configured provider', async ({ page }) => {
    const thirdParty: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (
        url.includes('googletagmanager.com') ||
        url.includes('google-analytics.com') ||
        url.includes('plausible.io') ||
        url.includes('posthog.com')
      ) {
        thirdParty.push(url);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(
      thirdParty,
      `Unexpected analytics requests with no provider configured:\n${thirdParty.join('\n')}`,
    ).toHaveLength(0);
  });
});
