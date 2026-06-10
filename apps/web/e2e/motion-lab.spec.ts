import { test, expect } from '@playwright/test';

// MotionLab critical flow (#prompt acceptance criterion 20). Driven through the
// built-in SAMPLE analyses — a synthetic motion run through the REAL engine — so
// the path is deterministic and needs no camera, upload, or MediaPipe download.
// Live-video overlay controls (slow-mo / frame-step / overlay density) are
// covered by the unit suites; here we exercise select → analyse → replay →
// one fix → drill → retest end to end.

test.describe('MotionLab', () => {
  test('the lab opens with the sport selector and sample gallery', async ({ page }) => {
    await page.goto('/motion-lab');
    await expect(page.getByRole('heading', { name: /motion lab/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /analyse any motion in 3d/i })).toBeVisible();

    // All seven sports are selectable (golf · tennis · baseball · two softballs ·
    // pickleball · padel) — spot-check four anchors via the selector's exact
    // label (the sample cards use longer names like "Tennis forehand").
    for (const sport of ['Golf', 'Tennis', 'Pickleball', 'Padel']) {
      await expect(page.getByText(sport, { exact: true }).first()).toBeVisible();
    }
  });

  test('a rally-sport sample analyses, replays, and gives one fix · drill · retest', async ({ page }) => {
    await page.goto('/motion-lab');

    // 1) Select sport + use a sample clip (one click runs the real engine).
    await page.getByRole('button', { name: /tennis forehand/i }).click();

    // 2) Results render with the prioritized single fix.
    await expect(page.getByText(/biggest opportunity/i)).toBeVisible();
    await expect(page.getByText(/tennis/i).first()).toBeVisible();

    // 3) Replay (default 3D & Phases tab) surfaces the continuous-movement read —
    //    the rally-sport "how did I recover / get ready for the next ball" layer.
    await expect(page.getByText(/movement intelligence/i)).toBeVisible();
    await expect(page.getByText(/next-ready position/i)).toBeVisible();

    // 4) Coaching tab → the retest protocol closes the loop.
    await page.getByRole('button', { name: 'Coaching' }).click();
    await expect(page.getByText(/retest your/i)).toBeVisible();
    await expect(page.getByText(/reproduce the capture/i)).toBeVisible();
    await expect(page.getByText(/success looks like/i)).toBeVisible();

    // 5) Drills tab → a prescribed drill.
    await page.getByRole('button', { name: 'Drills' }).click();
    await expect(page.getByText(/immediate fix/i)).toBeVisible();
  });

  test('a swing-sport sample omits the rally movement layer', async ({ page }) => {
    await page.goto('/motion-lab');
    await page.getByRole('button', { name: /golf driver/i }).click();
    await expect(page.getByText(/biggest opportunity/i)).toBeVisible();
    // Golf is a discrete swing — no continuous-movement card.
    await expect(page.getByText(/movement intelligence/i)).toHaveCount(0);
    // But it still closes the loop with a retest protocol.
    await page.getByRole('button', { name: 'Coaching' }).click();
    await expect(page.getByText(/retest your/i)).toBeVisible();
  });

  test('works on a mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/motion-lab');
    await page.getByRole('button', { name: /pickleball dink/i }).click();
    await expect(page.getByText(/biggest opportunity/i)).toBeVisible();
    await expect(page.getByText(/movement intelligence/i)).toBeVisible();
  });
});
