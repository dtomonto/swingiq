// ============================================================
// POST /api/import/ocr
//
// Accurate, multi-provider OCR for the "upload a photo of your data"
// importer. It reads the numbers off a launch-monitor / stats screen and
// returns a clean table for the user to review.
//
// KEYLESS DEFAULT: returns { configured: false } when no AI provider key
// is set anywhere — the importer then uses manual entry (always works).
// WITH A KEY: reuses whatever vision-capable provider is already
// configured (OCR_PROVIDER → AI_VISION_PROVIDER → AI_PROVIDER) across
// Anthropic, OpenAI and Google, with a domain-aware prompt and one
// self-correction retry for reliability.
//
// The result ALWAYS requires user review before anything is saved.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimitDistributed, rateLimitResponse } from '@/lib/rate-limit';
import { resolveOcrProvider, type ResolvedOcrProvider } from '@/lib/capabilities';
import {
  buildImageExtractionPrompt,
  buildExtractionRepairPrompt,
  parseExtractedTable,
  summarizeFieldCoverage,
  type ImageExtractionConfidence,
} from '@swingiq/core';

export const runtime = 'nodejs';

interface OcrResponse {
  configured: boolean;
  headers?: string[];
  rows?: string[][];
  confidence?: ImageExtractionConfidence;
  /** Layout the model saw: a single-shot screen or a multi-row table. */
  layout?: 'single_shot' | 'table';
  /** Club read off the screen, if any. */
  club?: string | null;
  /** Units the model reported (e.g. "yards / mph"). */
  unitsDetected?: string | null;
  /** Universal schema fields we recognised in the extracted headers. */
  recognizedFields?: string[];
  /** Critical fields still missing (club, carry_distance). */
  missingCritical?: string[];
  /** Per-extraction notes from the model (glare, cut-off columns…). */
  warnings?: string[];
  message?: string;
}

const MAX_IMAGE_CHARS = 12_000_000; // ~9 MB base64
const MAX_OUTPUT_TOKENS = 4096;

export async function POST(req: NextRequest): Promise<NextResponse<OcrResponse>> {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rl = await checkRateLimitDistributed(`${ip}:import-ocr`, { limit: 6, windowMs: 60_000 });
  if (!rl.allowed) return rateLimitResponse() as NextResponse<OcrResponse>;

  const resolved = resolveOcrProvider();
  if (!resolved) {
    return NextResponse.json({
      configured: false,
      message: 'Auto-extraction is not enabled. Enter your data manually.',
    });
  }

  let body: { imageBase64?: unknown; source?: unknown; sport?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ configured: true, message: 'Invalid request.' }, { status: 400 });
  }

  const imageBase64 = typeof body.imageBase64 === 'string' ? body.imageBase64 : '';
  if (!imageBase64 || imageBase64.length > MAX_IMAGE_CHARS) {
    return NextResponse.json({ configured: true, message: 'Image missing or too large.' }, { status: 400 });
  }

  const source = typeof body.source === 'string' && body.source ? body.source : 'launch monitor';
  const sport = typeof body.sport === 'string' && body.sport ? body.sport : 'golf';

  try {
    return NextResponse.json(await extract(resolved, imageBase64, source, sport));
  } catch {
    // Never break the importer — fall back to manual entry.
    return NextResponse.json({
      configured: true,
      message: 'Automatic extraction failed. Please review or enter your data manually.',
    });
  }
}

// ── Orchestration: prompt → model → parse → (repair) → coverage ──

