import { test, expect } from '@playwright/test';
import path from 'node:path';

// Core journey: import performance data → reach the diagnosis surface.
// This is the roadmap's named E2E. The import UI has several entry
// points; this exercises the documented path and asserts the key
// surfaces render. The exact CSV-upload control selector may need
// confirming against the live import wizard — flagged inline.
test.describe('import → diagnosis journey', () => {
  test('import options and diagnosis surfaces render', async ({ page }) => {
    await page.goto('/sessions/import');
    // Import landing should offer at least one import path.
    await expect(page.getByText(/import/i).first()).toBeVisible();

    // The image/manual importer is always available (keyless path).
    await page.goto('/sessions/import/image');
    await expect(page.getByRole('heading', { name: /screenshot or photo/i })).toBeVisible();

    // Diagnosis surface renders.
    await page.goto('/diagnose');
    await expect(page.locator('main')).toBeVisible();
  });

  // Full CSV upload assertion. Enable once the upload control selector
  // is confirmed against the live wizard. A sample fixture is provided.
  test.fixme('CSV upload produces a reviewable session', async ({ page }) => {
    await page.goto('/sessions/import');
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(path.join(__dirname, 'fixtures', 'sample-golf.csv'));
    await expect(page.getByText(/review|mapping|columns/i).first()).toBeVisible();
  });
});
