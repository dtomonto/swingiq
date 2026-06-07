// ============================================================
// POST /api/recruiting/summary — optional AI re-word of a summary
// ------------------------------------------------------------
// Takes the deterministic (grounded) summary the client already built
// and asks the configured provider to make it read more naturally —
// WITHOUT adding any claim or projecting a recruiting ceiling. The
// result must pass validateSummaryBody (no forbidden claims, bounded
// length) or we return the original. Rate-limited and input-validated.
// Keyless: with no provider configured this is a safe no-op.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { clientIp } from '@/lib/security/client-ip';
import { aiBudgetExceeded, recordAiSpend } from '@/lib/ai-budget';
import { validateSummaryBody } from '@/lib/recruiting/summary';

const SYSTEM = [
  'You re-word recruiting player summaries for college coaches and scouts.',
  'STRICT RULES:',
  '- Do NOT add any new fact, metric, or claim. Only re-word what is given.',
  '- Never project a recruiting ceiling or outcome. Banned: "Division I", "D1", "pro-ready",',
  '  "elite prospect", "can\'t-miss", "guarantee", "full ride", "scholarship", "generational".',
  '- Keep the honest caveats intact and visible.',
  '- Be concise, respectful, and concrete. No hype, no superlatives you cannot support.',
  'Return ONLY JSON: {"body": string}.',
].join('\n');

function extractJson(raw: string): unknown {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
}

async function callProvider(system: string, user: string): Promise<string | null> {
  const provider = process.env.AI_PROVIDER;
  try {
    if (provider === 'openai' && process.env.OPENAI_API_KEY) {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
          messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
          max_tokens: 700,
          temperature: 0.4,
          response_format: { type: 'json_object' },
        }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      return data.choices?.[0]?.message?.content ?? null;
    }
    if (provider === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({
          model: process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5',
          max_tokens: 700,
          temperature: 0.4,
          system,
          messages: [{ role: 'user', content: `${user}\n\nRespond with JSON only.` }],
        }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
      return data.content?.find((c) => c.type === 'text')?.text ?? null;
    }
  } catch {
    return null;
  }
  return null;
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const rl = await checkRateLimit(`${ip}:recruiting-summary`, { limit: 15, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { body: original, caveats } = (body ?? {}) as { body?: unknown; caveats?: unknown };
  if (typeof original !== 'string' || original.trim().length < 20) {
    return NextResponse.json({ error: 'Missing summary body.' }, { status: 400 });
  }

  const caveatText = Array.isArray(caveats) ? caveats.filter((c) => typeof c === 'string').join(' ') : '';
  const user = [
    'Re-word this grounded summary to read more naturally. Add nothing.',
    `SUMMARY: ${original}`,
    caveatText ? `KEEP THESE CAVEATS HONEST AND PRESENT: ${caveatText}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  // Global daily AI-spend kill-switch (off unless AI_DAILY_BUDGET_CENTS is set):
  // when spent, skip the optional re-word and return the grounded original.
  if (await aiBudgetExceeded()) {
    return NextResponse.json({ body: original, usedAi: false });
  }

  const raw = await callProvider(SYSTEM, user);
  if (!raw) return NextResponse.json({ body: original, usedAi: false });
  await recordAiSpend('recruiting-summary');

  const parsed = extractJson(raw) as { body?: unknown } | null;
  const reworded = parsed && typeof parsed.body === 'string' ? parsed.body.trim() : '';

  // Reject anything that fails the no-exaggeration validator → fall back.
  if (!reworded || !validateSummaryBody(reworded)) {
    return NextResponse.json({ body: original, usedAi: false });
  }

  return NextResponse.json({ body: reworded, usedAi: true });
}
