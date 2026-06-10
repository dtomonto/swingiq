// ============================================================
// SwingVantage — Video Analysis API Route
// POST /api/video-analysis
//
// Accepts video metadata + estimated landmark data,
// runs the deterministic analysis engine,
// optionally calls AI coach for narrative (if AI_PROVIDER set).
//
// ⚠️  No actual video bytes are processed server-side in this route.
//     All video stays in the browser. Only metadata + analysis input
//     is sent. This keeps the route fast and respects privacy.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { runVideoAnalysis } from '@swingiq/core';
import type { SwingVideoMetadata } from '@swingiq/core';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { clientIp } from '@/lib/security/client-ip';
import { aiBudgetExceeded, recordAiSpend } from '@/lib/ai-budget';
import { getAuthenticatedUser } from '@/lib/supabase-server';

interface VideoAnalysisRequest {
  video_id: string;
  // user_id is intentionally NOT accepted from the client body — it is derived
  // server-side from the authenticated session below to prevent IDOR attacks.
  session_id: string | null;
  metadata: SwingVideoMetadata;
}

export async function POST(req: NextRequest) {
  // Rate limiting
  const ip = clientIp(req);
  const rl = await checkRateLimit(`${ip}:video-analysis`, { limit: 30, windowMs: 60_000 });
  if (!rl.allowed) {
    return rateLimitResponse();
  }

  let body: VideoAnalysisRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { video_id, session_id, metadata } = body;

  // Derive user identity server-side from the verified Supabase session (never
  // trusted from the client body). Falls back to 'anonymous' for logged-out use
  // or when Supabase isn't configured, so analysis still works.
  const authedUser = await getAuthenticatedUser();
  const user_id = authedUser?.id ?? 'anonymous';

  if (!video_id || !metadata) {
    return NextResponse.json(
      { error: 'Missing required fields: video_id, metadata.' },
      { status: 400 },
    );
  }

  // Validate metadata shape
  if (
    typeof metadata.duration_seconds !== 'number' ||
    metadata.duration_seconds <= 0 ||
    metadata.duration_seconds > 300
  ) {
    return NextResponse.json(
      { error: 'Invalid metadata: duration_seconds must be between 0 and 300.' },
      { status: 400 },
    );
  }

  // Run deterministic analysis
  // No landmarks provided from client (heuristic mode)
  const analysis = runVideoAnalysis({
    video_id,
    user_id,
    session_id: session_id ?? null,
    metadata,
    landmarks_by_frame: new Map(),
  });

  // Optionally augment with AI narrative — skipped when the global daily AI
  // budget is spent (off unless AI_DAILY_BUDGET_CENTS is set).
  const aiProvider = process.env.AI_PROVIDER;
  if (aiProvider && !(await aiBudgetExceeded()) && analysis.detected_issues.length > 0) {
    try {
      const narrative = await generateAINarrative(analysis, aiProvider);
      analysis.ai_narrative = narrative;
      await recordAiSpend('video-analysis');
    } catch (err) {
      // AI failure is non-fatal — return analysis without narrative
      console.error('[video-analysis] AI narrative failed:', err instanceof Error ? err.message : err);
    }
  }

  return NextResponse.json({ analysis }, { status: 200 });
}

// ──────────────────────────────────────────────────────────────
// AI narrative generation (optional, server-side only)
// ──────────────────────────────────────────────────────────────

async function generateAINarrative(
  analysis: ReturnType<typeof runVideoAnalysis>,
  provider: string,
): Promise<string> {
  const { detected_issues, camera_angle, overall_visual_score } = analysis;

  const issueList = detected_issues
    .slice(0, 3)
    .map((i) => `• ${i.label} (${i.severity}): ${i.description}`)
    .join('\n');

  const systemPrompt = `You are a professional golf instructor delivering concise, encouraging feedback.
You have received estimated (not ML-measured) visual analysis results for a golf swing.
Be honest that these are observations, not definitive measurements.
Keep your response to 2-3 short paragraphs. Focus on the highest-priority issue.
Do not invent specific statistics or claim to see things you cannot measure without real pose detection.`;

  const userPrompt = `Swing analysis summary:
Camera angle: ${camera_angle}
Visual score: ${overall_visual_score}/100
Detected issues (estimated):
${issueList || '(none detected)'}

Please provide a brief, encouraging coaching narrative for the golfer.`;

  if (provider === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
        max_tokens: 400,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });
    if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? '';
  }

  if (provider === 'anthropic') {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5',
        max_tokens: 400,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });
    if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);
    const data = await res.json();
    return data.content?.[0]?.text ?? '';
  }

  throw new Error(`Unknown AI provider: ${provider}`);
}
