// ============================================================
// POST /api/recruiting/summary — optional AI re-word of a summary
// ------------------------------------------------------------
// Takes the deterministic (grounded) summary the client already built
// and asks the configured provider to make it read more naturally —
// WITHOUT adding any claim or projecting a recruiting ceiling. The
// result must pass validateSummaryBody (no forbidden claims, bounded
// length) or we return the original. Rate-limited and input-validated.
// Keyless: with no provider configured this is a safe no-op.
//
// Routed through the central AI gateway (provider/key resolution, daily
// budget kill-switch, spend metering, one retry, structured output, and
// call observability) — the same path the AI coach uses. No bespoke
// per-provider fetch lives here anymore.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { clientIp } from '@/lib/security/client-ip';
import { complete } from '@/lib/ai/gateway';
import { isAiFeatureEnabled } from '@/lib/ai/ai-features';
import { validateSummaryBody } from '@/lib/recruiting/summary';
import { captureAiInteraction } from '@/lib/intelligence-os/capture';

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

const SUMMARY_SCHEMA = {
  name: 'recruiting_summary',
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['body'],
    properties: { body: { type: 'string' } },
  },
} as const;

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

  // Operator AI feature switch (admin "AI Feature Controls"): when this summary
  // polish is off, return the grounded original unchanged (no paid call).
  if (!(await isAiFeatureEnabled('recruiting-summary'))) {
    return NextResponse.json({ body: original, usedAi: false });
  }

  const caveatText = Array.isArray(caveats) ? caveats.filter((c) => typeof c === 'string').join(' ') : '';
  const user = [
    'Re-word this grounded summary to read more naturally. Add nothing.',
    `SUMMARY: ${original}`,
    caveatText ? `KEEP THESE CAVEATS HONEST AND PRESENT: ${caveatText}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  // The gateway handles the budget kill-switch (→ fallback), keyless (→ fallback),
  // provider/model resolution, retry, spend metering and observability. Any
  // fallback → return the grounded original unchanged.
  const result = await complete({
    system: SYSTEM,
    messages: [{ role: 'user', content: user }],
    maxTokens: 700,
    tier: 'fast',
    spendLabel: 'recruiting-summary',
    jsonSchema: SUMMARY_SCHEMA,
  });
  if (result.fallback) return NextResponse.json({ body: original, usedAi: false });

  const parsed = result.parsed as { body?: unknown } | null;
  const reworded = parsed && typeof parsed.body === 'string' ? parsed.body.trim() : '';

  // Reject anything that fails the no-exaggeration validator → fall back.
  if (!reworded || !validateSummaryBody(reworded)) {
    return NextResponse.json({ body: original, usedAi: false });
  }

  // Intelligence OS (observer): log for cost/activity visibility. Personalized
  // recruiting content → not promoted to global knowledge. Non-blocking.
  void captureAiInteraction({
    sourceSystem: 'admin-report', feature: 'recruiting-summary',
    request: original, response: reworded,
    provider: result.provider === 'none' ? 'none' : result.provider, model: result.model,
    promote: false,
  });

  return NextResponse.json({ body: reworded, usedAi: true });
}
