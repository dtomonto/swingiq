// ============================================================
// SwingIQ — AI Visual Analysis API Route
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

import { NextRequest, NextResponse } from 'next/server';
import {
  getVisionProvider,
  resolveVisionSpeed,
  dataUrlToFrame,
  VisualSportSchema,
  type VisionFrame,
  type VisionUserProfile,
  type PreviousAnalysisSummary,
  type VisionSpeed,
} from '@swingiq/core';
import { checkRateLimitDistributed, rateLimitResponse } from '@/lib/rate-limit';

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
  /** Speed tier requested by the client: fast | balanced | thorough. */
  speed?: string;
}

export async function POST(req: NextRequest) {
  // Rate limiting — vision calls are comparatively expensive.
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rl = await checkRateLimitDistributed(`${ip}:video-vision-analysis`, { limit: 12, windowMs: 60_000 });
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

  // Speed tier (fast | balanced | thorough). The client requests one; the
  // server maps it to a concrete model — a client never names a raw model.
  const speed: VisionSpeed = resolveVisionSpeed(body.speed);

  // Resolve the provider. With no key, this yields the disabled provider.
  const provider = getVisionProvider(process.env, { speed });
  if (!provider.isConfigured()) {
    const outcome = await provider.analyze({ sport, frames, metadata: {} });
    const message =
      outcome.configured === false
        ? outcome.reason
        : 'AI visual analysis is not currently configured.';
    return NextResponse.json({ configured: false, message }, { status: 200 });
  }

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

  if (outcome.configured === false) {
    return NextResponse.json({ configured: false, message: outcome.reason }, { status: 200 });
  }

  if (!outcome.ok) {
    // Developer-safe diagnostic; the client shows a clean retry-able error.
    console.error('[video-vision-analysis] analysis failed:', outcome.error);
    return NextResponse.json(
      {
        configured: true,
        error:
          'SwingIQ could not complete the AI analysis of your video. Please try again in a moment.',
      },
      { status: 502 },
    );
  }

  return NextResponse.json({ configured: true, analysis: outcome.analysis }, { status: 200 });
}
