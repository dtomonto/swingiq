// ============================================================
// SwingVantage — First-Party Intelligence OS · embeddings (SERVER-ONLY)
// ------------------------------------------------------------
// Real vector similarity, keyless-first. When an embeddings provider is
// configured (OPENAI_API_KEY), semantic matching uses cosine similarity over
// text-embedding vectors; otherwise it transparently falls back to the
// deterministic lexical similarity in ./fingerprint.ts. Either way callers use
// the same `semanticSimilarityHybrid()` API.
//
// Honesty: with no key this is the same lexical Jaccard as before — clearly
// labeled. With a key it is genuine embeddings. Vectors are memoized per
// process by text hash so the small admin-curated candidate sets aren't
// re-embedded on every request. Fetch-based (no SDK), mirroring lib/ai/gateway.
// ============================================================

import { isConfigured } from '@/lib/capabilities';
import { semanticSimilarity, stableHash } from './fingerprint';

const EMBED_DIMENSIONS = 256; // small + cheap; plenty for short questions

/** Resolved at call time so a model switch (env change) is observed live. */
function embedModel(): string {
  return process.env.AI_EMBEDDINGS_MODEL || 'text-embedding-3-small';
}

/**
 * The embedding model identifier currently in use, or `null` when keyless
 * (lexical fallback). Persisted alongside vectors so `backfillEmbeddings` can
 * re-embed records that were embedded with a different model.
 */
export function currentEmbeddingModel(): string | null {
  return isEmbeddingsConfigured() ? embedModel() : null;
}

/** Injectable embedder for tests (bypasses the network). */
type Embedder = (text: string) => Promise<number[] | null>;
let testEmbedder: Embedder | null = null;
let testConfigured: boolean | null = null;

export function __setEmbedderForTests(fn: Embedder | null, configured: boolean | null = null): void {
  testEmbedder = fn;
  testConfigured = configured;
}

/** True when a real embeddings provider is available. */
export function isEmbeddingsConfigured(): boolean {
  if (testConfigured !== null) return testConfigured;
  if ((process.env.AI_EMBEDDINGS ?? 'on').toLowerCase() === 'off') return false;
  return isConfigured(process.env.OPENAI_API_KEY);
}

// ── Per-process memo so curated candidates embed once ─────────
const MEMO_LIMIT = 2000;
const memo = new Map<string, number[] | null>();

async function callOpenAIEmbeddings(text: string): Promise<number[] | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!isConfigured(apiKey)) return null;
  try {
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: embedModel(), input: text.slice(0, 8000), dimensions: EMBED_DIMENSIONS }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const vec = data?.data?.[0]?.embedding;
    return Array.isArray(vec) ? (vec as number[]) : null;
  } catch {
    return null; // best-effort: never break a lookup on an embeddings error
  }
}

/** Embed text (memoized). Returns null when keyless or on error. */
export async function embedText(text: string): Promise<number[] | null> {
  if (!isEmbeddingsConfigured()) return null;
  // Key on model too: after a model switch the same text must re-embed, not
  // return a stale vector from a previous model.
  const key = `${embedModel()}::${stableHash(text)}`;
  if (memo.has(key)) return memo.get(key) ?? null;
  const vec = testEmbedder ? await testEmbedder(text) : await callOpenAIEmbeddings(text);
  if (memo.size >= MEMO_LIMIT) memo.clear();
  memo.set(key, vec);
  return vec;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  // Clamp to [0,1] — negatives mean "unrelated" for our threshold purposes.
  return Math.max(0, Math.min(1, dot / (Math.sqrt(na) * Math.sqrt(nb))));
}

/**
 * Similarity in [0,1]. Uses embeddings (cosine) when configured and both texts
 * embed successfully; otherwise the deterministic lexical fallback.
 */
export async function semanticSimilarityHybrid(a: string, b: string): Promise<number> {
  if (!isEmbeddingsConfigured()) return semanticSimilarity(a, b);
  const [va, vb] = await Promise.all([embedText(a), embedText(b)]);
  if (!va || !vb) return semanticSimilarity(a, b);
  return cosineSimilarity(va, vb);
}

/**
 * Similarity using PERSISTED candidate vectors when available — avoids
 * re-embedding curated records on every request. Falls back to embedding the
 * candidate text (memoized), then to lexical.
 *   - reqVec: the request embedding (computed once per resolve), or null
 *   - candVec: the candidate's stored embedding, or null
 */
export async function similarityWithVectors(
  reqText: string, reqVec: number[] | null, candText: string, candVec: number[] | null,
): Promise<number> {
  if (!isEmbeddingsConfigured()) return semanticSimilarity(reqText, candText);
  const rv = reqVec ?? (await embedText(reqText));
  const cv = candVec ?? (await embedText(candText));
  if (!rv || !cv) return semanticSimilarity(reqText, candText);
  return cosineSimilarity(rv, cv);
}

/** Which similarity backend is currently active — surfaced honestly in the UI. */
export function similarityBackend(): 'embeddings' | 'lexical' {
  return isEmbeddingsConfigured() ? 'embeddings' : 'lexical';
}

export function __resetEmbeddingsMemoForTests(): void {
  memo.clear();
}
