import { test, expect, type Page, type Locator } from '@playwright/test';
import { hideUsageCategoryModal } from './helpers/first-run';

// ============================================================
// Floating help tools — overlap / collision regression
// ------------------------------------------------------------
// Guards the bug this suite was written for: the two persistent
// bottom-right help tools (AI Coach launcher + Guide companion)
// stacking ON TOP of each other / overlapping. They now live in a
// single <FloatingDock> that owns their layout, so they must:
//   • never overlap each other (bounding boxes don't intersect),
//   • stay fully inside the viewport,
//   • clear the mobile bottom navigation,
//   • stay docked (fixed) while the page scrolls,
//   • never show two expanded panels at once (mutual exclusion).
//
// Stable selectors (set in the components):
//   [data-testid="floating-help-dock"]  — the dock container
//   [data-testid="help-tool-primary"]   — AI Coach launcher
//   [data-testid="help-tool-secondary"] — Guide companion launcher
//   [data-testid="help-panel-primary"]  — AI Coach chat panel
//   [data-testid="help-panel-secondary"]— Guide bubble
//
// Runs in KEYLESS mode (no Supabase env): sign-up creates a device-local
// account and the app is reachable anonymously. playwright.config.ts sets
// ALLOW_ANONYMOUS_APP=1 so the production auth middleware doesn't fail-closed
// on protected routes. To run locally with a real .env.local present, build
// keyless first, e.g. (PowerShell): move .env.local aside, then
//   $env:ALLOW_ANONYMOUS_APP=1; npm run build; npm run start -- -p 3100
// and run: npx playwright test floating-help-overlap
// ============================================================

// Freeze the guide's idle-bob animation so bounding boxes are stable
// (and so .click() never waits on an infinite animation).
test.use({ reducedMotion: 'reduce' });

type Box = { x: number; y: number; width: number; height: number };

const BREAKPOINTS = [
  { name: 'mobile-375', width: 375, height: 812 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'laptop-1024', width: 1024, height: 768 },
  { name: 'desktop-1440', width: 1440, height: 900 },
] as const;

/** True if two rectangles overlap. A 0.5px epsilon ignores sub-pixel edge contact. */
function intersects(a: Box, b: Box): boolean {
  const EPS = 0.5;
  return (
    a.x < b.x + b.width - EPS &&
    a.x + a.width - EPS > b.x &&
    a.y < b.y + b.height - EPS &&
    a.y + a.height - EPS > b.y
  );
}

async function boxOf(locator: Locator): Promise<Box> {
  const b = await locator.boundingBox();
  expect(b, 'element should be laid out (visible) and have a bounding box').not.toBeNull();
  return b as Box;
}

/**
 * Dismiss first-run overlays that float over the app on a brand-new device
 * (the full-screen usage-category modal and the bottom cookie bar). They are
 * unrelated to the dock but intercept clicks, so the dock-interaction test
 * clears them before exercising the dock.
 *
 * The modal is hidden race-proof via CSS (shared helper) rather than clicked
 * through — the click-through raced its ~800ms-delayed mount. We hide ONLY the
 * modal here, never the dock, which is the very chrome this suite asserts on.
 */
async function dismissFirstRunOverlays(page: Page) {
  await hideUsageCategoryModal(page);
  const accept = page.getByRole('button', { name: /^Accept$/ });
  try {
    await accept.waitFor({ state: 'visible', timeout: 3_000 });
    await accept.click();
  } catch { /* no cookie bar */ }
}

/** Keyless sign-up (no Supabase keys in CI) → device-local account → /start. */
async function signUpKeyless(page: Page) {
  await page.goto('/signup');
  const email = `e2e_dock_${Date.now()}_${Math.floor(Math.random() * 1e6)}@example.com`;
  await page.getByPlaceholder('Tiger Woods').fill('Dock Tester');
  await page.getByPlaceholder('you@example.com').fill(email);
  await page.getByPlaceholder('At least 8 characters').fill('test-password-123');
  // Button label is "Create Free Account" (keyless) — match loosely.
  await page.getByRole('button', { name: /create.*account/i }).click();
  await expect(page).toHaveURL(/\/start/, { timeout: 15_000 });
}

