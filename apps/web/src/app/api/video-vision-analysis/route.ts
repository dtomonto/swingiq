// ============================================================
// SwingVantage — AI Visual Analysis API Route
// POST /api/video-vision-analysis
//
// Accepts still frames extracted from the user's swing video (in the
// browser) plus the sport + metadata, and runs REAL AI vision analysis.
//
// Privacy: only the downscaled still frames are received here — never
// the original video file. Frames are forwarded to the configured AI
// vision provider for analysis and are NOT persisted server-side.
//
// Strict no-fake rule: if no AI vision provider is configured, this
// route returns { configured: false } with a clear message. It never
// fabricates mechanical feedback.
// ============================================================

import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import {
  getVisionProvider,
  resolveVisionSpeed,
  dataUrlToFrame,
  VisualSportSchema,
  type AIVisualAnalysis,
  type VisionFrame,
  type VisionUserProfile,
  type PreviousAnalysisSummary,
  type VisionSpeed,
} from '@swingiq/core';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { clientIp } from '@/lib/security/client-ip';
import { aiBudgetExceeded, recordAiSpend } from '@/lib/ai-budget';
import { getAuthenticatedUser } from '@/lib/supabase-server';
import { isUserAiPaused, meterUserAiUsage } from '@/lib/ai/user-ai';
import { gateVideoAnalysis } from '@/lib/intelligence';
import { isAiFeatureEnabled } from '@/lib/ai/ai-features';
import { resolveLiveRoute } from '@/lib/ai/ai-ops/effective-routing';
import { recordAiCall } from '@/lib/ai/ai-ops/call-log';
import type { AiProviderName } from '@/lib/ai/ai-ops/schemas';
import { logServerAnalysisFailure } from '@/lib/reliability-os/ingest.server';
import {
  runAnalysisPipeline,
  createBridgedIntakeProvider,
  visionAnalysisToCoachSynthesis,
  createOpenAICoachProvider,
  getMeasurementProvider,
  loadAIConfig,
  type CoachSynthesis,
  type PoseMetricsLike,
} from '@/lib/ai/ai-ops';

/** Map an orchestrator provider name onto the vision provider's env value. */
function toVisionProviderEnv(p: AiProviderName): string {
  return p === 'gemini' ? 'google' : p; // openai/anthropic pass through
}

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_FRAMES = Math.min(
  Number(process.env.MAX_VIDEO_FRAMES_ANALYZED) || 16,
  24,
);
// Guard against oversized request bodies (base64 frames add up).
const MAX_TOTAL_FRAME_BYTES = 16 * 1024 * 1024; // ~16 MB of base64

interface VisionRequestBody {
  sport: string;
  frames: string[];
  metadata?: {
    durationSeconds?: number;
    resolution?: string;
    declaredCameraAngle?: string;
  };
  notes?: string | null;
  profile?: VisionUserProfile | null;
  previous?: PreviousAnalysisSummary | null;
  poseSummary?: string | null;
  /** Optional structured on-device pose proxies — feeds the orchestrator's
   *  measurement stage so the structured report can corroborate the frame
   *  vision. Absent → the structured report runs on vision evidence alone. */
  poseMetrics?: PoseMetricsLike | null;
  /** Speed tier requested by the client: fast | balanced | thorough. */
  speed?: string;
}

