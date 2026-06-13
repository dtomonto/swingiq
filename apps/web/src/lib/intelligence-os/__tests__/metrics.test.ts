import { summarizeTokenSavings } from '../metrics';
import { classifySensitivity, canAutoServe, redactPii, hashUserId } from '../privacy';
import type { AiActivityEvent, TokenSavingsEntry } from '../types';

function event(over: Partial<AiActivityEvent>): AiActivityEvent {
  return {
    id: 'e', dataSource: 'real', createdAt: 't', updatedAt: 't', sourceSystem: 'AI Coach',
    feature: 'coach', sport: 'golf', userIntent: 'x', promptHash: 'h', promptSummary: 's',
    responseHash: 'h', responseSummary: 's', provider: 'openai', model: 'gpt-4o', inputTokens: 800,
    outputTokens: 400, estimatedCost: 0.01, latencyMs: 1000, status: 'ok', confidenceScore: 0.8,
    safetyFlags: [], qualityScore: 0.8, userFeedback: 'none', adminFeedback: 'none',
    relatedUserIdHash: null, relatedSessionId: null, relatedVideoId: null, relatedReportId: null,
    relatedTaskId: null, fingerprint: 'fp', reusePotential: 0.5, ...over,
  };
}

function ledger(over: Partial<TokenSavingsEntry>): TokenSavingsEntry {
  return {
    id: 'l', dataSource: 'real', createdAt: 't', updatedAt: 't', eventType: 'canonical_served',
    sourceFeature: 'coach', avoidedProvider: 'openai', avoidedModel: 'gpt-4o', avoidedInputTokens: 800,
    avoidedOutputTokens: 400, estimatedCostSaved: 0.01, servedBy: 'Canonical Answer', relatedCacheId: null,
    relatedKnowledgeId: null, relatedCanonicalAnswerId: null, ...over,
  };
}

describe('intelligence-os/metrics', () => {
  it('summarizes savings, third-party spend and cache-hit rate', () => {
    const events = [event({ id: 'a' }), event({ id: 'b', status: 'skipped', provider: null })];
    const led = [ledger({ id: 'l1' }), ledger({ id: 'l2', sourceFeature: 'upload' })];
    const s = summarizeTokenSavings(events, led);

    expect(s.aiCallsAvoided).toBe(2);
    expect(s.tokensAvoided).toBe(2 * 1200);
    expect(s.thirdPartyCalls).toBe(1); // the skipped one is excluded
    // hit rate = avoided / (avoided + third-party) = 2 / 3
    expect(s.cacheHitRate).toBeCloseTo(2 / 3, 5);
    expect(s.byFeature.map((f) => f.feature).sort()).toEqual(['coach', 'upload']);
    expect(s.byProvider[0].provider).toBe('openai');
  });

  it('handles empty data without dividing by zero', () => {
    const s = summarizeTokenSavings([], []);
    expect(s.cacheHitRate).toBe(0);
    expect(s.estimatedCostSaved).toBe(0);
  });
});

describe('intelligence-os/privacy', () => {
  it('redacts emails + phones and never auto-serves sensitive content', () => {
    expect(redactPii('reach me at jo@x.com or 555-123-4567')).not.toContain('jo@x.com');
    expect(classifySensitivity('my child has a wrist injury')).toBe('medical');
    expect(canAutoServe('medical')).toBe(false);
    expect(canAutoServe('general')).toBe(true);
    expect(classifySensitivity('anything', true)).toBe('personalized');
  });

  it('hashes user ids deterministically and never returns the raw id', () => {
    expect(hashUserId('user-123')).toBe(hashUserId('user-123'));
    expect(hashUserId('user-123')).not.toContain('user-123');
    expect(hashUserId(null)).toBeNull();
  });
});
