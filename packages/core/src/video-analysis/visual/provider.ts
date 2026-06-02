// ============================================================
// SwingIQ — AI Vision Provider Abstraction
//
// A provider takes extracted swing frames + a sport prompt and returns
// a validated, structured analysis from a REAL AI vision model.
//
// Three concrete providers (Anthropic, OpenAI, Google Gemini) plus a
// DisabledVisionProvider. The factory picks one from environment
// variables. If no API key is configured, the disabled provider is
// returned and the product shows a clear "not configured" state —
// it NEVER fabricates analysis.
//
// Reliability + cost:
//   • One automatic self-correction retry on schema/JSON failure. The
//     retry is TEXT-ONLY (no images re-sent) — it just asks the model to
//     fix its own draft to match the schema, which eliminates most
//     "couldn't analyze" failures cheaply.
//   • Anthropic prompt caching on the large system prompt.
//   • Configurable OpenAI image detail (AI_VISION_IMAGE_DETAIL).
//
// Fetch-based (no SDK dependencies). Runs server-side only (the route).
// ============================================================

import {
  validateAIResult,
  attachMeta,
  type AIVisualAnalysis,
  type VisualSport,
} from './schema';
import {
  buildVisionPrompt,
  JSON_CONTRACT,
  type VisionPromptMetadata,
  type VisionUserProfile,
  type PreviousAnalysisSummary,
} from './prompts';

// ──────────────────────────────────────────────────────────────
// Public types
// ──────────────────────────────────────────────────────────────

export interface VisionFrame {
  /** Base64-encoded image bytes WITHOUT the `data:` URI prefix. */
  base64: string;
  /** e.g. `image/jpeg`. */
  mediaType: string;
}

/** How much detail OpenAI should spend on each image (cost vs. fidelity). */
export type ImageDetail = 'auto' | 'low' | 'high';

export interface VisionAnalysisRequest {
  sport: VisualSport;
  frames: VisionFrame[];
  metadata: Omit<VisionPromptMetadata, 'frameCount'>;
  notes?: string | null;
  profile?: VisionUserProfile | null;
  previous?: PreviousAnalysisSummary | null;
}

export type VisionAnalysisOutcome =
  | { configured: true; ok: true; analysis: AIVisualAnalysis }
  | { configured: true; ok: false; error: string }
  | { configured: false; reason: string };

export interface AIVisionProvider {
  /** Stable id, e.g. `anthropic`. */
  readonly id: string;
  /** Model identifier used for analysis. */
  readonly model: string;
  /** True only when an API key is present and the provider can run. */
  isConfigured(): boolean;
  analyze(req: VisionAnalysisRequest): Promise<VisionAnalysisOutcome>;
}

/** The strict, no-fake message shown when AI vision is unavailable. */
export const NOT_CONFIGURED_MESSAGE =
  'AI visual analysis is not currently configured. Your video was uploaded, but SwingIQ could not visually inspect it yet. ' +
  'Add a valid AI vision provider key or enable the visual-analysis service to receive AI-powered mechanical feedback.';

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

/** Convert a `data:image/jpeg;base64,...` URL into a VisionFrame. Returns null if malformed. */
export function dataUrlToFrame(dataUrl: string): VisionFrame | null {
  const match = /^data:([^;]+);base64,(.+)$/s.exec(dataUrl);
  if (!match) return null;
  return { mediaType: match[1], base64: match[2] };
}

const MAX_OUTPUT_TOKENS = 4096;

type RawResult = { httpError: string } | { text: string };

type FinalizeResult =
  | { ok: true; analysis: AIVisualAnalysis }
  | { ok: false; error: string };

function finalize(
  text: string,
  req: VisionAnalysisRequest,
  provider: string,
  model: string,
): FinalizeResult {
  if (!text.trim()) return { ok: false, error: 'AI provider returned an empty response.' };
  const validated = validateAIResult(text);
  if (!validated.ok) return { ok: false, error: validated.error };
  const analysis = attachMeta(validated.data, {
    sport: req.sport,
    frameCountAnalyzed: req.frames.length,
    provider,
    model,
  });
  return { ok: true, analysis };
}

function networkError(err: unknown): string {
  return `Could not reach the AI vision provider: ${err instanceof Error ? err.message : 'network error'}`;
}

