import { runRetentionSweep } from '../retention';
import { activityRepo, saveSettings, __resetIntelligenceStoreForTests } from '../store';
import type { AIActivityEvent } from '../types';

beforeEach(() => { __resetIntelligenceStoreForTests(); });

function makeEvent(over: Partial<AIActivityEvent> & { id: string; createdAt: string }): AIActivityEvent {
  return {
    sourceSystem: 'ai-coach', feature: 'ai-coach', sport: 'golf', userIntent: 'q', promptHash: 'h',
    promptSummary: 'a question', responseHash: 'h2', responseSummary: 'an answer', provider: 'anthropic',
    model: 'm', inputTokens: 10, outputTokens: 10, estimatedCostCents: 1, latencyMs: 1, status: 'ok',
    confidenceScore: 0.8, safetyFlags: [], qualityScore: null, userFeedback: null, adminFeedback: null,
    relatedUserIdHash: null, relatedSessionId: null, relatedVideoId: null, relatedReportId: null,
    relatedTaskId: null, promotedKnowledgeId: null, dataSource: 'real',
    ...over,
  } as AIActivityEvent;
}

const iso = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400_000).toISOString();

describe('intelligence-os/retention', () => {
  it('summarizes old high-value events (keeps metadata, blanks free-text)', async () => {
    await saveSettings({ rawEventRetentionDays: 90, lowValueArchiveDays: 180 }, 'a@x.com');
    await activityRepo.create(makeEvent({ id: 'old-good', createdAt: iso(120), confidenceScore: 0.9, status: 'ok' }));
    const report = await runRetentionSweep();
    expect(report.summarized).toBe(1);
    const e = await activityRepo.get('old-good');
    expect(e?.promptSummary).toBe('');
    expect(e?.responseSummary).toBe('');
    expect(e?.estimatedCostCents).toBe(1); // metadata preserved
  });

  it('archives (deletes) old low-value, non-promoted events', async () => {
    await saveSettings({ rawEventRetentionDays: 90, lowValueArchiveDays: 180 }, 'a@x.com');
    await activityRepo.create(makeEvent({ id: 'old-bad', createdAt: iso(200), status: 'error', confidenceScore: 0.2 }));
    const report = await runRetentionSweep();
    expect(report.archived).toBe(1);
    expect(await activityRepo.get('old-bad')).toBeUndefined();
  });

  it('preserves recent events and promoted ones', async () => {
    await saveSettings({ rawEventRetentionDays: 90, lowValueArchiveDays: 180 }, 'a@x.com');
    await activityRepo.create(makeEvent({ id: 'recent', createdAt: iso(5) }));
    await activityRepo.create(makeEvent({ id: 'old-promoted', createdAt: iso(300), status: 'error', promotedKnowledgeId: 'k1' }));
    const report = await runRetentionSweep();
    expect(await activityRepo.get('recent')).toBeTruthy();
    expect(await activityRepo.get('old-promoted')).toBeTruthy(); // promoted → never archived
    expect(report.archived).toBe(0);
  });

  it('disables a rule when its threshold is 0', async () => {
    await saveSettings({ rawEventRetentionDays: 0, lowValueArchiveDays: 0 }, 'a@x.com');
    await activityRepo.create(makeEvent({ id: 'old', createdAt: iso(500), status: 'error', confidenceScore: 0.1 }));
    const report = await runRetentionSweep();
    expect(report.archived).toBe(0);
    expect(report.summarized).toBe(0);
    expect(report.preserved).toBe(1);
  });
});
