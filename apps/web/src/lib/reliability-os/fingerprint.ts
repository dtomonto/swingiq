// ============================================================
// ReliabilityOS — fingerprinting + sanitization (PURE, isomorphic)
// ------------------------------------------------------------
// Two privacy-critical pure helpers:
//   • generateErrorFingerprint — a STABLE group key so repeated failures
//     collapse into one issue and owner-state (status/notes) survives rescans.
//   • sanitizeOperationalEvent — scrubs secrets/PII and normalizes a raw,
//     partial event into a safe OperationalEvent. Reuses securityOS redaction.
// ============================================================

import { redactDeep, redactString } from '@/lib/security-os/redaction';
import type {
  OperationalCategory,
  OperationalEvent,
  OperationalEventSource,
  OperationalEventType,
  OperationalSeverity,
} from './types';

const MAX_MESSAGE_LEN = 200;

/** Map an event type to its category when the caller didn't supply one. */
const TYPE_CATEGORY: Record<OperationalEventType, OperationalCategory> = {
  page_load_failed: 'page',
  page_data_failed: 'page',
  client_crash: 'page',
  video_upload_started: 'video_upload',
  video_upload_failed: 'video_upload',
  video_upload_succeeded: 'video_upload',
  video_processing_failed: 'video_upload',
  auth_login_failed: 'auth',
  auth_signup_failed: 'auth',
  auth_session_failed: 'auth',
  tool_execution_failed: 'tool',
  api_request_failed: 'api',
  admin_action_failed: 'admin',
  diagnostic_failed: 'diagnostic',
  scheduled_task_failed: 'scheduled_task',
};

/** Default severity for an event type when the caller didn't supply one. */
const TYPE_SEVERITY: Record<OperationalEventType, OperationalSeverity> = {
  page_load_failed: 'high',
  page_data_failed: 'medium',
  client_crash: 'high',
  video_upload_started: 'low',
  video_upload_failed: 'high',
  video_upload_succeeded: 'low',
  video_processing_failed: 'high',
  auth_login_failed: 'high',
  auth_signup_failed: 'high',
  auth_session_failed: 'medium',
  tool_execution_failed: 'high',
  api_request_failed: 'medium',
  admin_action_failed: 'high',
  diagnostic_failed: 'low',
  scheduled_task_failed: 'high',
};

/**
 * Normalize an error message into a fingerprint-stable token: lowercased,
 * secrets redacted, and volatile substrings (numbers, uuids, hex, quoted
 * literals, urls) replaced with placeholders so "failed after 1234ms" and
 * "failed after 5678ms" share a fingerprint.
 */
