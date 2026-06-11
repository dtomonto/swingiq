// ============================================================
// SwingVantage — cross-theme visual + contrast regression (E2E)
//
// Renders the real authenticated app shell (mobile viewport) in EACH of
// the 7 themes and, for every theme:
//   1. captures a screenshot artifact of the mobile nav drawer + sport
//      selector — the exact surface that shipped the white-on-white bug;
//   2. runs a RUNTIME contrast sweep over every visible text node and
//      fails if any readable text is effectively invisible against its
//      background (ratio < HARD_FAIL) — i.e. white-on-white / dark-on-dark.
//
// The runtime sweep is the durable gate: unlike pixel snapshots it needs
// no committed baseline (which are platform/font flaky) and it inspects
// what the browser ACTUALLY paints, across all themes.
//
// Setup (same as the other e2e specs — kept out of the default install):
//   npm i -D @playwright/test
//   npm run test:e2e:install
//   npm run test:e2e
// ============================================================

import { test, expect, type Page } from '@playwright/test';

const THEMES = [
  'standard',
  'dark-performance',
  'coach-mode',
  'heritage-club',
  'field-court',
  'arcade-practice',
  'bird-print',
] as const;

const DARK_FAMILY = new Set(['dark-performance', 'arcade-practice']);

// Anything below this is effectively unreadable — a genuine defect.
const HARD_FAIL = 2.0;
// Soft signal: WCAG AA for normal text. Logged, not failed (muted/disabled
// copy can legitimately sit a touch under AA).
const SOFT_AA = 4.5;

// Mobile viewport — the drawer / bottom-nav / sport-selector defect surface.
test.use({ viewport: { width: 390, height: 844 }, isMobile: true });

/** Apply a theme the same way the app's bootstrap + ThemeApplicator do. */
async function applyTheme(page: Page, theme: string) {
  await page.evaluate(
    ({ t, isDark }) => {
      const el = document.documentElement;
      el.setAttribute('data-theme', t);
      el.classList.toggle('dark', isDark);
    },
    { t: theme, isDark: DARK_FAMILY.has(theme) },
  );
  // let transitions settle
  await page.waitForTimeout(120);
}

/**
 * Walk every visible text node, resolve its effective (first opaque)
 * background, and return the lowest-contrast readable text found.
 */
async function contrastReport(page: Page) {
  return page.evaluate(() => {
    function parse(c: string): [number, number, number, number] | null {
      const m = c.match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const p = m[1].split(',').map((x) => parseFloat(x));
      return [p[0], p[1], p[2], p[3] === undefined ? 1 : p[3]];
    }
    function lin(c: number) {
      const x = c / 255;
      return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    }
    function lum([r, g, b]: number[]) {
      return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    }
    function ratio(a: number[], b: number[]) {
      const l1 = lum(a);
      const l2 = lum(b);
      const hi = Math.max(l1, l2);
      const lo = Math.min(l1, l2);
      return (hi + 0.05) / (lo + 0.05);
    }
    // Effective background: first ancestor with a non-transparent bg.
    function bgOf(el: Element): [number, number, number] {
      let node: Element | null = el;
      while (node) {
        const c = parse(getComputedStyle(node).backgroundColor);
        if (c && c[3] > 0.5) return [c[0], c[1], c[2]];
        node = node.parentElement;
      }
      return [255, 255, 255];
    }

    const out: { text: string; ratio: number; color: string; bg: string }[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n: Node | null;
    while ((n = walker.nextNode())) {
      const text = (n.textContent ?? '').trim();
      if (text.length < 2) continue;
      const el = n.parentElement;
      if (!el) continue;
      if (el.closest('[aria-hidden="true"], svg, script, style, noscript')) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none') continue;
      if (parseFloat(cs.opacity) < 0.5) continue;
      const fg = parse(cs.color);
      if (!fg || fg[3] < 0.5) continue;
      const bg = bgOf(el);
      const r = ratio([fg[0], fg[1], fg[2]], bg);
      out.push({
        text: text.slice(0, 60),
        ratio: Math.round(r * 100) / 100,
        color: cs.color,
        bg: `rgb(${bg.join(',')})`,
      });
    }
    out.sort((a, b) => a.ratio - b.ratio);
    return out;
  });
}

test('every theme renders the mobile nav + sport selector readably', async ({ page }) => {
  // Enter the app via a keyless local account (no Supabase needed).
  await page.goto('/signup');
  const email = `e2e_theme_${Date.now()}@example.com`;
  await page.getByPlaceholder('Tiger Woods').fill('Theme Tester');
  await page.getByPlaceholder('you@example.com').fill(email);
  await page.getByPlaceholder('At least 8 characters').fill('test-password-123');
  // Button label is "Create Free Account" — match flexibly, with a submit fallback.
  const createBtn = page.getByRole('button', { name: /create.*account/i });
  if (await createBtn.count()) {
    await createBtn.first().click();
  } else {
    await page.locator('form button[type="submit"]').first().click();
  }
  await page.waitForURL(/\/(start|dashboard)/, { timeout: 15_000 });

  // Land on a screen that renders the AppShell (drawer + bottom nav).
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');

  // Hide the first-run "who's using this device?" modal deterministically. It
  // mounts ~800ms after store hydration, so clicking through it races on slow CI;
  // a <style> in <head> applies the instant it mounts. We open the nav drawer
  // below, so hide only the modal — no other chrome.
  await page.addStyleTag({
    content: '[aria-labelledby="usage-modal-title"]{display:none !important}',
  }).catch(() => { /* style injection best-effort */ });
  // Clear any remaining first-run overlay (tutorial nudge, etc.).
  await page.keyboard.press('Escape').catch(() => {});

  // Open the mobile drawer + sport switcher ONCE. Switching themes below only
  // sets data-theme on <html> (no React re-render), so the drawer stays open —
  // keeping the per-theme loop fast and click-free.
  const menu = page.getByRole('button', { name: /open navigation menu/i });
  if (await menu.count()) {
    await menu.first().click();
    await page.waitForTimeout(250);
    const sportBtn = page
      .getByRole('button')
      .filter({ hasText: /golf|tennis|pickleball|padel|baseball|softball/i });
    if (await sportBtn.count()) {
      await sportBtn.first().click().catch(() => {});
      await page.waitForTimeout(150);
    }
  }

  const worstByTheme: Record<string, number> = {};

  for (const theme of THEMES) {
    await test.step(theme, async () => {
      await applyTheme(page, theme);

      // Visual snapshot artifact for this theme.
      await page.screenshot({ path: `e2e/__screenshots__/theme-${theme}.png` });

      // Runtime contrast sweep.
      const report = await contrastReport(page);
      const worst = report[0]?.ratio ?? 21;
      worstByTheme[theme] = worst;

      const belowAA = report.filter((r) => r.ratio < SOFT_AA);
      if (belowAA.length) {
        console.log(
          `\n[${theme}] ${belowAA.length} text node(s) under AA (${SOFT_AA}):`,
        );
        for (const r of belowAA.slice(0, 8)) {
          console.log(`   ${r.ratio.toFixed(2)}  "${r.text}"  (${r.color} on ${r.bg})`);
        }
      }

      const invisible = report.filter((r) => r.ratio < HARD_FAIL);
      expect(
        invisible,
        `[${theme}] unreadable text (contrast < ${HARD_FAIL}): ` +
          invisible.map((r) => `"${r.text}" @ ${r.ratio}`).join(', '),
      ).toEqual([]);
    });
  }

  console.log('\nWorst contrast per theme:', worstByTheme);
});
