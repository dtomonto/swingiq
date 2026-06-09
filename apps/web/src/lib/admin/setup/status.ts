// ============================================================
// SwingVantage Admin — Setup & Next Steps: live status (SERVER-ONLY)
// ------------------------------------------------------------
// Reads the real environment (capabilities + which env vars are set) and
// produces a SECRET-FREE SetupSignal — booleans only. This is the one
// place that touches process.env for the hub; everything downstream
// (registry.ts, the client board) works off the booleans, so a real key
// value is NEVER serialized to the browser.
//
// Adding a new env var to the catalog needs no change here: we read every
// env name the catalog references automatically (collectEnvNames).
// ============================================================

import 'server-only';
import { getServerCapabilities, isConfigured } from '@/lib/capabilities';
import type { SetupSignal, SetupTask } from './types';

/** Gather every env var name referenced by the given tasks (detect + inputs). */
export function collectEnvNames(tasks: SetupTask[]): string[] {
  const names = new Set<string>();
  for (const t of tasks) {
    if (t.detect.kind === 'env') t.detect.anyOf.forEach((n) => names.add(n));
    for (const input of t.inputs ?? []) {
      if (input.kind === 'env') names.add(input.value);
    }
  }
  return [...names];
}

/** A couple of "is this really set up?" checks that need a little logic. */
function computeDerived(): Record<string, boolean> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const isProdUrl = (v: string) =>
    isConfigured(v) && !/localhost|127\.0\.0\.1/.test(v);

  return {
    // Public URLs point at a real domain (not the localhost default).
    'prod-urls': isProdUrl(siteUrl) && isProdUrl(appUrl),
    // /admin/* is protected in production (either path is enough).
    'admin-protected':
      isConfigured(process.env.ADMIN_SECRET) || isConfigured(process.env.ADMIN_EMAILS),
    // Any web analytics provider wired up.
    'analytics-any':
      isConfigured(process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN) ||
      isConfigured(process.env.NEXT_PUBLIC_GA_ID) ||
      isConfigured(process.env.NEXT_PUBLIC_POSTHOG_KEY) ||
      isConfigured(process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID),
    // Daily AI spend kill-switch configured (lib/ai-budget.ts).
    'ai-budget': isConfigured(process.env.AI_DAILY_BUDGET_CENTS),
    // Distributed rate limiter (Upstash) — both halves required.
    'rate-limit-redis':
      isConfigured(process.env.UPSTASH_REDIS_REST_URL) &&
      isConfigured(process.env.UPSTASH_REDIS_REST_TOKEN),
    // Cron endpoints protected.
    'cron-secret': isConfigured(process.env.CRON_SECRET),
    // Search Console verification token present.
    'gsc-verify': isConfigured(process.env.NEXT_PUBLIC_GSC_VERIFICATION),
    // Search Console DATA connected (SearchIntelligenceOS) — both halves required.
    'gsc-search-analytics':
      isConfigured(process.env.GSC_ACCESS_TOKEN) && isConfigured(process.env.GSC_SITE_URL),
  };
}

/**
 * Build the secret-free SetupSignal for a set of tasks. Call this from a
 * Server Component / Route Handler only.
 */
export function getSetupSignal(tasks: SetupTask[]): SetupSignal {
  const caps = getServerCapabilities();
  const env: Record<string, boolean> = {};
  for (const name of collectEnvNames(tasks)) {
    env[name] = isConfigured(process.env[name]);
  }
  return {
    caps,
    env,
    derived: computeDerived(),
    generatedAt: new Date().toISOString(),
  };
}
