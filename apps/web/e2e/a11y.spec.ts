import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Automated accessibility regression gate. Runs axe-core (WCAG 2.0/2.1 A + AA)
// against the most important public pages and fails on any SERIOUS or CRITICAL
// violation — the bar that genuinely matters and is least prone to false
// positives. Complements the manual jsx-a11y lint pass (which is static); axe
// checks the RENDERED page (contrast, ARIA, names, roles). Moderate/minor
// findings are reported in the attachment but don't fail the build.
const PAGES = [
  '/',
  '/features',
  '/features/ai-diagnostic-engine',
  '/how-it-works',
  '/pricing',
  '/golf-swing-analysis',
];

for (const path of PAGES) {
  test(`a11y: ${path} has no serious/critical violations`, async ({ page }, testInfo) => {
    await page.goto(path);
    // Wait for the main content so we analyze a settled DOM.
    await page.locator('h1, main, article').first().waitFor({ state: 'visible', timeout: 10_000 });

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    // Attach the full report (incl. color-contrast) for debugging / the CI artifact.
    await testInfo.attach(`axe-${path.replace(/\W+/g, '_') || 'home'}.json`, {
      body: JSON.stringify(results.violations, null, 2),
      contentType: 'application/json',
    });

    // Block on ALL serious/critical violations, including `color-contrast`.
    // The brand-element contrast debt (green logo badge, hero text, footer
    // headings) was fixed in a visually-verified design pass: the SV badge uses
    // dark-green glyphs on the fairway-green chip, the standard-theme primary was
    // darkened to 26% so white/80–/90 hero text clears AA, and the light footer's
    // headings use text-foreground. CONTRAST_DEBT is now empty (kept as the seam
    // to re-park a finding if one ever regresses, rather than re-disabling the rule).
    const CONTRAST_DEBT = new Set<string>([]);
    const blocking = results.violations.filter(
      (v) => (v.impact === 'serious' || v.impact === 'critical') && !CONTRAST_DEBT.has(v.id),
    );
    const summary = blocking.map((v) => `${v.impact}: ${v.id} (${v.nodes.length}) — ${v.help}`);
    expect(summary, summary.join('\n')).toEqual([]);
  });
}
