// ============================================================
// GHIN — pure validation & labeling helpers (client-safe, keyless)
// ------------------------------------------------------------
// GHIN (Golf Handicap & Information Network) is the USGA's official
// handicap system. These helpers are PURE — no network, no secrets —
// so they run identically on the client and server and are fully unit
// tested. The live lookup (client.ts) is server-only and gated on
// credentials; everything here works with zero configuration.
// ============================================================

import type { DataSource } from '@/lib/recruiting/types';

/** Source of the stored handicap. Mirrors the profile schema enum. */
export type HandicapSource = 'self_reported' | 'ghin_verified';

/**
 * Map a handicap source to the recruiting credibility vocabulary so a
 * GHIN-verified index reads as "platform generated" (independently
 * corroborated) while a typed value stays "self-reported".
 */
export function handicapDataSource(source: HandicapSource): DataSource {
  return source === 'ghin_verified' ? 'platform_generated' : 'self_reported';
}

/** Short human label for the handicap source badge. */
export function handicapSourceLabel(source: HandicapSource): string {
  return source === 'ghin_verified' ? 'Verified via GHIN' : 'Self-reported';
}

/**
 * Normalize a raw GHIN-number input: strip spaces/dashes and surrounding
 * whitespace. Returns the digits-only string (may still be invalid).
 */
export function normalizeGhinNumber(raw: string): string {
  return raw.replace(/[\s-]/g, '').trim();
}

/**
 * A GHIN number is 6–10 digits (historically 7, modern IDs run longer).
 * We validate format only — existence is confirmed by a live lookup.
 */
export function isValidGhinNumber(raw: string): boolean {
  return /^\d{6,10}$/.test(normalizeGhinNumber(raw));
}

/**
 * Parse a Handicap Index string into a number. Accepts the USGA "plus"
 * convention where a "+" prefix denotes a better-than-scratch (negative)
 * index — e.g. "+2.4" → -2.4, "12.3" → 12.3. Returns null when unparseable
 * or out of the valid -10..54 range.
 */
export function parseHandicapIndex(raw: string | number | null | undefined): number | null {
  if (raw == null) return null;
  if (typeof raw === 'number') return clampIndex(raw);
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  // USGA "plus" handicaps are better than scratch → negative numerically.
  const isPlus = trimmed.startsWith('+');
  const body = isPlus ? trimmed.slice(1) : trimmed;
  if (!/^\d+(\.\d+)?$/.test(body)) return null;
  const n = Number(body);
  if (Number.isNaN(n)) return null;
  return clampIndex(isPlus ? -n : n);
}

function clampIndex(n: number): number | null {
  if (n < -10 || n > 54) return null;
  return n;
}

/**
 * Format a numeric Handicap Index for display using the USGA "plus"
 * convention: negative indexes render with a leading "+", everything
 * else to one decimal — e.g. -2.4 → "+2.4", 12 → "12.0".
 */
export function formatHandicapIndex(index: number | null | undefined): string {
  if (index == null || Number.isNaN(index)) return '—';
  if (index < 0) return `+${Math.abs(index).toFixed(1)}`;
  return index.toFixed(1);
}
