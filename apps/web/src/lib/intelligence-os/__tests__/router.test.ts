import {
  normalizeIntelligenceRequest, findExactCacheMatch, findCanonicalAnswer,
  retrieveKnowledge, scoreConfidence, shouldUseThirdPartyAI, decide, estimateCost,
  type ResolveDeps,
} from '../router';
import { semanticFingerprint } from '../fingerprint';
import type { AnswerCache, CanonicalAnswer, KnowledgeItem } from '../types';

const SETTINGS = { autoServeThreshold: 0.85, semanticMatchThreshold: 0.8 };

function canonical(over: Partial<CanonicalAnswer> = {}): CanonicalAnswer {
  return {
    id: 'ca1', dataSource: 'demo', createdAt: 't', updatedAt: 't',
    canonicalQuestion: 'How do I fix my slice?', canonicalAnswer: 'Swing in-to-out and square the face.',
    answerFormat: 'Coaching Response', topic: 'slice', sport: 'golf', audience: 'athlete',
    triggerPhrases: ['fix my slice', 'stop slicing'], semanticFingerprint: semanticFingerprint('how do i fix my slice'),
    confidenceScore: 0.9, allowedAutoServe: true, requiresAdminReview: false, sourceKnowledgeIds: ['kn1'],
    regressionTestCases: [], lastValidatedAt: 't', usageCount: 0, aiCallsAvoided: 0, tokensAvoided: 0,
    estimatedCostSaved: 0, sensitivity: 'general', ...over,
  };
}

describe('intelligence-os/router', () => {
  it('normalizes + redacts PII and classifies sensitivity', () => {
    const n = normalizeIntelligenceRequest({
      query: 'My kid is injured, email me at a@b.com', feature: 'coach', source: 'AI Coach',
    });
    expect(n.redactedQuery).toContain('[email]');
    // medical takes precedence in the keyword list
    expect(['medical', 'youth']).toContain(n.sensitivity);
  });

  it('exact cache match respects expiry and invalidation', () => {
    const fp = semanticFingerprint('how do i fix my slice');
    const fresh: AnswerCache = {
      id: 'c1', dataSource: 'demo', createdAt: 't', updatedAt: 't', cacheKey: `${fp}:golf`,
      semanticFingerprint: fp, requestSummary: 's', response: 'r', responseType: 'Coaching Response',
      confidenceScore: 0.9, source: 'Canonical Answer', providerOriginallyUsed: null, modelOriginallyUsed: null,
      tokenCostOriginal: null, usageCount: 0, lastHitAt: null, expiresAt: '2999-01-01T00:00:00.000Z',
      invalidationReason: null, sensitivity: 'general',
    };
    const req = normalizeIntelligenceRequest({ query: 'how do I fix my slice', feature: 'coach', source: 'AI Coach', sport: 'golf' });
    expect(findExactCacheMatch(req, [fresh])?.id).toBe('c1');
    expect(findExactCacheMatch(req, [{ ...fresh, expiresAt: '2000-01-01T00:00:00.000Z' }])).toBeNull();
    expect(findExactCacheMatch(req, [{ ...fresh, invalidationReason: 'stale' }])).toBeNull();
  });

  it('canonical answer matches on trigger phrase + confidence gate', () => {
    const req = normalizeIntelligenceRequest({ query: 'help me fix my slice please', feature: 'coach', source: 'AI Coach', sport: 'golf' });
    expect(findCanonicalAnswer(req, [canonical()], SETTINGS)?.id).toBe('ca1');
    // below-threshold confidence is not served
    expect(findCanonicalAnswer(req, [canonical({ confidenceScore: 0.5 })], SETTINGS)).toBeNull();
    // not allowed to auto-serve
    expect(findCanonicalAnswer(req, [canonical({ allowedAutoServe: false })], SETTINGS)).toBeNull();
  });

  it('does not auto-serve sensitive canonical answers', () => {
    const req = normalizeIntelligenceRequest({ query: 'fix my slice', feature: 'coach', source: 'AI Coach', sport: 'golf' });
    expect(findCanonicalAnswer(req, [canonical({ sensitivity: 'medical' })], SETTINGS)).toBeNull();
  });

  it('scoreConfidence + shouldUseThirdPartyAI escalate only when low', () => {
    expect(scoreConfidence({ cacheHit: true })).toBe(0.95);
    expect(shouldUseThirdPartyAI(0.95, SETTINGS)).toBe(false);
    expect(shouldUseThirdPartyAI(0.4, SETTINGS)).toBe(true);
  });

  it('estimateCost is monotonic in tokens', () => {
    expect(estimateCost(1000, 1000)).toBeGreaterThan(estimateCost(100, 100));
  });

  const knowledge: KnowledgeItem[] = [{
    id: 'kn1', dataSource: 'demo', createdAt: 't', updatedAt: 't', title: 'Slice fix',
    knowledgeType: 'Coaching Answer', sport: 'golf', topic: 'slice', userIntent: 'fix slice',
    canonicalQuestion: 'How do I fix my slice?', canonicalAnswer: 'Swing in-to-out.', shortAnswer: 'in-to-out',
    structuredSteps: [], evidenceSummary: '', sourceEventIds: [], sourceReportIds: [], sourceTaskIds: [],
    confidenceScore: 0.9, validationStatus: 'Approved', approvedByAdmin: true, usageCount: 5, successCount: 5,
    failureCount: 0, lastUsedAt: 't', fingerprint: 'fp', tags: ['slice'], archived: false,
  }];

  function deps(over: Partial<ResolveDeps> = {}): ResolveDeps {
    return { caches: [], canonical: [], knowledge: [], settings: SETTINGS, ...over };
  }

  it('decide() prefers cache → canonical → retrieval → third-party', async () => {
    const req = normalizeIntelligenceRequest({ query: 'how do I fix my slice', feature: 'coach', source: 'AI Coach', sport: 'golf' });

    const canon = await decide(req, deps({ canonical: [canonical()] }));
    expect(canon.servedBy).toBe('Canonical Answer');
    expect(canon.thirdPartyAiUsed).toBe(false);

    const retr = await decide(req, deps({ knowledge }));
    expect(retr.servedBy).toBe('Retrieval');

    const novel = normalizeIntelligenceRequest({ query: 'what padel paddle suits a beginner with tennis elbow concerns generally', feature: 'coach', source: 'AI Coach' });
    const needsAi = await decide(novel, deps());
    expect(needsAi.needsThirdParty).toBe(true);
    expect(needsAi.response).toBeNull();
  });

  it('decide() uses the third-party adapter when supplied and flags a learning candidate', async () => {
    const novel = normalizeIntelligenceRequest({ query: 'totally novel unique inquiry about xyzzy widget', feature: 'coach', source: 'AI Coach' });
    const d = await decide(novel, deps({
      callThirdParty: async () => ({ response: 'answer', provider: 'openai', model: 'gpt-4o', inputTokens: 800, outputTokens: 400 }),
    }));
    expect(d.servedBy).toBe('Third-Party AI');
    expect(d.thirdPartyAiUsed).toBe(true);
    expect(d.shouldCreateLearningCandidate).toBe(true);
    expect(d.estimatedCost).toBeGreaterThan(0);
  });

  it('retrieveKnowledge ranks relevant items first', () => {
    const req = normalizeIntelligenceRequest({ query: 'slice fix help', feature: 'coach', source: 'AI Coach' });
    const got = retrieveKnowledge(req, knowledge);
    expect(got[0]?.item.id).toBe('kn1');
  });
});
