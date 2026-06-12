// Tests for the global AI spend guard (lib/ai-budget.ts).
// Exercises the in-memory path deterministically (no Upstash, no network).

import {
  aiBudgetExceeded,
  recordAiSpend,
  getAiBudgetStatus,
  dailyBudgetCents,
  isAiBudgetConfigured,
  estimateCostCents,
  isAiUsageMeteringEnabled,
  meterAiUsage,
  getAiUsageReport,
  getAiProviderBilling,
  getBudgetOverrideCents,
  setBudgetOverrideCents,
  resolvedDailyBudgetCents,
  __test__,
} from '@/lib/ai-budget';

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  __test__.reset();
  // Force the in-memory path so tests are deterministic and offline.
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  delete process.env.AI_DAILY_BUDGET_CENTS;
  delete process.env.AI_USAGE_METERING;
  // No provider keys → metering off by default unless a test opts in.
  delete process.env.AI_PROVIDER;
  delete process.env.AI_VISION_PROVIDER;
  delete process.env.OCR_PROVIDER;
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.OPENAI_API_KEY;
  delete process.env.GOOGLE_AI_API_KEY;
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

describe('usage metering — gating', () => {
  it('is off in the fully-keyless case (no provider, no budget, no force)', () => {
    expect(isAiUsageMeteringEnabled()).toBe(false);
  });

  it('turns on when a budget ceiling is armed', () => {
    process.env.AI_DAILY_BUDGET_CENTS = '500';
    expect(isAiUsageMeteringEnabled()).toBe(true);
  });

  it('turns on when an AI provider is configured', () => {
    process.env.AI_PROVIDER = 'anthropic';
    process.env.ANTHROPIC_API_KEY = 'sk-real-key';
    expect(isAiUsageMeteringEnabled()).toBe(true);
  });

  it('respects an explicit AI_USAGE_METERING off-switch', () => {
    process.env.AI_PROVIDER = 'anthropic';
    process.env.ANTHROPIC_API_KEY = 'sk-real-key';
    process.env.AI_USAGE_METERING = '0';
    // Provider is on, but the explicit force value is falsy → still enabled via provider.
    expect(isAiUsageMeteringEnabled()).toBe(true);
    // With no provider, an explicit "0" must not enable it.
    delete process.env.AI_PROVIDER;
    delete process.env.ANTHROPIC_API_KEY;
    expect(isAiUsageMeteringEnabled()).toBe(false);
    // An explicit truthy value forces it on with nothing else configured.
    process.env.AI_USAGE_METERING = '1';
    expect(isAiUsageMeteringEnabled()).toBe(true);
  });
});

describe('usage metering — recording & report', () => {
  beforeEach(() => {
    // Arm via a provider so metering is active and the budget counter stays off.
    process.env.AI_PROVIDER = 'anthropic';
    process.env.ANTHROPIC_API_KEY = 'sk-real-key';
  });

  it('records per-operation cents and exact call counts (in-memory)', async () => {
    await meterAiUsage('video-vision'); // +5c, +1 call
    await meterAiUsage('video-vision'); // +5c, +1 call
    await meterAiUsage('ai-coach'); // +1c, +1 call

    expect(__test__.usageMemoryUsed('video-vision')).toBe(10);
    expect(__test__.usageMemoryCount('video-vision')).toBe(2);
    expect(__test__.usageMemoryCount('ai-coach')).toBe(1);

    const report = await getAiUsageReport(14);
    expect(report.enabled).toBe(true);
    expect(report.source).toBe('memory');
    expect(report.totals.calls).toBe(3);
    expect(report.totals.cents).toBe(11);
    expect(report.today.calls).toBe(3);
    expect(report.today.cents).toBe(11);

    // Busiest-by-cost first.
    expect(report.byOp[0]).toMatchObject({ op: 'video-vision', calls: 2, cents: 10 });
    expect(report.byOp.find((r) => r.op === 'ai-coach')).toMatchObject({ calls: 1, cents: 1 });

    // Today's bucket carries the spend.
    const today = report.byDay.find((d) => d.date === report.today.date);
    expect(today).toMatchObject({ calls: 3, cents: 11 });
  });

  it('recordAiSpend meters usage even when no budget ceiling is armed', async () => {
    expect(isAiBudgetConfigured()).toBe(false);
    await recordAiSpend('ocr'); // budget counter stays 0, usage records
    expect(__test__.memoryUsed()).toBe(0); // budget untouched
    expect(__test__.usageMemoryCount('ocr')).toBe(1);
    expect(__test__.usageMemoryUsed('ocr')).toBe(4);
  });

  it('returns an empty, disabled report when metering is off', async () => {
    delete process.env.AI_PROVIDER;
    delete process.env.ANTHROPIC_API_KEY;
    const report = await getAiUsageReport(7);
    expect(report.enabled).toBe(false);
    expect(report.source).toBe('off');
    expect(report.totals.calls).toBe(0);
    expect(report.byOp).toHaveLength(0);
    expect(report.byDay).toHaveLength(7);
  });
});

describe('provider billing links', () => {
  it('marks configured providers and sorts them first', () => {
    process.env.OPENAI_API_KEY = 'sk-openai';
    const { links, configuredCount } = getAiProviderBilling();
    expect(links).toHaveLength(4);
    expect(links.every((l) => l.url.startsWith('https://'))).toBe(true);
    expect(configuredCount).toBe(1);
    expect(links[0]).toMatchObject({ id: 'openai', configured: true });
  });
});

describe('ai-budget — admin-editable override', () => {
  it('starts unset and resolves to the env default', async () => {
    expect(await getBudgetOverrideCents()).toBeNull();
    expect(await resolvedDailyBudgetCents()).toBe(0); // env unset in beforeEach
    process.env.AI_DAILY_BUDGET_CENTS = '500';
    expect(await resolvedDailyBudgetCents()).toBe(500);
    delete process.env.AI_DAILY_BUDGET_CENTS;
  });

  it('the override wins over the env default and is reflected everywhere', async () => {
    process.env.AI_DAILY_BUDGET_CENTS = '500';
    await setBudgetOverrideCents(2000); // $20
    expect(await getBudgetOverrideCents()).toBe(2000);
    expect(await resolvedDailyBudgetCents()).toBe(2000);

    const status = await getAiBudgetStatus();
    expect(status.limitCents).toBe(2000);
    expect(status.limitSource).toBe('override');
    delete process.env.AI_DAILY_BUDGET_CENTS;
  });

  it('clearing the override reverts to the env default', async () => {
    await setBudgetOverrideCents(2000);
    expect(await resolvedDailyBudgetCents()).toBe(2000);
    await setBudgetOverrideCents(null);
    expect(await getBudgetOverrideCents()).toBeNull();
    expect(await resolvedDailyBudgetCents()).toBe(0);
    expect((await getAiBudgetStatus()).limitSource).toBe('off');
  });

  it('an override of 0 means explicitly uncapped (overrides a positive env)', async () => {
    process.env.AI_DAILY_BUDGET_CENTS = '500';
    await setBudgetOverrideCents(0);
    expect(await resolvedDailyBudgetCents()).toBe(0);
    expect(await aiBudgetExceeded()).toBe(false);
    delete process.env.AI_DAILY_BUDGET_CENTS;
  });

  it('the override arms the kill-switch even when no env cap is set', async () => {
    await setBudgetOverrideCents(2); // 2 cents — trips after a couple of calls
    expect(await aiBudgetExceeded()).toBe(false);
    await recordAiSpend('video-vision'); // +5c (estimate) ≥ 2c
    expect(await aiBudgetExceeded()).toBe(true);
  });
});
