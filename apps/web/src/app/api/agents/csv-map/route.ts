/**
 * SwingVantage AI CSV Mapping Agent — API Route
 *
 * POST /api/agents/csv-map
 *
 * Given a launch-monitor CSV's headers + a few sample rows, returns a
 * column mapping (universal field key → exact header) inferred by the AI.
 * Used by the import wizard when the deterministic detector can't map the
 * critical fields (odd header names, a new brand, a hand-built sheet).
 *
 * Security mirrors /api/agents/enhance and the AI Coach route:
 * - API key is server-side only; never shipped to the client.
 * - Input is validated, length-capped (headers + a few sample rows only —
 *   performance numbers, no PII).
 * - The model's output is re-validated in @swingiq/core against the real
 *   headers + known field keys, so a hallucinated column can't get through.
 * - Rate limited per IP.
 * - If no provider is configured, returns an empty mapping (the wizard
 *   keeps its deterministic mapping), so enabling AI is always safe.
 */

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import {
  CSV_MAPPING_SYSTEM_PROMPT,
  buildCsvMappingUserMessage,
  parseCsvMappingResponse,
} from '@swingiq/core';

const MAX_HEADERS = 80;
const MAX_SAMPLE_ROWS = 8;
const MAX_CELL = 64;

function sanitizeCell(v: unknown): string {
  return typeof v === 'string' ? v.slice(0, MAX_CELL) : '';
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rl = await checkRateLimit(`${ip}:csv-map`, { limit: 20, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'Missing headers.' }, { status: 400 });
  }

  const { headers, sampleRows } = body as { headers?: unknown; sampleRows?: unknown };
  if (!Array.isArray(headers) || headers.length === 0) {
    return NextResponse.json({ error: 'Missing headers.' }, { status: 400 });
  }

  const cleanHeaders = headers.slice(0, MAX_HEADERS).map(sanitizeCell);
  const cleanRows: string[][] = Array.isArray(sampleRows)
    ? sampleRows
        .slice(0, MAX_SAMPLE_ROWS)
        .map((r) => (Array.isArray(r) ? r.slice(0, MAX_HEADERS).map(sanitizeCell) : []))
    : [];

  const aiProvider = process.env.AI_PROVIDER ?? 'none';
  const openAiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  const userMessage = buildCsvMappingUserMessage({ headers: cleanHeaders, sampleRows: cleanRows });

  try {
    if (aiProvider === 'openai' && openAiKey) {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openAiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: CSV_MAPPING_SYSTEM_PROMPT },
            { role: 'user', content: userMessage },
          ],
          max_tokens: 600,
          temperature: 0,
          response_format: { type: 'json_object' },
        }),
      });
      if (!res.ok) return NextResponse.json({ mapping: {} });
      const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
      const out = data.choices[0]?.message?.content ?? '';
      return NextResponse.json({ mapping: parseCsvMappingResponse(out, cleanHeaders) });
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
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 600,
          system: CSV_MAPPING_SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userMessage }],
        }),
      });
      if (!res.ok) return NextResponse.json({ mapping: {} });
      const data = (await res.json()) as { content: Array<{ type: string; text: string }> };
      const out = data.content.find((c) => c.type === 'text')?.text ?? '';
      return NextResponse.json({ mapping: parseCsvMappingResponse(out, cleanHeaders) });
    }
  } catch {
    // Any failure → empty mapping; the wizard keeps its deterministic mapping.
    return NextResponse.json({ mapping: {} });
  }

  // No provider configured — safe no-op.
  return NextResponse.json({ mapping: {} });
}
