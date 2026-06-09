import { test, expect } from '@playwright/test';

// The feature hub + per-feature detail pages are a public, statically-generated
// content system (registry → /features/[slug]). These guard that the hub renders
// clickable cards and that a detail page serves a real, non-thin guide — so a
// registry/route regression is caught here instead of as a 404 or empty page.
test.describe('feature pages', () => {
  test('the /features hub lists clickable feature cards', async ({ page }) => {
    await page.goto('/features');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // At least one card links to a detail page.
    const detailLink = page.locator('a[href^="/features/"]').first();
    await expect(detailLink).toBeVisible();
  });

  test('a feature detail page renders its guide', async ({ page }) => {
    await page.goto('/features/ai-diagnostic-engine');
    await expect(page.getByRole('heading', { level: 1, name: /AI Diagnostic Engine/i })).toBeVisible();
    // The comprehensive sections must be present (not a thin page).
    await expect(page.getByText('How to take full advantage', { exact: false })).toBeVisible();
    await expect(page.getByText('What it is', { exact: false })).toBeVisible();
  });

  test('feature detail pages respond 200 and emit JSON-LD', async ({ request }) => {
    for (const slug of ['fix-stack', 'motion-lab-3d', 'verified-recruiting-profile']) {
      const res = await request.get(`/features/${slug}`);
      expect(res.ok()).toBeTruthy();
      const html = await res.text();
      // HowTo schema is emitted for every feature's step-by-step guide.
      expect(html).toContain('"HowTo"');
    }
  });

  test('an unknown feature slug 404s', async ({ request }) => {
    const res = await request.get('/features/not-a-real-feature-xyz');
    expect(res.status()).toBe(404);
  });
});
