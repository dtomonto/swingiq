// ============================================================
// SwingVantage — Agent Provider: LLM Provider (optional, flagged)
// ------------------------------------------------------------
// An OPTIONAL enhancer that can rewrite deterministic copy into
// warmer language. It is OFF by default and gated behind a
// feature flag. It never sends raw user data — only already-
// grounded summary text. Any failure falls back silently to the
// deterministic text, so the app never breaks when AI is absent.
//
// ENABLE (optional):
//   apps/web/.env.local →  NEXT_PUBLIC_AGENTS_LLM=1
//   (and implement /api/agents/enhance server-side to use a key)
// ============================================================

import { localRuleProvider, type AgentProvider, type EnhanceInput } from './local-rule-provider';

function llmEnabled(): boolean {
  // Client-readable flag. The actual provider key stays server-side in the
  // /api/agents/enhance route (not implemented by default).
  return process.env.NEXT_PUBLIC_AGENTS_LLM === '1';
}

export const llmProvider: AgentProvider = {
  id: 'llm',
  isAvailable: () => llmEnabled(),
  enhanceSummary: async (input: EnhanceInput) => {
    if (!llmEnabled()) return input.text;
    try {
      const res = await fetch('/api/agents/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) return input.text;
      const data = (await res.json()) as { text?: string };
      return typeof data.text === 'string' && data.text.trim() ? data.text : input.text;
    } catch {
      // Network/availability failure — deterministic fallback.
      return input.text;
    }
  },
};

/** Returns the LLM provider when enabled, otherwise the deterministic one. */
export function getActiveProvider(): AgentProvider {
  return llmProvider.isAvailable() ? llmProvider : localRuleProvider;
}
