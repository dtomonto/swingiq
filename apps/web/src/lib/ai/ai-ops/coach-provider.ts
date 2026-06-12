// ============================================================
// SwingVantage — AI Operations: OpenAI coach provider (§2.1/§4.3)
// ------------------------------------------------------------
// The primary user-facing reasoning provider. Thin, well-tested layer over
// the existing lib/ai/gateway (OpenAI, budget, retry, structured output) —
// it does NOT re-implement provider plumbing. Consumes normalized evidence,
// returns a validated CoachSynthesis ("one fix / one plan / one retest").
// Keyless-first: on any gateway fallback it returns null so the caller
// renders its data-grounded placeholder — it never fabricates.
// ============================================================

import { complete as gatewayComplete, type AiCompleteRequest, type AiCompleteResult } from '@/lib/ai/gateway';
import type { AIModelConfig } from './model-config';
import { seedPromptRegistry } from './prompts';
import {
  COACH_SYNTHESIS_JSON_SCHEMA,
  CoachSynthesisSchema,
  type CoachSynthesis,
  type ProviderTrace,
} from './schemas';
import type { CoachInput, CoachProvider } from './types';

type CompleteFn = (req: AiCompleteRequest) => Promise<AiCompleteResult>;

/** Compact, honesty-preserving evidence digest for the coach prompt. */
function evidenceToPrompt(input: CoachInput): string {
  const e = input.evidence;
  const claims = e.evidenceClaims
    .map((c) => `- [${c.supportLevel} · conf ${c.confidence.toFixed(2)}] ${c.claim}`)
    .join('\n');
  const limits = e.analysisLimitations.length ? `\nLimitations: ${e.analysisLimitations.join('; ')}` : '';
  const conflicts = e.conflicts.length ? `\nConflicts: ${e.conflicts.join('; ')}` : '';
  const prior = input.priorEvidence
    ? `\n\nPRIOR ANALYSIS (for explicit comparison only — compare evidence-backed claims):\n${input.priorEvidence.evidenceClaims
        .map((c) => `- [${c.supportLevel}] ${c.claim}`)
        .join('\n')}`
    : '';
  return [
    `Sport: ${input.sport ?? 'unknown'}${input.skillLevel ? ` · level: ${input.skillLevel}` : ''}`,
    `Overall evidence confidence: ${e.confidenceScore.toFixed(2)}`,
    `Evidence claims:\n${claims || '(none)'}`,
    conflicts,
    limits,
    prior,
    `\nReturn a CoachSynthesis JSON object. Ground every statement in the evidence above; never invent measurements, timestamps, or comparisons.`,
  ].join('\n');
}

export interface CreateCoachOptions {
  config: AIModelConfig;
  /** Injectable for tests; defaults to the real gateway. */
  complete?: CompleteFn;
  now?: () => string;
}

export function createOpenAICoachProvider(opts: CreateCoachOptions): CoachProvider {
  const complete = opts.complete ?? gatewayComplete;
  const now = opts.now ?? (() => new Date().toISOString());
  const prompt = seedPromptRegistry.get('coach_synthesis');

  return {
    name: 'openai',
    async synthesize(input: CoachInput) {
      const startedAt = now();
      const premium = input.mode === 'premium';
      // null model => gateway tier default (works today); OPENAI_COACH_MODEL overrides.
      const model = premium
        ? opts.config.openai.coachModel
        : opts.config.openai.coachCostModel ?? opts.config.openai.coachModel;

      const res = await complete({
        provider: 'openai',
        model: model ?? undefined,
        tier: premium ? 'powerful' : 'balanced',
        system: prompt.body,
        messages: [{ role: 'user', content: evidenceToPrompt(input) }],
        maxTokens: opts.config.openai.maxOutputTokens,
        spendLabel: 'ai-coach-synthesis',
        jsonSchema: { name: 'CoachSynthesis', schema: COACH_SYNTHESIS_JSON_SCHEMA as Record<string, unknown> },
      });

      const base: ProviderTrace = {
        stage: 'coach_synthesis',
        provider: 'openai',
        model: res.model,
        promptVersion: prompt.version,
        startedAt,
        completedAt: now(),
        latencyMs: null,
        inputTokens: null,
        outputTokens: null,
        estimatedCost: null,
        status: res.fallback ? (res.fallback === 'error' ? 'error' : 'skipped') : 'ok',
        errorCode: res.fallback ?? null,
        errorMessage: res.fallback ? `coach unavailable: ${res.fallback}` : null,
        retryCount: 0,
        fallbackUsed: Boolean(res.fallback),
        sanitizedRequest: null,
        sanitizedResponse: null,
      };

      if (res.fallback || res.parsed == null) {
        return { result: null, trace: { ...base, status: base.status === 'ok' ? 'error' : base.status } };
      }

      const parsed = CoachSynthesisSchema.safeParse(res.parsed);
      if (!parsed.success) {
        return {
          result: null,
          trace: { ...base, status: 'error', errorCode: 'schema_invalid', errorMessage: 'coach output failed schema validation' },
        };
      }
      return { result: parsed.data, trace: base };
    },
  };
}
