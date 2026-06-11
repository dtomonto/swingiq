// ============================================================
// ReliabilityOS — types (PURE, isomorphic)
// ------------------------------------------------------------
// The operational-health layer for the admin dashboard. Modelled on the
// existing admin "OS" modules (securityOS, Command Center): a pure,
// deterministic engine fed by sanitized events + server signals, with the
// owner's workflow state (issue status / notes / settings / audit) persisted
// CLIENT-side in localStorage so it works in production's read-only filesystem.
//
// HONESTY: every captured event is sanitized (no secrets/PII). When no cross-
// user backend is configured the dashboard says so rather than inventing
// numbers — it shows admin-session + signal-derived health only.
// ============================================================

/** What kind of operational failure occurred. */
export type OperationalEventType =
  | 'page_load_failed'
  | 'page_data_failed'
  | 'client_crash'
  | 'video_upload_started'
  | 'video_upload_failed'
  | 'video_upload_succeeded'
  | 'video_processing_failed'
  | 'auth_login_failed'
  | 'auth_signup_failed'
  | 'auth_session_failed'
  | 'tool_execution_failed'
  | 'api_request_failed'
  | 'admin_action_failed'
  | 'diagnostic_failed'
  | 'scheduled_task_failed';

/** The product area a failure belongs to. */
export type OperationalCategory =
  | 'page'
  | 'video_upload'
  | 'auth'
  | 'tool'
  | 'api'
  | 'admin'
  | 'diagnostic'
  | 'scheduled_task'
  | 'database'
  | 'storage'
  | 'third_party';

/** Founder-facing impact level. */
export type OperationalSeverity = 'critical' | 'high' | 'medium' | 'low';

/** Owner workflow status for a grouped issue. */
export type OperationalIssueStatus =
  | 'new'
  | 'investigating'
  | 'resolved'
  | 'ignored'
  | 'reopened';

/** Overall operational status of the platform. */
export type SystemHealthStatus = 'healthy' | 'watch' | 'degraded' | 'critical';

/** Where a captured event came from (drives the "cross-user vs my session" honesty label). */
export type OperationalEventSource = 'client' | 'server' | 'ingest';

/**
 * A single sanitized operational event. This is the ONLY shape persisted to the
 * ring buffer / optional ingest. It carries NO raw error objects, request
 * bodies, tokens or PII — only diagnosable metadata.
 */
export interface OperationalEvent {
  /** Stable per-event id. */
  id: string;
  /** ISO timestamp. */
  at: string;
  type: OperationalEventType;
  category: OperationalCategory;
  severity: OperationalSeverity;
  source: OperationalEventSource;
  /** Route the failure happened on (pathname only, no query/hash). */
  route?: string;
  pageName?: string;
  toolName?: string;
  actionName?: string;
  /** For video_upload events: which stage failed. */
  uploadStage?: string;
  httpStatus?: number;
  errorCode?: string;
  /** Already sanitized + truncated. Safe to display. */
  errorMessageSafe?: string;
  /** Deterministic group key (category + route + tool + stage + normalized message + status). */
  fingerprint: string;
  /** Anonymous, non-identifying session id (rotates; never a user id without consent). */
  sessionId?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  browser?: string;
  os?: string;
  durationMs?: number;
  /** Correlation id to tie related events together. */
  correlationId?: string;
  /** Sanitized extra context (redactMetadata applied). */
  metadata?: Record<string, unknown>;
}

/** A grouped issue — many like events collapsed by fingerprint. */
export interface OperationalIssue {
  id: string; // === fingerprint (stable across rescans, basis for owner-state dedupe)
  title: string;
  category: OperationalCategory;
  severity: OperationalSeverity;
  firstSeenAt: string;
  lastSeenAt: string;
  occurrenceCount: number;
  affectedSessionCount: number;
  primaryRoute?: string;
  primaryTool?: string;
  primaryUploadStage?: string;
  representativeMessage?: string;
  /** Most recent events (capped) for the timeline. */
  recentEvents: OperationalEvent[];
  /** Static, category-derived debugging checklist. */
  suggestedActions: string[];
  /** Common browser/device across occurrences, when discernible. */
  commonDevice?: string;
  commonBrowser?: string;
}

/** Owner workflow override for an issue (persisted client-side). */
export interface IssueOverride {
  status: OperationalIssueStatus;
  note?: string;
  /** ISO; set when first moved to resolved. */
  resolvedAt?: string;
  /** ISO; set when snoozed/ignored-until. */
  snoozedUntil?: string;
  updatedAt: string;
}

export type IssueOverrideMap = Record<string, IssueOverride>;

/** An issue joined with its owner-state override, ready for the UI. */
export interface OperationalIssueView extends OperationalIssue {
  status: OperationalIssueStatus;
  note?: string;
  resolvedAt?: string;
  snoozedUntil?: string;
  /** True when status is resolved/ignored and the issue should drop out of the inbox. */
  closed: boolean;
}

/** Tunable alert thresholds (owner settings, localStorage). */
export interface ReliabilitySettings {
  /** Uploads failed in the trailing window to raise a Watch/Degraded alert. */
  uploadFailureThreshold: number;
  /** Auth failures in the trailing window to raise an alert. */
  authFailureThreshold: number;
  /** Window (minutes) used by the threshold checks. */
  thresholdWindowMinutes: number;
  /** How many days to keep events in the local ring buffer. */
  retentionDays: number;
}

export const DEFAULT_SETTINGS: ReliabilitySettings = {
  uploadFailureThreshold: 5,
  authFailureThreshold: 5,
  thresholdWindowMinutes: 60,
  retentionDays: 30,
};

/** Redacted audit entry for owner actions (status change etc.). */
export interface ReliabilityAuditEntry {
  id: string;
  at: string;
  actor: string;
  action: string;
  entityId?: string;
  summary: string;
  metadata?: Record<string, unknown>;
}

export const RELIABILITY_AUDIT_CAP = 300;
export const EVENT_BUFFER_CAP = 500;
export const RECENT_EVENTS_PER_ISSUE = 8;

/**
 * Server-gathered signals (booleans/counts only — never secrets). Mirrors the
 * securityOS posture snapshot. Lets the dashboard show real health even with
 * zero captured events.
 */
export interface ReliabilitySignals {
  /** Whether a durable cross-user store (Supabase) is configured. */
  crossUserCaptureEnabled: boolean;
  /** Whether an error-reporting sink (Sentry) is configured. */
  observabilityConfigured: boolean;
  /** Connector layers and how many of each are configured (from ConnectorOS). */
  connectors: Array<{ layer: string; configured: number; total: number }>;
  /** Open admin audit findings by severity (from the audit snapshot), when available. */
  openAuditFindings?: { p0: number; p1: number; total: number };
  /** Env label. */
  environment: string;
  /** When these signals were gathered. */
  gatheredAt: string;
}

/** Executive summary numbers for the top of the dashboard. */
export interface ReliabilitySummary {
  status: SystemHealthStatus;
  openCritical: number;
  openHigh: number;
  failedUploads24h: number;
  failedLogins24h: number;
  pageFailures24h: number;
  toolFailures24h: number;
  mostAffectedRoute?: string;
  mostAffectedFeature?: string;
  latestCritical?: OperationalIssueView;
  totalEvents: number;
}
