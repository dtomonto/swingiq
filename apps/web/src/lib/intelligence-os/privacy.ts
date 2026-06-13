// ============================================================
// First-Party Intelligence OS — privacy & safety helpers
// ------------------------------------------------------------
// Reusable knowledge must never carry PII or be a personalized answer reused
// globally. These helpers anonymize identifiers and classify sensitivity so
// the router/promotion flow can gate auto-serve and require human review.
// ============================================================

import { stableHash } from './fingerprint';

export type Sensitivity = 'general' | 'youth' | 'medical' | 'legal' | 'privacy' | 'personalized';

/** One-way hash of a user id so events can be correlated without storing PII. */
export function hashUserId(userId: string | null | undefined): string | null {
  if (!userId) return null;
  // Salt keeps hashes non-trivially reversible across an exported dataset.
  return `u_${stableHash(`sviq:${userId}`)}`;
}

const PII_PATTERNS: Array<[RegExp, string]> = [
  [/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi, '[email]'],
  [/\b\+?\d[\d\s().-]{7,}\d\b/g, '[phone]'],
  [/\b\d{1,5}\s+[a-z0-9.\s]+\b(?:street|st|avenue|ave|road|rd|lane|ln|drive|dr)\b/gi, '[address]'],
];

/** Strip obvious PII from text before it enters the reusable knowledge layer. */
export function redactPii(text: string): string {
  let out = text || '';
  for (const [pattern, replacement] of PII_PATTERNS) out = out.replace(pattern, replacement);
  return out;
}

const SENSITIVE_KEYWORDS: Array<[Sensitivity, RegExp]> = [
  ['medical', /\b(injury|injured|pain|hurt|medical|doctor|physio|surgery|concussion|rehab)\b/i],
  ['youth', /\b(kid|child|children|junior|youth|minor|my son|my daughter|teenager)\b/i],
  ['legal', /\b(legal|lawsuit|liability|gdpr|contract|terms|copyright)\b/i],
  ['privacy', /\b(privacy|personal data|delete my|my account data|gdpr|ccpa)\b/i],
];

/**
 * Classify a request/answer's sensitivity. `personalizedHint` lets the caller
 * mark answers that reference a specific user's data — those must never be
 * reused globally.
 */
export function classifySensitivity(text: string, personalizedHint = false): Sensitivity {
  if (personalizedHint) return 'personalized';
  for (const [level, pattern] of SENSITIVE_KEYWORDS) {
    if (pattern.test(text)) return level;
  }
  return 'general';
}

/** Sensitive content can be retained but never auto-served without review. */
export function canAutoServe(sensitivity: Sensitivity): boolean {
  return sensitivity === 'general';
}
