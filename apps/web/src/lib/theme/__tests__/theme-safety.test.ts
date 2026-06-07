// ============================================================
// Theme safety guard (static lint).
//
// The contrast suite proves the TOKEN SYSTEM is AA-safe. This suite
// proves the navigation surfaces actually CONSUME it: the shared shell
// and sport components must not reach for raw, un-themeable color
// utilities (text-white / bg-white / text-gray-* / the Tailwind rainbow),
// which is exactly how the white-on-white mobile defect was introduced.
//
// Decorative scrims (`bg-black/50`) keep their alpha slash and are allowed.
// Brand logotype marks are the only hard-coded exception and are listed
// explicitly below so a NEW raw color cannot slip in unnoticed.
// ============================================================

import { readFileSync } from 'fs';
import { resolve } from 'path';

const SRC = resolve(__dirname, '../../..');

/** Shell / nav / sport components that must stay token-pure. */
const GUARDED_FILES = [
  'components/layout/AppShell.tsx',
  'components/layout/Sidebar.tsx',
  'components/sport/SportSelector.tsx',
];

/** Raw, un-themeable color utilities that must not appear in guarded files. */
const FORBIDDEN: { label: string; re: RegExp }[] = [
  { label: 'text-white', re: /\btext-white\b/g },
  { label: 'bg-white', re: /\bbg-white\b/g },
  // black as solid text/fill (a `bg-black/50` scrim keeps its alpha slash)
  { label: 'text-black (no alpha)', re: /\btext-black\b(?!\/)/g },
  { label: 'bg-black (no alpha)', re: /\bbg-black\b(?!\/)/g },
  {
    label: 'neutral palette (gray/slate/neutral/zinc/stone)',
    re: /\b(?:text|bg|border|ring|from|via|to)-(?:gray|slate|neutral|zinc|stone)-\d{2,3}\b/g,
  },
  {
    label: 'raw Tailwind rainbow color',
    re: /\b(?:text|bg|border|ring|from|via|to)-(?:green|yellow|lime|sky|red|orange|pink|blue|purple|amber|emerald|teal|cyan|indigo|violet|fuchsia|rose)-\d{2,3}\b/g,
  },
];

/**
 * Intentional, documented exceptions (brand logotype marks). The "SV" logo
 * tile is a fixed-green brand mark, not body text, so its `text-white` is a
 * logotype exception (WCAG 1.4.3 exempts logotypes). Any count ABOVE these
 * numbers is a regression and fails the suite.
 */
const ALLOW: Record<string, Record<string, number>> = {
  'components/layout/AppShell.tsx': { 'text-white': 1 },
  'components/layout/Sidebar.tsx': { 'text-white': 1 },
};

function read(file: string): string {
  return readFileSync(resolve(SRC, file), 'utf8');
}

function lineOf(src: string, index: number): number {
  return src.slice(0, index).split('\n').length;
}

describe('theme safety — shell & sport components are token-pure', () => {
  it.each(GUARDED_FILES)('%s has no un-allowlisted raw color utilities', (file) => {
    const src = read(file);
    const allow = ALLOW[file] ?? {};
    const violations: string[] = [];

    for (const { label, re } of FORBIDDEN) {
      const matches = [...src.matchAll(re)];
      const allowed = allow[label] ?? 0;
      if (matches.length > allowed) {
        for (const m of matches) {
          violations.push(
            `  line ${lineOf(src, m.index ?? 0)}: "${m[0]}" (${label})`,
          );
        }
        if (allowed > 0) {
          violations.push(
            `  → ${matches.length} "${label}" found but only ${allowed} allow-listed (brand logotype).`,
          );
        }
      }
    }

    if (violations.length) {
      throw new Error(
        `Raw color utilities in ${file} — use semantic theme tokens ` +
          `(bg-drawer / text-foreground / bg-sport-* …):\n${violations.join('\n')}`,
      );
    }
  });

  it('Sidebar active-sport accent uses semantic sport tokens (not a raw map)', () => {
    const src = read('components/layout/Sidebar.tsx');
    // Positive lock: every sport id maps to its token pair.
    for (const sport of [
      'golf',
      'tennis',
      'pickleball',
      'padel',
      'baseball',
      'softball-slow',
      'softball-fast',
    ]) {
      expect(src).toContain(`bg-sport-${sport} text-sport-${sport}-foreground`);
    }
    // And the old hard-coded accents are gone for good.
    expect(src).not.toMatch(/bg-(green|yellow|lime|sky|red|orange|pink)-\d00/);
  });

  it('SportSelector dropdown no longer paints primary-foreground on a light panel', () => {
    const src = read('components/sport/SportSelector.tsx');
    // The original bug: white-ish `text-primary-foreground/*` rows sitting on
    // a `bg-secondary` panel. The panel is now a popover surface and rows use
    // popover-/primary-foreground correctly — so this anti-pattern is absent.
    expect(src).not.toMatch(/bg-secondary[\s\S]{0,400}text-primary-foreground/);
    expect(src).toContain('bg-popover text-popover-foreground');
  });
});
