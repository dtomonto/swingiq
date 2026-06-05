import { aggregateEvents, type RecordedEvent } from '../analytics';

describe('aggregateEvents', () => {
  const events: RecordedEvent[] = [
    { event: 'impression', at: '2026-06-05T00:00:00Z' },
    { event: 'impression', at: '2026-06-05T00:00:01Z' },
    { event: 'play', at: '2026-06-05T00:00:02Z' },
    { event: 'pause', completion: 0.4, dropOffSec: 12, at: '2026-06-05T00:00:03Z' },
    { event: 'complete', completion: 1, at: '2026-06-05T00:00:04Z' },
    { event: 'cta_click', at: '2026-06-05T00:00:05Z' },
    { event: 'caption_toggle', at: '2026-06-05T00:00:06Z' },
  ];

  const metric = aggregateEvents(events, {
    assetId: 'a1',
    placementId: 'p1',
    windowStart: 's',
    windowEnd: 'e',
  });

  it('counts events by type', () => {
    expect(metric.impressions).toBe(2);
    expect(metric.plays).toBe(1);
    expect(metric.pauses).toBe(1);
    expect(metric.completions).toBe(1);
    expect(metric.ctaClicks).toBe(1);
    expect(metric.captionToggles).toBe(1);
  });

  it('computes avgCompletion and dropOffPoint in 0–1', () => {
    expect(metric.avgCompletion).toBeGreaterThan(0);
    expect(metric.avgCompletion).toBeLessThanOrEqual(1);
    expect(metric.dropOffPoint).toBeGreaterThanOrEqual(0);
    expect(metric.dropOffPoint).toBeLessThanOrEqual(1);
  });

  it('handles an empty batch without dividing by zero', () => {
    const empty = aggregateEvents([], { assetId: 'a', placementId: 'p', windowStart: 's', windowEnd: 'e' });
    expect(empty.impressions).toBe(0);
    expect(empty.avgCompletion).toBe(0);
    expect(empty.dropOffPoint).toBe(0);
  });
});
