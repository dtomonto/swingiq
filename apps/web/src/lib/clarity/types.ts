// ============================================================
// Clarity OS — shared types (isomorphic, safe on client & server)
// ------------------------------------------------------------
// Describes the Microsoft Clarity control center the admin sees. NOTHING
// here carries a secret: the Data Export API token never leaves the server
// (see config.ts getReadConfig). `ClarityConnection` is the sanitized view
// that IS sent to the browser. Mirrors lib/posthog/types.ts in spirit.
// ============================================================

/**
 * How fully Clarity is wired:
 *   • none   — no project id at all (the tag never loads, nothing records).
 *   • ingest — project id set: heatmaps & recordings collect IN Clarity, but
 *              we cannot read metrics back here (no Data Export API token).
 *   • full   — project id + Data Export token: live metrics render in the OS.
 */
export type ConnectionLevel = 'none' | 'ingest' | 'full';

/** Sanitized connection status — safe to pass to client components. */
export interface ClarityConnection {
  level: ConnectionLevel;
  /** Public (browser) project id, masked for display. */
  projectIdMasked: string | null;
  /** Whether the public project id is set (tag loads / data collects). */
  ingestConfigured: boolean;
  /** Raw project id — needed to build deep links into clarity.microsoft.com. */
  projectId: string | null;
  /** Whether the server-side Data Export API token is configured. */
  readConfigured: boolean;
  /** Base URL of the Clarity app for this project, for deep links. */
  appBaseUrl: string;
}

/** What the OS can do for a given Clarity capability. */
export type CapabilityAccess =
  | 'live' // we render the data inside the OS
  | 'linked'; // we deep-link into Clarity for the rich UI

/** Resolved per-capability state once we know the connection. */
export type CapabilityState = 'live' | 'linked' | 'needs-key';

export type CapabilityGroupId = 'observe' | 'analyze' | 'configure';

export interface ClarityCapability {
  id: string;
  label: string;
  description: string;
  group: CapabilityGroupId;
  /** Best thing the OS can do for this capability. */
  access: CapabilityAccess;
  /** True when the action needs the server-side Data Export API token. */
  needsReadKey: boolean;
  /** Path within the Clarity app for the deep link (joined to appBaseUrl). */
  clarityPath: string;
  /** Lucide icon name, mapped to a component in the UI layer. */
  icon: string;
}

/** A capability with its state resolved against the live connection. */
export interface ResolvedCapability extends ClarityCapability {
  state: CapabilityState;
  /** Fully-qualified deep link into Clarity (or null when not connected). */
  href: string | null;
}

/** The static dashboard the server hands to the client on page load. */
export interface ClarityOsDashboard {
  connection: ClarityConnection;
  coverage: ResolvedCapability[];
  coverageByGroup: { group: CapabilityGroupId; label: string; items: ResolvedCapability[] }[];
  coverageStats: { live: number; linked: number; needsKey: number; total: number };
  /** The quality signals the OS surfaces from the Data Export API (catalog). */
  signalCatalog: { id: string; label: string; description: string }[];
  /** Dimensions the Data Export API supports for breakdowns. */
  dimensions: { id: string; label: string }[];
  /** ISO timestamp the dashboard was assembled (for "as of"). */
  generatedAt: string;
}

// ── Live data shapes (returned by the API route when level === 'full') ──

/** Headline traffic totals for the window. */
export interface ClarityTraffic {
  totalSessions: number | null;
  botSessions: number | null;
  distinctUsers: number | null;
  pagesPerSession: number | null;
}

/** Engagement metrics (scroll depth + time on page). */
export interface ClarityEngagement {
  /** Average scroll depth, 0–100 (%). */
  averageScrollDepth: number | null;
  /** Total time in seconds (as reported by Clarity). */
  totalTime: number | null;
  /** Active (engaged) time in seconds. */
  activeTime: number | null;
}

/**
 * A behavioral quality signal (the "Insights" Clarity is famous for):
 * rage clicks, dead clicks, excessive scrolling, quick-backs, script errors.
 */
export interface ClaritySignal {
  id: string;
  label: string;
  /** Sessions exhibiting the signal. */
  sessions: number | null;
  /** Percentage of sessions exhibiting it (0–100). */
  pct: number | null;
}

/** One row of a dimension breakdown (e.g. by Browser / Device / Country). */
export interface ClarityBreakdownRow {
  name: string;
  sessions: number | null;
  pct: number | null;
}

export interface ClarityLiveSnapshot {
  traffic: ClarityTraffic;
  engagement: ClarityEngagement;
  signals: ClaritySignal[];
  /** Optional single-dimension breakdown when one was requested. */
  breakdown: { dimension: string; rows: ClarityBreakdownRow[] } | null;
  /** Raw metric names Clarity returned, for transparency. */
  metricsReturned: string[];
  /**
   * The raw, unparsed JSON Clarity returned. Surfaced in an admin debug view
   * so the exact field shapes can be confirmed against the live API (the
   * normalizer in client.ts reconstructs field names defensively, so this is
   * how a mismatch gets spotted and corrected). Admin-only, never user-facing.
   */
  raw: unknown;
  numOfDays: number;
  errors: Record<string, string>;
  fetchedAt: string;
}

/** Normalized result of any Clarity API call — never throws. */
export interface ClarityResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
  error: string | null;
}
