// ============================================================
// POST /api/import/ocr
//
// Optional OCR auto-extraction for the image-table importer.
// KEYLESS DEFAULT: returns { configured: false } when no OCR provider
// key is set — the importer then uses manual entry (which always works).
// WITH KEY (OCR_PROVIDER=openai + OPENAI_API_KEY): sends the image to
// OpenAI vision and returns a best-effort table for user review.
//
// The result ALWAYS requires user review before anything is saved.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';
import { isOcrConfigured } from '@/lib/capabilities';

export const runtime = 'nodejs';

interface OcrResponse {
  configured: boolean;
  headers?: string[];
  rows?: string[][];
  confidence?: 'high' | 'medium' | 'low';
  message?: string;
}

const MAX_IMAGE_CHARS = 12_000_000; // ~9 MB base64

export async function POST(req: NextRequest): Promise<NextResponse<OcrResponse>> {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rl = checkRateLimit(`${ip}:import-ocr`, { limit: 6, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse() as NextResponse<OcrResponse>;

  if (!isOcrConfigured()) {
    return NextResponse.json({
      configured: false,
      message: 'Auto-extraction is not enabled. Enter your data manually.',
    });
  }

  let body: { imageBase64?: unknown; source?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ configured: true, message: 'Invalid request.' }, { status: 400 });
  }

  const imageBase64 = typeof body.imageBase64 === 'string' ? body.imageBase64 : '';
  if (!imageBase64 || imageBase64.length > MAX_IMAGE_CHARS) {
    return NextResponse.json({ configured: true, message: 'Image missing or too large.' }, { status: 400 });
  }

  const source = typeof body.source === 'string' ? body.source : 'a launch monitor or stats table';

  try {
    const result = await extractWithOpenAI(imageBase64, source);
    return NextResponse.json(result);
  } catch {
    // Never break the importer — fall back to manual entry.
    return NextResponse.json({
      configured: true,
      message: 'Automatic extraction failed. Please review or enter your data manually.',
    });
  }
}

async function extractWithOpenAI(imageBase64: string, source: string): Promise<OcrResponse> {
  if (process.env.OCR_PROVIDER !== 'openai') {
    return { configured: true, message: 'Configured OCR provider is not yet supported here. Use manual entry.' };
  }
  const model = process.env.OCR_MODEL || 'gpt-4o';
  const dataUrl = imageBase64.startsWith('data:') ? imageBase64 : `data:image/png;base64,${imageBase64}`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      response_format: { type: 'json_object' },
      max_tokens: 1500,
      messages: [
        {
          role: 'system',
          content:
            'You extract tabular performance data from an image of a sports launch-monitor or stats table. ' +
            'Return STRICT JSON only: {"headers": string[], "rows": string[][], "confidence": "high"|"medium"|"low"}. ' +
            'Each row array must have the same length as headers. Use the exact numbers/text visible; never invent values. ' +
            'If you cannot read the table, return {"headers": [], "rows": [], "confidence": "low"}.',
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: `This image is from ${source}. Extract the data table.` },
            { type: 'image_url', image_url: { url: dataUrl, detail: 'high' } },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    return { configured: true, message: 'Extraction service error. Use manual entry.' };
  }

  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = json.choices?.[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(content) as { headers?: unknown; rows?: unknown; confidence?: unknown };

  const headers = Array.isArray(parsed.headers) ? parsed.headers.map(String) : [];
  const rawRows = Array.isArray(parsed.rows) ? parsed.rows : [];
  const rows = rawRows
    .filter((r): r is unknown[] => Array.isArray(r))
    .map((r) => headers.map((_, i) => (r[i] != null ? String(r[i]) : '')));

  const confidence =
    parsed.confidence === 'high' || parsed.confidence === 'medium' || parsed.confidence === 'low'
      ? parsed.confidence
      : 'low';

  if (headers.length === 0) {
    return { configured: true, headers: [], rows: [], confidence, message: 'Could not read the table — please enter your data manually.' };
  }
  return { configured: true, headers, rows, confidence };
}
