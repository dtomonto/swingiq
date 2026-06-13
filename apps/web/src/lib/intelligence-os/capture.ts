// ============================================================
// SwingVantage — First-Party Intelligence OS · capture helper (SERVER-ONLY)
// ------------------------------------------------------------
// A best-effort, non-blocking seam for existing AI features to adopt the
// Intelligence OS WITHOUT changing their behavior. Call captureAiInteraction()
// after your feature produces an answer — it logs an AI activity event and (if
// reusable + non-personalized) creates a knowledge candidate.
//
// It NEVER throws and NEVER blocks the caller's response path: every error is
// swallowed. This keeps live features (AI coach, video analysis, audits) fully
// working while the system quietly learns from them.
// ============================================================

import { getSettings } from './store';
import {
  normalizeIntelligenceRequest, logAIActivity, createKnowledgeCandidate, recordPattern,
} from './router';
import { hashText } from './fingerprint';
import { SPORTS } from './types';
import type { Sport, SourceSystem, Provider, PatternType } from './types';

// Map the various sport identifiers used across the app to our Sport union.
const SPORT_ALIASES: Record<string, Sport> = {
  golf: 'golf', tennis: 'tennis', baseball: 'baseball',
  softball_slow: 'softball-slowpitch', softball_slowpitch: 'softball-slowpitch', slowpitch: 'softball-slowpitch',
  softball_fast: 'softball-fastpitch', softball_fastpitch: 'softball-fastpitch', fastpitch: 'softball-fastpitch',
  pickleball: 'pickleball', padel: 'padel',
};

export function coerceSport(value: string | null | undefined): Sport {
  if (!value) return 'none';
  if (SPORTS.includes(value as Sport)) return value as Sport;
  return SPORT_ALIASES[value] ?? 'none';
}

function estTokens(text: string): number {
  return Math.max(1, Math.ceil((text || '').length / 4));
}

export interface CaptureInput {
  sourceSystem: SourceSystem;
  feature: string;
  sport?: string | null;
  /** The user question / prompt that drove the answer. */
  request: string;
  /** The answer text the feature produced. */
  response: string;
  provider: Provider;
  model: string | null;
  inputTokens?: number;
  outputTokens?: number;
  latencyMs?: number | null;
  /** Raw user id — hashed before storage (never stored raw). */
  userId?: string | null;
  confidenceScore?: number;
  relatedVideoId?: string | null;
  relatedReportId?: string | null;
  /** Set false for stylistic rephrases that shouldn't become knowledge. */
  promote?: boolean;
}

/**
 * Capture an AI interaction into the Intelligence OS. Best-effort and
 * non-blocking — safe to call as `void captureAiInteraction(...)`.
 */
export async function captureAiInteraction(input: CaptureInput): Promise<void> {
  try {
    if (!input.request || !input.response) return;
    const settings = await getSettings();
    const req = normalizeIntelligenceRequest({
      sourceSystem: input.sourceSystem,
      feature: input.feature,
      sport: coerceSport(input.sport),
      request: input.request,
      userIdHash: input.userId && input.userId !== 'anonymous' ? hashText(input.userId) : null,
      relatedVideoId: input.relatedVideoId ?? null,
      relatedReportId: input.relatedReportId ?? null,
    }, settings);

    const event = await logAIActivity({
      req,
      provider: input.provider,
      model: input.model,
      response: input.response,
      inputTokens: input.inputTokens ?? estTokens(input.request),
      outputTokens: input.outputTokens ?? estTokens(input.response),
      latencyMs: input.latencyMs ?? null,
      confidenceScore: input.confidenceScore ?? 0.6,
    });

    // Promotion is internally gated by confidence + privacy/personalization.
    if (input.promote !== false) await createKnowledgeCandidate(event, input.response, settings);
  } catch {
    // Best-effort: instrumentation must never affect the live feature.
  }
}

// ── First-party (deterministic) recommendation capture ────────
// Drill/retest plans are generated deterministically (no third-party AI), so
// they cost nothing — but capturing them lets recurring recommendations be
// deduped into pattern memories and surfaced as reusable first-party knowledge.
// provider is recorded as 'first-party' (zero third-party cost).
export interface RecordRecommendationInput {
  kind: 'drill' | 'retest';
  /** The user intent / situation that produced the recommendation. */
  intent: string;
  /** The recommendation text (drill name + why, or retest plan summary). */
  recommendation: string;
  sport?: string | null;
  affectedFeature?: string;
  userId?: string | null;
}

export async function recordFirstPartyRecommendation(input: RecordRecommendationInput): Promise<void> {
  try {
    if (!input.intent || !input.recommendation) return;
    const settings = await getSettings();
    const sourceSystem: SourceSystem = input.kind === 'drill' ? 'drill-plan' : 'retest-plan';
    const patternType: PatternType = input.kind === 'drill'
      ? 'recurring-drill-recommendation' : 'recurring-retest-recommendation';
    const feature = input.affectedFeature ?? (input.kind === 'drill' ? 'drill-plan' : 'retest-plan');
    const sport = coerceSport(input.sport);

    const req = normalizeIntelligenceRequest({
      sourceSystem, feature, sport, request: input.intent,
      userIdHash: input.userId && input.userId !== 'anonymous' ? hashText(input.userId) : null,
    }, settings);

    const event = await logAIActivity({
      req, provider: 'first-party', model: null, response: input.recommendation,
      inputTokens: 0, outputTokens: 0, costCents: 0, confidenceScore: 0.7,
    });

    // Dedupe recurring recommendations into a pattern memory.
    await recordPattern({
      patternTitle: `${input.kind === 'drill' ? 'Drill' : 'Retest'} recommendation: ${input.intent}`,
      patternType,
      summary: input.recommendation,
      affectedFeature: feature,
      affectedSport: sport,
      relatedEventId: event.id,
    });

    // Generic (non-personalized) recommendations also become knowledge candidates.
    if (!req.personalized) await createKnowledgeCandidate(event, input.recommendation, settings);
  } catch {
    // Best-effort.
  }
}
