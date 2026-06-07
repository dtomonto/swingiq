// ============================================================
// Theme safety guard (static lint).
//
// The contrast suite proves the TOKEN SYSTEM is AA-safe. This suite
// proves components actually CONSUME it instead of reaching for raw,
// un-themeable color utilities (text-white / bg-white / text-gray-* /
// the Tailwind rainbow) — which is exactly how the white-on-white
// mobile defect was introduced.
//
// Two layers:
//   1. A strict per-file denylist for the audited shell / nav / sport /
//      overlay components: zero raw color utilities (brand logotype marks
//      are the only documented exception).
//   2. An APP-WIDE scan: no single className literal may put a white-ish
//      foreground on a solid light surface (the literal white-on-white
//      shape). Decorative scrims (`bg-black/50`) and variant-prefixed
//      states are correctly ignored.
// ============================================================

import { readFileSync, readdirSync } from 'fs';
import { resolve, relative } from 'path';

const SRC = resolve(__dirname, '../../..');

// ── Layer 1: strict per-file denylist ──────────────────────────────────

/** Audited shell / nav / sport / overlay components that must stay token-pure. */
const GUARDED_FILES = [
  'components/layout/AppShell.tsx',
  'components/layout/Sidebar.tsx',
  'components/sport/SportSelector.tsx',
  'components/ui/PWAInstallBanner.tsx',
  'components/ui/UsageCategoryModal.tsx',
  'components/ui/CookieBanner.tsx',
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

// ── Layer 2: app-wide white-on-light literal scan ──────────────────────

const LIGHT_SURFACE =
  /^(?:bg-white|bg-card|bg-secondary|bg-muted|bg-popover|bg-background|bg-nav|bg-drawer|bg-input|bg-surface|bg-surface-muted)$/;
const WHITE_FG =
  /^(?:text-white|text-primary-foreground|text-accent-secondary-foreground|text-success-foreground|text-error-foreground|text-destructive-foreground|text-card|text-background)(?:\/\d+)?$/;

function walkTsx(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = resolve(dir, entry.name);
    if (entry.isDirectory()) walkTsx(p, out);
    else if (entry.name.endsWith('.tsx')) out.push(p);
  }
  return out;
}

/** Find class-literal violations: a white-ish fg + a solid light bg in one literal. */
function scanWhiteOnLight(src: string): { line: number; tokens: string }[] {
  const hits: { line: number; tokens: string }[] = [];
  src.split('\n').forEach((line, i) => {
    for (const m of line.matchAll(/["'`]([^"'`]*)["'`]/g)) {
      const tokens = m[1].split(/\s+/).filter(Boolean);
      // Drop variant-prefixed tokens (hover:/disabled:/dark:/group-*) — those
      // are different states, not the resting paint.
      const base = tokens.filter((t) => !t.includes(':'));
      const surface = base.filter((t) => LIGHT_SURFACE.test(t));
      const fg = base.filter((t) => WHITE_FG.test(t));
      if (surface.length && fg.length) {
        hits.push({ line: i + 1, tokens: [...surface, ...fg].join(' + ') });
      }
    }
  });
  return hits;
}

describe('theme safety — audited components are token-pure', () => {
  it.each(GUARDED_FILES)('%s has no un-allowlisted raw color utilities', (file) => {
    const src = read(file);
    const allow = ALLOW[file] ?? {};
    const violations: string[] = [];

    for (const { label, re } of FORBIDDEN) {
      const matches = [...src.matchAll(re)];
      const allowed = allow[label] ?? 0;
      if (matches.length > allowed) {
        for (const m of matches) {
          violations.push(`  line ${lineOf(src, m.index ?? 0)}: "${m[0]}" (${label})`);
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
          `(bg-drawer / text-foreground / bg-sport-* / text-link …):\n${violations.join('\n')}`,
      );
    }
  });

  it('Sidebar active-sport accent uses semantic sport tokens (not a raw map)', () => {
    const src = read('components/layout/Sidebar.tsx');
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
    expect(src).not.toMatch(/bg-(green|yellow|lime|sky|red|orange|pink)-\d00/);
  });

  it('SportSelector dropdown no longer paints primary-foreground on a light panel', () => {
    const src = read('components/sport/SportSelector.tsx');
    expect(src).not.toMatch(/bg-secondary[\s\S]{0,400}text-primary-foreground/);
    expect(src).toContain('bg-popover text-popover-foreground');
  });
});

describe('theme safety — app-wide white-on-light scan', () => {
  const files = walkTsx(SRC);

  it('scans a meaningful number of component files', () => {
    expect(files.length).toBeGreaterThan(100);
  });

  it('no className literal puts a white-ish foreground on a solid light surface', () => {
    const report: string[] = [];
    for (const file of files) {
      const hits = scanWhiteOnLight(readFileSync(file, 'utf8'));
      for (const h of hits) {
        report.push(`  ${relative(SRC, file)}:${h.line}  [${h.tokens}]`);
      }
    }
    if (report.length) {
      throw new Error(
        `White-on-light text detected (white-ish foreground on a light surface ` +
          `in the same className). Pair the surface with its own *-foreground ` +
          `token instead:\n${report.join('\n')}`,
      );
    }
  });
});
