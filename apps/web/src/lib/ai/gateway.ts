// ============================================================
// SwingVantage — AI text gateway (intelligence Sprint 3 foundation)
// ------------------------------------------------------------
// One provider-agnostic entry point for text generation, abstracting OpenAI
// and Anthropic behind a typed result. Centralizes what every AI route used to
// hand-roll: provider/key resolution, model TIERING (#4), the daily-budget
// kill-switch + spend recording, a single retry on transient errors, and
// (opt-in) structured JSON output (#1). Fetch-based — same precedent as the
// vision provider in packages/core (no SDK dependency).
//
// Keyless-first: with no provider key the gateway returns a `no_provider`
// fallback so callers render their own data-grounded placeholder. It never
// fabricates a response.
// ============================================================

import { aiBudgetExceeded, recordAiSpend } from '@/lib/ai-budget';
import { isConfigured } from '@/lib/capabilities';

export type AiProviderId = 'anthropic' | 'openai' | 'none';
/** fast = cheapest/quickest · balanced = stronger reasoning · powerful = best. */
export type ModelTier = 'fast' | 'balanced' | 'powerful';

export interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiCompleteRequest {
  system: string;
  messages: AiMessage[];
  maxTokens?: number;
  tier?: ModelTier;
  /** Label for budget/spend accounting (e.g. 'ai-coach'). */
  spendLabel: string;
  /** Optional structured-output schema (#1). When set, `parsed` is populated. */
  jsonSchema?: { name: string; schema: Record<string, unknown> } | null;
  /** Override the provider for this call (else resolved from env). */
  provider?: AiProviderId;
}

export type AiFallback = 'no_provider' | 'over_budget' | 'error';

export interface AiCompleteResult {
  text: string;
  provider: AiProviderId;
  model: string | null;
  /** Parsed JSON when jsonSchema was requested and parsing succeeded. */
  parsed: unknown | null;
  /** Set when no real model response was produced; caller should fall back. */
  fallback: AiFallback | null;
}

// ── Pure helpers (unit-tested) ───────────────────────────────

const TIER_MODELS: Record<'anthropic' | 'openai', Record<ModelTier, string>> = {
  anthropic: { fast: 'claude-haiku-4-5', balanced: 'claude-sonnet-4-6', powerful: 'claude-opus-4-8' },
  openai: { fast: 'gpt-4o-mini', balanced: 'gpt-4o', powerful: 'gpt-4o' },
};

/** Which provider to use, honoring AI_PROVIDER and key presence. Defaults Anthropic. */
export function resolveProvider(env: NodeJS.ProcessEnv = process.env): AiProviderId {
  const pref = (env.AI_PROVIDER ?? 'anthropic').trim().toLowerCase();
  if (pref === 'openai') return isConfigured(env.OPENAI_API_KEY) ? 'openai' : 'none';
  if (pref === 'anthropic') return isConfigured(env.ANTHROPIC_API_KEY) ? 'anthropic' : 'none';
  if (pref === 'none' || pref === '') return 'none';
  // Unknown value — try whichever key exists.
  if (isConfigured(env.ANTHROPIC_API_KEY)) return 'anthropic';
  if (isConfigured(env.OPENAI_API_KEY)) return 'openai';
  return 'none';
}

/** Resolve the concrete model id for a provider + tier (honors env overrides). */
export function selectModel(
  provider: 'anthropic' | 'openai',
  tier: ModelTier = 'fast',
  env: NodeJS.ProcessEnv = process.env,
): string {
  // Back-compat: an explicit ANTHROPIC_MODEL overrides the fast-tier default.
  if (provider === 'anthropic' && tier === 'fast' && isConfigured(env.ANTHROPIC_MODEL)) {
    return env.ANTHROPIC_MODEL!.trim();
  }
  return TIER_MODELS[provider][tier];
}

/** Transient errors worth one retry. */
export function shouldRetry(status: number): boolean {
  return status === 429 || (status >= 500 && status < 600);
}

function extractFirstJson(text: string): unknown | null {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

// ── Provider calls ───────────────────────────────────────────

async function callOnce(
  provider: 'anthropic' | 'openai',
  model: string,
  req: AiCompleteRequest,
): Promise<{ ok: true; text: string } | { ok: false; status: number }> {
  const maxTokens = req.maxTokens ?? 600;

  if (provider === 'anthropic') {
    const body: Record<string, unknown> = {
      model,
      max_tokens: maxTokens,
      system: req.system,
      messages: req.messages.map((m) => ({ role: m.role, content: m.content })),
    };
    if (req.jsonSchema) {
      body.output_config = { format: { type: 'json_schema', schema: req.jsonSchema.schema } };
    }
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) return { ok: false, status: res.status };
    const data = (await res.json()) as { content: Array<{ type: string; text?: string }> };
    return { ok: true, text: data.content.find((c) => c.type === 'text')?.text?.trim() ?? '' };
  }

  // OpenAI
  const body: Record<string, unknown> = {
    model,
    max_tokens: maxTokens,
    temperature: 0.4,
    messages: [{ role: 'system', content: req.system }, ...req.messages],
  };
  if (req.jsonSchema) {
    body.response_format = {
      type: 'json_schema',
      json_schema: { name: req.jsonSchema.name, schema: req.jsonSchema.schema, strict: true },
    };
  }
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) return { ok: false, status: res.status };
  const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
  return { ok: true, text: data.choices[0]?.message?.content?.trim() ?? '' };
}

/**
 * Generate text through the configured provider. Honors the daily AI budget,
 * records spend on success, and retries once on a transient error. Returns a
 * `fallback` (and empty text) rather than throwing when it can't produce a real
 * response — the caller renders its keyless/data-grounded placeholder.
 */
export async function complete(req: AiCompleteRequest): Promise<AiCompleteResult> {
  const provider = req.provider ?? resolveProvider();
  if (provider === 'none') {
    return { text: '', provider: 'none', model: null, parsed: null, fallback: 'no_provider' };
  }
  if (await aiBudgetExceeded()) {
    return { text: '', provider, model: null, parsed: null, fallback: 'over_budget' };
  }

  const model = selectModel(provider, req.tier ?? 'fast');
  let attempt = await callOnce(provider, model, req);
  if (!attempt.ok && shouldRetry(attempt.status)) {
    attempt = await callOnce(provider, model, req);
  }
  if (!attempt.ok) {
    return { text: '', provider, model, parsed: null, fallback: 'error' };
  }

  await recordAiSpend(req.spendLabel);
  const parsed = req.jsonSchema ? extractFirstJson(attempt.text) : null;
  return { text: attempt.text, provider, model, parsed, fallback: null };
}
