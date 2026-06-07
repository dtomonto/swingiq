// ============================================================
// SwingVantage — Marketing localization registry
//
// Maps each localizable page path to the translation keys it depends
// on. Every page implicitly depends on the shared chrome (nav +
// footer). A locale is only exposed for a page when ALL of these keys
// are current for that locale (see ./expose).
// ============================================================

import { EN_FLAT } from './dict';

/** Shared header + footer keys — present on every marketing page. */
export const CHROME_KEYS: string[] = Object.keys(EN_FLAT).filter(
  (k) => k.startsWith('nav.') || k.startsWith('footer.'),
);

/**
 * Page-specific content keys, keyed by site-relative path (no locale prefix).
 * Add an entry here when a page's body content becomes localizable.
 */
export const PAGE_CONTENT_KEYS: Record<string, string[]> = {
  '/': Object.keys(EN_FLAT).filter((k) => k.startsWith('home.')),
  '/how-it-works': Object.keys(EN_FLAT).filter((k) => k.startsWith('howItWorks.')),
  '/features': Object.keys(EN_FLAT).filter((k) => k.startsWith('features.')),
};

/** Paths that have localizable body content (candidates for /[lang]/...). */
export const LOCALIZABLE_PATHS: string[] = Object.keys(PAGE_CONTENT_KEYS);

/** All keys a given page needs translated = chrome ∪ its own content. */
export function keysForPath(path: string): string[] {
  return [...CHROME_KEYS, ...(PAGE_CONTENT_KEYS[path] ?? [])];
}
