// ============================================================
// SwingVantage — AI Operations: Gemini video-intake provider (§2.2/§4.2)
// ------------------------------------------------------------
// The primary VIDEO-UNDERSTANDING engine. Sends the swing video to Gemini and
// returns STRUCTURED EVIDENCE ONLY (never final coaching copy). Fetch-based
// (no SDK), mirroring the existing GoogleVisionProvider. Honesty-first: output
// is validated against VideoIntakeResultSchema with one self-correction repair
// pass; an invalid result becomes null (caller routes to review) — it never
// fabricates. Disabled (null + skipped trace) when no GOOGLE_AI_API_KEY.
//
// Video submission paths (§2.2):
//   • inline   — small clips: videoRef is a `data:video/...;base64,...` URL
//   • file_api — larger clips: videoRef is a Gemini `files/...` resource URI
//                (the resumable upload that PRODUCES that URI is wired by the
//                orchestrator/route in a later AIO step; this provider consumes
//                the handle).
// ============================================================

import type { AIModelConfig } from '../model-config';
import { seedPromptRegistry } from '../prompts';
import {
  VideoIntakeResultSchema,
  type ProviderTrace,
  type VideoIntakeResult,
} from '../schemas';
import type { VideoIntakeInput, VideoIntakeProvider } from '../types';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

/** A single content part Gemini accepts for the video. */
type VideoPart =
  | { inlineData: { mimeType: string; data: string } }
  | { fileData: { mimeType: string; fileUri: string } };

export type GeminiRawResult = { httpError: string } | { text: string };

/** Provider-specific call, injectable for tests (no network in unit tests). */
export type GeminiGenerate = (args: {
  model: string;
  system: string;
  userText: string;
  video: VideoPart | null;
  maxOutputTokens: number;
}) => Promise<GeminiRawResult>;

/** Default network call to Gemini generateContent (structured JSON requested). */
const realGenerate =
  (apiKey: string): GeminiGenerate =>
  async ({ model, system, userText, video, maxOutputTokens }) => {
    const parts: Array<{ text: string } | VideoPart> = [{ text: userText }];
    if (video) parts.push(video);
    try {
      const res = await fetch(
        `${GEMINI_BASE}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: [{ role: 'user', parts }],
            generationConfig: { responseMimeType: 'application/json', maxOutputTokens },
          }),
        },
      );
      if (!res.ok) return { httpError: `Gemini API error: ${res.status}` };
      const data = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      return { text: data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '' };
    } catch (err) {
      return { httpError: `Gemini network error: ${err instanceof Error ? err.message : 'unknown'}` };
    }
  };

/** Build the video content part from the input ref + size routing. */
export function buildVideoPart(input: VideoIntakeInput, thresholdMb: number): VideoPart | null {
  const ref = input.videoRef ?? '';
  // File API handle (large clips): `files/abc` or a full resource URI.
  if (/^files\//.test(ref) || ref.startsWith(`${GEMINI_BASE}/files/`)) {
    return { fileData: { mimeType: 'video/mp4', fileUri: ref } };
  }
  // Inline data URL (small clips under the threshold).
  const m = /^data:([^;]+);base64,(.+)$/s.exec(ref);
  if (m && (input.sizeMb == null || input.sizeMb <= thresholdMb)) {
    return { inlineData: { mimeType: m[1], data: m[2] } };
  }
  return null;
}

function parseIntake(text: string): VideoIntakeResult | null {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    const parsed = VideoIntakeResultSchema.safeParse(JSON.parse(text.slice(start, end + 1)));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export interface CreateGeminiIntakeOptions {
  config: AIModelConfig;
  apiKey?: string | undefined;
  generate?: GeminiGenerate;
  now?: () => string;
}

export function createGeminiVideoIntakeProvider(opts: CreateGeminiIntakeOptions): VideoIntakeProvider {
  const apiKey = opts.apiKey ?? process.env.GOOGLE_AI_API_KEY;
  const generate = opts.generate ?? (apiKey ? realGenerate(apiKey) : null);
  const now = opts.now ?? (() => new Date().toISOString());
  const prompt = seedPromptRegistry.get('video_intake');

  const skip = (model: string | null, reason: string, status: ProviderTrace['status'] = 'skipped'): ProviderTrace => ({
    stage: 'video_intake',
    provider: 'gemini',
    model,
    promptVersion: prompt.version,
    startedAt: now(),
    completedAt: now(),
    latencyMs: 0,
    inputTokens: null,
    outputTokens: null,
    estimatedCost: null,
    status,
    errorCode: reason,
    errorMessage: null,
    retryCount: 0,
    fallbackUsed: false,
    sanitizedRequest: null,
    sanitizedResponse: null,
  });

  return {
    name: 'gemini',
    async intake(input: VideoIntakeInput) {
      const model =
        input.mode === 'premium'
          ? opts.config.gemini.deepModel ?? opts.config.gemini.fastModel
          : opts.config.gemini.fastModel;

      if (!apiKey || !generate) return { result: null, trace: skip(model, 'no_provider') };
      if (!model) return { result: null, trace: skip(null, 'no_model_configured') };

      const video = buildVideoPart(input, opts.config.gemini.fileApiThresholdMb);
      if (!video) return { result: null, trace: skip(model, 'no_video_ref') };

      const startedAt = now();
      const userText =
        `Analyze this ${input.declaredSport ?? 'sports'} swing video and return the VideoIntakeResult JSON. ` +
        `videoId="${input.videoId}". Structured evidence only — no coaching copy.`;

      let raw = await generate({
        model,
        system: prompt.body,
        userText,
        video,
        maxOutputTokens: opts.config.gemini.maxOutputTokens,
      });

      let retryCount = 0;
      let result = 'text' in raw ? parseIntake(raw.text) : null;

      // One self-correction repair pass (text-only — no video re-sent).
      if (!result && 'text' in raw && raw.text.trim()) {
        retryCount = 1;
        const repair = await generate({
          model,
          system:
            'Repair the following draft so it EXACTLY matches the VideoIntakeResult JSON schema. ' +
            'Output ONLY the corrected JSON. Preserve observations; never fabricate new evidence.',
          userText: raw.text,
          video: null,
          maxOutputTokens: opts.config.gemini.maxOutputTokens,
        });
        if ('text' in repair) result = parseIntake(repair.text);
        raw = repair;
      }

      const trace: ProviderTrace = {
        stage: 'video_intake',
        provider: 'gemini',
        model,
        promptVersion: prompt.version,
        startedAt,
        completedAt: now(),
        latencyMs: null,
        inputTokens: null,
        outputTokens: null,
        estimatedCost: null,
        status: 'httpError' in raw ? 'error' : result ? 'ok' : 'error',
        errorCode: 'httpError' in raw ? 'provider_error' : result ? null : 'schema_invalid',
        errorMessage: 'httpError' in raw ? raw.httpError : null,
        retryCount,
        fallbackUsed: false,
        // Never persist the raw video/response unless explicitly configured.
        sanitizedRequest: opts.config.system.redactProviderPayloads ? null : { model, videoId: input.videoId },
        sanitizedResponse: null,
      };

      return { result, trace };
    },
  };
}
