// SignalRadar OS — webhook payload parsing + ingest merge tests (pure).

import { parseWebhookPayload, mergeIngested } from '../ingest';
import { processRawInputs } from '../engine';
import { DEFAULT_CONFIG, DEFAULT_COMPETITORS } from '../config';
import type { RawSignalInput, Signal } from '../types';

const NOW = '2026-06-11T12:00:00.000Z';

describe('parseWebhookPayload', () => {
  it('coerces a minimal body into a webhook RawSignalInput', () => {
    const input = parseWebhookPayload({ text: 'SwingVantage is great for golf' });
    expect(input).not.toBeNull();
    expect(input!.collectionMethod).toBe('webhook');
    expect(input!.sourceType).toBe('webhook');
    expect(input!.text).toContain('SwingVantage');
  });

  it('accepts title-only and field aliases (content/url/author)', () => {
    const input = parseWebhookPayload({ content: 'great tool', url: 'https://x.com/a', author: 'bob', sourceType: 'reddit' });
    expect(input!.sourceUrl).toBe('https://x.com/a');
    expect(input!.authorName).toBe('bob');
    expect(input!.sourceType).toBe('reddit'); // whitelisted type honored
  });

  it('rejects an empty / textless body', () => {
    expect(parseWebhookPayload({})).toBeNull();
    expect(parseWebhookPayload(null)).toBeNull();
    expect(parseWebhookPayload('nope')).toBeNull();
    expect(parseWebhookPayload({ foo: 'bar' })).toBeNull();
  });

  it('clamps oversized text and whitelists an unknown source type', () => {
    const input = parseWebhookPayload({ text: 'x'.repeat(10_000), sourceType: 'evil_type' });
    expect(input!.text.length).toBeLessThanOrEqual(5000);
    expect(input!.sourceType).toBe('webhook'); // unknown type falls back
  });
});

describe('mergeIngested', () => {
  function make(text: string, url: string, ids: string): Signal {
    const raw: RawSignalInput = { sourceType: 'manual', collectionMethod: 'manual', text, sourceUrl: url };
    return processRawInputs([raw], DEFAULT_CONFIG, DEFAULT_COMPETITORS, { now: NOW, makeId: () => ids }).signals[0];
  }

  it('appends ingested-only signals and flags them', () => {
    const local = [make('local one', 'https://x.com/1', 'l1')];
    const ingested = [make('ingested two', 'https://x.com/2', 'i2')];
    const merged = mergeIngested(local, ingested);
    expect(merged).toHaveLength(2);
    expect(merged.find((s) => s.id === 'i2')!.ingested).toBe(true);
    expect(merged.find((s) => s.id === 'l1')!.ingested).toBeUndefined();
  });

  it('drops an ingested signal whose fingerprint already exists locally (local wins)', () => {
    const local = [make('same', 'https://x.com/dup', 'local')];
    const ingested = [make('same', 'https://x.com/dup', 'remote')];
    const merged = mergeIngested(local, ingested);
    expect(merged).toHaveLength(1);
    expect(merged[0].id).toBe('local');
  });
});
