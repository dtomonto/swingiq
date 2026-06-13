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
import { getSettings } from '@/lib/intelligence-os/store';
import {
  normalizeIntelligenceRequest, findExactCacheMatch, recordTokenSavings, upsertCacheEntry,
} from '@/lib/intelligence-os/router';
import { captureAiInteraction } from '@/lib/intelligence-os/capture';
import { SOURCE_SYSTEMS } from '@/lib/intelligence-os/types';

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

  const { text, sport, source } = body as { text?: unknown; sport?: unknown; source?: unknown };
  if (typeof text !== 'string' || !text.trim()) {
    return NextResponse.json({ error: 'Missing text.' }, { status: 400 });
  }
  const input = text.slice(0, MAX_TEXT);
  const sportLabel = typeof sport === 'string' ? sport.replace('_', ' ') : 'sport';

  const user = `Sport: ${sportLabel}\n\nSummary to rewrite:\n${input}`;

  // ── Intelligence OS · exact-cache short-circuit ───────────────
  // Identical (sport, summary) rewrites are served from the first-party answer
  // cache, skipping the paid call entirely. The dominant caller is the
  // practice/drill-plan agent flow; `source` lets callers self-label.
  const ioSource = SOURCE_SYSTEMS.includes(source as never) ? (source as never) : 'drill-plan';
  const ioFeature = 'agent-summary-enhance';
  const settings = await getSettings();
  const norm = normalizeIntelligenceRequest(
    { sourceSystem: ioSource, feature: ioFeature, sport: typeof sport === 'string' ? (sport as never) : 'none', request: input },
    settings,
  );
  const cacheHit = await findExactCacheMatch(norm);
  if (cacheHit) {
    void recordTokenSavings({
      sourceFeature: ioFeature, servedBy: 'exact-cache',
      avoidedProvider: cacheHit.providerOriginallyUsed, avoidedModel: cacheHit.modelOriginallyUsed,
      avoidedInputTokens: Math.round(cacheHit.tokenCostOriginal * 0.6),
      avoidedOutputTokens: Math.round(cacheHit.tokenCostOriginal * 0.4),
      costCents: cacheHit.costCentsOriginal, relatedCacheId: cacheHit.id, dataSource: 'real',
    });
    return NextResponse.json({ text: cacheHit.response, cached: true });
  }

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
  const enhanced = result.text.trim() || input;

  // Cache the rewrite for identical future requests + log the interaction
  // (stylistic rephrase → cache the value, don't promote it to knowledge).
  const estTokens = Math.ceil((SYSTEM_PROMPT.length + user.length + enhanced.length) / 4);
  void upsertCacheEntry({
    req: norm, response: enhanced, responseType: 'report-summary',
    provider: result.provider === 'none' ? null : result.provider, model: result.model,
    tokens: estTokens, costCents: 0, confidence: 0.7,
  });
  void captureAiInteraction({
    sourceSystem: ioSource, feature: ioFeature, sport: typeof sport === 'string' ? sport : null,
    request: input, response: enhanced,
    provider: result.provider === 'none' ? 'none' : result.provider, model: result.model,
    promote: false,
  });

  return NextResponse.json({ text: enhanced });
}
