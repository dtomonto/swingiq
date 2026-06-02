/**
 * SwingIQ Agent Enhancer API Route
 *
 * POST /api/agents/enhance
 *
 * OPTIONAL. Rewrites an already-grounded, deterministic agent summary into
 * warmer, clearer language. It never invents facts — it only re-phrases text
 * the deterministic layer already produced. If no AI provider is configured,
 * it returns the original text unchanged, so enabling the client flag is
 * always safe.
 *
 * Security mirrors the AI Coach route:
 * - API key is server-side only.
 * - Input is validated, length-capped, and never includes raw user data
 *   (only the short, pre-built summary string the client sends).
 * - Rate limited per IP.
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

const MAX_TEXT = 2000;

const SYSTEM_PROMPT =
  `You are a copy editor for SwingIQ, a sports-improvement app. Rewrite the provided ` +
  `summary so it is warm, encouraging, and clear in plain language for a recreational athlete.\n` +
  `RULES YOU MUST FOLLOW:\n` +
  `1. Do NOT introduce any new facts, numbers, drills, diagnoses, or claims. Only rephrase what is given.\n` +
  `2. Do NOT add medical advice or guaranteed-result language.\n` +
  `3. Keep it about the same length or shorter. No preamble, no markdown — return only the rewritten text.`;

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rl = checkRateLimit(`${ip}:agents-enhance`, { limit: 30, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (typeof body !== 'object' || body === null || !('text' in body)) {
    return NextResponse.json({ error: 'Missing text.' }, { status: 400 });
  }

  const { text, sport } = body as { text?: unknown; sport?: unknown };
  if (typeof text !== 'string' || !text.trim()) {
    return NextResponse.json({ error: 'Missing text.' }, { status: 400 });
  }
  const input = text.slice(0, MAX_TEXT);
  const sportLabel = typeof sport === 'string' ? sport.replace('_', ' ') : 'sport';

  const aiProvider = process.env.AI_PROVIDER ?? 'none';
  const openAiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  const user = `Sport: ${sportLabel}\n\nSummary to rewrite:\n${input}`;

  // No provider configured → graceful no-op (return original text).
  try {
    if (aiProvider === 'openai' && openAiKey) {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openAiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: user },
          ],
          max_tokens: 400,
          temperature: 0.5,
        }),
      });
      if (!res.ok) return NextResponse.json({ text: input });
      const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
      const out = data.choices[0]?.message?.content?.trim();
      return NextResponse.json({ text: out || input });
    }

    if (aiProvider === 'anthropic' && anthropicKey) {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5',
          max_tokens: 400,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: user }],
        }),
      });
      if (!res.ok) return NextResponse.json({ text: input });
      const data = (await res.json()) as { content: Array<{ type: string; text: string }> };
      const out = data.content.find((c) => c.type === 'text')?.text?.trim();
      return NextResponse.json({ text: out || input });
    }
  } catch {
    // Any failure → deterministic fallback.
    return NextResponse.json({ text: input });
  }

  // No key configured — return the grounded text unchanged.
  return NextResponse.json({ text: input });
}
