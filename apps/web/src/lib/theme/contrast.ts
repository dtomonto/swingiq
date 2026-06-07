// ============================================================
// SwingVantage — Theme contrast utilities
// Pure, dependency-free WCAG 2.x contrast math + a parser that
// reads the `[data-theme]` palettes out of globals.css and resolves
// the semantic token graph (including `var(--…)` aliases) into a
// flat per-theme map of HSL triples.
//
// This is the engine behind theme-contrast.test.ts. Keeping it as a
// normal lib module (not buried in a test) means the contrast floor
// is reusable — e.g. a future Storybook a11y check or a CI gate can
// import the same math instead of re-deriving it.
// ============================================================

export type Rgb = [number, number, number];

/** Every theme context that appears in globals.css. */
export const THEME_CONTEXTS = [
  'standard',
  'dark-performance',
  'coach-mode',
  'heritage-club',
  'field-court',
  'arcade-practice',
  'bird-print',
] as const;

export type ThemeContext = (typeof THEME_CONTEXTS)[number];

/** WCAG 2.1 minimum contrast ratios. */
export const WCAG_AA = 4.5; // normal text
export const WCAG_AA_LARGE = 3; // >=18.66px bold or >=24px, and UI components

/**
 * Convert an `"H S% L%"` triple (the form stored in our CSS custom
 * properties, e.g. `"142 64% 30%"`) into an sRGB byte triple.
 * Returns null if the string is not a plain HSL triple.
 */
export function hslTripleToRgb(triple: string): Rgb | null {
  const m = triple
    .trim()
    .match(/^(-?[\d.]+)\s+([\d.]+)%\s+([\d.]+)%$/);
  if (!m) return null;
  const h = parseFloat(m[1]);
  const s = parseFloat(m[2]) / 100;
  const l = parseFloat(m[3]) / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [
    Math.round(f(0) * 255),
    Math.round(f(8) * 255),
    Math.round(f(4) * 255),
  ];
}

function channelLuminance(c: number): number {
  const x = c / 255;
  return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
}

/** WCAG relative luminance of an sRGB triple. */
export function relativeLuminance([r, g, b]: Rgb): number {
  return (
    0.2126 * channelLuminance(r) +
    0.7152 * channelLuminance(g) +
    0.0722 * channelLuminance(b)
  );
}

/** WCAG contrast ratio between two sRGB triples (1–21). */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

/** Contrast ratio between two HSL-triple token values. */
export function tripleContrast(fg: string, bg: string): number {
  const a = hslTripleToRgb(fg);
  const b = hslTripleToRgb(bg);
  if (!a || !b) {
    throw new Error(`Not an HSL triple: fg="${fg}" bg="${bg}"`);
  }
  return contrastRatio(a, b);
}

export type ThemeTokenMap = Record<string, string>;

/**
 * Parse globals.css and return a fully-resolved token map per theme.
 *
 * Keys are token names WITHOUT the leading `--` (e.g. `card-foreground`,
 * `drawer-bg`, `sport-golf`). Values are resolved to literal HSL triples
 * wherever the graph bottoms out in one; `var(--x)` aliases are followed.
 *
 * Resolution model mirrors the CSS cascade:
 *  - A block whose selector contains `:root` applies to ALL themes
 *    (it is either the base palette or the shared sport/component layer).
 *  - A block selector `[data-theme='x']` (or `.dark`) overrides that theme.
 *  - Source order wins, so theme blocks override the base they follow.
 */
export function parseThemeTokens(css: string): Record<ThemeContext, ThemeTokenMap> {
  // Strip CSS comments so a declaration that follows an inline `/* … */`
  // comment still parses cleanly.
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');

  const raw: Record<string, ThemeTokenMap> = {};
  for (const id of THEME_CONTEXTS) raw[id] = {};

  // Declaration blocks have no nested braces, so `[^{}]+` for the body is safe.
  const blockRe = /((?::root|\[data-theme=)[^{]*)\{([^{}]+)\}/g;
  let block: RegExpExecArray | null;
  while ((block = blockRe.exec(css)) !== null) {
    const selector = block[1];
    const body = block[2];

    // Which theme contexts does this block target?
    let targets: ThemeContext[];
    if (selector.includes(':root')) {
      targets = [...THEME_CONTEXTS]; // base palette or shared layer
    } else {
      targets = [];
      const dt = [...selector.matchAll(/\[data-theme='([^']+)'\]/g)].map(
        (m) => m[1] as ThemeContext,
      );
      for (const id of dt) if (THEME_CONTEXTS.includes(id)) targets.push(id);
      if (selector.includes('.dark') && !targets.includes('dark-performance')) {
        targets.push('dark-performance');
      }
    }
    if (targets.length === 0) continue;

    // `[^;]+` captures each value up to its terminating semicolon, tolerating
    // multi-line values; comments were already stripped above.
    for (const dm of body.matchAll(/--([\w-]+)\s*:\s*([^;]+)/g)) {
      const name = dm[1];
      const value = dm[2].trim();
      for (const id of targets) raw[id][name] = value;
    }
  }

  // Resolve var(--x) aliases to their underlying value per theme.
  const resolved: Record<string, ThemeTokenMap> = {};
  for (const id of THEME_CONTEXTS) {
    resolved[id] = {};
    for (const name of Object.keys(raw[id])) {
      resolved[id][name] = resolveValue(raw[id], raw[id][name], 0);
    }
  }
  return resolved as Record<ThemeContext, ThemeTokenMap>;
}

function resolveValue(map: ThemeTokenMap, value: string, depth: number): string {
  if (depth > 12) return value;
  const m = value.match(/^var\(\s*--([\w-]+)\s*\)$/);
  if (m) {
    const ref = map[m[1]];
    if (ref != null) return resolveValue(map, ref, depth + 1);
  }
  return value;
}
