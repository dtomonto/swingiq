// ============================================================
// SwingVantage — Environment validation (A10)
// ------------------------------------------------------------
// SwingVantage runs in "keyless" mode with almost nothing configured, so
// nearly every variable is OPTIONAL. This module does two safe things:
//
//   1. Validates the FORMAT of any var that IS present (a typo'd URL, a
//      non-numeric budget, or an unknown provider name is caught early).
//   2. Optionally enforces a required set — but only when you ask for it
//      (`assertEnv({ strict: true })` or `STRICT_ENV=1`), so it can never
//      break a teammate's dev server or the default build.
//
// It pairs with lib/config/integrations.ts (which reports *what is configured*)
// — this module reports *whether what is configured is well-formed*.
// ============================================================

import { z } from 'zod';

export type Env = Record<string, string | undefined>;

const urlish = z.string().url('must be a valid URL (including https://)');
const intString = z
  .string()
  .regex(/^\d+$/, 'must be a whole, non-negative number');
const provider = z.enum(['openai', 'anthropic', 'google']);

/**
 * Schema of the env vars SwingVantage understands. `.passthrough()` keeps
 * unknown vars (we never reject a variable we don't know about). Everything is
 * `.optional()` — absence is valid; only a malformed *present* value is flagged.
 */
export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).optional(),

    // Supabase (accounts + cloud data)
    NEXT_PUBLIC_SUPABASE_URL: urlish.optional(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20).optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(20).optional(),

    // AI providers (vision + coach)
    AI_VISION_PROVIDER: provider.optional(),
    AI_PROVIDER: provider.optional(),
    OPENAI_API_KEY: z.string().min(10).optional(),
    ANTHROPIC_API_KEY: z.string().min(10).optional(),
    GOOGLE_AI_API_KEY: z.string().min(10).optional(),
    AI_DAILY_BUDGET_CENTS: intString.optional(),

    // OCR
    OCR_PROVIDER: z.enum(['openai', 'google']).optional(),
    GOOGLE_CLOUD_VISION_API_KEY: z.string().min(10).optional(),

    // Analytics (any one turns measurement on)
    NEXT_PUBLIC_GA_ID: z.string().optional(),
    NEXT_PUBLIC_PLAUSIBLE_DOMAIN: z.string().optional(),
    NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
    NEXT_PUBLIC_POSTHOG_HOST: urlish.optional(),

    // Observability (Sentry) — see docs/OBSERVABILITY.md
    SENTRY_DSN: urlish.optional(),
    NEXT_PUBLIC_SENTRY_DSN: urlish.optional(),

    // Stripe billing
    STRIPE_SECRET_KEY: z.string().optional(),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),

    // Server secrets (admin + cron)
    ADMIN_SECRET: z.string().min(16, 'should be at least 16 chars').optional(),
    CRON_SECRET: z.string().min(16, 'should be at least 16 chars').optional(),

    // Strict-mode toggle for this module itself
    STRICT_ENV: z.string().optional(),
  })
  .passthrough();

export type ParsedEnv = z.infer<typeof envSchema>;

export interface EnvIssue {
  path: string;
  message: string;
  level: 'error' | 'warn';
}

export interface EnvResult {
  ok: boolean;
  issues: EnvIssue[];
}

const present = (v: string | undefined): boolean => Boolean(v && v.trim());

/**
 * Cross-field sanity checks: a configured integration should be *complete*.
 * These are warnings (level: 'warn') — they describe a half-configured
 * integration, not a malformed value.
 */
function crossChecks(env: Env): EnvIssue[] {
  const issues: EnvIssue[] = [];

  // A named AI provider needs its matching key.
  const aiKey: Record<string, string> = {
    openai: 'OPENAI_API_KEY',
    anthropic: 'ANTHROPIC_API_KEY',
    google: 'GOOGLE_AI_API_KEY',
  };
  for (const which of ['AI_VISION_PROVIDER', 'AI_PROVIDER'] as const) {
    const p = (env[which] ?? '').trim();
    if (p && aiKey[p] && !present(env[aiKey[p]])) {
      issues.push({
        path: which,
        level: 'warn',
        message: `set to "${p}" but ${aiKey[p]} is missing — AI features will stay off`,
      });
    }
  }

  // Stripe needs both halves to function.
  if (present(env.STRIPE_SECRET_KEY) !== present(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)) {
    issues.push({
      path: 'STRIPE_*',
      level: 'warn',
      message:
        'only one of STRIPE_SECRET_KEY / NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set — checkout needs both',
    });
  }

  // Supabase URL + anon key travel together.
  if (present(env.NEXT_PUBLIC_SUPABASE_URL) !== present(env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
    issues.push({
      path: 'NEXT_PUBLIC_SUPABASE_*',
      level: 'warn',
      message:
        'only one of NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY is set — accounts need both',
    });
  }

  return issues;
}

/** Validate an env bag. Never throws. */
export function validateEnv(env: Env = process.env): EnvResult {
  const parsed = envSchema.safeParse(env);
  const issues: EnvIssue[] = [];

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      issues.push({
        path: issue.path.join('.') || '(root)',
        message: issue.message,
        level: 'error',
      });
    }
  }
  issues.push(...crossChecks(env));

  const hasError = issues.some((i) => i.level === 'error');
  return { ok: !hasError, issues };
}

function formatIssues(issues: EnvIssue[]): string {
  return issues
    .map((i) => `  • [${i.level}] ${i.path}: ${i.message}`)
    .join('\n');
}

/**
 * Validate and react. Default behaviour is non-fatal:
 *   • errors  → throw ONLY in strict mode (STRICT_ENV=1 or { strict: true });
 *               otherwise console.error (outside production console.warn).
 *   • warnings → console.warn outside production.
 *
 * Call this from instrumentation `register()` so a misconfigured *production*
 * deploy can be made to fail loudly (set STRICT_ENV=1 in prod), while local /
 * keyless development is never blocked.
 */
export function assertEnv(opts: { strict?: boolean; env?: Env } = {}): EnvResult {
  const env = opts.env ?? process.env;
  const res = validateEnv(env);
  const strict =
    opts.strict ?? (env.STRICT_ENV === '1' || env.STRICT_ENV === 'true');

  if (res.issues.length > 0) {
    const text = formatIssues(res.issues);
    if (!res.ok && strict) {
      throw new Error(`Invalid environment configuration:\n${text}`);
    }
    if (env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn(`[env] configuration notes:\n${text}`);
    }
  }
  return res;
}
