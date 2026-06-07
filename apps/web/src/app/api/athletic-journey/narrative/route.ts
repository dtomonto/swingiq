// ============================================================
// POST /api/athletic-journey/narrative — optional AI re-word
// ------------------------------------------------------------
// Takes the deterministic (grounded) journey narrative the client
// already built and asks the configured provider to make it read
// more naturally — WITHOUT changing any number, stage, basis, or
// adding a claim/guarantee. The result must pass validateNarrative
// (structure intact, no forbidden hype) or we return the original.
// Rate-limited + input-validated. Keyless: with no provider this is
// a safe no-op that echoes the deterministic narrative back.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { clientIp } from '@/lib/security/client-ip';
import { aiBudgetExceeded, recordAiSpend } from '@/lib/ai-budget';
import { validateNarrative, type JourneyNarrative } from '@/lib/athletic-journey';

const SYSTEM = [
  'You re-word a player-development "Athletic Journey" summary for an athlete.',
  'STRICT RULES:',
  '- Do NOT add any new fact, metric, number, stage, or claim. Only re-word what is given.',
  '- Never guarantee an outcome or project a professional ceiling. Banned: "guarantee",',
  '  "will go pro", "pro-ready", "can\'t-miss", "scholarship", "next <famous athlete>".',
  '- Never present self-reported data as verified. Keep honest caveats intact.',
  '- Keep the SAME JSON shape and the same array lengths. Be encouraging but honest.',
  'Return ONLY JSON with exactly these keys: stageSummary (string), whyHere (string[]),',
  'strengths (string[]), developmentGaps (string[]), contradictoryEvidence (string[]),',
  'nextStageFocus (string[]), ratingAlignment (string), coachNote (string),',
  'missingDataRequests (string[]), recommendedNextActions (string[]).',
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
          max_tokens: 900,
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
          max_tokens: 900,
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

function isNarrativeShape(v: unknown): v is JourneyNarrative {
  if (!v || typeof v !== 'object') return false;
  const n = v as Record<string, unknown>;
  return typeof n.stageSummary === 'string' && typeof n.coachNote === 'string' && Array.isArray(n.whyHere);
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const rl = await checkRateLimit(`${ip}:journey-narrative`, { limit: 12, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const base = (body as { narrative?: unknown }).narrative;
  if (!isNarrativeShape(base)) {
    return NextResponse.json({ error: 'Missing or malformed narrative.' }, { status: 400 });
  }

  // Global daily AI-spend kill-switch (off unless AI_DAILY_BUDGET_CENTS is set):
  // when spent, echo the deterministic narrative unchanged.
  if (await aiBudgetExceeded()) {
    return NextResponse.json({ narrative: { ...base, enhanced: false } });
  }

  // Keyless / provider error → echo the deterministic narrative unchanged.
  const raw = await callProvider(SYSTEM, JSON.stringify(base));
  if (!raw) {
    return NextResponse.json({ narrative: { ...base, enhanced: false } });
  }
  await recordAiSpend('narrative');

  const parsed = extractJson(raw);
  const safe = validateNarrative(base, parsed); // falls back to base on any violation
  return NextResponse.json({ narrative: safe });
}
