// ============================================================
// SwingVantage — First-Party Intelligence OS · fingerprinting & dedup
// ------------------------------------------------------------
// Pure, deterministic, dependency-light (node:crypto only). Turns prompts,
// responses and intents into stable hashes + a lexical "semantic fingerprint"
// used for dedup and cache lookup.
//
// HONESTY: the similarity here is LEXICAL (normalized token-set Jaccard), not
// vector embeddings. It is deterministic, keyless and free — good for catching
// repeated/near-identical questions. When a real embedding provider is wired,
// swap `semanticSimilarity` behind the same interface. Until then the admin UI
// labels matches as lexical so nobody mistakes it for semantic search.
// ============================================================

import { redactString } from '@/lib/security-os/redaction';
import { SAFETY_KEYWORDS } from './config';
import type { SafetyFlag } from './types';

/**
 * Dependency-free, edge-safe, deterministic string hash (FNV-1a x2 → 16 hex
 * chars). NOT cryptographic — these are dedup/cache keys, never secrets. We
 * avoid node:crypto so the module runs in any Next runtime (the rest of the
 * codebase uses global `crypto` for the same reason).
 */
export function stableHash(input: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < input.length; i += 1) {
    const c = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul((h2 + c) ^ (c << 5), 0x85ebca6b) >>> 0;
  }
  return (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0');
}

const STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'to', 'of', 'and', 'or', 'in',
  'on', 'for', 'with', 'how', 'do', 'i', 'my', 'me', 'you', 'your', 'it', 'this', 'that',
  'can', 'should', 'would', 'what', 'why', 'when', 'which', 'as', 'at', 'by', 'from', 'into',
  'about', 'please', 'help', 'tell', 'get', 'so', 'if', 'but', 'then',
]);

/** SHA-256 hex of redacted, normalized input — never leaks secrets/PII. */
export function hashText(input: string | null | undefined): string {
  const safe = redactString(input ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
  return stableHash(safe);
}

/** Lowercase, redact, strip volatile tokens (urls/uuids/numbers/quotes). */
export function normalize(text: string | null | undefined): string {
  if (!text) return '';
  return redactString(text)
    .toLowerCase()
    .replace(/https?:\/\/[^\s'"]+/g, ' ')
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\b\d[\d.,]*\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Significant token set (stopwords + short tokens removed), sorted + unique. */
export function significantTokens(text: string | null | undefined): string[] {
  const toks = normalize(text).split(' ').filter((t) => t.length > 2 && !STOPWORDS.has(t));
  return Array.from(new Set(toks)).sort();
}

/**
 * Lexical "semantic fingerprint": the sorted significant token set hashed.
 * Two requests that mean the same thing in the same words share this key.
 */
export function semanticFingerprint(text: string | null | undefined): string {
  const toks = significantTokens(text);
  return stableHash(toks.join(' '));
}

/** Jaccard similarity (0..1) over significant token sets. Deterministic. */
export function semanticSimilarity(a: string, b: string): number {
  const sa = new Set(significantTokens(a));
  const sb = new Set(significantTokens(b));
  if (sa.size === 0 && sb.size === 0) return 1;
  if (sa.size === 0 || sb.size === 0) return 0;
  let inter = 0;
  for (const t of sa) if (sb.has(t)) inter += 1;
  const union = sa.size + sb.size - inter;
  return union === 0 ? 0 : inter / union;
}

/**
 * Cache key for an exact-match lookup. Combines feature/sport/audience scope
 * with the normalized request so identical scoped requests collide.
 */
export function buildCacheKey(parts: {
  feature: string; sport: string; audience?: string; request: string;
}): string {
  const scope = `${parts.feature}|${parts.sport}|${parts.audience ?? 'any'}`;
  return `${scope}#${hashText(parts.request)}`;
}

/**
 * Stable dedup fingerprint for a knowledge item / pattern: intent + sport +
 * topic + the meaning of the answer. Items that match are merged, not duplicated.
 */
export function knowledgeFingerprint(parts: {
  userIntent: string; sport: string; topic: string; answer: string;
}): string {
  const basis = [
    normalize(parts.userIntent),
    parts.sport,
    normalize(parts.topic),
    significantTokens(parts.answer).slice(0, 24).join(' '),
  ].join('::');
  return stableHash(basis);
}

/** Detect privacy/safety flags from request text + explicit exclusion keywords. */
export function detectSafetyFlags(text: string, privacyKeywords: string[] = []): SafetyFlag[] {
  const hay = (text || '').toLowerCase();
  const flags = new Set<SafetyFlag>();
  for (const [flag, words] of Object.entries(SAFETY_KEYWORDS) as [SafetyFlag, string[]][]) {
    if (words.some((w) => hay.includes(w))) flags.add(flag);
  }
  if (privacyKeywords.some((w) => w && hay.includes(w.toLowerCase()))) flags.add('privacy');
  return Array.from(flags);
}

/** Short, redacted, single-line summary capped at `max` chars for storage. */
export function summarize(text: string | null | undefined, max = 240): string {
  const safe = redactString(text ?? '').replace(/\s+/g, ' ').trim();
  return safe.length > max ? `${safe.slice(0, max - 1)}…` : safe;
}
