import {
  cosineSimilarity, semanticSimilarityHybrid, isEmbeddingsConfigured, similarityBackend,
  __setEmbedderForTests, __resetEmbeddingsMemoForTests,
} from '../embeddings';

afterEach(() => { __setEmbedderForTests(null, null); __resetEmbeddingsMemoForTests(); });

describe('intelligence-os/embeddings', () => {
  it('cosineSimilarity: identical vectors = 1, orthogonal = 0', () => {
    expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBeCloseTo(1);
    expect(cosineSimilarity([1, 0], [0, 1])).toBe(0);
    expect(cosineSimilarity([], [])).toBe(0);
    expect(cosineSimilarity([1, 2], [1])).toBe(0); // mismatched dims
  });

  it('falls back to lexical similarity when no embeddings provider is configured', async () => {
    __setEmbedderForTests(null, false);
    expect(isEmbeddingsConfigured()).toBe(false);
    expect(similarityBackend()).toBe('lexical');
    // lexical: same words → 1
    expect(await semanticSimilarityHybrid('fix the golf slice', 'fix the golf slice')).toBe(1);
  });

  it('uses cosine over embeddings when a provider is configured', async () => {
    // Mock embedder: map known phrases to vectors; "slice" topics close, tennis far.
    const vectors: Record<string, number[]> = {
      'how to fix a golf slice': [1, 0, 0],
      'fix my golf slice': [0.96, 0.28, 0],
      'best tennis serve grip': [0, 0, 1],
    };
    __setEmbedderForTests(async (t) => vectors[t] ?? [0.5, 0.5, 0.5], true);
    expect(similarityBackend()).toBe('embeddings');

    const close = await semanticSimilarityHybrid('how to fix a golf slice', 'fix my golf slice');
    const far = await semanticSimilarityHybrid('how to fix a golf slice', 'best tennis serve grip');
    expect(close).toBeGreaterThan(0.9);
    expect(far).toBeLessThan(0.2);
    expect(close).toBeGreaterThan(far);
  });

  it('falls back to lexical when the embedder returns null for a text', async () => {
    __setEmbedderForTests(async () => null, true);
    // null vectors → lexical path; identical text → 1
    expect(await semanticSimilarityHybrid('same words', 'same words')).toBe(1);
  });
});
