// ============================================================
// SwingVantage — i18n upkeep: manifest types + load helpers
//
// The manifest is the persistent record of "what the English source
// looked like when each locale's translation was last confirmed."
// It is a committed, generated file. The exposure gate compares a
// locale's recorded srcHash against the LIVE English hash, so drift
// is caught the moment English changes — even before the scheduled
// upkeep task re-runs.
// ============================================================

import type { LanguageCode } from '@/lib/i18n';

export type LocaleStatus = 'current' | 'stale' | 'missing';

/** Per (key, locale): the English hash this translation was blessed against. */
export interface KeyLocaleRecord {
  /** hashString() of the English source at the time this locale was confirmed. */
  srcHash: string;
  /** ISO timestamp of the last confirmation/translation. */
  translatedAt: string;
  /** How the translation was produced — for auditability. */
  source: 'human' | 'ai';
}

export interface ManifestKey {
  locales: Partial<Record<LanguageCode, KeyLocaleRecord>>;
}

export interface TranslationManifest {
  version: number;
  generatedAt: string;
  /** Keyed by dot-path translation key, e.g. 'marketingNav.howItWorks'. */
  keys: Record<string, ManifestKey>;
}

export const MANIFEST_VERSION = 1;

export function emptyManifest(): TranslationManifest {
  return { version: MANIFEST_VERSION, generatedAt: new Date(0).toISOString(), keys: {} };
}

/** Coerce unknown JSON into a well-formed manifest (tolerant of older/missing files). */
export function normalizeManifest(raw: unknown): TranslationManifest {
  if (!raw || typeof raw !== 'object') return emptyManifest();
  const obj = raw as Partial<TranslationManifest>;
  return {
    version: typeof obj.version === 'number' ? obj.version : MANIFEST_VERSION,
    generatedAt: typeof obj.generatedAt === 'string' ? obj.generatedAt : new Date(0).toISOString(),
    keys: obj.keys && typeof obj.keys === 'object' ? obj.keys : {},
  };
}
