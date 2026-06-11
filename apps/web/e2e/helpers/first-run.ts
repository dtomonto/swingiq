import type { Page } from '@playwright/test';

/**
 * Deterministically neutralize the first-run usage-category onboarding modal so
 * it can't intercept feature clicks on any `(app)` route.
 *
 * The modal (`UsageCategoryModal`, a full-screen `z-200` backdrop) mounts ~800ms
 * AFTER the persisted store hydrates. Dismissing it by clicking through with a
 * bounded `waitFor` is therefore racy: on slow CI the modal can appear after the
 * wait window and then swallow the next click. Hiding it via an injected `<style>`
 * cannot lose that race — the rule lives in `<head>` and applies the instant the
 * modal mounts, and `display:none` removes the backdrop from hit-testing entirely.
 *
 * This hides ONLY the modal — not the floating help dock or bottom nav — so it is
 * safe to call from specs that actually exercise that chrome (e.g. the dock-overlap
 * and theme-contrast suites). The modal keeps its own dedicated coverage elsewhere.
 */
export async function hideUsageCategoryModal(page: Page) {
  await page
    .addStyleTag({
      content: '[aria-labelledby="usage-modal-title"]{display:none !important}',
    })
    .catch(() => {
      /* style injection is best-effort; absence of the modal is also fine */
    });
}

/**
 * Hide the persistent floating chrome that overlaps the bottom of `(app)` routes
 * and intercepts feature clicks — the floating help dock (its profile/onboarding
 * CTA sits over page content) and the mobile bottom navigation. Same race-proof
 * CSS approach as {@link hideUsageCategoryModal}.
 *
 * Call this ONLY from specs that don't themselves exercise the dock/nav. The
 * dock-overlap and theme-contrast suites assert on exactly this chrome, so they
 * must NOT call it — they only need the modal hidden.
 */
export async function hideFloatingChrome(page: Page) {
  await page
    .addStyleTag({
      content: `[data-testid="floating-help-dock"], .floating-dock,
        nav[aria-label="Bottom navigation"] { display: none !important; }`,
    })
    .catch(() => {
      /* best-effort */
    });
}
