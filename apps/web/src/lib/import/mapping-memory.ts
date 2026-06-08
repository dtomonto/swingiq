// ============================================================
// SwingVantage — Learned Column-Mapping Memory (Phase 3)
// ------------------------------------------------------------
// Pure logic for "don't make the user remap the same export twice".
//
//   • schemaFingerprint(headers) — a stable id for a file's shape, so a
//     later upload of the SAME export layout is recognised.
//   • mappingConfidence(mapping) — high / medium / low, which the wizard
//     uses to decide: skip mapping (high), quick review (medium), or full
//     mapping (low).
//   • SavedMapping + helpers — the record we persist per fingerprint and
//     reuse / learn from on the next import.
//
// Persistence lives in the store slice (store/slices/importMappings.ts);
// this module stays framework-free and unit-testable.
// ============================================================

import { getMissingCriticalFields, getMissingRecommendedFields } from '@swingiq/core';

/** Lowercase, drop parenthetical units, strip non-alphanumerics. */
function canon(s: string): string {
  return s.toLowerCase().replace(/\([^)]*\)/g, '').replace(/[^a-z0-9]/g, '').trim();
}

/** Small, stable, dependency-free string hash → base36. */
function hashString(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = (h * 33) ^ input.charCodeAt(i);
  }
  // >>> 0 keeps it an unsigned 32-bit int.
  return (h >>> 0).toString(36);
}

/**
 * A stable fingerprint of a file's column layout. Two exports with the
 * same set of columns (ignoring order, case, units, punctuation) produce
 * the same fingerprint — so a remembered mapping can be reused. The column
 * COUNT is included so a coincidentally-similar but differently-shaped
 * file doesn't collide.
 */
export function schemaFingerprint(headers: string[]): string {
  const canonized = headers
    .map(canon)
    .filter(Boolean)
    .sort();
  if (canonized.length === 0) return 'empty';
  return `${canonized.length}-${hashString(canonized.join('|'))}`;
}

export type MappingConfidence = 'high' | 'medium' | 'low';

const RECOMMENDED_TOTAL = 9; // keep in sync with core getMissingRecommendedFields

/**
 * Confidence that a mapping is good enough to import without forcing the
 * user through the full mapping screen.
 *   • low    — a required field (club / carry) is unmapped.
 *   • high   — all required mapped AND most (≥6/9) recommended mapped.
 *   • medium — all required mapped, fewer recommended.
 */
export function mappingConfidence(mapping: Record<string, string>): MappingConfidence {
  if (getMissingCriticalFields(mapping).length > 0) return 'low';
  const missingRecommended = getMissingRecommendedFields(mapping).length;
  const present = RECOMMENDED_TOTAL - missingRecommended;
  return present >= 6 ? 'high' : 'medium';
}

/** A remembered mapping for one file layout + source. */
export interface SavedMapping {
  /** schemaFingerprint of the file this was learned from. */
  fingerprint: string;
  /** Source id (registry) this mapping belongs to. */
  sourceId: string;
  /** universalField -> csv header. */
  mapping: Record<string, string>;
  /** The headers it was learned from (for display / debugging). */
  headers: string[];
  createdAt: string;
  updatedAt: string;
  /** How many times this mapping has been reused. */
  useCount: number;
  /** True once the user manually corrected it (raises trust). */
  corrected: boolean;
}

export function makeSavedMapping(args: {
  fingerprint: string;
  sourceId: string;
  mapping: Record<string, string>;
  headers: string[];
  corrected?: boolean;
  now?: string;
}): SavedMapping {
  const now = args.now ?? new Date().toISOString();
  return {
    fingerprint: args.fingerprint,
    sourceId: args.sourceId,
    mapping: { ...args.mapping },
    headers: [...args.headers],
    createdAt: now,
    updatedAt: now,
    useCount: 0,
    corrected: !!args.corrected,
  };
}

/**
 * Merge a new (corrected/derived) mapping into an existing saved one,
 * preserving creation time + bumping useCount. A user correction is
 * "sticky": once corrected, the record stays flagged corrected.
 */
export function mergeSavedMapping(
  prev: SavedMapping,
  next: { mapping: Record<string, string>; headers: string[]; corrected?: boolean; now?: string },
): SavedMapping {
  return {
    ...prev,
    mapping: { ...next.mapping },
    headers: [...next.headers],
    updatedAt: next.now ?? new Date().toISOString(),
    useCount: prev.useCount + 1,
    corrected: prev.corrected || !!next.corrected,
  };
}

/** True when the two mappings map the same fields to the same columns. */
export function sameMapping(a: Record<string, string>, b: Record<string, string>): boolean {
  const ak = Object.keys(a).filter((k) => a[k]);
  const bk = Object.keys(b).filter((k) => b[k]);
  if (ak.length !== bk.length) return false;
  return ak.every((k) => a[k] === b[k]);
}
