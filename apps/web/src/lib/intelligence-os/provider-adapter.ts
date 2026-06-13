// ============================================================
// SwingVantage — First-Party Intelligence OS · third-party AI adapter
// ------------------------------------------------------------
// Bridges the router's pluggable `callThirdParty` to the real AI gateway
// (lib/ai/gateway). Keyless-first: if the gateway returns a fallback (no
// provider / over budget / error) we surface it so the router records an
// honest fallback event rather than fabricating an answer.
//
// Token counts the gateway doesn't expose are ESTIMATED from text length
// (~4 chars/token) and labeled as estimates in the activity event.
// ============================================================

import { complete, type ModelTier, type AiProviderId } from '@/lib/ai/gateway';
import type { Provider } from './types';
import type { NormalizedRequest, ThirdPartyResult } from './router';

function estTokens(text: string): number {
  return Math.max(1, Math.ceil((text || '').length / 4));
}

function toProvider(p: AiProviderId): Provider {
  return p === 'none' ? 'none' : p;
}

export interface GatewayAdapterOptions {
  /** Budget/metering label, e.g. 'ai-coach'. */
  spendLabel: string;
  /** Builds the system prompt for this feature. */
  system: string;
  tier?: ModelTier;
  maxTokens?: number;
}

/**
 * Returns a `callThirdParty` suitable for resolveWithFirstPartyIntelligence.
 * On a gateway fallback it throws so the router can decide; callers that want a
 * soft path should catch and present their own data-grounded placeholder.
 */
export function gatewayCallThirdParty(opts: GatewayAdapterOptions): (req: NormalizedRequest) => Promise<ThirdPartyResult> {
  return async (req: NormalizedRequest): Promise<ThirdPartyResult> => {
    const started = Date.now();
    const res = await complete({
      system: opts.system,
      messages: [{ role: 'user', content: req.request }],
      tier: opts.tier ?? 'balanced',
      maxTokens: opts.maxTokens,
      spendLabel: opts.spendLabel,
    });
    const latencyMs = Date.now() - started;
    const inputTokens = estTokens(opts.system + req.request);
    const outputTokens = estTokens(res.text);
    return {
      text: res.text,
      provider: toProvider(res.provider),
      model: res.model,
      inputTokens,
      outputTokens,
      latencyMs,
      confidence: res.fallback ? 0.0 : 0.65,
    };
  };
}
