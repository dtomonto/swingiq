import {
  stableHash, hashText, semanticFingerprint, semanticSimilarity, significantTokens,
  buildCacheKey, knowledgeFingerprint, detectSafetyFlags, summarize,
} from '../fingerprint';

describe('intelligence-os/fingerprint', () => {
  it('stableHash is deterministic and hex', () => {
    expect(stableHash('hello world')).toBe(stableHash('hello world'));
    expect(stableHash('a')).not.toBe(stableHash('b'));
    expect(stableHash('x')).toMatch(/^[0-9a-f]{16}$/);
  });

  it('hashText ignores case/whitespace volatility', () => {
    expect(hashText('How do I fix my slice?')).toBe(hashText('how do i fix my slice?  '));
  });

  it('semanticFingerprint matches reordered same significant tokens', () => {
    const a = semanticFingerprint('fix the slice driver swing');
    const b = semanticFingerprint('driver swing slice fix the');
    expect(a).toBe(b);
  });

  it('significantTokens drops stopwords and short tokens', () => {
    expect(significantTokens('How do I fix my slice')).toEqual(['fix', 'slice']);
  });

  it('semanticSimilarity ranks closer questions higher', () => {
    const close = semanticSimilarity('how to fix a golf slice', 'fix my golf slice');
    const far = semanticSimilarity('how to fix a golf slice', 'best tennis serve grip');
    expect(close).toBeGreaterThan(far);
    expect(semanticSimilarity('same words here', 'same words here')).toBe(1);
  });

  it('buildCacheKey is scoped by feature/sport and collides on identical requests', () => {
    const k1 = buildCacheKey({ feature: 'ai-coach', sport: 'golf', request: 'fix slice' });
    const k2 = buildCacheKey({ feature: 'ai-coach', sport: 'golf', request: 'fix slice' });
    const k3 = buildCacheKey({ feature: 'ai-coach', sport: 'tennis', request: 'fix slice' });
    expect(k1).toBe(k2);
    expect(k1).not.toBe(k3);
  });

  it('knowledgeFingerprint dedupes equivalent items', () => {
    const a = knowledgeFingerprint({ userIntent: 'fix slice', sport: 'golf', topic: 'driver', answer: 'strengthen grip and close clubface' });
    const b = knowledgeFingerprint({ userIntent: 'fix slice', sport: 'golf', topic: 'driver', answer: 'close clubface and strengthen grip' });
    expect(a).toBe(b);
  });

  it('detectSafetyFlags flags youth/medical/privacy content', () => {
    expect(detectSafetyFlags('my child has an injury')).toEqual(expect.arrayContaining(['youth', 'medical']));
    expect(detectSafetyFlags('here is my email address')).toContain('privacy');
    expect(detectSafetyFlags('how to improve tempo')).toEqual([]);
  });

  it('summarize caps length with an ellipsis', () => {
    const long = 'how to fix my golf slice and improve driver consistency '.repeat(20);
    expect(summarize(long, 50)).toHaveLength(50);
    expect(summarize(long, 50).endsWith('…')).toBe(true);
    expect(summarize('short')).toBe('short');
  });
});
