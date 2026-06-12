import { describe, it, expect } from '@jest/globals';
import { loadAIConfig } from '../model-config';
import { createRouter } from '../registry';
import { createOpenAICoachProvider } from '../coach-provider';
import { createClaudeNarrativeProvider } from '../narrative-provider';
import { CoachSynthesisSchema, type NormalizedAnalysisEvidence } from '../schemas';
import type { AiCompleteResult } from '@/lib/ai/gateway';

const EVIDENCE: NormalizedAnalysisEvidence = {
  videoIntake: null,
  measurements: null,
  mergedObservations: [],
  evidenceClaims: [
    { claim: 'Out-to-in path through impact', source: 'video_intake', supportLevel: 'observed', confidence: 0.6, usedInCoachOutput: false },
  ],
  unsupportedClaimsRejected: [],
  conflicts: [],
  confidenceScore: 0.6,
  analysisLimitations: ['single-camera estimate'],
};

const VALID_COACH = {
  summary: 's',
  quickRead: 'q',
  whatISee: 'w',
  primaryFault: 'out-to-in path',
  oneFix: 'fix',
  whyItMatters: 'why',
  practicePlan: 'plan',
  retestProtocol: 'retest',
  confidence: 0.6,
  evidenceUsed: ['Out-to-in path through impact'],
  safetyDisclaimer: 'Not medical advice.',
  limitations: ['single-camera estimate'],
};

const ok = (parsed: unknown): AiCompleteResult => ({
  text: JSON.stringify(parsed),
  provider: 'openai',
  model: 'gpt-4o',
  parsed,
  fallback: null,
});

describe('loadAIConfig', () => {
  it('safe defaults: no hardcoded model ids, claude disabled, payloads redacted', () => {
    const c = loadAIConfig({});
    expect(c.openai.coachModel).toBeNull(); // empty → gateway tier default
    expect(c.gemini.fastModel).toBeNull(); // never seeded
    expect(c.claude.enabled).toBe(false);
    expect(c.system.redactProviderPayloads).toBe(true);
    expect(c.system.storeRawProviderResponses).toBe(false);
    expect(c.measurement.provider).toBe('mediapipe');
  });
  it('reads overrides from env', () => {
    const c = loadAIConfig({ OPENAI_COACH_MODEL: 'gpt-5.5', ENABLE_CLAUDE_PREMIUM_NARRATIVE: 'true' });
    expect(c.openai.coachModel).toBe('gpt-5.5');
    expect(c.claude.enabled).toBe(true);
  });
});

describe('router', () => {
  const router = createRouter(loadAIConfig({}));
  it('coach is always OpenAI; intake is Gemini; narrative OFF by default', () => {
    expect(router.route('coach_synthesis', 'standard').provider).toBe('openai');
    expect(router.route('coach_chat', 'premium').provider).toBe('openai');
    expect(router.route('video_intake', 'premium').provider).toBe('gemini');
    expect(router.route('premium_narrative', 'standard').enabled).toBe(false);
  });
});

describe('OpenAI coach provider', () => {
  const config = loadAIConfig({});

  it('returns a schema-valid CoachSynthesis on success', async () => {
    const coach = createOpenAICoachProvider({ config, complete: async () => ok(VALID_COACH), now: () => '2026-01-01T00:00:00Z' });
    const { result, trace } = await coach.synthesize({ evidence: EVIDENCE, sport: 'golf', mode: 'standard' });
    expect(result).not.toBeNull();
    expect(CoachSynthesisSchema.safeParse(result).success).toBe(true);
    expect(trace.status).toBe('ok');
    expect(trace.provider).toBe('openai');
  });

  it('returns null (no fabrication) when the gateway falls back', async () => {
    const coach = createOpenAICoachProvider({
      config,
      complete: async () => ({ text: '', provider: 'none', model: null, parsed: null, fallback: 'no_provider' }),
    });
    const { result, trace } = await coach.synthesize({ evidence: EVIDENCE, sport: 'golf', mode: 'standard' });
    expect(result).toBeNull();
    expect(trace.fallbackUsed).toBe(true);
  });

  it('rejects output that fails schema validation', async () => {
    const coach = createOpenAICoachProvider({ config, complete: async () => ok({ summary: 'incomplete' }) });
    const { result, trace } = await coach.synthesize({ evidence: EVIDENCE, sport: 'golf', mode: 'standard' });
    expect(result).toBeNull();
    expect(trace.errorCode).toBe('schema_invalid');
  });
});

describe('Claude narrative provider', () => {
  it('is skipped (disabled) by default and never calls the model', async () => {
    let called = false;
    const config = loadAIConfig({});
    const narr = createClaudeNarrativeProvider({
      config,
      complete: async () => { called = true; return ok({}); },
    });
    const { result, skippedReason, trace } = await narr.narrate({ evidence: EVIDENCE, coach: VALID_COACH, sport: 'golf' });
    expect(result).toBeNull();
    expect(skippedReason).toBe('disabled_by_default');
    expect(trace.status).toBe('skipped');
    expect(called).toBe(false);
  });

  it('runs when enabled and never fails the job on provider fallback', async () => {
    const config = loadAIConfig({ ENABLE_CLAUDE_PREMIUM_NARRATIVE: 'true' });
    const narr = createClaudeNarrativeProvider({
      config,
      complete: async () => ({ text: '', provider: 'anthropic', model: null, parsed: null, fallback: 'error' }),
    });
    const { result, trace } = await narr.narrate({ evidence: EVIDENCE, coach: VALID_COACH, sport: 'golf' });
    expect(result).toBeNull(); // degraded, but no throw
    expect(trace.status).toBe('skipped');
  });
});