async function extract(
  resolved: ResolvedOcrProvider,
  imageBase64: string,
  source: string,
  sport: string,
): Promise<OcrResponse> {
  const image = parseDataUrl(imageBase64);
  const { system, userText } = buildImageExtractionPrompt({ source, sport });

  const firstText = await callModel(resolved, system, userText, image);
  let parsed = parseExtractedTable(firstText);

  // One text-only self-correction pass (no image re-sent) on malformed JSON.
  if (!parsed.ok) {
    const repair = buildExtractionRepairPrompt(firstText, parsed.error);
    try {
      const repairedText = await callModel(resolved, repair.system, repair.userText, null);
      parsed = parseExtractedTable(repairedText);
    } catch {
      // keep the original parse failure
    }
  }

  if (!parsed.ok) {
    return {
      configured: true,
      headers: [],
      rows: [],
      confidence: 'low',
      message: 'Could not read the data automatically — please enter your values manually.',
    };
  }

  const { table } = parsed;
  if (table.headers.length === 0) {
    return {
      configured: true,
      headers: [],
      rows: [],
      confidence: table.confidence,
      warnings: table.warnings,
      message: 'Could not read the table — please enter your data manually.',
    };
  }

  const coverage = summarizeFieldCoverage(table.headers, source);
  // A single-shot screen often lists the club as a heading rather than a
  // column; if we detected it, it isn't actually "missing".
  const missingCritical = table.club
    ? coverage.missingCritical.filter((f) => f !== 'club')
    : coverage.missingCritical;
  return {
    configured: true,
    headers: table.headers,
    rows: table.rows,
    confidence: table.confidence,
    layout: table.layout,
    club: table.club,
    unitsDetected: table.unitsDetected,
    recognizedFields: coverage.recognizedFields,
    missingCritical,
    warnings: table.warnings,
  };
}

// ── Provider calls ────────────────────────────────────────────

interface ParsedImage {
  mediaType: string;
  base64: string;
}

/** Split a `data:image/png;base64,…` URL (or bare base64) into parts. */
function parseDataUrl(input: string): ParsedImage {
  const match = /^data:([^;]+);base64,(.+)$/s.exec(input);
  if (match) return { mediaType: match[1]!, base64: match[2]! };
  return { mediaType: 'image/png', base64: input };
}

/** Call the resolved provider. `image` null ⇒ a text-only completion (repair pass). */
async function callModel(
  resolved: ResolvedOcrProvider,
  system: string,
  userText: string,
  image: ParsedImage | null,
): Promise<string> {
  if (resolved.provider === 'anthropic') return callAnthropic(resolved, system, userText, image);
  if (resolved.provider === 'openai') return callOpenAI(resolved, system, userText, image);
  return callGoogle(resolved, system, userText, image);
}

async function callAnthropic(
  { apiKey, model }: ResolvedOcrProvider,
  system: string,
  userText: string,
  image: ParsedImage | null,
): Promise<string> {
  const content: unknown[] = [{ type: 'text', text: userText }];
  if (image) {
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: image.mediaType, data: image.base64 },
    });
  }
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);
  const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
  return data.content?.find((c) => c.type === 'text')?.text ?? '';
}

async function callOpenAI(
  { apiKey, model }: ResolvedOcrProvider,
  system: string,
  userText: string,
  image: ParsedImage | null,
): Promise<string> {
  const userContent: unknown[] = [{ type: 'text', text: userText }];
  if (image) {
    userContent.push({
      type: 'image_url',
      image_url: { url: `data:${image.mediaType};base64,${image.base64}`, detail: 'high' },
    });
  }
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      max_tokens: MAX_OUTPUT_TOKENS,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userContent },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content ?? '';
}

async function callGoogle(
  { apiKey, model }: ResolvedOcrProvider,
  system: string,
  userText: string,
  image: ParsedImage | null,
): Promise<string> {
  const parts: unknown[] = [{ text: userText }];
  if (image) parts.push({ inlineData: { mimeType: image.mediaType, data: image.base64 } });

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent` +
    `?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts }],
      generationConfig: { responseMimeType: 'application/json', maxOutputTokens: MAX_OUTPUT_TOKENS },
    }),
  });
  if (!res.ok) throw new Error(`Google AI API error: ${res.status}`);
  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  return data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
}
