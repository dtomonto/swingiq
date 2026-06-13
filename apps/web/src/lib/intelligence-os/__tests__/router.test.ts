import {
  resolveWithFirstPartyIntelligence, normalizeIntelligenceRequest, upsertCacheEntry,
  type IntelligenceRequestInput, type ThirdPartyResult,
} from '../router';
import {
  canonicalRepo, knowledgeRepo, getSettings, saveSettings, __resetIntelligenceStoreForTests,
} from '../store';
import type { CanonicalAnswer } from '../types';

const baseReq: IntelligenceRequestInput = {
  sourceSystem: 'ai-coach', feature: 'ai-coach', sport: 'golf', request: 'How do I fix my golf slice with a driver?',
};

beforeEach(() => { __resetIntelligenceStoreForTests(); });

function thirdParty(text: string, confidence = 0.8): ThirdPartyResult {
  return { text, provider: 'anthropic', model: 'claude-sonnet-4-6', inputTokens: 300, outputTokens: 200, confidence };
}

describe('intelligence-os/router', () => {
  it('flags needsThirdParty when nothing is cached and no provider is supplied', async () => {
    const d = await resolveWithFirstPartyIntelligence(baseReq);
    expect(d.servedBy).toBe('none');
    expect(d.needsThirdParty).toBe(true);
    expect(d.thirdPartyAiUsed).toBe(false);
    expect(d.response).toBeNull();
  });

  it('calls third-party, logs activity, and creates a knowledge candidate', async () => {
    const d = await resolveWithFirstPartyIntelligence(baseReq, {
      callThirdParty: async () => thirdParty('Strengthen your grip and square the clubface at impact.'),
    });
    expect(d.servedBy).toBe('third-party-ai');
    expect(d.thirdPartyAiUsed).toBe(true);
    expect(d.providerUsed).toBe('anthropic');
    expect(d.eventId).toBeTruthy();
    expect(d.shouldCreateLearningCandidate).toBe(true);

    const knowledge = await knowledgeRepo.list();
    expect(knowledge).toHaveLength(1);
    expect(knowledge[0].validationStatus).toBe('candidate');
  });

  it('dedupes repeated AI answers into one knowledge item (occurrence bump)', async () => {
    const opts = { callThirdParty: async () => thirdParty('Strengthen your grip and square the clubface.') };
    await resolveWithFirstPartyIntelligence(baseReq, opts);
    await resolveWithFirstPartyIntelligence(baseReq, opts);
    const knowledge = await knowledgeRepo.list();
    expect(knowledge).toHaveLength(1);
    expect(knowledge[0].usageCount).toBeGreaterThanOrEqual(2);
  });

  it('serves an exact cache hit and records token savings', async () => {
    const settings = await getSettings();
    const norm = normalizeIntelligenceRequest(baseReq, settings);
    await upsertCacheEntry({
      req: norm, response: 'Cached: strengthen grip.', responseType: 'coaching-response',
      provider: 'anthropic', model: 'claude-sonnet-4-6', tokens: 500, costCents: 2, confidence: 0.9,
    });
    const d = await resolveWithFirstPartyIntelligence(baseReq);
    expect(d.servedBy).toBe('exact-cache');
    expect(d.cacheHit).toBe(true);
    expect(d.response).toContain('Cached');
    expect(d.savingsId).toBeTruthy();
    expect(d.thirdPartyAiUsed).toBe(false);
  });

  it('auto-serves an approved canonical answer above threshold', async () => {
    const now = new Date().toISOString();
    const canon: CanonicalAnswer = {
      id: 'canon-1', canonicalQuestion: 'How do I fix my golf slice with a driver?',
      canonicalAnswer: 'Strengthen grip; rotate through impact.', answerFormat: 'coaching-response',
      topic: 'driver', sport: 'golf', audience: 'athlete', triggerPhrases: ['fix my golf slice'],
      semanticFingerprint: 'x', confidenceScore: 0.95, allowedAutoServe: true, requiresAdminReview: false,
      safetyFlags: [], sourceKnowledgeIds: [], regressionTestCases: [], validationStatus: 'approved',
      approvedByAdmin: 'admin@x.com', lastValidatedAt: now, usageCount: 0, aiCallsAvoided: 0,
      tokensAvoided: 0, estimatedCostSavedCents: 0, dataSource: 'real', createdAt: now, updatedAt: now,
    };
    await canonicalRepo.create(canon);
    const d = await resolveWithFirstPartyIntelligence(baseReq);
    expect(d.servedBy).toBe('canonical-answer');
    expect(d.response).toContain('Strengthen grip');
    expect(d.thirdPartyAiUsed).toBe(false);
  });

  it('never serves a cached/canonical answer for personalized/privacy requests', async () => {
    const settings = await getSettings();
    const personalReq: IntelligenceRequestInput = { ...baseReq, request: 'Analyze my last session video and tell me about my swing for me specifically' };
    const norm = normalizeIntelligenceRequest(personalReq, settings);
    expect(norm.personalized).toBe(true);
    await upsertCacheEntry({
      req: norm, response: 'should never serve', responseType: 'coaching-response',
      provider: 'anthropic', model: null, tokens: 100, costCents: 1, confidence: 0.99,
    }).then((e) => expect(e).toBeNull()); // personalized answers are not cached at all
    const d = await resolveWithFirstPartyIntelligence(personalReq);
    expect(d.cacheHit).toBe(false);
    expect(d.needsThirdParty).toBe(true);
  });

  it('respects the knowledge promotion threshold from settings', async () => {
    await saveSettings({ knowledgePromotionThreshold: 0.95 }, 'admin@x.com');
    const d = await resolveWithFirstPartyIntelligence(baseReq, {
      callThirdParty: async () => thirdParty('low confidence answer', 0.6),
    });
    expect(d.thirdPartyAiUsed).toBe(true);
    expect(d.shouldCreateLearningCandidate).toBe(false);
    expect(await knowledgeRepo.list()).toHaveLength(0);
  });
});
