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
//
// Routed through the central AI gateway (provider/key resolution, daily
// budget kill-switch, spend metering, one retry, structured output, and
// call observability) — the same path the AI coach uses. validateNarrative
// remains the safety net regardless of provider.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { clientIp } from '@/lib/security/client-ip';
import { complete } from '@/lib/ai/gateway';
import { isAiFeatureEnabled } from '@/lib/ai/ai-features';
import { validateNarrative, type JourneyNarrative } from '@/lib/athletic-journey';
import { captureAiInteraction } from '@/lib/intelligence-os/capture';

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

const strArr = { type: 'array', items: { type: 'string' } } as const;
const NARRATIVE_SCHEMA = {
  name: 'journey_narrative',
  schema: {
    type: 'object',
    additionalProperties: false,
    required: [
      'stageSummary', 'whyHere', 'strengths', 'developmentGaps', 'contradictoryEvidence',
      'nextStageFocus', 'ratingAlignment', 'coachNote', 'missingDataRequests', 'recommendedNextActions',
    ],
    properties: {
      stageSummary: { type: 'string' },
      whyHere: strArr,
      strengths: strArr,
      developmentGaps: strArr,
      contradictoryEvidence: strArr,
      nextStageFocus: strArr,
      ratingAlignment: { type: 'string' },
      coachNote: { type: 'string' },
      missingDataRequests: strArr,
      recommendedNextActions: strArr,
    },
  },
} as const;

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

  // Operator AI feature switch (admin "AI Feature Controls"): when this narrative
  // polish is off, echo the deterministic narrative unchanged (no paid call).
  if (!(await isAiFeatureEnabled('journey-narrative'))) {
    return NextResponse.json({ narrative: { ...base, enhanced: false } });
  }

  // The gateway handles budget (→ fallback), keyless (→ fallback), provider/model,
  // retry, spend metering and observability. Any fallback → echo the deterministic
  // narrative unchanged.
  const result = await complete({
    system: SYSTEM,
    messages: [{ role: 'user', content: JSON.stringify(base) }],
    maxTokens: 900,
    tier: 'fast',
    spendLabel: 'narrative',
    jsonSchema: NARRATIVE_SCHEMA,
  });
  if (result.fallback) {
    return NextResponse.json({ narrative: { ...base, enhanced: false } });
  }

  // validateNarrative falls back to base on any structural/hype violation.
  const safe = validateNarrative(base, result.parsed);

  // Intelligence OS (observer): log for cost/activity visibility. Personalized
  // athlete narrative → not promoted to global knowledge. Non-blocking.
  void captureAiInteraction({
    sourceSystem: 'admin-report', feature: 'athletic-journey-narrative',
    request: base.stageSummary || 'journey narrative', response: safe.stageSummary || '',
    provider: result.provider === 'none' ? 'none' : result.provider, model: result.model,
    promote: false,
  });

  return NextResponse.json({ narrative: safe });
}
