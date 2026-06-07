// ============================================================
// SwingVantage — Server instrumentation (Next.js native hook)
// ------------------------------------------------------------
// Runs once when the server process starts. Two safe jobs:
//
//   1. Validate environment configuration (A10). Warns by default; throws only
//      when STRICT_ENV=1 — so a misconfigured *production* deploy can be made
//      to fail loudly, while local/keyless development is never blocked.
//
//   2. Capture server-side errors (A2) via `onRequestError`, forwarded to the
//      provider-agnostic reporter (a no-op until an observability sink is set).
//
// To enable Sentry without changing this file's dependencies, see
// docs/OBSERVABILITY.md — install @sentry/nextjs, init it, and set
// `globalThis.__svCaptureException = Sentry.captureException`.
// ============================================================

import { assertEnv } from '@/lib/config/env';
import { reportError } from '@/lib/observability/report';

export async function register(): Promise<void> {
  // Non-fatal by default; throws only under STRICT_ENV (intentional, so a bad
  // production configuration is surfaced at boot rather than as a runtime 500).
  assertEnv();
}

/**
 * Next.js calls this for every server-side error (App Router pages, layouts,
 * route handlers, and server actions). We forward it to the observability
 * reporter so it reaches Sentry the moment one is configured.
 */
export function onRequestError(
  error: unknown,
  request: { path?: string; method?: string },
  context: { routerKind?: string; routePath?: string; renderSource?: string },
): void {
  reportError(error, {
    source: 'onRequestError',
    path: request?.path,
    method: request?.method,
    routerKind: context?.routerKind,
    routePath: context?.routePath,
    renderSource: context?.renderSource,
  });
}
