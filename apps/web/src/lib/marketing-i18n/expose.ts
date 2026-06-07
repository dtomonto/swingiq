// ============================================================
// SwingVantage — Marketing localization exposure gate
//
// The single source of truth for "which locales is this page actually
// available in?" Used by:
//   • app/[lang] generateStaticParams (which routes to build)
//   • buildMetadata (which hreflang alternates to emit)
//   • sitemap.ts (which localized URLs + alternates to list)
//   • the language switcher (which locales to offer)
//
// A locale is exposed for a path ONLY when every key that page depends
// on is `current` — so stale/partial translations are never shown or
// indexed. Drift is computed live from the committed manifest vs. the
// current English JSON, so editing English instantly hides affected
// pages from a locale until they're re-translated and re-blessed.
// ============================================================

import type { LanguageCode } from '@/lib/i18n';
import manifestJson from '@/content/marketing/translation-manifest.generated.json';
import { normalizeManifest } from '@/lib/i18n-upkeep/manifest';
import { currentLocalesForKeys, type DriftInput } from '@/lib/i18n-upkeep/detect';
import { EN_FLAT, flatDict, MARKETING_LOCALES } from './dict';
import { keysForPath, LOCALIZABLE_PATHS, PAGE_CONTENT_KEYS } from './registry';

const manifest = normalizeManifest(manifestJson);

function driftInput(): DriftInput {
  const translations: Partial<Record<LanguageCode, Record<string, string>>> = {};
  for (const loc of MARKETING_LOCALES) translations[loc] = flatDict(loc);
  return { manifest, english: EN_FLAT, translations };
}

/** Locales (excluding English) in which `path` is fully translated right now. */
export function currentLocalesFor(path: string): LanguageCode[] {
  // Only pages explicitly registered as localizable can ever be exposed — this
  // prevents emitting hreflang/sitemap entries (or building routes) for a /es
  // URL that has no translated body and would 404.
  if (!(path in PAGE_CONTENT_KEYS)) return [];
  return currentLocalesForKeys(keysForPath(path), driftInput(), MARKETING_LOCALES);
}

/** Is this path currently available in this (non-English) locale? */
export function isLocaleCurrentFor(path: string, locale: LanguageCode): boolean {
  return currentLocalesFor(path).includes(locale);
}

/** Every (locale, path) pair that should be statically built / listed. */
export function localizedRoutes(): Array<{ locale: LanguageCode; path: string }> {
  const routes: Array<{ locale: LanguageCode; path: string }> = [];
  for (const path of LOCALIZABLE_PATHS) {
    for (const locale of currentLocalesFor(path)) routes.push({ locale, path });
  }
  return routes;
}

export { LOCALIZABLE_PATHS };
