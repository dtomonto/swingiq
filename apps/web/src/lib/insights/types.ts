// ============================================================
// SwingVantage — Owner Insights / North-Star OS: types
// ------------------------------------------------------------
// The owner's command view of growth. Honest by construction: it
// separates the STRATEGY (North-Star + funnel + targets — always known)
// from MEASUREMENT (aggregate numbers live in your analytics provider;
// only this account's data can be read locally).
// ============================================================

export type FunnelStageId =
  | 'acquisition' | 'activation' | 'retention' | 'referral' | 'revenue';

export interface FunnelStage {
  id: FunnelStageId;
  label: string;
  /** The plain-English question this stage answers. */
  question: string;
  /** The single metric that defines progress at this stage. */
  metric: string;
  /** Directional target for the current go-to-market phase. */
  target: string;
  /** Which GTM phase this stage is the focus of. */
  phase: 'now' | 'next' | 'later';
}

export interface NorthStar {
  name: string;
  definition: string;
  why: string;
}

/** Which analytics provider is wired (detected at runtime). */
export interface ProviderStatus {
  ga4: boolean;
  plausible: boolean;
  posthog: boolean;
  /** True when at least one aggregate provider is active. */
  anyConnected: boolean;
}

/** A single number computed from THIS account's local data. */
export interface LocalMetric {
  key: string;
  label: string;
  value: number | string;
  hint?: string;
}

/** What the local snapshot needs — passed in by the hook (no store coupling here). */
export interface LocalSnapshotInput {
  sessionCount: number;
  videoAnalysisCount: number;
  diagnosedCount: number;
  streakDays: number;
  daysSinceLastActivity: number | null;
  referralShares: number;
  referralSignups: number;
  teamSize: number;
  remindersOptedIn: boolean;
}

export interface LocalSnapshot {
  /** The activation state of this account, mapped onto the funnel. */
  stageReached: FunnelStageId;
  metrics: LocalMetric[];
}
