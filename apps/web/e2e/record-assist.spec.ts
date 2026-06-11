import { test, expect, type Page } from '@playwright/test';

// RecordAssist guided-recording entry flow. The pre-camera path is fully
// deterministic (no getUserMedia needed) — it exercises routing, the feature
// gate, the sport/preset engine, voice controls, and the transition into the
// camera-permission panel. Live pose + recording are covered by the engine
// unit tests (62) and validated via the admin QA simulator.

/**
 * On a brand-new device the app shell floats layers over the page that are
 * unrelated to RecordAssist but intercept clicks: the first-run usage-category
 * modal and the bottom-right floating help dock (which overlaps the "Record with
 * guidance" button). Dismiss the modal the way a user would and hide the
 * persistent chrome so feature clicks land. Mirrors e2e/motion-lab.spec.ts.
 */
async function dismissFirstRunOverlays(page: Page) {
  await page.addStyleTag({
    content: `[data-testid="floating-help-dock"], .floating-dock,
      nav[aria-label="Bottom navigation"] { display: none !important; }`,
  }).catch(() => { /* style injection best-effort */ });

  const adult = page.getByRole('button', { name: /Adult athlete/i });
  try {
    await adult.waitFor({ state: 'visible', timeout: 5_000 });
    await adult.click();
    await page.getByRole('button', { name: /Continue to SwingVantage/i }).click();
  } catch { /* modal already handled in this context */ }
}

test.describe('RecordAssist — guided recording entry', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/record-assist');
    await dismissFirstRunOverlays(page);
  });

  test('renders the guided-recording launcher', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /record with guidance/i })).toBeVisible();
    // Sport picker shows all six sports.
    for (const sport of ['Golf', 'Tennis', 'Baseball', 'Softball', 'Pickleball', 'Padel']) {
      await expect(page.getByRole('button', { name: new RegExp(sport, 'i') }).first()).toBeVisible();
    }
  });

  test('shows the privacy notice and voice modes', async ({ page }) => {
    await expect(page.getByText(/run entirely on your device/i)).toBeVisible();
    await expect(page.getByRole('radio', { name: /coach/i })).toBeVisible();
    await expect(page.getByRole('radio', { name: /silent/i })).toBeVisible();
  });

  test('requires an action before recording, then transitions to the camera panel', async ({ page }) => {
    const recordBtn = page.getByRole('button', { name: /record with guidance/i });
    await expect(recordBtn).toBeDisabled();

    // Pick a sport + action (wait for each to be actionable to avoid races).
    await page.getByRole('button', { name: /^Tennis/i }).first().click();
    const serve = page.getByRole('button', { name: /serve/i }).first();
    await expect(serve).toBeVisible();
    await serve.click();

    await expect(recordBtn).toBeEnabled();
    await recordBtn.click();

    // Capture phase opens with the camera-permission panel (idle, no getUserMedia
    // required to assert this state).
    await expect(page.getByRole('button', { name: /enable camera/i })).toBeVisible();
    // The reassurance copy renders as both a heading and a paragraph; assert the
    // heading specifically so the locator stays unambiguous (strict mode).
    await expect(
      page.getByRole('heading', { name: /help you get in frame/i }),
    ).toBeVisible();
  });

  test('switching sport updates the available actions', async ({ page }) => {
    await page.getByRole('button', { name: /^Golf/i }).first().click();
    await expect(page.getByRole('button', { name: /driver/i }).first()).toBeVisible();

    await page.getByRole('button', { name: /^Pickleball/i }).first().click();
    await expect(page.getByRole('button', { name: /dink/i }).first()).toBeVisible();
  });
});
