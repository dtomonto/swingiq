/**
 * SwingVantage AI Coach API Route
 *
 * POST /api/ai-coach
 *
 * Accepts a structured coaching context (pre-built by the client using
 * the deterministic diagnostic engine) and returns an AI-generated
 * narrative response. The AI is given only pre-computed stats — it
 * never has access to raw user data, session IDs, or secrets.
 *
 * Security:
 * - API key is server-side only (never sent to client)
 * - Request body is validated and sanitized
 * - Prompt injection guardrails are applied
 * - No PII beyond first name is passed to the AI
 */

import { NextRequest, NextResponse } from 'next/server';
import { buildCoachPrompt, validateUserQuestion, type CoachContext } from '@/lib/ai-coach-prompts';
import { validateGrounding } from '@/lib/ai-coach/grounding';
import { getCachedResponse, setCachedResponse } from '@/lib/ai-coach/response-cache';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { clientIp } from '@/lib/security/client-ip';
import { complete } from '@/lib/ai/gateway';
import {
  COACH_RESPONSE_JSON_SCHEMA,
  coerceStructuredCoachResponse,
  coachMessageFrom,
} from '@/lib/ai-coach/structured';
import { selectCoachTier } from '@/lib/ai-coach/tiering';
import { getAuthenticatedUser } from '@/lib/supabase-server';
import { isUserAiPaused, meterUserAiUsage } from '@/lib/ai/user-ai';
import { isAiFeatureEnabled } from '@/lib/ai/ai-features';
import { resolveLiveRoute } from '@/lib/ai/ai-ops/effective-routing';
import type { AiProviderId } from '@/lib/ai/gateway';

// ── Handler ───────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // IP-based rate limiting
  const ip = clientIp(req);
  const rl = await checkRateLimit(`${ip}:ai-coach`, { limit: 20, windowMs: 60_000 });
  if (!rl.allowed) {
    return rateLimitResponse();
  }

  // Parse and validate request body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (typeof body !== 'object' || body === null || !('user_question' in body)) {
    return NextResponse.json({ error: 'Missing user_question.' }, { status: 400 });
  }

  const ctx = body as CoachContext;

  // Validate the question (sport-aware guardrails)
  const questionError = validateUserQuestion(ctx.user_question ?? '', ctx.active_sport);
  if (questionError) {
    return NextResponse.json({ error: questionError }, { status: 400 });
  }

  // Build the structured prompt — AI only gets pre-computed stats
  const { system, user } = buildCoachPrompt(ctx);

  // #6 response cache: an identical (context, question) request skips the paid
  // API call entirely. App-level, keyed on a stable hash of the structured ctx.
  const cached = getCachedResponse(ctx);
  if (cached) {
    return NextResponse.json({
      message: cached,
      grounding: validateGrounding(cached, ctx),
      cached: true,
      aiMeta: { cached: true }, // served from cache — no provider call
    });
  }

  // Per-user AI switch: when an operator has turned AI off for this account,
  // serve the same data-grounded placeholder the keyless/over-budget paths use
  // instead of a paid call. Never fabricates a coaching answer.
  const authedUser = await getAuthenticatedUser();
  const userId = authedUser?.id ?? 'anonymous';
  if (await isUserAiPaused(userId)) {
    const placeholder = buildDevPlaceholderResponse(ctx);
    return NextResponse.json({
      message: placeholder,
      grounding: validateGrounding(placeholder, ctx),
      aiMeta: { fallback: 'paused' },
    });
  }

  // Operator AI feature switch (admin "AI Feature Controls"): when AI Coach is
  // turned off for the whole product, serve the same data-grounded placeholder.
  if (!(await isAiFeatureEnabled('ai-coach'))) {
    const placeholder = buildDevPlaceholderResponse(ctx);
    return NextResponse.json({
      message: placeholder,
      grounding: validateGrounding(placeholder, ctx),
      aiMeta: { fallback: 'feature_off' },
    });
  }

  // ── Strategic routing (AI Provider Control Center) ─────────
  // Consult the live route for the coach-chat task. An admin can disable coaching
  // (serve the placeholder, no paid call) or re-route it to a specific
  // provider/model. We apply the provider/model as a hard override ONLY when
  // it's usable (enabled + that provider's key is set); otherwise we defer to the
  // gateway's existing env resolution, so unconfigured overrides never error.
  const route = await resolveLiveRoute('coach_chat');
  if (!route.enabled) {
    const placeholder = buildDevPlaceholderResponse(ctx);
    return NextResponse.json({
      message: placeholder,
      grounding: validateGrounding(placeholder, ctx),
      aiMeta: { fallback: 'disabled' },
    });
  }

  // ── Generate via the provider-agnostic AI gateway ─────────
  // The gateway centralizes provider/key resolution, model tiering, the daily
  // AI-budget kill-switch + spend recording, and a single transient-error
  // retry. It returns a `fallback` (no_provider / over_budget / error) instead
  // of throwing, so keyless installs and over-budget days serve the same
  // data-grounded placeholder the route always has.
  const startedAt = Date.now();
  const result = await complete({
    system,
    messages: [{ role: 'user', content: user }],
    // #4 difficulty routing: low-confidence/complex questions get a stronger tier.
    tier: selectCoachTier(ctx),
    spendLabel: 'ai-coach',
    // Control Center override (only when usable; else gateway resolves from env).
    provider: route.usable ? (route.provider as AiProviderId) : undefined,
    model: route.usable && route.model ? route.model : undefined,
    // #1 structured output: the model fills a JSON schema (coaching_text +
    // evidence/fix/drill/safety) so the app can parse + trust-check the pieces.
    jsonSchema: COACH_RESPONSE_JSON_SCHEMA,
  });
  const latencyMs = Date.now() - startedAt;

  // Non-PII AI call metadata for the AI-Coach-Quality funnel (P2). Provider id +
  // resolved model + measured latency only — never the question or answer text.
  const aiMeta = { provider: result.provider, model: result.model, latencyMs };

  if (result.fallback === 'error') {
    return NextResponse.json(
      {
        error: 'AI service error. Please try again in a moment.',
        aiMeta: { ...aiMeta, fallback: 'error' },
      },
      { status: 502 },
    );
  }

  if (!result.fallback) {
    // Prefer the structured coaching_text; fall back to raw text if the model
    // returned prose / parsing failed. `structured` is additive — the UI keeps
    // rendering `message`.
    const structured = coerceStructuredCoachResponse(result.parsed);
    const message = coachMessageFrom(structured, result.text);
    setCachedResponse(ctx, message);
    await meterUserAiUsage(userId, 'ai-coach');
    // #2 grounding: surface whether the response's measurement claims trace to
    // the player's data so clients can flag/regenerate ungrounded answers.
    return NextResponse.json({
      message,
      structured,
      grounding: validateGrounding(message, ctx),
      aiMeta: { ...aiMeta, cached: false },
    });
  }

  // no_provider (keyless) or over_budget → data-grounded placeholder.
  const placeholder = buildDevPlaceholderResponse(ctx);
  return NextResponse.json({
    message: placeholder,
    grounding: validateGrounding(placeholder, ctx),
    aiMeta: { ...aiMeta, fallback: result.fallback },
  });
}

