// ============================================================
// Design V2 — visual regression baseline (Phase 0 safety net).
//
// Captures the redesign's key surfaces across themes × viewports so the
// flagged restyles in Phases 4–7 can't silently shift layout, color, or
// chrome. Per the plan's risk register (#4) visual regression lives on
// Playwright app routes — NOT Storybook screenshots — to avoid toolchain
// coupling.
//
// Baselines are NOT committed yet — generate them once in the keyless build
// environment, then commit the PNGs:
//
//   npm run test:e2e:install            # one-time: Chromium
//   npm run test:e2e:visual:update      # writes e2e/visual/*-snapshots/*.png
//   git add apps/web/e2e/visual/**/*.png
//
// After that, `npm run test:e2e:visual` enforces 0 unexpected diffs. Themes
// are pinned via the Theme Lab operator-pin localStorage key (the pin wins
// even for anonymous visitors — see lib/theme-lab/control.ts), so the matrix
// works without an authenticated session.
// ============================================================

import { test, expect } from '@playwright/test';

// Theme Lab operator-pin localStorage key. Inlined (not imported from app
// source) so Playwright's loader never has to resolve the `@/` alias chain
// that lib/theme-lab/control.ts pulls in. Keep in sync with
// THEME_LAB_STORAGE_KEY in src/lib/theme-lab/control.ts.
const THEME_LAB_STORAGE_KEY = 'swingiq-theme-lab';

// Three palettes spanning light, the brand dark default, and a second light.
const THEMES = ['standard', 'dark-performance', 'coach-mode'] as const;

// 375×812 is the PRIMARY (mobile-first) target; 1280×800 is the desktop check.
const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'desktop', width: 1280, height: 800 },
] as const;

// Verified keyless-reachable surfaces (public marketing + anonymous app via
// ALLOW_ANONYMOUS_APP=1, see playwright.config.ts). Names become file stems.
const ROUTES = [
  { name: 'home', path: '/' },
  { name: 'pricing', path: '/pricing' },
  { name: 'sample-report', path: '/sample-report' },
  { name: 'trust', path: '/trust' },
  // NOTE: /dashboard is intentionally excluded. Its anonymous render contains a
  // time/date-dependent block, so a committed full-page pixel baseline drifts and
  // produces false failures (a stale baseline can pass for hours, then fail with
  // no code change). The suite now pins the wall clock (see setFixedTime below),
  // which removes the day/year drift, but the dashboard still needs its dynamic
  // regions masked before it can rejoin this full-page matrix — out of scope for
  // this safety net, which guards the STATIC redesign surfaces.
  { name: 'diagnose-report', path: '/diagnose' },
] as const;

test.describe('design-v2 visual regression', () => {
  for (const theme of THEMES) {
    for (const vp of VIEWPORTS) {
      for (const route of ROUTES) {
        test(`${route.name} · ${theme} · ${vp.name}`, async ({ page }) => {
          // Pin the theme before any app script runs (also covers the pre-paint
          // bootstrap in layout.tsx, so there's no flash to capture).
          await page.addInitScript(
            ([key, id]) => {
              try {
                localStorage.setItem(key, JSON.stringify({ forcedThemeId: id }));
              } catch {
                /* storage unavailable */
              }
            },
            [THEME_LAB_STORAGE_KEY, theme] as const,
          );
          await page.emulateMedia({ reducedMotion: 'reduce' });
          await page.setViewportSize({ width: vp.width, height: vp.height });

          // Freeze the wall clock so date-dependent render is deterministic.
          // The public footer prints the copyright year via
          // `new Date().getFullYear()` (PublicFooter.tsx), so without this every
          // committed baseline would silently drift at the New Year boundary and
          // fail with no code change — the same flake class that forced /dashboard
          // out of this matrix, but suite-wide. setFixedTime pins Date while
          // leaving real timers running, so networkidle/animation waits are
          // unaffected. Pinned within the year the baselines were captured (2026),
          // so current PNGs stay pixel-identical.
          await page.clock.setFixedTime(new Date('2026-06-14T12:00:00Z'));

          const res = await page.goto(route.path, { waitUntil: 'networkidle' });
          test.skip(!res || res.status() >= 400, `route ${route.path} unavailable keyless`);

          // Confirms the pin applied (and waits for it) before snapshotting.
          await expect(page.locator('html')).toHaveAttribute('data-theme', theme);

          await expect(page).toHaveScreenshot(`${route.name}-${theme}-${vp.name}.png`, {
            fullPage: true,
            animations: 'disabled',
            // Small tolerance for sub-pixel font AA across runs.
            maxDiffPixelRatio: 0.02,
          });
        });
      }
    }
  }
});
