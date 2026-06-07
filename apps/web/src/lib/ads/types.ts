// ============================================================
// SwingVantage — AdsOS: types
// ------------------------------------------------------------
// A config-driven ad placement system. Keyless-first: with no ad network
// configured it shows ZERO paid ads (the clean free experience) but can
// still fill slots with HOUSE promotions (e.g. "invite friends") that
// grow the product now. Youth-safe (no ads for minors) and member-aware
// (clean experience for paying users). Mirrors the Video Studio
// placement pattern.
// ============================================================

export type AdFormat = 'inline' | 'card' | 'banner';

export type AdPlacementId =
  | 'dashboard-feed'
  | 'between-results'
  | 'library-grid'
  | 'drills-list'
  | 'sessions-list';

export interface AdPlacement {
  id: AdPlacementId;
  label: string;
  /** Where in the app this slot lives (for the admin inventory). */
  surface: string;
  format: AdFormat;
  /** Master on/off for the slot. */
  enabled: boolean;
  /** May fall back to a house promo when no paid ad is available. */
  allowHouse: boolean;
  /** Sensitive surfaces never carry paid ads (e.g. anything youth/health). */
  sensitive: boolean;
}

export interface HouseAd {
  id: string;
  title: string;
  body: string;
  cta: { label: string; href: string };
  /** Tailwind accent token group, e.g. 'primary' | 'success'. */
  accent: 'primary' | 'success' | 'warning';
  /** Relative weight in the rotation (higher = more often). */
  weight: number;
}

export type AdDecision =
  | { kind: 'none' }
  | { kind: 'house'; ad: HouseAd }
  | { kind: 'paid'; placement: AdPlacement };

export interface AdContext {
  placementId: AdPlacementId;
  isMinor: boolean;
  isMember: boolean;
  adsConfigured: boolean;
}

export interface AdState {
  version: 1;
  /** House-ad ids the user dismissed (won't show again). */
  dismissedHouse: string[];
}
