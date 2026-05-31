// ============================================================
// SwingIQ — i18n Utility Functions
// Translation lookup with English fallback, template interpolation.
// ============================================================

import { en } from './translations/en';
import { es } from './translations/es';
import { fr } from './translations/fr';
import { de } from './translations/de';
import { zh } from './translations/zh';
import { hi } from './translations/hi';
import { ar } from './translations/ar';
import { pt } from './translations/pt';
import { bn } from './translations/bn';
import { ru } from './translations/ru';
import { ur } from './translations/ur';
import { id } from './translations/id';
import { ja } from './translations/ja';
import { ko } from './translations/ko';
import { vi } from './translations/vi';
import { it } from './translations/it';
import { tr } from './translations/tr';
import { pl } from './translations/pl';
import { nl } from './translations/nl';
import { fil } from './translations/fil';
import type { LanguageCode, PartialTranslations, Translations } from './types';

export type { LanguageCode, Translations, PartialTranslations };
export { LANGUAGE_CONFIG, RTL_LANGUAGES, ALL_LANGUAGE_CODES } from './types';

const TRANSLATION_MAP: Record<LanguageCode, PartialTranslations> = {
  en, es, fr, de, zh, hi, ar, pt, bn, ru, ur, id, ja, ko, vi, it, tr, pl, nl, fil,
};

// Deep-get a value from a nested object using dot notation key.
function deepGet(obj: Record<string, unknown>, key: string): string | undefined {
  const parts = key.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === 'string' ? current : undefined;
}

// Interpolate {key} placeholders in a translation string.
function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const val = vars[key];
    return val !== undefined ? String(val) : `{${key}}`;
  });
}

// Detect browser language on first visit.
export function detectBrowserLanguage(): LanguageCode {
  if (typeof navigator === 'undefined') return 'en';
  const browserLang = navigator.language.split('-')[0].toLowerCase();
  const supported = Object.keys(TRANSLATION_MAP) as LanguageCode[];
  // Filipino browsers may report 'tl' for Tagalog
  if (browserLang === 'tl') return 'fil';
  return supported.includes(browserLang as LanguageCode) ? (browserLang as LanguageCode) : 'en';
}

// Build a translator function for the given language code.
// Automatically falls back to English for any missing key.
// Never returns raw translation keys to the user.
export function buildTranslator(lang: LanguageCode) {
  const langDict = TRANSLATION_MAP[lang] ?? {};
  const enDict = TRANSLATION_MAP['en'] as Record<string, unknown>;
  const langObj = langDict as Record<string, unknown>;

  return function t(key: string, vars?: Record<string, string | number>): string {
    // Try the current language first
    const localized = deepGet(langObj, key);
    if (localized) return interpolate(localized, vars);

    // Fall back to English
    const fallback = deepGet(enDict, key);
    if (fallback) return interpolate(fallback, vars);

    // Last resort: return empty string (never show raw key to users)
    return '';
  };
}

// Convenience hook exported for use outside of React context (pure utility)
export function getTranslations(lang: LanguageCode): Translations {
  return en as Translations; // Always returns English complete set for type-safe access
}

export { en as defaultTranslations };
