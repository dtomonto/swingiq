import { test, expect } from '@playwright/test';

// RecordAssist guided-recording entry flow. The pre-camera path is fully
// deterministic (no getUserMedia needed) — it exercises routing, the feature
// gate, the sport/preset engine, voice controls, and the transition into the
// camera-permission panel. Live pose + recording are covered by the engine
// unit tests (62) and validated via the admin QA simulator.
test.describe('RecordAssist — guided recording entry', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/record-assist');
  });

  test('renders the guided-recording launcher', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /record with guidance/i })).toBeVisible();
    // Sport picker shows all six sports.
    for (const sport of ['Golf', 'Tennis', 'Baseball', 'Softball', 'Pickleball', 'Padel']) {
      await expect(page.getByRole('button', { name: new RegExp(sport, 'i') }).first()).toBeVisible();
    }
  });

  test('shows the privacy notice and voice modes', async ({ page }) => {
    await expect(page.getByText(/runs entirely on your device/i)).toBeVisible();
    await expect(page.getByRole('radio', { name: /coach/i })).toBeVisible();
    await expect(page.getByRole('radio', { name: /silent/i })).toBeVisible();
  });

  test('requires an action before recording, then transitions to the camera panel', async ({ page }) => {
    const recordBtn = page.getByRole('button', { name: /record with guidance/i });
    await expect(recordBtn).toBeDisabled();

    // Pick a sport + action.
    await page.getByRole('button', { name: /^Tennis/i }).first().click();
    await page.getByRole('button', { name: /serve/i }).first().click();

    await expect(recordBtn).toBeEnabled();
    await recordBtn.click();

    // Capture phase opens with the camera-permission panel (idle, no getUserMedia
    // required to assert this state).
    await expect(page.getByRole('button', { name: /enable camera/i })).toBeVisible();
    await expect(page.getByText(/we’ll help you get in frame|help you get in frame/i)).toBeVisible();
  });

  test('switching sport updates the available actions', async ({ page }) => {
    await page.getByRole('button', { name: /^Golf/i }).first().click();
    await expect(page.getByRole('button', { name: /driver/i }).first()).toBeVisible();

    await page.getByRole('button', { name: /^Pickleball/i }).first().click();
    await expect(page.getByRole('button', { name: /dink/i }).first()).toBeVisible();
  });
});
