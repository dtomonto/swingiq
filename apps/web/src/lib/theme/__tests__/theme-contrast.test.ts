// ============================================================
// Theme contrast regression guard.
//
// Parses the real globals.css and asserts every theme clears the
// WCAG AA contrast floor for every meaningful foreground/background
// token pairing — including the per-sport accents, the text-safe
// `--link` accent, and the derived nav/drawer/modal/etc. component
// vocabulary.
//
// This is the structural protection against the production defect
// class: white-on-white, dark-on-dark, and low-contrast text can no
// longer be introduced into the token system for ANY of the 7 themes
// without turning this suite red.
// ============================================================

import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  parseThemeTokens,
  tripleContrast,
  THEME_CONTEXTS,
  WCAG_AA,
  WCAG_AA_LARGE,
  type ThemeContext,
  type ThemeTokenMap,
} from '../contrast';

const css = readFileSync(
  resolve(__dirname, '../../../app/globals.css'),
  'utf8',
);
const themes = parseThemeTokens(css);

/** [foreground token, background token, human label] */
type Pair = [string, string, string];

// Foreground tokens that are explicitly named to sit ON their surface.
// These MUST clear AA — they carry real text / icons.
const SELF_PAIRS: Pair[] = [
  ['foreground', 'background', 'body text on page'],
  ['card-foreground', 'card', 'text on card'],
  ['popover-foreground', 'popover', 'text on popover'],
  ['secondary-foreground', 'secondary', 'text on secondary surface'],
  ['accent-foreground', 'accent', 'text on accent surface'],
  ['muted-foreground', 'muted', 'muted text on muted surface'],
  ['primary-foreground', 'primary', 'label on primary fill (buttons/CTAs)'],
  ['accent-secondary-foreground', 'accent-secondary', 'label on info accent'],
  ['success-foreground', 'success', 'label on success fill'],
  ['warning-foreground', 'warning', 'label on warning fill'],
  ['error-foreground', 'error', 'label on error fill'],
  ['destructive-foreground', 'destructive', 'label on destructive fill'],
];

// `--link` is the text-safe accent. It must read as a foreground on the
// surfaces links actually appear on.
const LINK_PAIRS: Pair[] = [
  ['link', 'background', 'link on page'],
  ['link', 'card', 'link on card'],
  ['link', 'secondary', 'link on sidebar/secondary surface'],
];

// `--warning-text` / `--success-text` / `--error-text` are the text-safe
// status accents. Unlike the FILL tokens above (which carry a `*-foreground`
// LABEL), these are used directly AS text on a neutral surface — so they must
// clear AA on both the page and a card, in every theme. This is what stops a
// status color (amber/green/red) from doubling as sub-AA body text again.
const STATUS_TEXT_PAIRS: Pair[] = [
  ['warning-text', 'background', 'warning text on page'],
  ['warning-text', 'card', 'warning text on card'],
  ['success-text', 'background', 'success text on page'],
  ['success-text', 'card', 'success text on card'],
  ['error-text', 'background', 'error text on page'],
  ['error-text', 'card', 'error text on card'],
];

// Real cross-surface usages: muted text and body text land on more than
// just their "home" surface.
const CROSS_PAIRS: Pair[] = [
  ['muted-foreground', 'background', 'secondary text on page'],
  ['muted-foreground', 'card', 'secondary text on card'],
  ['muted-foreground', 'secondary', 'muted labels in sidebar'],
  ['foreground', 'card', 'body text on card'],
  ['foreground', 'secondary', 'body text on sidebar'],
];

// Per-sport accent identity colors (active sport states in nav/chips).
const SPORTS = [
  'golf',
  'tennis',
  'pickleball',
  'padel',
  'baseball',
  'softball-slow',
  'softball-fast',
] as const;
const SPORT_PAIRS: Pair[] = SPORTS.map((s) => [
  `sport-${s}-foreground`,
  `sport-${s}`,
  `${s} accent label`,
]);

