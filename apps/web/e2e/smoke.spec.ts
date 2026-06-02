import { test, expect } from '@playwright/test';

// Public pages and the SEO/crawl surface should always render.
test.describe('public surface', () => {
  test('home page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/SwingIQ/i);
  });

  test('sitemap.xml lists URLs', async ({ request }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.ok()).toBeTruthy();
    const body = await res.text();
    expect(body).toContain('<urlset');
    expect(body).toMatch(/<loc>https?:\/\/[^<]+<\/loc>/);
  });

  test('robots.txt blocks authenticated app routes', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.ok()).toBeTruthy();
    const body = await res.text();
    expect(body).toContain('Disallow: /dashboard');
  });

  test('pricing renders Free + Pro tiers', async ({ page }) => {
    await page.goto('/pricing');
    await expect(page.getByText('Free', { exact: false }).first()).toBeVisible();
    await expect(page.getByText('Pro', { exact: false }).first()).toBeVisible();
  });

  test('capabilities endpoint returns a boolean summary', async ({ request }) => {
    const res = await request.get('/api/capabilities');
    expect(res.ok()).toBeTruthy();
    const caps = await res.json();
    for (const key of ['auth', 'aiCoach', 'aiVision', 'ocr', 'email', 'billing']) {
      expect(typeof caps[key]).toBe('boolean');
    }
  });
});
