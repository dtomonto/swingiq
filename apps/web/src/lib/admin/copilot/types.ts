// ============================================================
// SwingVantage Admin — Copilot: shared types (isomorphic, pure)
// ------------------------------------------------------------
// The Admin Copilot answers founder/operator questions about the
// platform using ONLY data the admin already has. The snapshot below
// is a privacy-safe, AGGREGATE view (counts, booleans, alert summaries)
// — never per-user rows — so neither the engine nor the client can leak
// personally-identifiable data.
//
// The engine that turns a snapshot + a question into an answer
// (engine.ts) is pure and dependency-free, which makes it fully unit
// testable and keeps it keyless: every answer is COMPUTED from real
// signals, never invented. An optional model adapter (ai-seam.ts) can
// layer free-form answers on top, off by default and clearly labeled.
// ============================================================

/** A privacy-safe, aggregate snapshot of platform state for the Copilot. */
export interface CopilotSnapshot {
  generatedAt: string;
  /** Whether the service-role client is connected (live cross-user data). */
  connected: boolean;
  /** Present only when not connected — why live data is unavailable. */
  connectReason?: string;
  /** Aggregate record counts. `null` = not available (not "zero"). */
  counts: {
    authUsers: number | null;
    golfProfiles: number | null;
    sportProfiles: number | null;
    sessions: number | null;
    analyses: number | null;
    community: number | null;
  };
  /** True when the auth-user count hit the page cap and is a floor. */
  authUsersCapped: boolean;
  /** Practice sessions per sport, sorted desc. Empty when none/unconnected. */
  sportUsage: { sport: string; sessions: number }[];
  /** Integration connection booleans (no secrets). */
  integrations: { id: string; name: string; connected: boolean }[];
  /** Product-capability booleans derived from configured providers. */
  capabilities: {
    auth: boolean;
    aiVision: boolean;
    aiCoach: boolean;
    ocr: boolean;
    email: boolean;
    billing: boolean;
    ads: boolean;
    auditAccess: boolean;
  };
  /** Derived smart alerts (same source as the Command Center). */
  alerts: {
    id: string;
    severity: 'critical' | 'warning' | 'info' | 'success';
    title: string;
    detail: string;
    href?: string;
    cta?: string;
  }[];
  /** Action Center inbox roll-up (what needs the owner). */
  actions: {
    id: string;
    sourceLabel: string;
    title: string;
    detail?: string;
    severity: 'critical' | 'warning' | 'info' | 'success';
    count: number;
    href: string;
    cta?: string;
  }[];
  /** Feature-education coverage counts. */
  featureEducation: {
    features: number;
    gaps: number;
    drift: number;
    needsReview: number;
  };
  /** Admin section coverage from the nav model. */
  sections: { built: number; total: number; soon: string[] };
}

export type CopilotConfidence = 'high' | 'medium' | 'low';

/** Where a number/claim in an answer came from (transparency). */
export interface CopilotSource {
  label: string;
  href?: string;
}

/** A recommended next action — gated by whether its route is built. */
export interface CopilotAction {
  label: string;
  href: string;
  built: boolean;
}

/** A structured, grounded answer to one question. */
export interface CopilotAnswer {
  /** Resolved intent id (see questions.ts). */
  intent: string;
  title: string;
  /** Plain-English paragraph a non-technical founder can act on. */
  summary: string;
  /** Supporting points, each grounded in the snapshot. */
  bullets: string[];
  /** Data provenance for everything above. */
  sources: CopilotSource[];
  /** Suggested next steps (deep links into the existing tools). */
  actions: CopilotAction[];
  confidence: CopilotConfidence;
  /** 'computed' = deterministic from data; 'ai' = model-generated. */
  generatedBy: 'computed' | 'ai';
  /** Always false here — the Copilot only reads, it never executes. */
  needsApproval: boolean;
  /** Honesty note when data is missing or the answer is a pointer, not a result. */
  caveat?: string;
}