/** Returns a data-grounded placeholder when no AI key is configured. */
function buildDevPlaceholderResponse(ctx: CoachContext): string {
  const sport = ctx.active_sport ?? 'golf';
  const s = ctx.current_session_stats;
  const hasGolfData = s && Object.keys(s).length > 0;
  const hasVideoData = !!ctx.primary_video_issue;
  const hasAnyData = hasGolfData || hasVideoData;

  if (!hasAnyData) {
    const sportActions: Record<string, string> = {
      golf: 'import a CSV from your launch monitor using the Import Data section',
      tennis: 'upload a video of your stroke using the Video Analysis section',
      baseball: 'upload a swing video using the Video Analysis section',
      softball_slow: 'upload a swing video using the Video Analysis section',
      softball_fast: 'upload a swing video using the Video Analysis section',
    };
    const action = sportActions[sport] ?? sportActions.golf;
    return (
      `I don't have any ${sport.replace('_', ' ')} analysis data yet. Please ${action}, ` +
      `then come back and I'll answer your question using your actual data.\n\n` +
      `What to do next: Upload your first video or session to get started.`
    );
  }

  const lines: string[] = [];

  // Golf-specific
  if (sport === 'golf') {
    if (ctx.primary_diagnosis_name) {
      lines.push(`Based on your data, your primary pattern is: ${ctx.primary_diagnosis_name}.`);
      if (ctx.primary_diagnosis_confidence !== undefined) {
        lines.push(`The engine detected this with ${ctx.primary_diagnosis_confidence}% confidence.`);
      }
    }
    if (s?.avg_face_to_path !== undefined) {
      const ftp = s.avg_face_to_path;
      if (Math.abs(ftp) > 3) {
        lines.push(
          `Your face-to-path is ${ftp > 0 ? '+' : ''}${ftp.toFixed(1)}° — ` +
          `${ftp > 0 ? 'open face causing fade/slice' : 'closed face causing draw/hook'}.`,
        );
      }
    }
    if (s?.avg_carry !== undefined && s?.shot_count !== undefined) {
      lines.push(`You averaged ${s.avg_carry.toFixed(0)} yards carry over ${s.shot_count} shots.`);
    }
  }

  // Non-golf: video analysis
  if (sport !== 'golf' && ctx.primary_video_issue) {
    lines.push(`Your latest video analysis identified: ${ctx.primary_video_issue}.`);
    lines.push(`This is a pose-based estimate — confidence is moderate.`);
  }

  lines.push('');
  lines.push(
    `Note: Full AI narrative responses require an API key. Set AI_PROVIDER=openai or AI_PROVIDER=anthropic ` +
    `in your apps/web/.env.local file and add your key.`,
  );

  lines.push('');
  lines.push(`What to do next: ${ctx.engine_summary ?? 'Check the Training page for your current drill plan.'}`);

  return lines.join('\n');
}