/** The system + user text for the text-only self-correction pass (no images). */
function buildRepairPrompt(priorText: string, error: string): { system: string; userText: string } {
  const system =
    'You repair a draft JSON object so it EXACTLY matches the required SwingIQ analysis schema. ' +
    'Output ONLY the corrected JSON object — no prose, no markdown fences. Preserve the original ' +
    'observations; do not fabricate new analysis. Fix structure, missing required fields (infer ' +
    'sensibly from the existing content), value types, and enum values.\n\n' +
    JSON_CONTRACT;
  const userText =
    `This draft JSON failed validation:\n\n${priorText}\n\n` +
    `Validation errors: ${error}\n\nReturn the corrected JSON object only.`;
  return { system, userText };
}

// ──────────────────────────────────────────────────────────────
// Base provider — owns prompt building, the retry, and validation
// ──────────────────────────────────────────────────────────────

abstract class BaseVisionProvider implements AIVisionProvider {
  abstract readonly id: string;
  readonly model: string;
  protected readonly apiKey: string | undefined;
  protected readonly imageDetail: ImageDetail;

  constructor(apiKey: string | undefined, model: string, imageDetail: ImageDetail = 'auto') {
    this.apiKey = apiKey;
    this.model = model;
    this.imageDetail = imageDetail;
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  /** Provider-specific HTTP call. `frames` empty ⇒ a text-only completion. */
  protected abstract requestRaw(
    system: string,
    userText: string,
    frames: VisionFrame[],
  ): Promise<RawResult>;

  async analyze(req: VisionAnalysisRequest): Promise<VisionAnalysisOutcome> {
    if (!this.apiKey) return { configured: false, reason: NOT_CONFIGURED_MESSAGE };

    const { system, userText } = buildVisionPrompt({
      sport: req.sport,
      metadata: { ...req.metadata, frameCount: req.frames.length },
      notes: req.notes,
      profile: req.profile,
      previous: req.previous,
    });

    let raw: RawResult;
    try {
      raw = await this.requestRaw(system, userText, req.frames);
    } catch (err) {
      return { configured: true, ok: false, error: networkError(err) };
    }
    if ('httpError' in raw) return { configured: true, ok: false, error: raw.httpError };

    const first = finalize(raw.text, req, this.id, this.model);
    if (first.ok) return { configured: true, ok: true, analysis: first.analysis };

    // ── One self-correction retry (text-only, no images re-sent) ──
    const repair = buildRepairPrompt(raw.text, first.error);
    try {
      const raw2 = await this.requestRaw(repair.system, repair.userText, []);
      if (!('httpError' in raw2)) {
        const second = finalize(raw2.text, req, this.id, this.model);
        if (second.ok) return { configured: true, ok: true, analysis: second.analysis };
      }
    } catch {
      // fall through to the original error
    }
    return { configured: true, ok: false, error: first.error };
  }
}

// ──────────────────────────────────────────────────────────────
// Anthropic (Claude) provider — with prompt caching
// ──────────────────────────────────────────────────────────────

export class AnthropicVisionProvider extends BaseVisionProvider {
  readonly id = 'anthropic';

  constructor(apiKey: string | undefined, model?: string, imageDetail?: ImageDetail) {
    super(apiKey, model ?? 'claude-3-5-sonnet-20241022', imageDetail);
  }

  protected async requestRaw(
    system: string,
    userText: string,
    frames: VisionFrame[],
  ): Promise<RawResult> {
    const content = [
      { type: 'text', text: userText },
      ...frames.map((f) => ({
        type: 'image',
        source: { type: 'base64', media_type: f.mediaType, data: f.base64 },
      })),
    ];

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey as string,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: MAX_OUTPUT_TOKENS,
        // Cache the large system prompt across the vision call + any retry.
        system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content }],
      }),
    });

    if (!res.ok) return { httpError: `Anthropic API error: ${res.status}` };
    const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
    return { text: data.content?.find((c) => c.type === 'text')?.text ?? '' };
  }
}

// ──────────────────────────────────────────────────────────────
// OpenAI provider — configurable image detail
// ──────────────────────────────────────────────────────────────

export class OpenAIVisionProvider extends BaseVisionProvider {
  readonly id = 'openai';

  constructor(apiKey: string | undefined, model?: string, imageDetail?: ImageDetail) {
    super(apiKey, model ?? 'gpt-4o', imageDetail);
  }

