/**
 * SwingVantage Agent Enhancer API Route
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
import { clientIp } from '@/lib/security/client-ip';
import { complete } from '@/lib/ai/gateway';

const MAX_TEXT = 2000;

const SYSTEM_PROMPT =
  `You are a copy editor for SwingVantage, a sports-improvement app. Rewrite the provided ` +
  `summary so it is warm, encouraging, and clear in plain language for a recreational athlete.\n` +
  `RULES YOU MUST FOLLOW:\n` +
  `1. Do NOT introduce any new facts, numbers, drills, diagnoses, or claims. Only rephrase what is given.\n` +
  `2. Do NOT add medical advice or guaranteed-result language.\n` +
  `3. Keep it about the same length or shorter. No preamble, no markdown — return only the rewritten text.`;

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const rl = await checkRateLimit(`${ip}:agents-enhance`, { limit: 30, windowMs: 60_000 });
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

  const user = `Sport: ${sportLabel}\n\nSummary to rewrite:\n${input}`;

  // Routed through the central AI gateway: it resolves provider/model (no more
  // hardcoded 'gpt-4o-mini'), enforces the daily budget kill-switch, meters
  // spend, retries once, and records call observability. Any fallback (keyless,
  // over-budget, error) → return the grounded text unchanged.
  const result = await complete({
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: user }],
    maxTokens: 400,
    tier: 'fast',
    spendLabel: 'agents',
  });
  if (result.fallback) return NextResponse.json({ text: input });
  return NextResponse.json({ text: result.text.trim() || input });
}
