// ============================================================
// SwingVantage — AI Operations: Gemini provider test / discovery (§2.2, §10.1)
// ------------------------------------------------------------
// Validates that a configured Gemini model id is actually available to the
// connected API account BEFORE it's relied on (the master prompt requires this
// — Gemini model ids must never be assumed). Powers the admin "Test provider"
// button. Server-only; the key never reaches the client.
// ============================================================

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export interface GeminiProviderTest {
  keyPresent: boolean;
  /** True when the API key authenticated (models listed). */
  keyValid: boolean;
  /** True when the requested model id is present + supports generateContent. */
  modelAvailable: boolean;
  /** generateContent-capable Gemini model ids on this account (for a picker). */
  availableModels: string[];
  ok: boolean;
  error: string | null;
}

type ListFetch = (url: string) => Promise<{ status: number; json: unknown }>;

const realFetch: ListFetch = async (url) => {
  const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    /* non-JSON */
  }
  return { status: res.status, json };
};

/**
 * Validate the Gemini key + a model id. Pure-ish: the network fetch is
 * injectable for tests. Never throws — returns a structured, honest result.
 */
export async function testGeminiProvider(
  apiKey: string | undefined,
  model: string | null,
  doFetch: ListFetch = realFetch,
): Promise<GeminiProviderTest> {
  const base: GeminiProviderTest = {
    keyPresent: Boolean(apiKey),
    keyValid: false,
    modelAvailable: false,
    availableModels: [],
    ok: false,
    error: null,
  };
  if (!apiKey) return { ...base, error: 'No GOOGLE_AI_API_KEY configured.' };

  let res: { status: number; json: unknown };
  try {
    res = await doFetch(`${GEMINI_BASE}/models?key=${encodeURIComponent(apiKey)}`);
  } catch (err) {
    return { ...base, error: `Could not reach Gemini: ${err instanceof Error ? err.message : 'network error'}` };
  }

  if (res.status !== 200) {
    const msg = (res.json as { error?: { message?: string } })?.error?.message;
    return { ...base, error: `Gemini rejected the key (HTTP ${res.status})${msg ? `: ${msg.slice(0, 140)}` : ''}` };
  }

  const models = ((res.json as { models?: Array<{ name?: string; supportedGenerationMethods?: string[] }> })?.models ?? [])
    .filter((m) => (m.supportedGenerationMethods ?? []).includes('generateContent'))
    .map((m) => (m.name ?? '').replace(/^models\//, ''))
    .filter((n) => n.startsWith('gemini'));

  const modelAvailable = model ? models.includes(model) : false;
  return {
    keyPresent: true,
    keyValid: true,
    modelAvailable,
    availableModels: models,
    ok: Boolean(model) && modelAvailable,
    error: model
      ? modelAvailable
        ? null
        : `Model "${model}" is not available to this account. Pick one of the listed models.`
      : 'Key is valid, but no model id is configured to test.',
  };
}