// Derived component-surface vocabulary. Every one of these resolves to a
// base pair, but asserting them explicitly proves the nav/drawer/modal
// abstractions are safe and locks them against a bad future re-mapping.
const COMPONENT_PAIRS: Pair[] = [
  ['nav-fg', 'nav-bg', 'top nav text'],
  ['drawer-fg', 'drawer-bg', 'mobile drawer text'],
  ['drawer-selected-fg', 'drawer-selected-bg', 'selected drawer row'],
  ['bottom-nav-fg', 'bottom-nav-bg', 'bottom tab label'],
  ['bottom-nav-active-fg', 'bottom-nav-bg', 'active bottom tab label'],
  ['modal-fg', 'modal-bg', 'modal text'],
  ['popover-fg', 'popover-bg', 'popover text'],
  ['card-fg', 'card-bg', 'card text'],
  ['tooltip-fg', 'tooltip-bg', 'tooltip text'],
  ['toast-fg', 'toast-bg', 'toast text'],
  ['table-fg', 'table-bg', 'table cell text'],
  ['table-header-fg', 'table-header-bg', 'table header text'],
  ['input-fg', 'input-bg', 'input text'],
  ['input-placeholder', 'input-bg', 'input placeholder'],
  ['button-fg', 'button-bg', 'button label'],
  ['chip-fg', 'chip-bg', 'chip text'],
  ['chip-selected-fg', 'chip-selected-bg', 'selected chip text'],
  ['surface-foreground', 'surface', 'text on generic surface'],
  ['surface-elevated-foreground', 'surface-elevated', 'text on elevated surface'],
];

function ratioFor(
  tokens: ThemeTokenMap,
  fg: string,
  bg: string,
): number {
  expect(tokens[fg]).toBeDefined();
  expect(tokens[bg]).toBeDefined();
  return tripleContrast(tokens[fg], tokens[bg]);
}

describe('theme token contrast (WCAG AA)', () => {
  it('parses all seven theme contexts from globals.css', () => {
    for (const id of THEME_CONTEXTS) {
      expect(themes[id]).toBeDefined();
      // sanity: the base palette is present for every theme
      expect(themes[id].background).toMatch(/^[\d.]+ [\d.]+% [\d.]+%$/);
      expect(themes[id].foreground).toMatch(/^[\d.]+ [\d.]+% [\d.]+%$/);
    }
  });

  describe.each(THEME_CONTEXTS)('%s', (id: ThemeContext) => {
    const tokens = themes[id];

    it.each(SELF_PAIRS)(
      'AA: %s on %s (%s)',
      (fg, bg) => {
        const r = ratioFor(tokens, fg, bg);
        expect(r).toBeGreaterThanOrEqual(WCAG_AA);
      },
    );

    it.each(LINK_PAIRS)('AA: %s on %s (%s)', (fg, bg) => {
      expect(ratioFor(tokens, fg, bg)).toBeGreaterThanOrEqual(WCAG_AA);
    });

    it.each(STATUS_TEXT_PAIRS)('AA: %s on %s (%s)', (fg, bg) => {
      expect(ratioFor(tokens, fg, bg)).toBeGreaterThanOrEqual(WCAG_AA);
    });

    it.each(CROSS_PAIRS)('AA: %s on %s (%s)', (fg, bg) => {
      expect(ratioFor(tokens, fg, bg)).toBeGreaterThanOrEqual(WCAG_AA);
    });

    it.each(SPORT_PAIRS)('AA: %s on %s (%s)', (fg, bg) => {
      expect(ratioFor(tokens, fg, bg)).toBeGreaterThanOrEqual(WCAG_AA);
    });

    it.each(COMPONENT_PAIRS)('AA: %s on %s (%s)', (fg, bg) => {
      expect(ratioFor(tokens, fg, bg)).toBeGreaterThanOrEqual(WCAG_AA);
    });

    it('focus ring is visible against the page (>= 3:1 UI contrast)', () => {
      expect(ratioFor(tokens, 'ring', 'background')).toBeGreaterThanOrEqual(
        WCAG_AA_LARGE,
      );
    });

    it('border is perceptible against its surface (>= 1.3:1)', () => {
      // A hairline border just needs to be faintly visible, not AA.
      expect(ratioFor(tokens, 'border', 'card')).toBeGreaterThanOrEqual(1.3);
    });
  });
});
