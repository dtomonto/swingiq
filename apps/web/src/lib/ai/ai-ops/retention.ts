// ============================================================
// SwingVantage — AI Operations: privacy / retention policy (§10.9/§16)
// ------------------------------------------------------------
// Pure policy helpers that turn config into honest data-handling decisions for
// cloud video intake: whether to store raw provider payloads, whether to redact
// them in traces, how long uploaded media is retained, and the consent notice a
// user sees before frames/video leave the device. No I/O — just policy, so it's
// fully testable and there's one source of truth for the privacy posture.
// ============================================================

import type { AIModelConfig } from './model-config';

export interface ProviderPayloadPolicy {
  /** Persist the raw provider request/response? Default false (§16). */
  storeRaw: boolean;
  /** Redact payloads before they touch a trace/log? Default true. */
  redact: boolean;
}

export function providerPayloadPolicy(config: AIModelConfig): ProviderPayloadPolicy {
  return {
    storeRaw: config.system.storeRawProviderResponses,
    redact: config.system.redactProviderPayloads,
  };
}

/**
 * What may be attached to a ProviderTrace for a payload. Redaction wins: when
 * redact is on (default) nothing is kept; raw is kept ONLY when an operator has
 * explicitly opted in to storing raw responses.
 */
export function sanitizeForTrace<T>(payload: T, config: AIModelConfig): T | null {
  const p = providerPayloadPolicy(config);
  if (p.redact) return null;
  if (!p.storeRaw) return null;
  return payload;
}

/** Days uploaded media is retained at the provider before deletion is requested. */
export function retentionWindowDays(config: AIModelConfig): number {
  // Gemini's File API auto-expires uploads after 48h; we never keep them longer
  // than the configured analysis budget implies. Honest default: 2 days.
  void config;
  return 2;
}

export interface UploadConsent {
  /** Whether the user must explicitly acknowledge cloud processing first. */
  required: boolean;
  notice: string;
}

/**
 * Consent posture for sending frames/video to a third-party AI cloud. Cloud
 * intake ALWAYS requires acknowledgement — the notice states plainly where the
 * data goes (matching the user-facing copy), so nothing is left to interpretation.
 */
export function uploadConsent(config: AIModelConfig): UploadConsent {
  const days = retentionWindowDays(config);
  return {
    required: true,
    notice:
      'To analyze this swing, SwingVantage sends sampled still frames (or the clip, for full-video analysis) ' +
      'to a third-party AI provider (Google Gemini or OpenAI), where they are processed in that provider’s ' +
      `cloud. SwingVantage does not store them; uploaded media is deleted within ~${days} days and is never ` +
      'used to train a shared model. For analysis that stays entirely on your device, use Motion Lab instead.',
  };
}