test.describe('floating help tools never collide', () => {
  test.beforeEach(async ({ page }) => {
    await signUpKeyless(page);
  });

  for (const bp of BREAKPOINTS) {
    test(`launchers don't overlap and stay in-bounds @ ${bp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.goto('/dashboard');

      await expect(page.getByTestId('floating-help-dock')).toBeAttached();
      const primary = page.getByTestId('help-tool-primary');
      const secondary = page.getByTestId('help-tool-secondary');
      await expect(primary).toBeVisible();
      await expect(secondary).toBeVisible();

      const a = await boxOf(primary);
      const b = await boxOf(secondary);

      // 1) The two help tools must not overlap.
      expect(
        intersects(a, b),
        `primary ${JSON.stringify(a)} overlaps secondary ${JSON.stringify(b)}`,
      ).toBe(false);

      // 2) Both must stay fully within the viewport.
      for (const r of [a, b]) {
        expect(r.x).toBeGreaterThanOrEqual(-0.5);
        expect(r.y).toBeGreaterThanOrEqual(-0.5);
        expect(r.x + r.width).toBeLessThanOrEqual(bp.width + 0.5);
        expect(r.y + r.height).toBeLessThanOrEqual(bp.height + 0.5);
      }

      // 3) On mobile/tablet they must sit ABOVE the bottom navigation.
      if (bp.width < 1024) {
        const nav = page.getByRole('navigation', { name: 'Bottom navigation' });
        await expect(nav).toBeVisible();
        const navBox = await boxOf(nav);
        expect(a.y + a.height).toBeLessThanOrEqual(navBox.y + 0.5);
        expect(b.y + b.height).toBeLessThanOrEqual(navBox.y + 0.5);
      }
    });
  }

  test('launchers stay docked + non-overlapping while scrolling a long page', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/progress');

    const primary = page.getByTestId('help-tool-primary');
    const secondary = page.getByTestId('help-tool-secondary');
    await expect(primary).toBeVisible();
    await expect(secondary).toBeVisible();

    const before = await boxOf(primary);
    await page.mouse.wheel(0, 2400);
    await page.waitForTimeout(250);
    const after = await boxOf(primary);

    // position:fixed → the launcher does not move with the page scroll.
    expect(Math.abs(after.y - before.y)).toBeLessThan(2);
    expect(intersects(await boxOf(primary), await boxOf(secondary))).toBe(false);
  });

  for (const bp of [
    { name: 'mobile-390', width: 390, height: 844 },
    { name: 'desktop-1280', width: 1280, height: 800 },
  ] as const) {
    test(`only one expanded panel at a time @ ${bp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: bp.width, height: bp.height });
      await page.goto('/dashboard');
      await dismissFirstRunOverlays(page);

      // Open the AI Coach. The dock must collapse any other open tool.
      await page.getByTestId('help-tool-primary').click();
      const coachPanel = page.getByTestId('help-panel-primary');
      await expect(coachPanel).toBeVisible();

      // The guide bubble must NOT be open at the same time.
      await expect(page.getByTestId('help-panel-secondary')).toHaveCount(0);

      // The open panel stays inside the viewport...
      const p = await boxOf(coachPanel);
      expect(p.x).toBeGreaterThanOrEqual(-0.5);
      expect(p.y).toBeGreaterThanOrEqual(-0.5);
      expect(p.x + p.width).toBeLessThanOrEqual(bp.width + 0.5);

      // ...and never covers the other tool's launcher.
      const guide = await boxOf(page.getByTestId('help-tool-secondary'));
      expect(intersects(p, guide), 'coach panel overlaps the guide launcher').toBe(false);
    });
  }
});
