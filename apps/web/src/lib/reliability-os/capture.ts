// ============================================================
// ReliabilityOS — client capture (BROWSER)
// ------------------------------------------------------------
// Captures sanitized operational failures into a capped localStorage ring
// buffer so the admin can review what broke on THIS device, and (when a durable
// backend is configured) fire-and-forgets them to /api/reliability/ingest for
// cross-user visibility.
//
// The backbone is `registerOperationalSink()`: it installs the pluggable
// `window.__svCaptureException` sink that `lib/observability/report.ts` already
// checks first — so EVERY existing reportError() call (global error boundary,
// server onRequestError relayed, window.error, unhandledrejection) flows in here
// with zero call-site edits. It CHAINS to any prior sink / window.Sentry so it
// never shadows real error reporting.
//
// Everything here is fire-and-forget and wrapped so a logging failure can NEVER
// break the user action it is reporting on.
// ============================================================

import { isSupabaseConfigured } from '@/lib/capabilities';
import { sanitizeOperationalEvent, type RawOperationalEvent } from './fingerprint';
import { EVENT_BUFFER_CAP, type OperationalEvent } from './types';

const BUFFER_KEY = 'swingvantage:reliability-os:events:v1';
const SESSION_KEY = 'swingvantage:reliability-os:session';
const INGEST_URL = '/api/reliability/ingest';

type Sink = (error: unknown, context?: Record<string, unknown>) => void;
interface WindowWithSink extends Window {
  __svCaptureException?: Sink;
  Sentry?: { captureException: (e: unknown, hint?: unknown) => void };
  __reliabilityOSRegistered?: boolean;
}

// ── device / session (anonymous, no PII) ──────────────────────
function detectDevice(ua: string): OperationalEvent['deviceType'] {
  if (/tablet|ipad/i.test(ua)) return 'tablet';
  if (/mobi|android|iphone/i.test(ua)) return 'mobile';
  if (ua) return 'desktop';
  return 'unknown';
}
function detectBrowser(ua: string): string | undefined {
  if (/edg\//i.test(ua)) return 'Edge';
  if (/chrome|crios/i.test(ua)) return 'Chrome';
  if (/firefox|fxios/i.test(ua)) return 'Firefox';
  if (/safari/i.test(ua)) return 'Safari';
  return undefined;
}
function detectOS(ua: string): string | undefined {
  if (/windows/i.test(ua)) return 'Windows';
  if (/iphone|ipad|ios/i.test(ua)) return 'iOS';
  if (/mac os/i.test(ua)) return 'macOS';
  if (/android/i.test(ua)) return 'Android';
  if (/linux/i.test(ua)) return 'Linux';
  return undefined;
}
function sessionId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    let id = window.sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = `s_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
      window.sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return undefined;
  }
}

// ── ring buffer ───────────────────────────────────────────────
export function readBufferedEvents(): OperationalEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(BUFFER_KEY);
    return raw ? (JSON.parse(raw) as OperationalEvent[]) : [];
  } catch {
    return [];
  }
}
export function clearBufferedEvents(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(BUFFER_KEY);
  } catch {
    /* noop */
  }
}
function appendToBuffer(event: OperationalEvent): void {
  if (typeof window === 'undefined') return;
  try {
    const next = [...readBufferedEvents(), event].slice(-EVENT_BUFFER_CAP);
    window.localStorage.setItem(BUFFER_KEY, JSON.stringify(next));
  } catch {
    /* quota / private mode — degrade silently */
  }
}

// ── ingest (optional, only when a durable backend is configured) ──
function maybeIngest(event: OperationalEvent): void {
  if (!isSupabaseConfigured || typeof navigator === 'undefined') return;
  try {
    const body = JSON.stringify(event);
    if (typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon(INGEST_URL, new Blob([body], { type: 'application/json' }));
    } else {
      // Best-effort; keepalive lets it complete past unload.
      void fetch(INGEST_URL, { method: 'POST', body, keepalive: true, headers: { 'content-type': 'application/json' } }).catch(() => {});
    }
  } catch {
    /* never throw from telemetry */
  }
}

/** The one public capture entrypoint. Sanitizes, buffers, optionally ingests. Never throws. */
export function logOperationalEvent(raw: RawOperationalEvent): void {
  try {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const enriched: RawOperationalEvent = {
      source: 'client',
      route: raw.route ?? (typeof window !== 'undefined' ? window.location?.pathname : undefined),
      sessionId: raw.sessionId ?? sessionId(),
      deviceType: raw.deviceType ?? detectDevice(ua),
      browser: raw.browser ?? detectBrowser(ua),
      os: raw.os ?? detectOS(ua),
      ...raw,
    };
    const event = sanitizeOperationalEvent(enriched);
    appendToBuffer(event);
    maybeIngest(event);
  } catch {
    /* never throw from telemetry */
  }
}

// Thin opt-in helpers for call sites.
export const logUploadFailure = (p: Omit<RawOperationalEvent, 'type'>) => logOperationalEvent({ type: 'video_upload_failed', category: 'video_upload', ...p });
export const logAuthFailure = (p: Omit<RawOperationalEvent, 'type'> & { type?: RawOperationalEvent['type'] }) => logOperationalEvent({ type: p.type ?? 'auth_login_failed', category: 'auth', ...p });
export const logToolFailure = (p: Omit<RawOperationalEvent, 'type'>) => logOperationalEvent({ type: 'tool_execution_failed', category: 'tool', ...p });
export const logPageFailure = (p: Omit<RawOperationalEvent, 'type'>) => logOperationalEvent({ type: 'page_load_failed', category: 'page', ...p });

// ── map a generic reportError(error, ctx) into a RawOperationalEvent ──
function sinkContextToRaw(error: unknown, ctx?: Record<string, unknown>): RawOperationalEvent {
  const kind = typeof ctx?.kind === 'string' ? (ctx.kind as string) : undefined;
  const hasApi = ctx?.routePath || ctx?.method || ctx?.routerKind;
  let type: RawOperationalEvent['type'] = 'client_crash';
  let category: RawOperationalEvent['category'] = 'page';
  if (hasApi) {
    type = 'api_request_failed';
    category = 'api';
  } else if (kind === 'window.error' || kind === 'unhandledrejection' || ctx?.boundary) {
    type = 'client_crash';
    category = 'page';
  }
  const route = typeof ctx?.routePath === 'string' ? (ctx.routePath as string) : undefined;
  return { type, category, source: 'client', error, route, metadata: ctx };
}

/**
 * Install the operational sink. Idempotent. Chains to any prior sink and to
 * window.Sentry so real error reporting is preserved.
 */
export function registerOperationalSink(): void {
  if (typeof window === 'undefined') return;
  const w = window as WindowWithSink;
  if (w.__reliabilityOSRegistered) return;
  const prev = w.__svCaptureException;
  w.__svCaptureException = (error: unknown, context?: Record<string, unknown>) => {
    try {
      logOperationalEvent(sinkContextToRaw(error, context));
    } catch {
      /* swallow */
    }
    try {
      if (typeof prev === 'function') prev(error, context);
      else if (w.Sentry?.captureException) w.Sentry.captureException(error, context ? { extra: context } : undefined);
    } catch {
      /* swallow */
    }
  };
  w.__reliabilityOSRegistered = true;
}
