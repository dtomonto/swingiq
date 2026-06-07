// ============================================================
// SwingVantage — Theme safety / anti-pattern guard
// ------------------------------------------------------------
// The token-contrast test (theme-contrast.test.ts) proves the PALETTE
// is safe in all seven themes. That guarantee only holds if components
// actually use the semantic tokens instead of bypassing them with raw
// colors. This test enforces that discipline on the app "chrome"
// (navigation, drawer, shell, sport selector, hero cards, guide) — the
// exact surfaces where the production white-on-white / dark-on-dark
// defect appeared — so it cannot silently return.
//
// What it catches:
//   • white text + a light surface set on the SAME element (white-on-white)
//   • theme-flipping `text-primary-foreground` on the fixed dark brand
//     surface `bg-golf-dark` (dark-on-dark in dark themes)
//   • raw Tailwind palette colors for text/background in chrome files
//   • regressions of the specific sport-selector dropdown fix
//
// Honest limitation: a purely static scan cannot model an element's
// ANCESTOR background, so it cannot prove every nested case. The palette
// floor (contrast test) + these chrome invariants together cover the
// shipped defect class; full ancestor-aware checking would need render
// tests and is noted as a future enhancement.
// ============================================================

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const SRC = join(__dirname, '..', '..', '..');

/** Strip block + line comments so doc comments can mention class names. */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

/** Every quoted/back-ticked string literal in a source file. */
function classLiterals(src: string): string[] {
  const out: string[] = [];
  const re = /(['"`])((?:[^'"`\\]|\\.)*?)\1/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) out.push(m[2]);
  return out;
}

/** Does this class string contain the OPAQUE, UNPREFIXED utility `name`?
 *  Rejects longer tokens, `/opacity` modifiers, and state-variant prefixes
 *  (`disabled:`, `hover:`, `dark:`, …) — a `disabled:bg-muted` is a state,
 *  not the element's resting background, so it must not pair with base text. */
function hasOpaque(classStr: string, name: string): boolean {
  return new RegExp(`(?<![\\w:/-])${name}(?![\\w/])`).test(classStr);
}

// Surfaces that are LIGHT in light themes — white text on them = unreadable.
const LIGHT_SURFACES = [
  'bg-white',
  'bg-background',
  'bg-card',
  'bg-popover',
  'bg-secondary',
  'bg-muted',
];
// Opaque white-ish text tokens.
const WHITE_TEXT = ['text-white', 'text-primary-foreground'];

function recurse(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'admin' || entry.name === '__tests__') continue; // internal / not product chrome
      files.push(...recurse(full));
    } else if (entry.name.endsWith('.tsx')) {
      files.push(full);
    }
  }
  return files;
}

// ── Broad net: white text + a light surface on the SAME element ──
describe('no same-element white-on-light in product components', () => {
  const files = recurse(join(SRC, 'components'));
  for (const file of files) {
    const rel = file.slice(SRC.length + 1);
    test(rel, () => {
      const code = stripComments(readFileSync(file, 'utf8'));
      for (const lit of classLiterals(code)) {
        const whiteText = WHITE_TEXT.find((t) => hasOpaque(lit, t));
        const lightBg = LIGHT_SURFACES.find((s) => hasOpaque(lit, s));
        if (whiteText && lightBg) {
          throw new Error(
            `White text ("${whiteText}") on a light surface ("${lightBg}") in the same className:\n  "${lit}"\n` +
              `Use semantic pairs (e.g. bg-popover/text-popover-foreground, bg-card/text-card-foreground).`,
          );
        }
      }
    });
  }
});

// ── Chrome files: stricter discipline ──
const CHROME = [
  'components/layout/AppShell.tsx',
  'components/layout/Sidebar.tsx',
  'components/sport/SportSelector.tsx',
  'components/agents/FirstSwingJourneyCard.tsx',
  'components/agents/NextBestActionCard.tsx',
  'components/guide/GuideCompanion.tsx',
];

describe('app chrome avoids raw Tailwind palette colors for text/bg', () => {
  // Logo monograms are exempt (logotype — WCAG 1.4.3) but they use
  // bg-golf-fairway, not gray/slate/neutral, so this stays strict.
  const RAW = /(?<![\w-])(?:text|bg)-(?:gray|slate|neutral|zinc|stone)-\d/;
  for (const rel of CHROME) {
    test(rel, () => {
      const code = stripComments(readFileSync(join(SRC, rel), 'utf8'));
      for (const lit of classLiterals(code)) {
        expect(lit).not.toMatch(RAW);
      }
    });
  }
});

describe('hero cards on the fixed bg-golf-dark surface never use theme-flipping primary-foreground', () => {
  // bg-golf-dark is the SAME near-black green in every theme, but
  // `--primary-foreground` flips to near-black in dark themes — pairing
  // them produced dark-on-dark. These cards must use white-based text.
  const GOLF_DARK_CARDS = [
    'components/agents/FirstSwingJourneyCard.tsx',
    'components/agents/NextBestActionCard.tsx',
    'components/guide/GuideCompanion.tsx',
  ];
  for (const rel of GOLF_DARK_CARDS) {
    test(rel, () => {
      const code = stripComments(readFileSync(join(SRC, rel), 'utf8'));
      expect(code).toContain('bg-golf-dark'); // guard stays relevant
      expect(code).not.toMatch(/text-primary-foreground/);
    });
  }
});

describe('sport selector dropdown uses readable popover tokens (regression of the shipped fix)', () => {
  const code = stripComments(
    readFileSync(join(SRC, 'components/sport/SportSelector.tsx'), 'utf8'),
  );
  test('panel uses bg-popover + text-popover-foreground', () => {
    expect(code).toContain('bg-popover');
    expect(code).toContain('text-popover-foreground');
  });
  test('no leftover bg-secondary panel or raw white text', () => {
    expect(code).not.toContain('bg-secondary');
    expect(code).not.toMatch(/(?<![\w-])text-white(?![\w/])/);
  });
});
