// ============================================================
// SwingVantage — Mental Performance: optional AI-rewrite seam
//
// The deterministic coach (coach.ts) is always complete on its own. This seam
// lets an AI provider POLISH the prose later — but it is OFF by default and
// keyless-first, matching the project's cost-capped AI posture. It NEVER
// touches crisis/medical responses, and falls back to the deterministic
// output on any error. No provider is wired this pass (passthrough).
// ============================================================

import type { CoachResponse } from './types';
import { AI_FLAG_ENV } from './constants';

/** Server-side flag check. Default OFF. */
export function isMentalAiEnabled(): boolean {
  if (typeof process === 'undefined') return false;
  const v = process.env[AI_FLAG_ENV];
  return v === 'true' || v === '1';
}

export interface MentalAiEnhancer {
  /** Rewrite/polish a coaching response. Must preserve meaning + safety. */
  enhance(response: CoachResponse): Promise<CoachResponse>;
}

let enhancer: MentalAiEnhancer | null = null;

/** Register a provider-backed enhancer (e.g. behind the AI budget guard). */
export function registerMentalAiEnhancer(e: MentalAiEnhancer | null): void {
  enhancer = e;
}

/**
 * Optionally enhance a coaching response. Returns the input unchanged when the
 * flag is off, no enhancer is registered, the response is crisis/medical, or
 * the provider throws.
 */
export async function maybeEnhance(response: CoachResponse): Promise<CoachResponse> {
  if (response.kind !== 'coaching') return response; // never AI-touch safety paths
  if (!isMentalAiEnabled() || !enhancer) return response;
  try {
    return await enhancer.enhance(response);
  } catch {
    return response; // honest deterministic fallback
  }
}
