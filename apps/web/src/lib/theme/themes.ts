// ============================================================
// SwingVantage — Theme Registry
// The single source of truth for the curated multi-theme system.
// Themes change the visual/emotional layer ONLY — never layout,
// navigation, coaching logic, data, or accessibility. Every theme
// redefines the same semantic tokens defined in globals.css.
// ============================================================

export type ThemeId =
  | 'standard'
  | 'dark-performance'
  | 'coach-mode'
  | 'heritage-club'
  | 'field-court'
  | 'arcade-practice'
  | 'bird-print';

export type ThemeCategory = 'light' | 'dark';

export interface ThemeSwatches {
  /** Page background */
  bg: string;
  /** Card / surface */
  surface: string;
  /** Primary text on surface */
  text: string;
  /** Primary accent */
  primary: string;
  /** Secondary accent */
  accent: string;
}

export interface ThemeDef {
  id: ThemeId;
  /** Display name shown in the selector. */
  name: string;
  /** One-line, plain-English description of who/what the theme is for. */
  tagline: string;
  /** Whether the theme is a light or dark family (drives the `.dark` class). */
  category: ThemeCategory;
  /**
   * Static preview swatches (CSS color strings) for the selector cards.
   * These mirror the token palette in globals.css so previews render
   * without having to mount the theme.
   */
  swatches: ThemeSwatches;
  /** True only for themes that render the decorative pattern overlay. */
  hasPattern?: boolean;
}

/**
 * Curated theme catalog. Order is intentional — `standard` is the default
 * and appears first.
 */
export const THEMES: ThemeDef[] = [
  {
    id: 'standard',
    name: 'Standard',
    tagline: 'Clean, timeless, and professional — the trustworthy default.',
    category: 'light',
    swatches: {
      bg: 'hsl(210 20% 98%)',
      surface: 'hsl(0 0% 100%)',
      text: 'hsl(222 22% 14%)',
      primary: 'hsl(142 64% 30%)',
      accent: 'hsl(188 72% 32%)',
    },
  },
  {
    id: 'dark-performance',
    name: 'Dark Performance',
    tagline: 'High-intensity analytics for serious training.',
    category: 'dark',
    swatches: {
      bg: 'hsl(222 24% 7%)',
      surface: 'hsl(222 18% 11%)',
      text: 'hsl(210 16% 92%)',
      primary: 'hsl(160 64% 44%)',
      accent: 'hsl(199 80% 54%)',
    },
  },
  {
    id: 'coach-mode',
    name: 'Coach Mode',
    tagline: 'Clear, structured, and instruction-first.',
    category: 'light',
    swatches: {
      bg: 'hsl(210 30% 99%)',
      surface: 'hsl(0 0% 100%)',
      text: 'hsl(217 33% 17%)',
      primary: 'hsl(217 79% 42%)',
      accent: 'hsl(173 58% 32%)',
    },
  },
  {
    id: 'heritage-club',
    name: 'Heritage Club',
    tagline: 'Classic club elegance with premium tradition.',
    category: 'light',
    swatches: {
      bg: 'hsl(42 33% 95%)',
      surface: 'hsl(40 36% 98%)',
      text: 'hsl(218 38% 18%)',
      primary: 'hsl(150 34% 25%)',
      accent: 'hsl(38 54% 36%)',
    },
  },
  {
    id: 'field-court',
    name: 'Field & Court',
    tagline: 'Outdoor athletic energy across every sport.',
    category: 'light',
    swatches: {
      bg: 'hsl(80 18% 96%)',
      surface: 'hsl(80 20% 99%)',
      text: 'hsl(150 18% 15%)',
      primary: 'hsl(135 45% 28%)',
      accent: 'hsl(18 68% 42%)',
    },
  },
  {
    id: 'arcade-practice',
    name: 'Arcade Practice',
    tagline: 'Gamified training with neon momentum.',
    category: 'dark',
    hasPattern: true,
    swatches: {
      bg: 'hsl(256 44% 8%)',
      surface: 'hsl(256 36% 13%)',
      text: 'hsl(250 36% 95%)',
      primary: 'hsl(280 72% 56%)',
      accent: 'hsl(322 85% 64%)',
    },
  },
  {
    id: 'bird-print',
    name: 'Bird Print Lifestyle',
    tagline: 'Original golf-streetwear bird-print energy.',
    category: 'light',
    hasPattern: true,
    swatches: {
      bg: 'hsl(196 30% 96%)',
      surface: 'hsl(0 0% 100%)',
      text: 'hsl(205 32% 16%)',
      primary: 'hsl(192 62% 34%)',
      accent: 'hsl(8 72% 49%)',
    },
  },
];

export const DEFAULT_THEME_ID: ThemeId = 'standard';

const THEME_IDS = new Set<string>(THEMES.map((t) => t.id));

/** Narrow an arbitrary string to a valid ThemeId, falling back to the default. */
export function normalizeThemeId(value: unknown): ThemeId {
  return typeof value === 'string' && THEME_IDS.has(value)
    ? (value as ThemeId)
    : DEFAULT_THEME_ID;
}

/** Look up a theme definition by id (falls back to the default theme). */
export function getTheme(id: ThemeId): ThemeDef {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

/** Whether a theme belongs to the dark family (drives the `.dark` class). */
export function isDarkTheme(id: ThemeId): boolean {
  return getTheme(id).category === 'dark';
}
