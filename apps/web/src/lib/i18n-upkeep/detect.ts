// ============================================================
// SwingVantage — i18n upkeep: drift detection + exposure logic
//
// Pure functions (no I/O) so they're trivially unit-testable and
// usable in any runtime. `statusFor` is the single rule that decides
// whether a translation is current/stale/missing; everything else
// (the CLI report, the route exposure gate) builds on it.
// ============================================================

import type { LanguageCode } from '@/lib/i18n';
import { hashString } from './hash';
import type { LocaleStatus, TranslationManifest } from './manifest';

export interface DriftInput {
  manifest: TranslationManifest;
  /** key -> current English source string. */
  english: Record<string, string>;
  /** locale -> key -> current translated string. */
  translations: Partial<Record<LanguageCode, Record<string, string>>>;
}

export interface KeyStatus {
  key: string;
  locale: LanguageCode;
  status: LocaleStatus;
}

export interface DriftReport {
  byKey: KeyStatus[];
  currentCount: number;
  staleCount: number;
  missingCount: number;
}

/**
 * The single source-of-truth rule:
 *   missing — no (non-empty) translation exists for this key/locale.
 *   stale   — a translation exists but was never confirmed, or the English
 *             has changed since it was confirmed (recorded srcHash mismatch).
 *   current — a translation exists and matches the English it was confirmed against.
 *
 * An untracked translation is deliberately treated as `stale`, not `current`:
 * if we don't know what English it was written for, we must not expose it.
 */
export function statusFor(
  key: string,
  locale: LanguageCode,
  input: DriftInput,
): LocaleStatus {
  const en = input.english[key];
  if (en === undefined) return 'missing'; // source key gone — nothing to show
  const translated = input.translations[locale]?.[key];
  if (translated === undefined || translated === '') return 'missing';

  const record = input.manifest.keys[key]?.locales[locale];
  if (!record) return 'stale';
  return record.srcHash === hashString(en) ? 'current' : 'stale';
}

/** Full drift report across every English key × requested locale. */
export function detectDrift(input: DriftInput, locales: LanguageCode[]): DriftReport {
  const byKey: KeyStatus[] = [];
  let currentCount = 0;
  let staleCount = 0;
  let missingCount = 0;

  for (const key of Object.keys(input.english)) {
    for (const locale of locales) {
      const status = statusFor(key, locale, input);
      byKey.push({ key, locale, status });
      if (status === 'current') currentCount++;
      else if (status === 'stale') staleCount++;
      else missingCount++;
    }
  }

  return { byKey, currentCount, staleCount, missingCount };
}

/**
 * Exposure gate: given the set of translation keys a page depends on, return
 * the locales in which EVERY key is `current`. These are the only locales for
 * which we build a localized route, emit hreflang, list in the sitemap, or
 * offer in the language switcher — so stale/partial translations are never
 * shown or indexed.
 */
export function currentLocalesForKeys(
  pageKeys: string[],
  input: DriftInput,
  locales: LanguageCode[],
): LanguageCode[] {
  return locales.filter((locale) =>
    pageKeys.length > 0 && pageKeys.every((key) => statusFor(key, locale, input) === 'current'),
  );
}
