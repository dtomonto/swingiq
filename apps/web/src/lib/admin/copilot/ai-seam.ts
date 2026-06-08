// ============================================================
// SwingVantage Admin — Copilot: optional AI adapter seam (SERVER-ONLY)
// ------------------------------------------------------------
// The deterministic engine (engine.ts) is the always-on brain. This seam
// is where a real model could later add free-form answers ON TOP of the
// computed ones — env-gated and OFF by default, in line with the
// project's keyless-first, spend-capped ethos.
//
// It is deliberately a CLEAN INTERFACE, not a fake integration: with no
// adapter registered, `runCopilotAi` returns null and the API route falls
// back to the deterministic answer. Wiring a provider is a single
// `registerCopilotAiAdapter(...)` call behind a budget/flag check.
// ============================================================

import type { CopilotAnswer, CopilotSnapshot } from './types';

export interface CopilotAiRequest {
  query: string;
  snapshot: CopilotSnapshot;
  /** The deterministic answer, so the model can refine rather than replace. */
  computed: CopilotAnswer;
}

export interface CopilotAiAdapter {
  id: string;
  /** Return an enhanced answer, or null to fall back to the computed one. */
  generate: (req: CopilotAiRequest) => Promise<CopilotAnswer | null>;
}

let adapter: CopilotAiAdapter | null = null;

/** Register a model adapter (call once at startup behind a budget/flag gate). */
export function registerCopilotAiAdapter(a: CopilotAiAdapter): void {
  adapter = a;
}

/**
 * True only when an admin explicitly enables the AI layer AND an adapter is
 * registered. Default false → the Copilot stays fully deterministic/keyless.
 */
export function isCopilotAiEnabled(): boolean {
  return Boolean(adapter) && process.env.ADMIN_COPILOT_AI === '1';
}

/**
 * Run the AI layer if enabled; otherwise return null so the caller uses the
 * deterministic answer. The returned answer is tagged `generatedBy: 'ai'` and
 * is clearly labeled as such in the UI. Never throws — degrades to null.
 */
export async function runCopilotAi(req: CopilotAiRequest): Promise<CopilotAnswer | null> {
  if (!adapter || !isCopilotAiEnabled()) return null;
  try {
    const answer = await adapter.generate(req);
    return answer ? { ...answer, generatedBy: 'ai' } : null;
  } catch {
    return null; // honest fallback to the computed answer
  }
}
