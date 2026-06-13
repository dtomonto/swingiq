// ============================================================
// First-Party Intelligence OS — fingerprinting & deduplication
// ------------------------------------------------------------
// Deterministic, dependency-free fingerprints used to dedupe AI events,
// tasks, reports, knowledge and patterns so we never store 100 copies of
// the same issue. Two flavours:
//   • fingerprint()        — exact-ish key from structured facets
//   • semanticFingerprint() — order-insensitive token signature for "is this
//                             basically the same question/answer?"
// Pure functions only — unit-testable without any I/O.
// ============================================================

/** Tiny stable 32-bit hash (FNV-1a) → base36. No crypto needed for keys. */
export function stableHash(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  // >>> 0 keeps it unsigned.
  return (h >>> 0).toString(36);
}

const STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'to', 'of', 'in', 'on', 'for', 'and', 'or',
  'my', 'me', 'i', 'you', 'it', 'this', 'that', 'with', 'how', 'do', 'does', 'why', 'what',
  'can', 'should', 'when', 'be', 'get', 'got', 'have', 'has', 'at', 'as', 'by', 'from',
]);

/** Normalize free text → significant, deduped, sorted tokens. */
export function tokenize(text: string): string[] {
  return Array.from(
    new Set(
      (text || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((t) => t.length > 2 && !STOPWORDS.has(t)),
    ),
  ).sort();
}

/** Order-insensitive signature of the meaningful tokens in a string. */
export function semanticFingerprint(text: string): string {
  const toks = tokenize(text);
  return `sem_${stableHash(toks.join('|'))}`;
}

/** Jaccard similarity (0..1) over significant tokens. */
export function textSimilarity(a: string, b: string): number {
  const sa = new Set(tokenize(a));
  const sb = new Set(tokenize(b));
  if (sa.size === 0 && sb.size === 0) return 1;
  if (sa.size === 0 || sb.size === 0) return 0;
  let inter = 0;
  for (const t of sa) if (sb.has(t)) inter += 1;
  return inter / (sa.size + sb.size - inter);
}

export interface FingerprintFacets {
  category?: string | null;
  route?: string | null;
  component?: string | null;
  source?: string | null;
  severity?: string | null;
  sport?: string | null;
  /** Error signature / stack-trace head / title — the discriminating text. */
  signature?: string | null;
}

/**
 * Structured fingerprint for tasks/reports/events. Combines stable facets with
 * a semantic signature of the discriminating text so near-identical issues
 * collapse to one key while materially-different ones stay distinct.
 */
export function fingerprint(facets: FingerprintFacets): string {
  const parts = [
    facets.category, facets.route, facets.component, facets.source, facets.severity, facets.sport,
  ]
    .map((p) => (p ?? '').toString().toLowerCase().trim())
    .join('::');
  const sig = facets.signature ? semanticFingerprint(facets.signature) : '';
  return `fp_${stableHash(`${parts}::${sig}`)}`;
}

/**
 * Find an existing record that the candidate is a duplicate of. Matches on
 * exact fingerprint first, then falls back to high semantic similarity of the
 * discriminating text (default 0.82). Returns the match or null.
 */
export function findDuplicate<T extends { fingerprint: string }>(
  candidate: { fingerprint: string; signature?: string | null },
  existing: T[],
  signatureOf: (r: T) => string,
  threshold = 0.82,
): T | null {
  const exact = existing.find((r) => r.fingerprint === candidate.fingerprint);
  if (exact) return exact;
  if (!candidate.signature) return null;
  let best: T | null = null;
  let bestScore = threshold;
  for (const r of existing) {
    const score = textSimilarity(candidate.signature, signatureOf(r));
    if (score >= bestScore) {
      best = r;
      bestScore = score;
    }
  }
  return best;
}
