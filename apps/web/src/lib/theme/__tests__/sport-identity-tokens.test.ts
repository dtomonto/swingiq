// ============================================================
// Design V2 — token architecture regression guard.
//
// Two new token axes are introduced by the redesign foundation and
// both are proven here against the SAME contrast math as the theme
// palettes (see contrast.ts):
//
//   1. The "document" surface — the AI report renders as light paper
//      in EVERY theme. Its foreground must read on the paper, and the
//      paper accent must clear AA as on-paper text, for all 8 themes.
//
//   2. The sport-identity layer (`data-sport`) — each sport's accent
//      ships an AA-paired `-foreground` (on the fill) and a darkened
//      `-text` (on light surfaces), and a sport block must NEVER leak
//      into a semantic token (--primary/--background/--card/status),
//      because sport is identity, not chrome.
// ============================================================

import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  parseThemeTokens,
  tripleContrast,
  THEME_CONTEXTS,
  WCAG_AA,
  WCAG_AA_LARGE,
} from '../contrast';

const cssPath = resolve(__dirname, '../../../app/globals.css');
const css = readFileSync(cssPath, 'utf8');
const themes = parseThemeTokens(css);

// ── 1. Document surface (per theme) ───────────────────────────────────────
describe('document surface tokens', () => {
  for (const theme of THEME_CONTEXTS) {
    const map = themes[theme];

    it(`[${theme}] defines a document surface trio`, () => {
      expect(map['surface-document']).toBeDefined();
      expect(map['surface-document-foreground']).toBeDefined();
      expect(map['surface-document-accent']).toBeDefined();
    });

    it(`[${theme}] body text reads on the document paper (AA)`, () => {
      const ratio = tripleContrast(
        map['surface-document-foreground'],
        map['surface-document'],
      );
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA);
    });

    it(`[${theme}] document accent reads on the paper (AA)`, () => {
      const ratio = tripleContrast(
        map['surface-document-accent'],
        map['surface-document'],
      );
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA);
    });
  }
});

// ── 2. Sport identity layer (`data-sport`) ────────────────────────────────

const SPORTS = [
  'golf',
  'tennis',
  'baseball',
  'softball_slow',
  'softball_fast',
  'pickleball',
  'padel',
] as const;

/** Pull each `[data-sport='x'] { … }` block body out of globals.css. */
function sportBlocks(source: string): Record<string, string> {
  const noComments = source.replace(/\/\*[\s\S]*?\*\//g, '');
  const re = /\[data-sport='([^']+)'\]\s*\{([^{}]+)\}/g;
  const out: Record<string, string> = {};
  let m: RegExpExecArray | null;
  while ((m = re.exec(noComments)) !== null) out[m[1]] = m[2];
  return out;
}

/** Read a single `--token: value;` declaration out of a block body. */
function decl(body: string, token: string): string | null {
  const m = body.match(new RegExp(`--${token}\\s*:\\s*([^;]+);`));
  return m ? m[1].trim() : null;
}

const blocks = sportBlocks(css);

// Light surfaces the `-text` accent is allowed to sit on (white paper + the
// lightest theme page background). `-text` is the on-light variant of an accent.
const LIGHT_SURFACES: Array<[string, string]> = [
  ['0 0% 100%', 'white'],
  ['210 20% 98%', 'lightest page bg'],
];

// Semantic/chrome tokens a sport block must never redefine.
const FORBIDDEN = [
  'primary',
  'background',
  'card',
  'foreground',
  'success',
  'warning',
  'error',
  'destructive',
  'ring',
];

describe('sport identity tokens', () => {
  it('defines all seven sports', () => {
    for (const sport of SPORTS) {
      expect(blocks[sport]).toBeDefined();
    }
  });

  for (const sport of SPORTS) {
    describe(`[${sport}]`, () => {
      it('label/icon on the accent fill clears the UI floor (3:1)', () => {
        const accent = decl(blocks[sport], 'sport-accent')!;
        const fg = decl(blocks[sport], 'sport-accent-foreground')!;
        expect(tripleContrast(fg, accent)).toBeGreaterThanOrEqual(WCAG_AA_LARGE);
      });

      it('accent-text reads as text on light surfaces (AA)', () => {
        const text = decl(blocks[sport], 'sport-accent-text')!;
        for (const [surface] of LIGHT_SURFACES) {
          expect(tripleContrast(text, surface)).toBeGreaterThanOrEqual(WCAG_AA);
        }
      });

      it('never leaks into a semantic/chrome token', () => {
        for (const token of FORBIDDEN) {
          // Require `--token:` literally (two leading dashes) so `--sport-*`
          // and compound names (e.g. `--card-foreground`) are not false hits.
          const leaks = new RegExp(`(^|[^-])--${token}\\s*:`).test(blocks[sport]);
          expect(leaks).toBe(false);
        }
      });
    });
  }
});
