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

function buildMeta(req: VisionAnalysisRequest, provider: string, model: string) {
  return {
    sport: req.sport,
    frameCountAnalyzed: req.frames.length,
    provider,
    model,
  };
}

// ──────────────────────────────────────────────────────────────
// Anthropic (Claude) provider
// ──────────────────────────────────────────────────────────────

export class AnthropicVisionProvider implements AIVisionProvider {
  readonly id = 'anthropic';
  readonly model: string;
  private readonly apiKey: string | undefined;

  constructor(apiKey: string | undefined, model?: string) {
    this.apiKey = apiKey;
    this.model = model ?? 'claude-3-5-sonnet-20241022';
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async analyze(req: VisionAnalysisRequest): Promise<VisionAnalysisOutcome> {
    if (!this.apiKey) return { configured: false, reason: NOT_CONFIGURED_MESSAGE };

    const { system, userText } = buildVisionPrompt({
      sport: req.sport,
      metadata: { ...req.metadata, frameCount: req.frames.length },
      notes: req.notes,
      profile: req.profile,
      previous: req.previous,
    });

    const content = [
      { type: 'text', text: userText },
      ...req.frames.map((f) => ({
        type: 'image',
        source: { type: 'base64', media_type: f.mediaType, data: f.base64 },
      })),
    ];

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: MAX_OUTPUT_TOKENS,
          system,
          messages: [{ role: 'user', content }],
        }),
      });

      if (!res.ok) {
        return { configured: true, ok: false, error: `Anthropic API error: ${res.status}` };
      }
      const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
      const text: string = data.content?.find((c) => c.type === 'text')?.text ?? '';
      return finalize(text, req, this.id, this.model);
    } catch (err) {
      return { configured: true, ok: false, error: networkError(err) };
    }
  }
}

// ──────────────────────────────────────────────────────────────
// OpenAI provider
// ──────────────────────────────────────────────────────────────

export class OpenAIVisionProvider implements AIVisionProvider {
  readonly id = 'openai';
  readonly model: string;
  private readonly apiKey: string | undefined;

  constructor(apiKey: string | undefined, model?: string) {
    this.apiKey = apiKey;
    this.model = model ?? 'gpt-4o';
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async analyze(req: VisionAnalysisRequest): Promise<VisionAnalysisOutcome> {
    if (!this.apiKey) return { configured: false, reason: NOT_CONFIGURED_MESSAGE };

    const { system, userText } = buildVisionPrompt({
      sport: req.sport,
      metadata: { ...req.metadata, frameCount: req.frames.length },
      notes: req.notes,
      profile: req.profile,
      previous: req.previous,
    });

    const userContent = [
      { type: 'text', text: userText },
      ...req.frames.map((f) => ({
        type: 'image_url',
        image_url: { url: `data:${f.mediaType};base64,${f.base64}` },
      })),
    ];

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
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

      if (!res.ok) {
        return { configured: true, ok: false, error: `OpenAI API error: ${res.status}` };
      }
      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const text: string = data.choices?.[0]?.message?.content ?? '';
      return finalize(text, req, this.id, this.model);
    } catch (err) {
      return { configured: true, ok: false, error: networkError(err) };
    }
  }
}

// ──────────────────────────────────────────────────────────────
// Google Gemini provider
// ──────────────────────────────────────────────────────────────

export class GoogleVisionProvider implements AIVisionProvider {
  readonly id = 'google';
  readonly model: string;
  private readonly apiKey: string | undefined;

  constructor(apiKey: string | undefined, model?: string) {
    this.apiKey = apiKey;
    this.model = model ?? 'gemini-1.5-flash';
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async analyze(req: VisionAnalysisRequest): Promise<VisionAnalysisOutcome> {
    if (!this.apiKey) return { configured: false, reason: NOT_CONFIGURED_MESSAGE };

    const { system, userText } = buildVisionPrompt({
      sport: req.sport,
      metadata: { ...req.metadata, frameCount: req.frames.length },
      notes: req.notes,
      profile: req.profile,
      previous: req.previous,
    });

    const parts = [
      { text: userText },
      ...req.frames.map((f) => ({ inlineData: { mimeType: f.mediaType, data: f.base64 } })),
    ];

    try {
      const url =
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model)}:generateContent` +
        `?key=${encodeURIComponent(this.apiKey)}`;
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

      if (!res.ok) {
        return { configured: true, ok: false, error: `Google AI API error: ${res.status}` };
      }
      const data = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const text: string =
        data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
      return finalize(text, req, this.id, this.model);
    } catch (err) {
      return { configured: true, ok: false, error: networkError(err) };
    }
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
// Shared finalize + error helpers
// ──────────────────────────────────────────────────────────────

function finalize(
  text: string,
  req: VisionAnalysisRequest,
  provider: string,
  model: string,
): VisionAnalysisOutcome {
  if (!text.trim()) {
    return { configured: true, ok: false, error: 'AI provider returned an empty response.' };
  }
  const validated = validateAIResult(text);
  if (!validated.ok) {
    return { configured: true, ok: false, error: validated.error };
  }
  const analysis = attachMeta(validated.data, buildMeta(req, provider, model));
  return { configured: true, ok: true, analysis };
}

function networkError(err: unknown): string {
  return `Could not reach the AI vision provider: ${err instanceof Error ? err.message : 'network error'}`;
}

// ──────────────────────────────────────────────────────────────
// Factory
// ──────────────────────────────────────────────────────────────

export type ProviderEnv = Record<string, string | undefined>;

/**
 * Resolve the configured vision provider from environment variables.
 *
 *   AI_VISION_PROVIDER  anthropic | openai | google   (falls back to AI_PROVIDER)
 *   ANTHROPIC_API_KEY / OPENAI_API_KEY / GOOGLE_AI_API_KEY
 *   AI_VISION_MODEL     optional model override
 *
 * Returns a DisabledVisionProvider (which yields the no-fake "not
 * configured" state) when no usable key is present.
 */
export function getVisionProvider(env: ProviderEnv = process.env): AIVisionProvider {
  const selected = (env.AI_VISION_PROVIDER ?? env.AI_PROVIDER ?? '').trim().toLowerCase();
  const modelOverride = env.AI_VISION_MODEL?.trim() || undefined;

  switch (selected) {
    case 'anthropic':
    case 'claude':
      return env.ANTHROPIC_API_KEY
        ? new AnthropicVisionProvider(env.ANTHROPIC_API_KEY, modelOverride)
        : new DisabledVisionProvider(missingKeyReason('ANTHROPIC_API_KEY'));

    case 'openai':
      return env.OPENAI_API_KEY
        ? new OpenAIVisionProvider(env.OPENAI_API_KEY, modelOverride)
        : new DisabledVisionProvider(missingKeyReason('OPENAI_API_KEY'));

    case 'google':
    case 'gemini':
      return env.GOOGLE_AI_API_KEY
        ? new GoogleVisionProvider(env.GOOGLE_AI_API_KEY, modelOverride)
        : new DisabledVisionProvider(missingKeyReason('GOOGLE_AI_API_KEY'));

    default:
      return new DisabledVisionProvider();
  }
}

function missingKeyReason(keyName: string): string {
  return `${NOT_CONFIGURED_MESSAGE} (Selected provider is missing its ${keyName}.)`;
}
