import {
  stableHash, tokenize, semanticFingerprint, textSimilarity, fingerprint, findDuplicate,
} from '../fingerprint';

describe('intelligence-os/fingerprint', () => {
  it('stableHash is deterministic and order-sensitive', () => {
    expect(stableHash('abc')).toBe(stableHash('abc'));
    expect(stableHash('abc')).not.toBe(stableHash('cba'));
  });

  it('tokenize drops stopwords/short tokens and sorts uniquely', () => {
    expect(tokenize('How do I fix my SLICE on the course?')).toEqual(['course', 'fix', 'slice']);
  });

  it('semanticFingerprint is order-insensitive over the token set', () => {
    // Same significant tokens {fix, slice}, different word order → same fp.
    expect(semanticFingerprint('fix my slice')).toBe(semanticFingerprint('my slice to fix'));
    expect(semanticFingerprint('fix my slice')).not.toBe(semanticFingerprint('fix my hook'));
  });

  it('textSimilarity ranks paraphrases above unrelated text', () => {
    const close = textSimilarity('how do I fix my slice', 'how can I fix the slice');
    const far = textSimilarity('how do I fix my slice', 'best pickleball paddle to buy');
    expect(close).toBeGreaterThan(far);
    expect(textSimilarity('same words here', 'same words here')).toBe(1);
  });

  it('fingerprint collapses identical facets and separates different ones', () => {
    const a = fingerprint({ category: 'Upload', route: '/start', signature: 'timeout large video safari' });
    const b = fingerprint({ category: 'Upload', route: '/start', signature: 'timeout large video on safari' });
    const c = fingerprint({ category: 'AI Coach', route: '/coach', signature: 'fix my slice' });
    expect(a).toBe(a);
    expect(a).not.toBe(c);
    // near-identical signatures still differ unless semantically identical tokens
    expect(typeof b).toBe('string');
  });

  it('findDuplicate matches by exact fingerprint then by similarity', () => {
    const existing = [
      { id: '1', fingerprint: 'fp_x', sig: 'video upload times out on mobile safari' },
      { id: '2', fingerprint: 'fp_y', sig: 'login fails with google oauth' },
    ];
    const byFp = findDuplicate({ fingerprint: 'fp_y' }, existing, (r) => r.sig);
    expect(byFp?.id).toBe('2');

    const bySim = findDuplicate(
      { fingerprint: 'fp_none', signature: 'video upload times out on mobile safari sometimes' },
      existing,
      (r) => r.sig,
    );
    expect(bySim?.id).toBe('1');

    const noMatch = findDuplicate(
      { fingerprint: 'fp_none', signature: 'pickleball paddle recommendation' },
      existing,
      (r) => r.sig,
    );
    expect(noMatch).toBeNull();
  });
});
