// ============================================================
// SwingVantage — Blog-to-Social: AI provider call
//
// SERVER-ONLY. Mirrors the AI Coach / Enhance routes: OpenAI or
// Anthropic per AI_PROVIDER, with a graceful fallback to null on any
// missing key, error, or unparseable response. The caller (generate.ts)
// treats null as "use the deterministic engine", so enabling AI is
// always safe and never blocks generation.
// ============================================================

import type { CreativeSuggestions, CtaType, HookType, Platform, VariationType } from './types';

export interface AiPost {
  platform: Platform;
  variation: VariationType;
  text: string;
  hookType?: HookType;
  ctaType?: CtaType;
  rationale?: string;
}

export interface AiResult {
  posts: AiPost[];
  creative?: Partial<CreativeSuggestions>;
}

/** True when a text-capable AI provider is configured (server-side only). */
export function isSocialAiConfigured(): boolean {
  const provider = process.env.AI_PROVIDER;
  if (provider === 'openai') return Boolean(process.env.OPENAI_API_KEY);
  if (provider === 'anthropic') return Boolean(process.env.ANTHROPIC_API_KEY);
  return false;
}

/** Pull the first balanced JSON object out of a model response. Exported for tests. */
export function extractJson(raw: string): unknown {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
}

/** Validate/shape a parsed object into an AiResult, or null. Exported for tests. */
export function coerceResult(parsed: unknown): AiResult | null {
  if (!parsed || typeof parsed !== 'object') return null;
  const obj = parsed as Record<string, unknown>;
  if (!Array.isArray(obj.posts)) return null;
  const posts: AiPost[] = [];
  for (const p of obj.posts) {
    if (!p || typeof p !== 'object') continue;
    const r = p as Record<string, unknown>;
    if (typeof r.platform !== 'string' || typeof r.variation !== 'string') continue;
    if (typeof r.text !== 'string' || !r.text.trim()) continue;
    posts.push({
      platform: r.platform as Platform,
      variation: r.variation as VariationType,
      text: r.text,
      hookType: typeof r.hook_type === 'string' ? (r.hook_type as HookType) : undefined,
      ctaType: typeof r.cta_type === 'string' ? (r.cta_type as CtaType) : undefined,
      rationale: typeof r.rationale === 'string' ? r.rationale : undefined,
    });
  }
  if (posts.length === 0) return null;
  const creative =
    obj.creative && typeof obj.creative === 'object'
      ? (obj.creative as Partial<CreativeSuggestions>)
      : undefined;
  return { posts, creative };
}

/** Call the configured provider. Returns null on any problem. */
export async function generateSocialWithAI(
  system: string,
  user: string,
): Promise<AiResult | null> {
  const provider = process.env.AI_PROVIDER;
  try {
    if (provider === 'openai' && process.env.OPENAI_API_KEY) {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          max_tokens: 3500,
          temperature: 0.7,
          response_format: { type: 'json_object' },
        }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
      const content = data.choices?.[0]?.message?.content;
      return content ? coerceResult(extractJson(content)) : null;
    }

    if (provider === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5',
          max_tokens: 3500,
          temperature: 0.7,
          system,
          messages: [{ role: 'user', content: `${user}\n\nRespond with JSON only.` }],
        }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
      const text = data.content?.find((c) => c.type === 'text')?.text;
      return text ? coerceResult(extractJson(text)) : null;
    }
  } catch {
    return null;
  }
  return null;
}
