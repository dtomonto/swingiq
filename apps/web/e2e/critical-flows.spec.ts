import { test, expect } from '@playwright/test';

// Critical conversion + navigation happy-paths (#1 Phase 13). These exercise the
// flows the smoke spec doesn't: the homepage primary CTA, the top nav, the
// mobile nav drawer, and a per-sport landing page. Selectors are role/text based
// and validated against the live DOM.

test.describe('critical flows', () => {
  test('homepage primary CTA leads to the start flow', async ({ page }) => {
    await page.goto('/');
    const cta = page.getByRole('link', { name: /analyze my swing/i }).first();
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', /\/start/);
    await cta.click();
    await expect(page).toHaveURL(/\/start/);
  });

  test('top nav navigates to pricing', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /^pricing$/i }).first().click();
    await expect(page).toHaveURL(/\/pricing/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('mobile nav drawer opens and reveals links', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    // The nav links are hidden behind the menu toggle on mobile.
    const toggle = page.getByRole('button', { name: /open menu/i });
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(page.getByRole('link', { name: /^pricing$/i }).first()).toBeVisible();
  });

  test('a per-sport landing page renders its hero + primary CTA', async ({ page }) => {
    await page.goto('/golf-swing-analysis');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/golf swing analysis/i);
    await expect(page.getByRole('link', { name: /import csv data/i }).first()).toBeVisible();
  });
});
