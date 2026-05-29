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

// ── Rate limiting (simple in-memory, per-IP) ──────────────────
const requestCounts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;         // requests
const RATE_WINDOW_MS = 60_000; // per 60 seconds

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = requestCounts.get(ip);
  if (!entry || now > entry.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_LIMIT) return true;
  entry.count++;
  return false;
}

// ── Handler ───────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // IP-based rate limiting
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment before asking again.' },
      { status: 429 },
    );
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

  // Validate the question
  const questionError = validateUserQuestion(ctx.user_question ?? '');
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
          model: 'claude-3-haiku-20240307',
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
  const s = ctx.current_session_stats;
  const hasData = s && Object.keys(s).length > 0;

  if (!hasData) {
    return (
      `I don't have any session data yet. Please import a CSV from your launch monitor using the Import Data section, ` +
      `then come back and I'll answer your question using your actual numbers.\n\n` +
      `What to do next: Click "Import Data" in the menu to upload your first session.`
    );
  }

  const lines: string[] = [];

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

  lines.push('');
  lines.push(
    `Note: AI narrative responses require an API key. Set AI_PROVIDER=openai or AI_PROVIDER=anthropic ` +
    `in your apps/web/.env.local file and add your key (OPENAI_API_KEY or ANTHROPIC_API_KEY). ` +
    `See docs/OWNER_TASKS.md for details.`,
  );

  lines.push('');
  lines.push(`What to do next: ${ctx.engine_summary ?? 'Check the Diagnose page for your full training routine.'}`);

  return lines.join('\n');
}
