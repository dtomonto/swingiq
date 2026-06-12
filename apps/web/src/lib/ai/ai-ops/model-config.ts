// ============================================================
// SwingVantage — AI Operations: model configuration service
// ------------------------------------------------------------
// AIModelConfigService (master-prompt §2/§5). Model IDs live in env (and
// later admin-DB overrides) — NEVER hardcoded in business logic. Safe
// defaults: an EMPTY coach model means "use the gateway's tier default"
// (gpt-4o today), so the system works on real keys without anyone having
// to know an exact model id. Gemini ids are intentionally NOT seeded —
// they must be set + validated against the connected account first.
// ============================================================

export interface AIModelConfig {
  openai: {
    coachModel: string | null;
    coachFallbackModel: string | null;
    coachCostModel: string | null;
    timeoutMs: number;
    maxOutputTokens: number;
  };
  gemini: {
    fastModel: string | null;
    deepModel: string | null;
    fallbackModel: string | null;
    timeoutMs: number;
    maxOutputTokens: number;
    inlineMaxMb: number;
    fileApiThresholdMb: number;
  };
  measurement: {
    provider: string; // 'mediapipe' default
    confidenceThreshold: number;
    serverSide: boolean;
    clientSide: boolean;
  };
  claude: {
    enabled: boolean; // disabled by default
    model: string | null;
    timeoutMs: number;
  };
  system: {
    routerEnabled: boolean;
    usageTracking: boolean;
    adminControls: boolean;
    evals: boolean;
    defaultMode: string;
    deepMode: string;
    storeRawProviderResponses: boolean;
    redactProviderPayloads: boolean;
    humanReviewLowConfidenceThreshold: number;
  };
}

const num = (v: string | undefined, d: number): number => {
  const n = v == null || v.trim() === '' ? NaN : Number(v);
  return Number.isFinite(n) ? n : d;
};
const str = (v: string | undefined): string | null => {
  const s = (v ?? '').trim();
  return s === '' ? null : s;
};
const bool = (v: string | undefined, d: boolean): boolean => {
  const s = (v ?? '').trim().toLowerCase();
  if (s === '') return d;
  return s === 'true' || s === '1' || s === 'yes' || s === 'on';
};

/** Load the AI config from env. Pure (env injectable) for tests. */
export function loadAIConfig(env: Record<string, string | undefined> = process.env): AIModelConfig {
  return {
    openai: {
      coachModel: str(env.OPENAI_COACH_MODEL),
      coachFallbackModel: str(env.OPENAI_COACH_FALLBACK_MODEL),
      coachCostModel: str(env.OPENAI_COACH_COST_MODEL),
      timeoutMs: num(env.OPENAI_COACH_TIMEOUT_MS, 60_000),
      maxOutputTokens: num(env.OPENAI_COACH_MAX_OUTPUT_TOKENS, 2500),
    },
    gemini: {
      fastModel: str(env.GEMINI_VIDEO_FAST_MODEL),
      deepModel: str(env.GEMINI_VIDEO_DEEP_MODEL),
      fallbackModel: str(env.GEMINI_VIDEO_FALLBACK_MODEL),
      timeoutMs: num(env.GEMINI_VIDEO_TIMEOUT_MS, 120_000),
      maxOutputTokens: num(env.GEMINI_VIDEO_MAX_OUTPUT_TOKENS, 4000),
      inlineMaxMb: num(env.GEMINI_INLINE_VIDEO_MAX_MB, 20),
      fileApiThresholdMb: num(env.GEMINI_FILE_API_THRESHOLD_MB, 20),
    },
    measurement: {
      provider: str(env.MEASUREMENT_PROVIDER) ?? 'mediapipe',
      confidenceThreshold: num(env.MEASUREMENT_CONFIDENCE_THRESHOLD, 0.65),
      serverSide: bool(env.ENABLE_SERVER_SIDE_MEASUREMENT, true),
      clientSide: bool(env.ENABLE_CLIENT_SIDE_MEASUREMENT, false),
    },
    claude: {
      enabled: bool(env.ENABLE_CLAUDE_PREMIUM_NARRATIVE, false),
      model: str(env.CLAUDE_NARRATIVE_MODEL),
      timeoutMs: num(env.CLAUDE_NARRATIVE_TIMEOUT_MS, 60_000),
    },
    system: {
      routerEnabled: bool(env.ENABLE_AI_PROVIDER_ROUTER, true),
      usageTracking: bool(env.ENABLE_AI_USAGE_TRACKING, true),
      adminControls: bool(env.ENABLE_AI_ADMIN_CONTROLS, true),
      evals: bool(env.ENABLE_AI_EVALS, true),
      defaultMode: str(env.AI_DEFAULT_ANALYSIS_MODE) ?? 'standard',
      deepMode: str(env.AI_DEEP_ANALYSIS_MODE) ?? 'premium',
      storeRawProviderResponses: bool(env.AI_STORE_RAW_PROVIDER_RESPONSES, false),
      redactProviderPayloads: bool(env.AI_REDACT_PROVIDER_PAYLOADS, true),
      humanReviewLowConfidenceThreshold: num(env.AI_HUMAN_REVIEW_LOW_CONFIDENCE_THRESHOLD, 0.65),
    },
  };
}
