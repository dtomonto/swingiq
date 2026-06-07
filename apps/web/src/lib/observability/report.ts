// ============================================================
// SwingVantage — Observability reporter (A2)
// ------------------------------------------------------------
// Provider-agnostic error reporting, modelled exactly on lib/analytics.ts:
// it forwards to whatever sink is configured (Sentry), and is otherwise a
// safe no-op (logs in development, drops in production).
//
// There is NO hard dependency on any SDK. If/when Sentry is installed and
// initialised (see docs/OBSERVABILITY.md), the init code sets a single global
// capture function (`__svCaptureException`) — or exposes `window.Sentry` — and
// this reporter starts delivering. Until then nothing breaks and nothing is
// sent off-device. This keeps the default install lean and privacy-first.
// ============================================================

type Ctx = Record<string, unknown>;

interface ServerGlobal {
  __svCaptureException?: (error: unknown, context?: Ctx) => void;
}
interface WindowWithSink extends Window {
  __svCaptureException?: (error: unknown, context?: Ctx) => void;
  Sentry?: { captureException: (error: unknown, hint?: unknown) => void };
}

/**
 * Report an error to the configured observability sink. Never throws — a
 * failure in the reporter must never crash the thing it is reporting on.
 */
export function reportError(error: unknown, context?: Ctx): void {
  try {
    if (typeof window !== 'undefined') {
      const w = window as WindowWithSink;
      if (typeof w.__svCaptureException === 'function') {
        w.__svCaptureException(error, context);
        return;
      }
      if (w.Sentry?.captureException) {
        w.Sentry.captureException(error, context ? { extra: context } : undefined);
        return;
      }
    } else {
      const g = globalThis as unknown as ServerGlobal;
      if (typeof g.__svCaptureException === 'function') {
        g.__svCaptureException(error, context);
        return;
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.error('[observability] error (no sink configured):', error, context ?? '');
    }
  } catch {
    /* never throw from the reporter */
  }
}

/** Report a non-exception message (e.g. a degraded-mode warning). */
export function reportMessage(message: string, context?: Ctx): void {
  reportError(new Error(message), { ...context, kind: 'message' });
}

/** Whether an observability sink is configured (drives the system-health card). */
export function isObservabilityConfigured(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(env.SENTRY_DSN || env.NEXT_PUBLIC_SENTRY_DSN);
}
