// ============================================================
// SwingVantage — Marketing localization shared constants
// Kept dependency-free so it's safe to import from middleware (edge),
// server components, and client components alike.
// ============================================================

/** Cookie that records the visitor's explicit language choice (1 year, lax). */
export const LANG_COOKIE = 'sv_lang';

/**
 * Non-English locales the marketing surface ships dictionaries for. Single
 * source of truth, kept here (dependency-free) so middleware can import the
 * locale prefixes without pulling in the full i18n bundle.
 */
export const MARKETING_LOCALE_CODES = ['es'] as const;
