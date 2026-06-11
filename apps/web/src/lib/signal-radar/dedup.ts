// ============================================================
// SignalRadar OS — deduplication (PURE)
// ------------------------------------------------------------
// Duplicate-safe ingestion: a signal is a duplicate when its fingerprint
// already exists (in the stored set or earlier in the same batch).
// Fingerprints come from normalize.fingerprintOf (URL-first, text-second).
// ============================================================

import type { NormalizedSignal } from './types';
import { fingerprintOf } from './normalize';

export function fingerprintFor(signal: NormalizedSignal): string {
  return fingerprintOf({ sourceUrl: signal.sourceUrl, title: signal.title, cleanText: signal.cleanText });
}

export interface DedupeResult {
  unique: (NormalizedSignal & { fingerprint: string })[];
  duplicates: (NormalizedSignal & { fingerprint: string })[];
}

/**
 * Split a batch of normalized signals into unique vs duplicate, given the
 * set of fingerprints already known. Pure — caller persists the result.
 */
export function dedupe(batch: NormalizedSignal[], knownFingerprints: Iterable<string> = []): DedupeResult {
  const seen = new Set<string>(knownFingerprints);
  const unique: (NormalizedSignal & { fingerprint: string })[] = [];
  const duplicates: (NormalizedSignal & { fingerprint: string })[] = [];

  for (const sig of batch) {
    const fingerprint = fingerprintFor(sig);
    const tagged = { ...sig, fingerprint };
    if (seen.has(fingerprint)) {
      duplicates.push(tagged);
    } else {
      seen.add(fingerprint);
      unique.push(tagged);
    }
  }
  return { unique, duplicates };
}
