// ============================================================
// SwingVantage Admin — Theme contrast auditor (isomorphic, pure)
// ------------------------------------------------------------
// Computes real WCAG 2.1 contrast ratios over the theme registry's
// preview swatches and grades the meaningful foreground/background
// pairs (body text on page, text on card, accents). This is the
// operator-facing surface that prevents the classic "white-on-white"
// unreadable-theme defect — every theme's pairs are scored and any that
// fall below WCAG AA are flagged loudly.
//
// Pure colour math (hsl/hex → relative luminance → ratio), fully unit
// testable against known reference values (black/white = 21:1).
// ============================================================

export interface RGB { r: number; g: number; b: number }

/** Swatch set every theme defines (mirrors ThemeSwatches). */
export interface SwatchSet {
  bg: string;
  surface: string;
  text: string;
  primary: string;
  accent: string;
}

/** Parse a CSS colour — supports `hsl(H S% L%)` and `#rgb`/`#rrggbb`. Returns null if unparseable. */
export function parseColor(input: string): RGB | null {
  const s = input.trim().toLowerCase();

  const hsl = s.match(/^hsla?\(\s*([\d.]+)\s*[, ]\s*([\d.]+)%\s*[, ]\s*([\d.]+)%/);
  if (hsl) {
    return hslToRgb(parseFloat(hsl[1]), parseFloat(hsl[2]) / 100, parseFloat(hsl[3]) / 100);
  }

  const hex = s.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
  }
  return null;
}

function hslToRgb(h: number, s: number, l: number): RGB {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) };
}

/** WCAG relative luminance of an sRGB colour. */
export function relativeLuminance({ r, g, b }: RGB): number {
  const f = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** WCAG contrast ratio between two colours (1..21). Returns 0 if either is unparseable. */
export function contrastRatio(a: string, b: string): number {
  const ca = parseColor(a);
  const cb = parseColor(b);
  if (!ca || !cb) return 0;
  const la = relativeLuminance(ca);
  const lb = relativeLuminance(cb);
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
}

export type ContrastGrade = 'AAA' | 'AA' | 'AA-large' | 'fail';

export function gradeRatio(ratio: number): ContrastGrade {
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  if (ratio >= 3) return 'AA-large';
  return 'fail';
}

export interface ContrastPair {
  label: string;
  fg: string;
  bg: string;
  ratio: number;
  grade: ContrastGrade;
  /** Minimum ratio this pair needs (4.5 for body text, 3 for large/UI). */
  minNeeded: number;
  passes: boolean;
}

export interface ThemeContrastAudit {
  id: string;
  name: string;
  category: string;
  pairs: ContrastPair[];
  /** The lowest ratio across the theme's pairs. */
  worstRatio: number;
  /** Number of pairs below the WCAG minimum. */
  fails: number;
}

interface PairSpec { label: string; fg: keyof SwatchSet; bg: keyof SwatchSet; min: number }

// The pairs that actually drive readability. Body text needs AA (4.5);
// accents are treated as large/UI elements (3.0).
const PAIR_SPECS: PairSpec[] = [
  { label: 'Body text on page', fg: 'text', bg: 'bg', min: 4.5 },
  { label: 'Body text on card', fg: 'text', bg: 'surface', min: 4.5 },
  { label: 'Primary accent on card', fg: 'primary', bg: 'surface', min: 3 },
  { label: 'Secondary accent on card', fg: 'accent', bg: 'surface', min: 3 },
];

/** Audit one theme's swatch set. */
export function auditSwatches(meta: { id: string; name: string; category: string }, sw: SwatchSet): ThemeContrastAudit {
  const pairs: ContrastPair[] = PAIR_SPECS.map((spec) => {
    const ratio = contrastRatio(sw[spec.fg], sw[spec.bg]);
    return {
      label: spec.label,
      fg: sw[spec.fg],
      bg: sw[spec.bg],
      ratio,
      grade: gradeRatio(ratio),
      minNeeded: spec.min,
      passes: ratio >= spec.min,
    };
  });
  return {
    id: meta.id,
    name: meta.name,
    category: meta.category,
    pairs,
    worstRatio: pairs.reduce((m, p) => Math.min(m, p.ratio), Infinity),
    fails: pairs.filter((p) => !p.passes).length,
  };
}

export interface ThemeLike { id: string; name: string; category: string; swatches: SwatchSet }

export interface ContrastReport {
  themes: ThemeContrastAudit[];
  stats: { themes: number; failingThemes: number; failingPairs: number; pairsChecked: number };
}

/** Audit every theme and roll up the failures. */
export function auditThemes(themes: ThemeLike[]): ContrastReport {
  const audits = themes.map((t) => auditSwatches({ id: t.id, name: t.name, category: t.category }, t.swatches));
  return {
    themes: audits,
    stats: {
      themes: audits.length,
      failingThemes: audits.filter((a) => a.fails > 0).length,
      failingPairs: audits.reduce((n, a) => n + a.fails, 0),
      pairsChecked: audits.reduce((n, a) => n + a.pairs.length, 0),
    },
  };
}
