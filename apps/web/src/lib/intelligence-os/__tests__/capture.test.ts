import { captureAiInteraction, coerceSport } from '../capture';
import { activityRepo, knowledgeRepo, __resetIntelligenceStoreForTests } from '../store';

beforeEach(() => { __resetIntelligenceStoreForTests(); });

describe('intelligence-os/capture', () => {
  it('coerceSport maps app sport ids to the Sport union', () => {
    expect(coerceSport('golf')).toBe('golf');
    expect(coerceSport('softball_slow')).toBe('softball-slowpitch');
    expect(coerceSport('softball_fast')).toBe('softball-fastpitch');
    expect(coerceSport('unknown-sport')).toBe('none');
    expect(coerceSport(null)).toBe('none');
  });

  it('logs an activity event and promotes a generic question to knowledge', async () => {
    await captureAiInteraction({
      sourceSystem: 'ai-coach', feature: 'ai-coach', sport: 'golf',
      request: 'How do I fix a slice with my driver?',
      response: 'Strengthen your grip and square the clubface through impact.',
      provider: 'anthropic', model: 'claude-sonnet-4-6', confidenceScore: 0.8,
    });
    expect(await activityRepo.list()).toHaveLength(1);
    expect(await knowledgeRepo.list()).toHaveLength(1);
  });

  it('does NOT promote a personalized question, but still logs it (hashed)', async () => {
    await captureAiInteraction({
      sourceSystem: 'ai-coach', feature: 'ai-coach', sport: 'golf',
      request: 'Analyze my last session video for me specifically',
      response: 'Your tempo dropped in your most recent session.',
      provider: 'anthropic', model: 'claude-sonnet-4-6', confidenceScore: 0.9,
      userId: 'user-123',
    });
    const events = await activityRepo.list();
    expect(events).toHaveLength(1);
    expect(events[0].relatedUserIdHash).not.toBe('user-123'); // hashed, never raw
    expect(events[0].relatedUserIdHash).toBeTruthy();
    expect(await knowledgeRepo.list()).toHaveLength(0); // personalized → not promoted
  });

  it('never throws on bad input', async () => {
    await expect(captureAiInteraction({
      sourceSystem: 'ai-coach', feature: 'ai-coach', request: '', response: '',
      provider: 'none', model: null,
    })).resolves.toBeUndefined();
  });
});
