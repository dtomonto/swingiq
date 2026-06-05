// ============================================================
// SwingVantage — Agent Provider: Local Rule Provider (default)
// ------------------------------------------------------------
// The deterministic source of truth. It NEVER calls an external
// service, always available, and returns structured copy exactly
// as the workflows produced it. The app is fully functional with
// only this provider — no AI keys required.
// ============================================================

import type { SportId } from '@swingiq/core';

export interface EnhanceInput {
  /** The deterministic, already-grounded text to (optionally) refine. */
  text: string;
  sport: SportId;
  tone?: 'warm' | 'concise' | 'coach';
}

export interface AgentProvider {
  id: string;
  /** True if this provider can be used right now. */
  isAvailable(): boolean;
  /**
   * Optionally rewrite deterministic copy into warmer/clearer language.
   * MUST be safe to fail — callers fall back to the input text.
   */
  enhanceSummary(input: EnhanceInput): Promise<string>;
}

export const localRuleProvider: AgentProvider = {
  id: 'local',
  isAvailable: () => true,
  // Deterministic provider returns the grounded text unchanged.
  enhanceSummary: async ({ text }) => text,
};
