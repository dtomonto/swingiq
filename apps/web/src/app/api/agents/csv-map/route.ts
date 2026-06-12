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
import { clientIp } from '@/lib/security/client-ip';
import { complete } from '@/lib/ai/gateway';
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
  const ip = clientIp(req);
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

  const userMessage = buildCsvMappingUserMessage({ headers: cleanHeaders, sampleRows: cleanRows });

  // Routed through the central AI gateway (provider/model resolution — no more
  // hardcoded model ids, budget kill-switch, spend metering, retry, observability).
  // temperature:0 keeps the column mapping deterministic; the model's output is
  // re-validated by parseCsvMappingResponse against the real headers, so a
  // hallucinated column still can't get through. Any fallback → empty mapping.
  const result = await complete({
    system: CSV_MAPPING_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
    maxTokens: 600,
    temperature: 0,
    tier: 'fast',
    spendLabel: 'agents',
  });
  if (result.fallback) return NextResponse.json({ mapping: {} });
  return NextResponse.json({ mapping: parseCsvMappingResponse(result.text, cleanHeaders) });
}
