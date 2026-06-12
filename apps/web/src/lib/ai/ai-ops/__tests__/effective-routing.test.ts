// Tests for the AI task registry, the durable routing-override store (in-memory
// path), and the effective-routing resolver that layers overrides + health over
// the strategic router. Pure — no network (Upstash creds absent in test env).

import { AI_TASKS, getTaskById, getTaskByStage } from '../task-registry';
import {
  getRoutingOverrides,
  setRoutingOverride,
  clearRoutingOverride,
  clearAllRoutingOverrides,
  routingStoreSource,
  __test__ as storeTest,
} from '../routing-store';
import { getEffectiveRouting, getProviderHealth, resolveLiveRoute } from '../effective-routing';

const ENV_BASE: Record<string, string | undefined> = {}; // no provider keys, no Upstash

beforeEach(() => {
  storeTest.reset();
});

describe('task-registry', () => {
  it('encodes the strategic provider defaults', () => {
    expect(getTaskByStage('video_intake')?.defaultProvider).toBe('gemini');
    expect(getTaskByStage('coach_synthesis')?.defaultProvider).toBe('openai');
    expect(getTaskByStage('coach_chat')?.defaultProvider).toBe('openai');
    expect(getTaskByStage('measurement')?.defaultProvider).toBe('mediapipe');
    expect(getTaskByStage('premium_narrative')?.defaultProvider).toBe('anthropic');
  });

  it('locks the measurement task to the CV layer (no LLM masquerade)', () => {
    const m = getTaskById('measurement')!;
    expect(m.reroutable).toBe(false);
    expect(m.allowedProviders).not.toContain('openai');
    expect(m.allowedProviders).not.toContain('gemini');
  });

  it('every task lists its default as an allowed provider', () => {
    for (const t of AI_TASKS) {
      expect(t.allowedProviders).toContain(t.defaultProvider);
    }
  });
});

describe('routing-store (in-memory path)', () => {
  it('reports memory source without Upstash creds', () => {
    expect(routingStoreSource()).toBe('memory');
  });

  it('starts empty', async () => {
    expect(await getRoutingOverrides()).toEqual({});
  });

  it('sets, merges, and clears a per-stage override', async () => {
    await setRoutingOverride('coach_synthesis', { provider: 'anthropic' });
    await setRoutingOverride('coach_synthesis', { model: 'claude-sonnet-4-6' });
    expect(await getRoutingOverrides()).toEqual({
      coach_synthesis: { provider: 'anthropic', model: 'claude-sonnet-4-6' },
    });

    await clearRoutingOverride('coach_synthesis');
    expect(await getRoutingOverrides()).toEqual({});
  });

  it("treats an empty-string model as 'clear to tier default' (null)", async () => {
    await setRoutingOverride('coach_chat', { provider: 'openai', model: '' });
    const ov = await getRoutingOverrides();
    expect(ov.coach_chat?.model).toBeNull();
  });

  it('clears all overrides', async () => {
    await setRoutingOverride('video_intake', { provider: 'openai' });
    await setRoutingOverride('premium_narrative', { enabled: true });
    await clearAllRoutingOverrides();
    expect(await getRoutingOverrides()).toEqual({});
  });

  it('sanitizes foreign/garbage shapes', () => {
    expect(storeTest.sanitize(null)).toEqual({});
    expect(storeTest.sanitize({ coach_chat: { provider: 'openai', junk: 1 } })).toEqual({
      coach_chat: { provider: 'openai' },
    });
  });
});

describe('getProviderHealth', () => {
  it('marks MediaPipe always available and gates LLMs on keys', () => {
    const health = getProviderHealth(ENV_BASE);
    const byId = Object.fromEntries(health.map((h) => [h.provider, h]));
    expect(byId.mediapipe.configured).toBe(true);
    expect(byId.openai.configured).toBe(false);
    expect(byId.gemini.configured).toBe(false);

    const withKeys = getProviderHealth({ OPENAI_API_KEY: 'sk-real', GOOGLE_AI_API_KEY: 'g-real' });
    const k = Object.fromEntries(withKeys.map((h) => [h.provider, h]));
    expect(k.openai.configured).toBe(true);
    expect(k.gemini.configured).toBe(true);
  });
});

