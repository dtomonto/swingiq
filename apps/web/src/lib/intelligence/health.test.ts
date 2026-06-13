// ============================================================
// GAI provider health — runtime liveness from call telemetry
// ============================================================

jest.mock('@/lib/ai/ai-ops/call-log', () => ({ getAiCallStats: jest.fn() }));

import { getAiCallStats } from '@/lib/ai/ai-ops/call-log';
import { resolveProviderHealth } from './health';

const mockStats = getAiCallStats as jest.MockedFunction<typeof getAiCallStats>;

function stats(byProvider: Array<{ provider: string; calls: number; okCalls: number }>) {
  return {
    source: 'memory' as const,
    total: byProvider.reduce((n, p) => n + p.calls, 0),
    okRate: 0,
    fallbackRate: 0,
    schemaFailureRate: 0,
    avgLatencyMs: null,
    byProvider: byProvider.map((p) => ({
      key: p.provider,
      provider: p.provider,
      calls: p.calls,
      okCalls: p.okCalls,
      fallbackCalls: p.calls - p.okCalls,
      schemaFailures: 0,
      avgLatencyMs: null,
      estCostCents: 0,
    })),
  };
}

beforeEach(() => mockStats.mockReset());

describe('resolveProviderHealth', () => {
  test('no recent calls → assume healthy', async () => {
    mockStats.mockResolvedValue(stats([]));
    expect(await resolveProviderHealth('PREMIUM_RETEST_PLAN')).toBe(true);
  });

  test('a relevant provider failing all recent calls → unhealthy', async () => {
    mockStats.mockResolvedValue(stats([{ provider: 'gemini', calls: 10, okCalls: 1 }]));
    expect(await resolveProviderHealth('PREMIUM_RETEST_PLAN')).toBe(false);
  });

  test('at least one healthy relevant provider → healthy', async () => {
    mockStats.mockResolvedValue(
      stats([
        { provider: 'gemini', calls: 10, okCalls: 1 },
        { provider: 'openai', calls: 10, okCalls: 9 },
      ]),
    );
    expect(await resolveProviderHealth('PREMIUM_RETEST_PLAN')).toBe(true);
  });

  test('too few samples to judge → healthy', async () => {
    mockStats.mockResolvedValue(stats([{ provider: 'openai', calls: 2, okCalls: 0 }]));
    expect(await resolveProviderHealth('AI_SWING_REPORT')).toBe(true);
  });

  test('coach tier ignores a failing vision-only provider', async () => {
    // gemini is not a coach provider, so its failures must not mark coach unhealthy.
    mockStats.mockResolvedValue(stats([{ provider: 'gemini', calls: 10, okCalls: 0 }]));
    expect(await resolveProviderHealth('AI_SWING_REPORT')).toBe(true);
  });

  test('telemetry error → fail open (healthy)', async () => {
    mockStats.mockRejectedValue(new Error('store down'));
    expect(await resolveProviderHealth('PREMIUM_RETEST_PLAN')).toBe(true);
  });
});
