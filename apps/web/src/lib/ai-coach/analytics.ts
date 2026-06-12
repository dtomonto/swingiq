// ============================================================
// AI Coach — analytics helpers (P2 AI observability)
// ------------------------------------------------------------
// One place to emit the AI-Coach-Quality funnel so both coach surfaces (the
// /ai-coach page and the FloatingCoach widget) stay consistent. Mirrors the
// per-feature analytics modules (lib/tutorial/analytics, lib/video-studio).
//
// Privacy: props are non-PII operational metadata only — NEVER the question or
// answer text. AI metadata (provider/model/latency) is echoed by the route.
// ============================================================

import { track, ANALYTICS_EVENTS } from '@/lib/analytics';

export type CoachSurface = 'page' | 'floating';
export type CoachQuestionSource = 'typed' | 'suggested';
export type CoachRating = 'helpful' | 'not_helpful';

/** Non-PII AI call metadata echoed by POST /api/ai-coach (`aiMeta`). */
export interface CoachAiMeta {
  provider?: string;
  model?: string | null;
  latencyMs?: number;
  cached?: boolean;
  /** no_provider | over_budget | paused | disabled | error | null */
  fallback?: string | null;
}

/** The coach chat surface mounted (fire once). */
export function trackCoachOpened(sport: string, surface: CoachSurface): void {
  track(ANALYTICS_EVENTS.AI_COACH_OPENED, { sport, surface });
}

/** A question was sent to the coach. `source` distinguishes typed vs a suggestion chip. */
export function trackCoachQuestion(
  sport: string,
  surface: CoachSurface,
  source: CoachQuestionSource,
): void {
  track(ANALYTICS_EVENTS.AI_COACH_QUESTION_ASKED, { sport, surface, source });
}

/** A coach answer came back — with AI observability when a provider actually ran. */
export function trackCoachAnswered(
  sport: string,
  surface: CoachSurface,
  opts: { ok: boolean; aiMeta?: CoachAiMeta | null },
): void {
  const m = opts.aiMeta ?? undefined;
  track(ANALYTICS_EVENTS.AI_COACH_ANSWERED, {
    sport,
    surface,
    ok: opts.ok,
    cached: m?.cached ?? false,
    fallback: m?.fallback ?? null,
    ...(m?.provider ? { ai_provider: m.provider } : {}),
    ...(m?.model ? { ai_model: m.model } : {}),
    ...(typeof m?.latencyMs === 'number' ? { ai_latency_ms: m.latencyMs } : {}),
  });
}

/** The user rated a coach answer (helpful / not). The AI-Coach-Quality signal. */
export function trackCoachRated(sport: string, surface: CoachSurface, value: CoachRating): void {
  track(ANALYTICS_EVENTS.AI_COACH_ANSWER_RATED, { sport, surface, value });
}
