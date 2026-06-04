/**
 * SwingIQ AI Coach API Route
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
import { checkRateLimitDistributed, rateLimitResponse } from '@/lib/rate-limit';

// ── Handler ───────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // IP-based rate limiting
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rl = await checkRateLimitDistributed(`${ip}:ai-coach`, { limit: 20, windowMs: 60_000 });
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

  // ── Call the AI provider ──────────────────────────────────
  // SwingIQ supports OpenAI or Anthropic. Configure via environment variables:
  //   AI_PROVIDER=openai  → uses OPENAI_API_KEY
  //   AI_PROVIDER=anthropic → uses ANTHROPIC_API_KEY (default)
  //
  // If no key is configured, the route returns a helpful placeholder so
  // the app still works without an AI key during development.

  const aiProvider = process.env.AI_PROVIDER ?? 'none';
  const openAiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (aiProvider === 'openai' && openAiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openAiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          max_tokens: 600,
          temperature: 0.4,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('[AI Coach] OpenAI error:', response.status, text);
        return NextResponse.json(
          { error: 'AI service error. Please try again in a moment.' },
          { status: 502 },
        );
      }

      const data = await response.json() as {
        choices: Array<{ message: { content: string } }>;
      };
      const message = data.choices[0]?.message?.content?.trim() ?? '';
      return NextResponse.json({ message });
    } catch (err) {
      console.error('[AI Coach] OpenAI fetch failed:', err);
      return NextResponse.json(
        { error: 'Could not reach AI service. Check your connection.' },
        { status: 502 },
      );
    }
  }

  if (aiProvider === 'anthropic' && anthropicKey) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5',
          max_tokens: 600,
          system,
          messages: [{ role: 'user', content: user }],
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error('[AI Coach] Anthropic error:', response.status, text);
        return NextResponse.json(
          { error: 'AI service error. Please try again in a moment.' },
          { status: 502 },
        );
      }

      const data = await response.json() as {
        content: Array<{ type: string; text: string }>;
      };
      const message = data.content.find((c) => c.type === 'text')?.text?.trim() ?? '';
      return NextResponse.json({ message });
    } catch (err) {
      console.error('[AI Coach] Anthropic fetch failed:', err);
      return NextResponse.json(
        { error: 'Could not reach AI service. Check your connection.' },
        { status: 502 },
      );
    }
  }

  // No AI key configured — return a helpful placeholder for development
  return NextResponse.json({
    message: buildDevPlaceholderResponse(ctx),
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