export function normalizeMessage(message: string | undefined): string {
  if (!message) return '';
  let m = redactString(message).toLowerCase();
  m = m
    .replace(/https?:\/\/[^\s'"]+/g, '<url>')
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/g, '<uuid>')
    .replace(/0x[0-9a-f]+/g, '<hex>')
    .replace(/\d[\d.,]*/g, '<n>')
    .replace(/["'`][^"'`]*["'`]/g, '<str>')
    .replace(/\s+/g, ' ')
    .trim();
  return m.slice(0, 120);
}

/** Truncate + redact a message for safe DISPLAY (not for fingerprinting). */
export function safeMessage(message: string | undefined): string | undefined {
  if (!message) return undefined;
  const red = redactString(String(message)).replace(/\s+/g, ' ').trim();
  return red.length > MAX_MESSAGE_LEN ? `${red.slice(0, MAX_MESSAGE_LEN - 1)}…` : red;
}

/** A pathname only — strip query + hash so routes group cleanly. */
export function normalizeRoute(route: string | undefined): string | undefined {
  if (!route) return undefined;
  const noQuery = route.split('?')[0].split('#')[0];
  return noQuery || '/';
}

interface FingerprintInput {
  category: OperationalCategory;
  route?: string;
  toolName?: string;
  actionName?: string;
  uploadStage?: string;
  httpStatus?: number;
  errorCode?: string;
  errorMessageSafe?: string;
}

/** Build the deterministic group key. Same inputs → same fingerprint. */
export function generateErrorFingerprint(input: FingerprintInput): string {
  const parts = [
    input.category,
    normalizeRoute(input.route) ?? '',
    input.toolName ?? '',
    input.actionName ?? '',
    input.uploadStage ?? '',
    input.httpStatus != null ? String(input.httpStatus) : '',
    input.errorCode ?? '',
    normalizeMessage(input.errorMessageSafe),
  ];
  return `ri_${djb2(parts.join('|'))}`;
}

/** Small, stable, dependency-free hash (djb2) → base36. */
function djb2(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return (h >>> 0).toString(36);
}

/** A raw, partial event as supplied by a call site or the error sink. */
export interface RawOperationalEvent {
  type: OperationalEventType;
  category?: OperationalCategory;
  severity?: OperationalSeverity;
  source?: OperationalEventSource;
  route?: string;
  pageName?: string;
  toolName?: string;
  actionName?: string;
  uploadStage?: string;
  httpStatus?: number;
  errorCode?: string;
  /** Raw message or Error — sanitized here. */
  error?: unknown;
  errorMessage?: string;
  sessionId?: string;
  deviceType?: OperationalEvent['deviceType'];
  browser?: string;
  os?: string;
  durationMs?: number;
  correlationId?: string;
  metadata?: Record<string, unknown>;
  /** Override timestamp (else now). */
  at?: string;
}

function messageFrom(raw: RawOperationalEvent): string | undefined {
  if (raw.errorMessage) return raw.errorMessage;
  const e = raw.error;
  if (e == null) return undefined;
  if (typeof e === 'string') return e;
  if (e instanceof Error) return e.message;
  if (typeof e === 'object' && 'message' in e && typeof (e as { message: unknown }).message === 'string') {
    return (e as { message: string }).message;
  }
  return undefined;
}

const rid = (now: number) => `rie_${now.toString(36)}_${Math.abs((now * 2654435761) % 1e6).toString(36)}`;

/**
 * Turn a raw, partial event into a fully-sanitized OperationalEvent. NEVER
 * throws. Drops the raw error object; keeps only a redacted, truncated message
 * + redacted metadata. The id is derived from the timestamp (no Math.random so
 * it stays test-stable when a fixed `at` is supplied via `nowMs`).
 */
export function sanitizeOperationalEvent(
  raw: RawOperationalEvent,
  nowMs: number = Date.now(),
): OperationalEvent {
  const category = raw.category ?? TYPE_CATEGORY[raw.type] ?? 'api';
  const severity = raw.severity ?? TYPE_SEVERITY[raw.type] ?? 'medium';
  const route = normalizeRoute(raw.route);
  const errorMessageSafe = safeMessage(messageFrom(raw));
  const fingerprint = generateErrorFingerprint({
    category,
    route,
    toolName: raw.toolName,
    actionName: raw.actionName,
    uploadStage: raw.uploadStage,
    httpStatus: raw.httpStatus,
    errorCode: raw.errorCode,
    errorMessageSafe,
  });

  return {
    id: rid(nowMs),
    at: raw.at ?? new Date(nowMs).toISOString(),
    type: raw.type,
    category,
    severity,
    source: raw.source ?? 'client',
    route,
    pageName: raw.pageName,
    toolName: raw.toolName,
    actionName: raw.actionName,
    uploadStage: raw.uploadStage,
    httpStatus: raw.httpStatus,
    errorCode: raw.errorCode,
    errorMessageSafe,
    fingerprint,
    sessionId: raw.sessionId,
    deviceType: raw.deviceType,
    browser: raw.browser,
    os: raw.os,
    durationMs: raw.durationMs,
    correlationId: raw.correlationId,
    metadata: raw.metadata ? (redactDeep(raw.metadata) as Record<string, unknown>) : undefined,
  };
}
