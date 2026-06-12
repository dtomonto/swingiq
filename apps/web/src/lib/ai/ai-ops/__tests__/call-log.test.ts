// Tests for the AI call-observability log (in-memory ring-buffer path — Upstash
// creds absent in test env). Verifies sanitization, capping, and aggregation.

import {
  recordAiCall,
  getRecentAiCalls,
  getAiCallStats,
  __callLogTest__ as logTest,
} from '../call-log';

const AT = new Date('2026-06-12T12:00:00.000Z');

beforeEach(() => {
  logTest.reset();
});

describe('recordAiCall + getRecentAiCalls', () => {
  it('records a sanitized call, newest first', async () => {
    await recordAiCall({ op: 'ai-coach', stage: 'coach_chat', provider: 'openai', model: 'gpt-4o', latencyMs: 120.7, ok: true, schemaRequested: true, schemaParsed: true }, AT);
    const { calls, source } = await getRecentAiCalls();
    expect(source).toBe('memory');
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      op: 'ai-coach',
      stage: 'coach_chat',
      provider: 'openai',
      model: 'gpt-4o',
      latencyMs: 121, // rounded
      ok: true,
      schemaRequested: true,
      schemaParsed: true,
    });
    expect(calls[0].estCostCents).toBeGreaterThan(0); // from the op estimate
  });

  it('schemaParsed is null when no schema was requested', async () => {
    await recordAiCall({ op: 'narrative', provider: 'anthropic', ok: true, schemaRequested: false }, AT);
    const { calls } = await getRecentAiCalls();
    expect(calls[0].schemaParsed).toBeNull();
    expect(calls[0].stage).toBeNull();
  });

  it('records fallbacks as not-ok', async () => {
    await recordAiCall({ op: 'ai-coach', provider: 'none', ok: false, fallback: 'no_provider' }, AT);
    const { calls } = await getRecentAiCalls();
    expect(calls[0].ok).toBe(false);
    expect(calls[0].fallback).toBe('no_provider');
  });

  it('caps the buffer and keeps the newest', async () => {
    for (let i = 0; i < 250; i += 1) {
      await recordAiCall({ op: 'ai-coach', provider: 'openai', model: `m${i}`, ok: true }, AT);
    }
    const { calls } = await getRecentAiCalls(500);
    expect(calls.length).toBeLessThanOrEqual(200); // LOG_MAX
    expect(calls[0].model).toBe('m249'); // newest first
  });
});

describe('getAiCallStats', () => {
  it('returns zeros for an empty buffer', async () => {
    const stats = await getAiCallStats();
    expect(stats.total).toBe(0);
    expect(stats.byProvider).toEqual([]);
    expect(stats.avgLatencyMs).toBeNull();
  });

  it('aggregates ok/fallback/schema-failure rates + per-provider latency', async () => {
    await recordAiCall({ op: 'ai-coach', provider: 'openai', latencyMs: 100, ok: true, schemaRequested: true, schemaParsed: true }, AT);
    await recordAiCall({ op: 'ai-coach', provider: 'openai', latencyMs: 300, ok: true, schemaRequested: true, schemaParsed: false }, AT);
    await recordAiCall({ op: 'video-vision', provider: 'gemini', latencyMs: 900, ok: false, fallback: 'error', schemaRequested: true, schemaParsed: false }, AT);

    const stats = await getAiCallStats();
    expect(stats.total).toBe(3);
    expect(stats.okRate).toBeCloseTo(2 / 3, 5);
    expect(stats.fallbackRate).toBeCloseTo(1 / 3, 5);
    expect(stats.schemaFailureRate).toBeCloseTo(2 / 3, 5); // 2 of 3 schema-requested failed
    expect(stats.avgLatencyMs).toBe(Math.round((100 + 300 + 900) / 3));

    const openai = stats.byProvider.find((p) => p.provider === 'openai')!;
    expect(openai.calls).toBe(2);
    expect(openai.avgLatencyMs).toBe(200); // (100+300)/2
    expect(openai.schemaFailures).toBe(1);

    const gemini = stats.byProvider.find((p) => p.provider === 'gemini')!;
    expect(gemini.fallbackCalls).toBe(1);
    expect(gemini.avgLatencyMs).toBe(900);
  });
});
