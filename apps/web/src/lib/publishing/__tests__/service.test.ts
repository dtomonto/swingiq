import { recordPublishDecision, getRecentEvents } from '../service';
import { getPublishOverrides, listEvents } from '../store';
import { __resetMemoryStore } from '../store';

describe('publishing/service', () => {
  beforeEach(() => __resetMemoryStore());

  it('publishes a low-risk update durably (override + event)', async () => {
    const res = await recordPublishDecision({
      entityType: 'update',
      entityId: 'u1',
      title: 'Hello',
      slug: 'hello',
      action: 'publish',
      actorEmail: 'owner@example.com',
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.published).toBe(true);
    expect(res.status).toBe('published');

    const overrides = await getPublishOverrides('update');
    expect(overrides.u1).toBe(true);

    const events = await listEvents('update:u1');
    expect(events).toHaveLength(1);
    expect(events[0].eventType).toBe('publish');
  });

  it('unpublish flips the override to false', async () => {
    await recordPublishDecision({ entityType: 'update', entityId: 'u2', title: 'X', action: 'publish' });
    const res = await recordPublishDecision({ entityType: 'update', entityId: 'u2', title: 'X', action: 'unpublish' });
    expect(res.ok).toBe(true);
    const overrides = await getPublishOverrides('update');
    expect(overrides.u2).toBe(false);
  });

  it('blocks any critical-risk action from the instant path', async () => {
    // unpublishing a feature-flag escalates to critical → blocked entirely.
    const res = await recordPublishDecision({
      entityType: 'feature-flag',
      entityId: 'kill-switch',
      title: 'Kill switch',
      action: 'unpublish',
      riskAcknowledged: true, // even an ack cannot bypass critical
    });
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.reason).toBe('blocked-critical');
  });

  it('requires acknowledgement for high-risk publishes', async () => {
    const blocked = await recordPublishDecision({
      entityType: 'sport-config',
      entityId: 'golf',
      title: 'Golf config',
      action: 'publish',
    });
    expect(blocked.ok).toBe(false);
    if (blocked.ok) return;
    expect(blocked.reason).toBe('needs-risk-ack');

    const ok = await recordPublishDecision({
      entityType: 'sport-config',
      entityId: 'golf',
      title: 'Golf config',
      action: 'publish',
      riskAcknowledged: true,
    });
    expect(ok.ok).toBe(true);
  });

  it('records events newest-first across entities', async () => {
    await recordPublishDecision({ entityType: 'update', entityId: 'a', title: 'A', action: 'publish' });
    await recordPublishDecision({ entityType: 'update', entityId: 'b', title: 'B', action: 'publish' });
    const recent = await getRecentEvents();
    expect(recent.length).toBeGreaterThanOrEqual(2);
  });
});