export async function POST(req: NextRequest) {
  // Rate limiting — vision calls are comparatively expensive.
  const ip = clientIp(req);
  const rl = await checkRateLimit(`${ip}:video-vision-analysis`, { limit: 12, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse();

  let body: VisionRequestBody;
  try {
    body = (await req.json()) as VisionRequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  // Validate sport.
  const sportResult = VisualSportSchema.safeParse(body.sport);
  if (!sportResult.success) {
    return NextResponse.json(
      { error: 'Unsupported or missing sport.' },
      { status: 400 },
    );
  }
  const sport = sportResult.data;

  // Validate frames.
  if (!Array.isArray(body.frames) || body.frames.length === 0) {
    return NextResponse.json(
      { error: 'No frames provided. Frame extraction may have failed — please retry.' },
      { status: 400 },
    );
  }

  const rawFrames = body.frames.slice(0, MAX_FRAMES);
  const totalBytes = rawFrames.reduce((sum, f) => sum + (typeof f === 'string' ? f.length : 0), 0);
  if (totalBytes > MAX_TOTAL_FRAME_BYTES) {
    return NextResponse.json(
      { error: 'Frame payload too large. Please try a shorter or lower-resolution video.' },
      { status: 413 },
    );
  }

  const frames: VisionFrame[] = [];
  for (const dataUrl of rawFrames) {
    const frame = typeof dataUrl === 'string' ? dataUrlToFrame(dataUrl) : null;
    if (frame) frames.push(frame);
  }
  if (frames.length === 0) {
    return NextResponse.json(
      { error: 'Frames were malformed. Please retry the analysis.' },
      { status: 400 },
    );
  }

  // Operator AI feature switch (admin "AI Feature Controls"): when video analysis
  // is turned off for the whole product, return the honest "off" response before
  // any provider work — the client shows its not-configured notice.
  if (!(await isAiFeatureEnabled('video-analysis'))) {
    return NextResponse.json(
      { configured: false, message: 'AI video analysis is turned off by the operator right now.' },
      { status: 200 },
    );
  }

  // Speed tier (fast | balanced | thorough). The client requests one; the
  // server maps it to a concrete model — a client never names a raw model.
  const speed: VisionSpeed = resolveVisionSpeed(body.speed);

  // ── Strategic routing (AI Provider Control Center) ─────────
  // Consult the live route for the video-intake task. An admin can disable video
  // understanding (honest "off" message, no paid call) or re-route it to a
  // specific provider/model. We only OVERLAY the provider/model env when the
  // admin has explicitly overridden AND that provider's key is set — otherwise
  // the operator's AI_VISION_PROVIDER env governs exactly as before.
  const route = await resolveLiveRoute('video_intake');
  if (!route.enabled) {
    return NextResponse.json(
      { configured: false, message: 'AI video analysis is turned off by the operator right now.' },
      { status: 200 },
    );
  }
  const visionEnv: typeof process.env =
    route.overridden && route.usable
      ? {
          ...process.env,
          AI_VISION_PROVIDER: toVisionProviderEnv(route.provider),
          ...(route.model ? { AI_VISION_MODEL: route.model } : {}),
        }
      : process.env;

  // Resolve the provider. With no key, this yields the disabled provider.
  const provider = getVisionProvider(visionEnv, { speed });
  if (!provider.isConfigured()) {
    const outcome = await provider.analyze({ sport, frames, metadata: {} });
    const message =
      outcome.configured === false
        ? outcome.reason
        : 'AI visual analysis is not currently configured.';
    return NextResponse.json({ configured: false, message }, { status: 200 });
  }

  // Per-user AI switch: an operator can disable AI for a single account. When
  // off, serve the same honest "not available" message instead of a paid call.
  const authedUser = await getAuthenticatedUser();
  const userId = authedUser?.id ?? 'anonymous';
  if (await isUserAiPaused(userId)) {
    return NextResponse.json(
      {
        configured: false,
        message:
          'AI swing analysis is turned off for your account. Please contact support if you believe this is a mistake.',
      },
      { status: 200 },
    );
  }

  // GAI Operating Mode gate. The platform posture (Default AI vs Cost-Saving),
  // the force-heuristic toggle, and the kill switch are all enforced here — this
  // expensive video route now respects the central Intelligence Router instead
  // of bypassing it. Provider config + budget keep their own dedicated guards
  // below; the gate governs WHETHER the paid path may run under the mode, records
  // the decision for observability, and fails open so it can only add safety.
  const gate = await gateVideoAnalysis({
    sport,
    issue: typeof body.notes === 'string' ? body.notes : undefined,
    userId: authedUser?.id ?? null,
    providerConfigured: true, // provider.isConfigured() verified above
  });
  if (!gate.allowAI) {
    return NextResponse.json({ configured: false, message: gate.message }, { status: 200 });
  }

  // Global daily AI-spend kill-switch (off unless AI_DAILY_BUDGET_CENTS is set).
  // When today's estimated budget is spent, pause paid vision calls instead of
  // running up the bill — surfaced honestly to the client as a temporary pause.
  if (await aiBudgetExceeded()) {
    return NextResponse.json(
      {
        configured: false,
        message:
          'AI swing analysis has paused for today — the daily AI budget cap was reached. Please try again tomorrow.',
      },
      { status: 200 },
    );
  }

  const t0 = Date.now();
  const outcome = await provider.analyze({
    sport,
    frames,
    metadata: {
      durationSeconds: body.metadata?.durationSeconds,
      resolution: body.metadata?.resolution,
      declaredCameraAngle: body.metadata?.declaredCameraAngle,
    },
    notes: body.notes ?? null,
    profile: body.profile ?? null,
    previous: body.previous ?? null,
    poseSummary: typeof body.poseSummary === 'string' ? body.poseSummary : null,
    // Fast tier asks the model for tight output — fewer tokens, quicker reply.
    concise: speed === 'fast',
  });
  const latencyMs = Date.now() - t0;

  // Observability (AI Provider Control Center): sanitized metadata only.
  const visionOk = outcome.configured !== false && outcome.ok === true;
  await recordAiCall({
    op: 'video-vision',
    stage: 'video_intake',
    provider: provider.id,
    model: provider.model || null,
    latencyMs,
    ok: visionOk,
    fallback: outcome.configured === false ? 'no_provider' : visionOk ? null : 'error',
    schemaRequested: true,
    schemaParsed: visionOk,
  });

  if (outcome.configured === false) {
    return NextResponse.json({ configured: false, message: outcome.reason }, { status: 200 });
  }

  // Non-PII operational metadata describing the AI call — provider id, resolved
  // model, measured latency, and the speed tier. Surfaced to the client so it can
  // attach these to the ANALYSIS_COMPLETED / ANALYSIS_FAILED PostHog events
  // (P2 AI observability). Never includes frames, prompts, or analysis content.
  const aiMeta = { provider: provider.id, model: provider.model, latencyMs, speed };

  if (!outcome.ok) {
    // Developer-safe diagnostic; the client shows a clean retry-able error.
    console.error('[video-vision-analysis] analysis failed:', outcome.error);
    // Make the server-side failure visible in ReliabilityOS so admins see when
    // analysis is breaking even if the browser never reports it. Best-effort,
    // no-op when keyless; never blocks the error response on its own failure.
    await logServerAnalysisFailure({
      route: '/api/video-vision-analysis',
      actionName: `analyze:${sport}`,
      error: outcome.error,
      metadata: { sport, provider: provider.id, model: provider.model, speed },
    });
    return NextResponse.json(
      {
        configured: true,
        error:
          'SwingVantage could not complete the AI analysis of your video. Please try again in a moment.',
        aiMeta,
        errorCode: classifyProviderError(outcome.error),
      },
      { status: 502 },
    );
  }

  await recordAiSpend('video-vision');
  await meterUserAiUsage(userId, 'video-vision');

  // AIO-4: layer the structured orchestrator over the SAME frame-vision result.
  // This is a pure in-memory bridge — NO additional frames or video leave the
  // device — that yields normalized evidence + the one-fix / one-plan / one-retest
  // CoachSynthesis contract. It can never break the core response: any failure is
  // caught and simply omits `structured`. The existing `analysis` field is
  // untouched, so current clients keep working unchanged.
  const structured = await buildStructuredReport(outcome.analysis, {
    userId,
    poseMetrics: body.poseMetrics ?? null,
  });
  return NextResponse.json(
    { configured: true, analysis: outcome.analysis, aiMeta, structured },
    { status: 200 },
  );
}

/**
 * Coarse, non-PII classification of a provider failure for analytics breakdowns
 * (no raw error text leaves the server). Lets the AI-reliability funnel split
 * failures by cause — provider HTTP error vs network vs unparseable output.
 */
function classifyProviderError(error: string): string {
  const e = error.toLowerCase();
  if (e.includes('api error') || e.includes('http')) return 'provider_http';
  if (e.includes('reach') || e.includes('network')) return 'network';
  if (e.includes('empty') || e.includes('schema') || e.includes('valid')) return 'invalid_output';
  return 'provider_error';
}

// ──────────────────────────────────────────────────────────────
// AIO-4 structured report (additive) — runs the orchestrator over the bridged
// frame-vision evidence. Coach refinement is opt-in + budget-gated; otherwise a
// deterministic vision-derived contract is returned at no extra cost.
// ──────────────────────────────────────────────────────────────

interface StructuredReport {
  coach: CoachSynthesis;
  /** completed | needs_review — honest, from the blended evidence confidence. */
  status: 'completed' | 'needs_review';
  confidence: number;
  /** Where the coach text came from: the AI coach, or the deterministic baseline. */
  coachSource: 'ai' | 'derived';
}

function envOn(v: string | undefined): boolean {
  const s = (v ?? '').trim().toLowerCase();
  return s === 'true' || s === '1' || s === 'yes' || s === 'on';
}

async function buildStructuredReport(
  analysis: AIVisualAnalysis,
  ctx: { userId: string; poseMetrics: PoseMetricsLike | null },
): Promise<StructuredReport | null> {
  try {
    const config = loadAIConfig(process.env);
    // The paid AI coach refinement is OPT-IN (ENABLE_AIO_COACH_SYNTHESIS) and
    // still respects the daily budget cap. When off, we return the deterministic
    // vision-derived contract — no second paid call, no behavior/cost change.
    const coachEnabled = envOn(process.env.ENABLE_AIO_COACH_SYNTHESIS) && !(await aiBudgetExceeded());

    const result = await runAnalysisPipeline(
      {
        jobId: randomUUID(),
        userId: ctx.userId,
        videoId: randomUUID(),
        videoRef: 'bridged-frames', // intake is the in-memory vision bridge, not a fetch
        sport: analysis.meta.sport,
        mode: 'standard',
        poseMetrics: ctx.poseMetrics,
      },
      {
        registry: {
          videoIntake: createBridgedIntakeProvider(analysis),
          measurement: ctx.poseMetrics ? getMeasurementProvider({ config }) : null,
          coach: coachEnabled ? createOpenAICoachProvider({ config }) : null,
          narrative: null,
        },
        config,
      },
    );

    const usedAiCoach = coachEnabled && result.coach != null;
    if (usedAiCoach) {
      // Meter the extra coach call exactly like any other paid AI op.
      await recordAiSpend('ai-coach-synthesis');
      await meterUserAiUsage(ctx.userId, 'ai-coach-synthesis');
    }

    // Always hand back a structured contract: the AI coach when it ran, else the
    // deterministic vision-derived baseline (honest, no fabrication).
    const coach = result.coach ?? visionAnalysisToCoachSynthesis(analysis);
    const confidence = result.evidence.confidenceScore;
    const status = confidence >= config.system.humanReviewLowConfidenceThreshold ? 'completed' : 'needs_review';
    return { coach, status, confidence, coachSource: usedAiCoach ? 'ai' : 'derived' };
  } catch (err) {
    // Non-fatal: the core `analysis` already succeeded; structured is a bonus.
    console.error(
      '[video-vision-analysis] structured orchestrator failed (non-fatal):',
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}
