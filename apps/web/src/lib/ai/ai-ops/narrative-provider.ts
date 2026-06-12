// ============================================================
// SwingVantage — AI Operations: Claude narrative provider (§2.4/§4.5)
// ------------------------------------------------------------
// OPTIONAL premium long-form summarizer. DISABLED BY DEFAULT. Runs only
// after OpenAI synthesis, polishes — never adds technical claims — and
// fails gracefully (a 'skipped' trace) without failing the core job.
// Phase 1 ships the disabled-by-default path + the gateway-backed call.
// ============================================================

import { complete as gatewayComplete, type AiCompleteRequest, type AiCompleteResult } from '@/lib/ai/gateway';
import type { AIModelConfig } from './model-config';
import { seedPromptRegistry } from './prompts';
import type { ProviderTrace } from './schemas';
import type { NarrativeInput, NarrativeProvider } from './types';

type CompleteFn = (req: AiCompleteRequest) => Promise<AiCompleteResult>;

export interface CreateNarrativeOptions {
  config: AIModelConfig;
  complete?: CompleteFn;
  now?: () => string;
}

export function createClaudeNarrativeProvider(opts: CreateNarrativeOptions): NarrativeProvider {
  const complete = opts.complete ?? gatewayComplete;
  const now = opts.now ?? (() => new Date().toISOString());
  const prompt = seedPromptRegistry.get('premium_narrative');

  const skip = (reason: string): { result: null; skippedReason: string; trace: ProviderTrace } => ({
    result: null,
    skippedReason: reason,
    trace: {
      stage: 'premium_narrative',
      provider: 'anthropic',
      model: opts.config.claude.model,
      promptVersion: prompt.version,
      startedAt: now(),
      completedAt: now(),
      latencyMs: 0,
      inputTokens: null,
      outputTokens: null,
      estimatedCost: null,
      status: 'skipped',
      errorCode: reason,
      errorMessage: null,
      retryCount: 0,
      fallbackUsed: false,
      sanitizedRequest: null,
      sanitizedResponse: null,
    },
  });

  return {
    name: 'anthropic',
    async narrate(input: NarrativeInput) {
      // Disabled by default — opt-in via ENABLE_CLAUDE_PREMIUM_NARRATIVE.
      if (!opts.config.claude.enabled) return skip('disabled_by_default');

      const startedAt = now();
      const res = await complete({
        provider: 'anthropic',
        model: opts.config.claude.model ?? undefined,
        tier: 'balanced',
        system: prompt.body,
        messages: [
          {
            role: 'user',
            content: `Coach synthesis to polish (do NOT add new technical claims; preserve all limitations):\n${JSON.stringify(
              input.coach,
            )}`,
          },
        ],
        maxTokens: 2000,
        spendLabel: 'ai-premium-narrative',
      });

      const trace: ProviderTrace = {
        stage: 'premium_narrative',
        provider: 'anthropic',
        model: res.model,
        promptVersion: prompt.version,
        startedAt,
        completedAt: now(),
        latencyMs: null,
        inputTokens: null,
        outputTokens: null,
        estimatedCost: null,
        status: res.fallback ? 'skipped' : 'ok',
        errorCode: res.fallback ?? null,
        errorMessage: null,
        retryCount: 0,
        fallbackUsed: Boolean(res.fallback),
        sanitizedRequest: null,
        sanitizedResponse: null,
      };
      // A narrative failure must NEVER fail the job — degrade to null.
      return { result: res.fallback ? null : res.text, skippedReason: res.fallback ?? undefined, trace };
    },
  };
}
