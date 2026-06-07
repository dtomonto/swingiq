// Tests for the global AI spend guard (lib/ai-budget.ts).
// Exercises the in-memory path deterministically (no Upstash, no network).

import {
  aiBudgetExceeded,
  recordAiSpend,
  getAiBudgetStatus,
  dailyBudgetCents,
  isAiBudgetConfigured,
  estimateCostCents,
  __test__,
} from '@/lib/ai-budget';

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  __test__.reset();
  // Force the in-memory path so tests are deterministic and offline.
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  delete process.env.AI_DAILY_BUDGET_CENTS;
});

afterAll(() => {
  process.env = ORIGINAL_ENV;
});

describe('ai-budget — off by default', () => {
  it('reports not-configured and never blocks when no ceiling is set', async () => {
    expect(isAiBudgetConfigured()).toBe(false);
    expect(dailyBudgetCents()).toBe(0);
    expect(await aiBudgetExceeded()).toBe(false);

    const s = await getAiBudgetStatus();
    expect(s.configured).toBe(false);
    expect(s.exceeded).toBe(false);
    expect(s.source).toBe('off');
    expect(s.usedCents).toBe(0);
  });

  it('recordAiSpend is a no-op when off (zero tracking, zero latency)', async () => {
    await recordAiSpend('video-vision');
    await recordAiSpend('ai-coach');
    expect(__test__.memoryUsed()).toBe(0);
  });
});

describe('estimateCostCents', () => {
  it('uses the table for known ops and 1c for unknown ops', () => {
    expect(estimateCostCents('video-vision')).toBe(5);
    expect(estimateCostCents('ocr')).toBe(4);
    expect(estimateCostCents('ai-coach')).toBe(1);
    expect(estimateCostCents('totally-unknown-op')).toBe(1);
  });
});

describe('dailyBudgetCents parsing', () => {
  it('treats zero / negative / non-numeric as off', () => {
    process.env.AI_DAILY_BUDGET_CENTS = '0';
    expect(dailyBudgetCents()).toBe(0);
    process.env.AI_DAILY_BUDGET_CENTS = '-50';
    expect(dailyBudgetCents()).toBe(0);
    process.env.AI_DAILY_BUDGET_CENTS = 'not-a-number';
    expect(dailyBudgetCents()).toBe(0);
    process.env.AI_DAILY_BUDGET_CENTS = '500';
    expect(dailyBudgetCents()).toBe(500);
    expect(isAiBudgetConfigured()).toBe(true);
  });
});

describe('ai-budget — armed (in-memory fallback)', () => {
  it('accumulates estimated spend and trips at the ceiling', async () => {
    process.env.AI_DAILY_BUDGET_CENTS = '10';
    expect(await aiBudgetExceeded()).toBe(false);

    await recordAiSpend('video-vision'); // +5 → 5
    let s = await getAiBudgetStatus();
    expect(s.usedCents).toBe(5);
    expect(s.remainingCents).toBe(5);
    expect(s.exceeded).toBe(false);
    expect(await aiBudgetExceeded()).toBe(false);

    await recordAiSpend('video-vision'); // +5 → 10 (== ceiling)
    s = await getAiBudgetStatus();
    expect(s.usedCents).toBe(10);
    expect(s.remainingCents).toBe(0);
    expect(s.exceeded).toBe(true);
    expect(await aiBudgetExceeded()).toBe(true);

    // Once tripped, it stays tripped and reports the right metadata.
    await recordAiSpend('ai-coach'); // +1 → 11
    s = await getAiBudgetStatus();
    expect(s.usedCents).toBe(11);
    expect(s.remainingCents).toBe(0);
    expect(s.exceeded).toBe(true);
    expect(s.configured).toBe(true);
    expect(s.limitCents).toBe(10);
    expect(s.source).toBe('memory');
  });

  it('keeps each UTC day independent', () => {
    expect(__test__.memoryUsed('2020-01-01')).toBe(0);
  });
});
