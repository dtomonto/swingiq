'use client';

// Sets <html lang/dir> for localized marketing pages. The root layout renders
// <html lang="en"> statically (it can't see the route locale), so we correct it
// on the client for /[lang] pages — mirroring how LanguageContext does it for
// the logged-in app. The SEO signal that matters (hreflang + canonical) is
// already server-rendered via buildMetadata.

import { useEffect } from 'react';
import { LANGUAGE_CONFIG, RTL_LANGUAGES } from '@/lib/i18n';
import type { LanguageCode } from '@/lib/i18n';

export function LocaleHtmlSetter({ locale }: { locale: LanguageCode }) {
  useEffect(() => {
    const el = document.documentElement;
    const prevLang = el.lang;
    const prevDir = el.dir;
    el.lang = LANGUAGE_CONFIG[locale]?.locale?.split('-')[0] ?? locale;
    el.dir = RTL_LANGUAGES.has(locale) ? 'rtl' : 'ltr';
    return () => {
      // Restore on unmount so navigating back to an English page resets it.
      el.lang = prevLang || 'en';
      el.dir = prevDir || 'ltr';
    };
  }, [locale]);
  return null;
}
