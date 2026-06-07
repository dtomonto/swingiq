// ============================================================
// SwingVantage — Marketing localized-URL helpers
// English lives at the root (/how-it-works); a locale lives under its
// prefix (/es/how-it-works) but ONLY when that page is actually
// translated. Otherwise we link to the English page that really exists
// — never a /es URL that would 404 or show English under a Spanish URL.
// ============================================================

import type { LanguageCode } from '@/lib/i18n';
import { MARKETING_LOCALES } from './dict';
import { isLocaleCurrentFor } from './expose';

/** Split a pathname into its locale + the underlying English (base) path. */
export function localeFromPathname(pathname: string): { locale: LanguageCode; basePath: string } {
  for (const loc of MARKETING_LOCALES) {
    if (pathname === `/${loc}`) return { locale: loc, basePath: '/' };
    if (pathname.startsWith(`/${loc}/`)) return { locale: loc, basePath: pathname.slice(loc.length + 1) };
  }
  return { locale: 'en', basePath: pathname || '/' };
}

/** Localized href for a base path, falling back to English when not translated. */
export function localizedHref(basePath: string, locale: LanguageCode): string {
  if (locale === 'en') return basePath;
  if (!isLocaleCurrentFor(basePath, locale)) return basePath;
  return basePath === '/' ? `/${locale}` : `/${locale}${basePath}`;
}
