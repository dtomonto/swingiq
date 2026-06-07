// ============================================================
// SwingVantage — Marketing i18n dictionary accessor
//
// Source of truth = JSON files under content/marketing/i18n/*.json
// (so both the Next app AND the plain-Node upkeep CLI read the same
// strings). English is the base; any locale falls back to English for
// keys it has not translated yet. The honesty gate (see ./expose) is
// what decides whether a locale is actually shown — this module just
// resolves strings.
// ============================================================

import type { LanguageCode } from '@/lib/i18n';
import en from '@/content/marketing/i18n/en.json';
import es from '@/content/marketing/i18n/es.json';
import { MARKETING_LOCALE_CODES } from './constants';

/** The full English shape is the canonical type for every locale. */
export type MarketingDict = typeof en;

/** Non-English locales that ship a marketing dictionary file. */
export const MARKETING_LOCALES: LanguageCode[] = [...MARKETING_LOCALE_CODES];
export const MARKETING_DEFAULT_LOCALE: LanguageCode = 'en';

/** Every locale the marketing surface knows how to render (en + translated). */
export const MARKETING_ALL_LOCALES: LanguageCode[] = ['en', ...MARKETING_LOCALES];

const DICTS: Partial<Record<LanguageCode, MarketingDict>> = { en, es };

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

/** Deep-merge a (possibly partial) locale dict over the English base. */
function deepMerge<T>(base: T, override: unknown): T {
  if (override === undefined || override === null) return base;
  if (typeof base !== 'object' || base === null || Array.isArray(base)) {
    return (override as T) ?? base;
  }
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  const ov = override as Record<string, unknown>;
  for (const key of Object.keys(out)) {
    if (key in ov) out[key] = deepMerge(out[key], ov[key]);
  }
  return out as T;
}

/**
 * Fully-typed dictionary for a locale, with English fallback for any missing
 * keys. Components read `dict.nav.howItWorks` etc. with type safety.
 */
export function getMarketingDict(locale: LanguageCode): MarketingDict {
  if (locale === 'en') return en;
  const loc = DICTS[locale];
  return loc ? deepMerge(en, loc) : en;
}

/** Flatten a nested dict into dot-path → string (for hashing / drift). */
export function flatten(obj: Json, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    for (const [k, v] of Object.entries(obj)) {
      const key = prefix ? `${prefix}.${k}` : k;
      if (typeof v === 'string') out[key] = v;
      else if (v && typeof v === 'object') Object.assign(out, flatten(v as Json, key));
    }
  }
  return out;
}

/** Flattened English source strings (the drift baseline). */
export const EN_FLAT: Record<string, string> = flatten(en as Json);

/** Flattened strings actually present in a locale's file (no fallback). */
export function flatDict(locale: LanguageCode): Record<string, string> {
  const d = DICTS[locale];
  return d ? flatten(d as Json) : {};
}

/**
 * Flat translator with English fallback — convenient for key-dense pages.
 * `t('features.groups.diagnosis.f1Name')` returns the locale string, falling
 * back to English, then '' (so a missing/omitted key renders as empty, never
 * a raw key). Pair with `{detail && ...}` to hide intentionally-absent fields.
 */
export function getMarketingT(locale: LanguageCode): (key: string) => string {
  const loc = flatDict(locale);
  return (key: string) => loc[key] ?? EN_FLAT[key] ?? '';
}
