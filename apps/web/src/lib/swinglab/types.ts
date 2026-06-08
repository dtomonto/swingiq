// ============================================================
// SwingVantage — SwingLab 2.0: personalization types (Phase 2)
// ------------------------------------------------------------
// Shared contract between the lab-state adapter (lib/swinglab/labState,
// Phase 2b/2c) and the interactive map UI. Kept tiny and serializable.
//
// HONESTY RULE: every status is derived from real user state. When we
// don't know, a station is `neutral` — never a fabricated badge.
// ============================================================

export type StationStatusKind =
  | 'recommended' // the single highest-impact next station
  | 'retest_due'  // a diagnosed finding here is due to be re-checked
  | 'in_progress' // an active plan / unfinished work lives here
  | 'new'         // tool the user hasn't opened yet
  | 'visited'     // recently used
  | 'neutral';    // nothing to surface (default)

export interface StationStatus {
  kind: StationStatusKind;
  /** Short, human label for the chip (e.g. "Retest due"). Empty for neutral. */
  label: string;
}

export interface LabPersonalization {
  /** Whether this reflects a real signed-in user or a generic preview. */
  mode: 'preview' | 'personalized';
  /** The recommended next station id, or null when unknown. */
  recommendedStationId: string | null;
  /** A "resume your last session" affordance, when one exists. */
  resume: { label: string; href: string } | null;
  /** Per-station status, keyed by station id. Missing ids are treated as neutral. */
  statusById: Record<string, StationStatus>;
}

/** The honest default for logged-out / no-data visitors: a generic preview. */
export const PREVIEW_PERSONALIZATION: LabPersonalization = {
  mode: 'preview',
  recommendedStationId: null,
  resume: null,
  statusById: {},
};