  protected async requestRaw(
    system: string,
    userText: string,
    frames: VisionFrame[],
  ): Promise<RawResult> {
    const userContent = [
      { type: 'text', text: userText },
      ...frames.map((f) => ({
        type: 'image_url',
        image_url: { url: `data:${f.mediaType};base64,${f.base64}`, detail: this.imageDetail },
      })),
    ];

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey as string}`,
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: MAX_OUTPUT_TOKENS,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userContent },
        ],
      }),
    });

    if (!res.ok) return { httpError: `OpenAI API error: ${res.status}` };
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return { text: data.choices?.[0]?.message?.content ?? '' };
  }
}

// ──────────────────────────────────────────────────────────────
// Google Gemini provider
// ──────────────────────────────────────────────────────────────

export class GoogleVisionProvider extends BaseVisionProvider {
  readonly id = 'google';

  constructor(apiKey: string | undefined, model?: string, imageDetail?: ImageDetail) {
    super(apiKey, model ?? 'gemini-1.5-flash', imageDetail);
  }

  protected async requestRaw(
    system: string,
    userText: string,
    frames: VisionFrame[],
  ): Promise<RawResult> {
    const parts = [
      { text: userText },
      ...frames.map((f) => ({ inlineData: { mimeType: f.mediaType, data: f.base64 } })),
    ];

    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent` +
      `?key=${encodeURIComponent(this.apiKey as string)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts }],
        generationConfig: {
          responseMimeType: 'application/json',
          maxOutputTokens: MAX_OUTPUT_TOKENS,
        },
      }),
    });

    if (!res.ok) return { httpError: `Google AI API error: ${res.status}` };
    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    return {
      text: data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '',
    };
  }
}

// ──────────────────────────────────────────────────────────────
// Disabled provider (no key) — strict no-fake fallback
// ──────────────────────────────────────────────────────────────

export class DisabledVisionProvider implements AIVisionProvider {
  readonly id = 'disabled';
  readonly model = 'none';
  private readonly reason: string;

  constructor(reason: string = NOT_CONFIGURED_MESSAGE) {
    this.reason = reason;
  }

  isConfigured(): boolean {
    return false;
  }

  async analyze(): Promise<VisionAnalysisOutcome> {
    return { configured: false, reason: this.reason };
  }
}

// ──────────────────────────────────────────────────────────────
// Factory
// ──────────────────────────────────────────────────────────────

export type ProviderEnv = Record<string, string | undefined>;

function resolveImageDetail(value: string | undefined): ImageDetail {
  const v = value?.trim().toLowerCase();
  return v === 'low' || v === 'high' ? v : 'auto';
}

/**
 * Resolve the configured vision provider from environment variables.
 *
 *   AI_VISION_PROVIDER     anthropic | openai | google   (falls back to AI_PROVIDER)
 *   ANTHROPIC_API_KEY / OPENAI_API_KEY / GOOGLE_AI_API_KEY
 *   AI_VISION_MODEL        optional model override
 *   AI_VISION_IMAGE_DETAIL auto | low | high   (OpenAI image fidelity vs. cost)
 *
 * Returns a DisabledVisionProvider (which yields the no-fake "not
 * configured" state) when no usable key is present.
 */
export function getVisionProvider(env: ProviderEnv = process.env): AIVisionProvider {
  const selected = (env.AI_VISION_PROVIDER ?? env.AI_PROVIDER ?? '').trim().toLowerCase();
  const modelOverride = env.AI_VISION_MODEL?.trim() || undefined;
  const imageDetail = resolveImageDetail(env.AI_VISION_IMAGE_DETAIL);

  switch (selected) {
    case 'anthropic':
    case 'claude':
      return env.ANTHROPIC_API_KEY
        ? new AnthropicVisionProvider(env.ANTHROPIC_API_KEY, modelOverride, imageDetail)
        : new DisabledVisionProvider(missingKeyReason('ANTHROPIC_API_KEY'));

    case 'openai':
      return env.OPENAI_API_KEY
        ? new OpenAIVisionProvider(env.OPENAI_API_KEY, modelOverride, imageDetail)
        : new DisabledVisionProvider(missingKeyReason('OPENAI_API_KEY'));

    case 'google':
    case 'gemini':
      return env.GOOGLE_AI_API_KEY
        ? new GoogleVisionProvider(env.GOOGLE_AI_API_KEY, modelOverride, imageDetail)
        : new DisabledVisionProvider(missingKeyReason('GOOGLE_AI_API_KEY'));

    default:
      return new DisabledVisionProvider();
  }
}

function missingKeyReason(keyName: string): string {
  return `${NOT_CONFIGURED_MESSAGE} (Selected provider is missing its ${keyName}.)`;
}
