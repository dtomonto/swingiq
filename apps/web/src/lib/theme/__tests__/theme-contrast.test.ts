// ============================================================
// SwingVantage — Theme token contrast guard
// ------------------------------------------------------------
// Structural floor for the multi-theme system. Every theme in
// globals.css redefines the SAME semantic tokens; this test parses
// those palettes and asserts the meaningful foreground/surface PAIRS
// clear WCAG 2.1 contrast minimums in ALL seven themes.
//
// This is what stops the production defect from coming back: a future
// edit that makes (say) popover-foreground white on a light popover, or
// a new dark theme whose card text goes dark-on-dark, fails here loudly
// instead of shipping an unreadable screen.
// ============================================================

import { readFileSync } from 'fs';
import { join } from 'path';

const CSS = readFileSync(join(__dirname, '..', '..', '..', 'app', 'globals.css'), 'utf8');

// The seven shipped themes (must match lib/theme/themes.ts).
const THEME_IDS = [
  'standard',
  'dark-performance',
  'coach-mode',
  'heritage-club',
  'field-court',
  'arcade-practice',
  'bird-print',
] as const;
type ThemeId = (typeof THEME_IDS)[number];

// ── HSL("H S% L%") → relative luminance → WCAG contrast ratio ──
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)].map((v) => Math.round(v * 255)) as [number, number, number];
}

function relLuminance([r, g, b]: [number, number, number]): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(hslA: string, hslB: string): number {
  const parse = (v: string) => {
    const m = v.trim().match(/^([\d.]+)\s+([\d.]+)%\s+([\d.]+)%$/);
    if (!m) throw new Error(`Not an HSL channel triple: "${v}"`);
    return relLuminance(hslToRgb(+m[1], +m[2], +m[3]));
  };
  const la = parse(hslA);
  const lb = parse(hslB);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

// ── Parse a theme's HSL-channel tokens out of its globals.css block ──
function tokensFor(themeId: ThemeId): Record<string, string> {
  const sel = `[data-theme='${themeId}']`;
  const at = CSS.indexOf(sel);
  if (at === -1) throw new Error(`Theme block not found in globals.css: ${themeId}`);
  const open = CSS.indexOf('{', at);
  const close = CSS.indexOf('}', open);
  const block = CSS.slice(open + 1, close);

  const tokens: Record<string, string> = {};
  const re = /--([\w-]+):\s*([^;]+);/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block)) !== null) {
    const value = m[2].trim();
    // Keep only "H S% L%" channel triples (the color tokens).
    if (/^[\d.]+\s+[\d.]+%\s+[\d.]+%$/.test(value)) tokens[m[1]] = value;
  }
  return tokens;
}

// Pairs that carry real text/UI and the minimum ratio each must clear.
// 4.5 = WCAG AA normal text; 3.0 = AA large/bold text + UI components.
const PAIRS: { fg: string; bg: string; min: number; note: string }[] = [
  { fg: 'foreground', bg: 'background', min: 4.5, note: 'body text on page' },
  { fg: 'card-foreground', bg: 'card', min: 4.5, note: 'text on cards' },
  { fg: 'popover-foreground', bg: 'popover', min: 4.5, note: 'text in popovers/dropdowns' },
  { fg: 'secondary-foreground', bg: 'secondary', min: 4.5, note: 'text on secondary surfaces (sidebar)' },
  { fg: 'accent-foreground', bg: 'accent', min: 4.5, note: 'text on accent surfaces' },
  { fg: 'muted-foreground', bg: 'muted', min: 4.5, note: 'muted text on muted surfaces' },
  { fg: 'muted-foreground', bg: 'background', min: 4.5, note: 'muted text on page' },
  { fg: 'muted-foreground', bg: 'card', min: 4.5, note: 'muted text on cards' },
  { fg: 'primary-foreground', bg: 'primary', min: 4.5, note: 'label on primary buttons/CTAs' },
  { fg: 'accent-secondary-foreground', bg: 'accent-secondary', min: 4.5, note: 'label on secondary accent' },
  { fg: 'success-foreground', bg: 'success', min: 4.5, note: 'label on success' },
  { fg: 'warning-foreground', bg: 'warning', min: 4.5, note: 'label on warning' },
  { fg: 'error-foreground', bg: 'error', min: 4.5, note: 'label on error' },
  { fg: 'destructive-foreground', bg: 'destructive', min: 4.5, note: 'label on destructive' },
];

describe('theme tokens are contrast-safe in every theme', () => {
  for (const themeId of THEME_IDS) {
    describe(themeId, () => {
      const tokens = tokensFor(themeId);

      for (const { fg, bg, min, note } of PAIRS) {
        test(`${fg} on ${bg} ≥ ${min}:1 (${note})`, () => {
          expect(tokens[fg]).toBeDefined();
          expect(tokens[bg]).toBeDefined();
          const ratio = contrast(tokens[fg], tokens[bg]);
          // Helpful diagnostic if it ever regresses.
          if (ratio < min) {
            // eslint-disable-next-line no-console
            console.error(
              `[contrast] ${themeId}: ${fg}(${tokens[fg]}) on ${bg}(${tokens[bg]}) = ${ratio.toFixed(2)}:1 (< ${min})`,
            );
          }
          expect(ratio).toBeGreaterThanOrEqual(min);
        });
      }
    });
  }
});

// Sanity: every theme actually defines the core token set (so a typo'd
// or missing token can't silently fall back to an inherited value).
describe('every theme defines the core semantic tokens', () => {
  const REQUIRED = [
    'background',
    'foreground',
    'card',
    'card-foreground',
    'popover',
    'popover-foreground',
    'primary',
    'primary-foreground',
    'secondary',
    'secondary-foreground',
    'muted',
    'muted-foreground',
    'border',
  ];
  for (const themeId of THEME_IDS) {
    test(`${themeId} defines all required tokens`, () => {
      const tokens = tokensFor(themeId);
      for (const t of REQUIRED) expect(tokens[t]).toBeDefined();
    });
  }
});
