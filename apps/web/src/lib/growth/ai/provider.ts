// ============================================================
// GrowthOS — AI provider abstraction (SERVER ONLY) (§31, §33)
// ------------------------------------------------------------
// Mirrors the existing /api/ai-coach pattern: supports OpenAI / Anthropic
// / Google via env, returns a structured result, and NEVER throws — it
// degrades to a clearly-labeled development fallback when no key is set.
//
// SECURITY: imports nothing client-safe. API keys are read from
// process.env and never leave the server. All caller-supplied context is
// treated as untrusted and sanitized before it reaches the model. Import
// this ONLY from route handlers / server components — never a client file.
// ============================================================

export interface GenerateParams {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
}

export interface GenerateResult {
  text: string;
  provider: 'openai' | 'anthropic' | 'google' | 'fallback';
  /** True when no AI key was configured and we returned a scaffold. */
  isFallback: boolean;
}

/**
 * Neutralise the most common prompt-injection vectors before untrusted
 * text (campaign context, competitor copy, pasted URLs) reaches the model.
 * This is defense-in-depth — the system prompt also instructs the model to
 * treat user content as data, not instructions.
 */
export function sanitizeUntrusted(input: string, maxLen = 4000): string {
  return input
    .slice(0, maxLen)
    .replace(/ignore (all|any|previous|above)[^\n]*/gi, '[filtered]')
    .replace(/disregard (all|any|previous|the)[^\n]*/gi, '[filtered]')
    .replace(/you are now[^\n]*/gi, '[filtered]')
    .replace(/system prompt[^\n]*/gi, '[filtered]')
    .replace(/<\/?(system|assistant|tool)[^>]*>/gi, '[filtered]');
}

export function aiProviderConfigured(): boolean {
  return Boolean(
    process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.GOOGLE_AI_API_KEY,
  );
}

/** Resolve the active provider from env (explicit AI_PROVIDER wins). */
function resolveProvider(): GenerateResult['provider'] {
  const explicit = (process.env.AI_PROVIDER ?? '').toLowerCase();
  if (explicit === 'openai' && process.env.OPENAI_API_KEY) return 'openai';
  if (explicit === 'anthropic' && process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (explicit === 'google' && process.env.GOOGLE_AI_API_KEY) return 'google';
  // Auto-detect when AI_PROVIDER isn't pinned.
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.GOOGLE_AI_API_KEY) return 'google';
  return 'fallback';
}

export async function generateMarketingDraft(
  params: GenerateParams,
  fallbackText: string,
): Promise<GenerateResult> {
  const provider = resolveProvider();
  const maxTokens = params.maxTokens ?? 900;
  const temperature = params.temperature ?? 0.5;

  if (provider === 'fallback') {
    return { text: fallbackText, provider: 'fallback', isFallback: true };
  }

  try {
    if (provider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
          messages: [
            { role: 'system', content: params.system },
            { role: 'user', content: params.user },
          ],
          max_tokens: maxTokens,
          temperature,
        }),
      });
      if (!res.ok) throw new Error(`OpenAI ${res.status}`);
      const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
      return { text: data.choices[0]?.message?.content?.trim() ?? fallbackText, provider, isFallback: false };
    }

    if (provider === 'anthropic') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY as string,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5',
          max_tokens: maxTokens,
          system: params.system,
          messages: [{ role: 'user', content: params.user }],
        }),
      });
      if (!res.ok) throw new Error(`Anthropic ${res.status}`);
      const data = (await res.json()) as { content: Array<{ type: string; text: string }> };
      const text = data.content.find((c) => c.type === 'text')?.text?.trim() ?? fallbackText;
      return { text, provider, isFallback: false };
    }

    // google
    const model = process.env.GOOGLE_AI_MODEL ?? 'gemini-1.5-flash';
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: params.system }] },
          contents: [{ role: 'user', parts: [{ text: params.user }] }],
          generationConfig: { maxOutputTokens: maxTokens, temperature },
        }),
      },
    );
    if (!res.ok) throw new Error(`Google ${res.status}`);
    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('').trim() ?? fallbackText;
    return { text, provider, isFallback: false };
  } catch (err) {
    console.error('[GrowthOS AI] provider error, using fallback:', err);
    return { text: fallbackText, provider: 'fallback', isFallback: true };
  }
}