describe('getEffectiveRouting', () => {
  it('returns the strategic defaults when no overrides exist', async () => {
    const snap = await getEffectiveRouting('standard', ENV_BASE);
    const byStage = Object.fromEntries(snap.routes.map((r) => [r.task.stage, r]));
    expect(byStage.video_intake.provider).toBe('gemini');
    expect(byStage.coach_synthesis.provider).toBe('openai');
    expect(byStage.video_intake.overridden).toBe(false);
    expect(snap.source).toBe('memory');
  });

  it('layers a durable override onto the base decision', async () => {
    await setRoutingOverride('coach_synthesis', { provider: 'anthropic', model: 'claude-sonnet-4-6' });
    const snap = await getEffectiveRouting('standard', ENV_BASE);
    const coach = snap.routes.find((r) => r.task.stage === 'coach_synthesis')!;
    expect(coach.provider).toBe('anthropic');
    expect(coach.model).toBe('claude-sonnet-4-6');
    expect(coach.overridden).toBe(true);
    expect(coach.reason).toMatch(/overridden/);
  });

  it('flags a route that points at an unconfigured provider', async () => {
    const snap = await getEffectiveRouting('standard', ENV_BASE);
    const video = snap.routes.find((r) => r.task.stage === 'video_intake')!;
    expect(video.provider).toBe('gemini');
    expect(video.providerConfigured).toBe(false); // no GOOGLE_AI_API_KEY in test env

    const snap2 = await getEffectiveRouting('standard', { GOOGLE_AI_API_KEY: 'g-real' });
    const video2 = snap2.routes.find((r) => r.task.stage === 'video_intake')!;
    expect(video2.providerConfigured).toBe(true);
  });

  it('can enable the opt-in Claude narrative via override', async () => {
    const before = await getEffectiveRouting('standard', ENV_BASE);
    expect(before.routes.find((r) => r.task.stage === 'premium_narrative')!.enabled).toBe(false);

    await setRoutingOverride('premium_narrative', { enabled: true });
    const after = await getEffectiveRouting('standard', ENV_BASE);
    const narr = after.routes.find((r) => r.task.stage === 'premium_narrative')!;
    expect(narr.enabled).toBe(true);
    expect(narr.overridden).toBe(true);
  });
});

describe('resolveLiveRoute (live-traffic resolver)', () => {
  it('is NOT usable when the provider has no key (defers to caller env)', async () => {
    const r = await resolveLiveRoute('coach_chat', 'standard', ENV_BASE);
    expect(r.provider).toBe('openai');
    expect(r.providerConfigured).toBe(false);
    expect(r.usable).toBe(false); // no OPENAI_API_KEY → caller keeps its env path
    expect(r.enabled).toBe(true);
  });

  it('is usable when the resolved provider is configured', async () => {
    const r = await resolveLiveRoute('coach_chat', 'standard', { OPENAI_API_KEY: 'sk-real' });
    expect(r.usable).toBe(true);
    expect(r.provider).toBe('openai');
  });

  it('reflects a usable admin override (provider + model)', async () => {
    await setRoutingOverride('coach_chat', { provider: 'anthropic', model: 'claude-sonnet-4-6' });
    const r = await resolveLiveRoute('coach_chat', 'standard', { ANTHROPIC_API_KEY: 'sk-ant' });
    expect(r.provider).toBe('anthropic');
    expect(r.model).toBe('claude-sonnet-4-6');
    expect(r.overridden).toBe(true);
    expect(r.usable).toBe(true);
  });

  it('marks a disabled stage not-enabled so callers serve their fallback', async () => {
    await setRoutingOverride('video_intake', { enabled: false });
    const r = await resolveLiveRoute('video_intake', 'standard', { GOOGLE_AI_API_KEY: 'g-real' });
    expect(r.enabled).toBe(false);
    expect(r.usable).toBe(false);
  });

  it('an override pointing at an UNconfigured provider stays non-usable', async () => {
    await setRoutingOverride('video_intake', { provider: 'openai' }); // but no OPENAI key
    const r = await resolveLiveRoute('video_intake', 'standard', ENV_BASE);
    expect(r.provider).toBe('openai');
    expect(r.overridden).toBe(true);
    expect(r.usable).toBe(false); // → vision route keeps the operator's env provider
  });
});
