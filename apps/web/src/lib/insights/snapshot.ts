// ============================================================
// SwingVantage — Owner Insights: local snapshot + provider status (pure)
// ------------------------------------------------------------
// buildLocalSnapshot maps THIS account's data onto the funnel — useful to
// see the shape of each metric, explicitly NOT aggregate. detectProvider
// reads which analytics provider is actually wired so the dashboard never
// implies numbers exist when no provider is connected.
// ============================================================

import type { FunnelStageId, LocalMetric, LocalSnapshot, LocalSnapshotInput, ProviderStatus } from './types';

export function buildLocalSnapshot(input: LocalSnapshotInput): LocalSnapshot {
  const activated = input.sessionCount > 0 || input.videoAnalysisCount > 0;
  const retained = input.streakDays >= 2 || (input.daysSinceLastActivity ?? 99) <= 7;
  const referred = input.referralSignups > 0;

  let stageReached: FunnelStageId = 'acquisition';
  if (activated) stageReached = 'activation';
  if (activated && retained) stageReached = 'retention';
  if (referred) stageReached = 'referral';

  const metrics: LocalMetric[] = [
    { key: 'sessions', label: 'Sessions logged', value: input.sessionCount },
    { key: 'analyses', label: 'Swing analyses', value: input.videoAnalysisCount },
    { key: 'diagnosed', label: 'Diagnoses run', value: input.diagnosedCount },
    { key: 'streak', label: 'Current streak', value: `${input.streakDays}d` },
    {
      key: 'recency',
      label: 'Days since active',
      value: input.daysSinceLastActivity === null ? '—' : `${input.daysSinceLastActivity}d`,
    },
    { key: 'ref-shares', label: 'Invites shared', value: input.referralShares },
    { key: 'ref-signups', label: 'Referral signups', value: input.referralSignups },
    { key: 'team', label: 'Roster size', value: input.teamSize },
    { key: 'reminders', label: 'Reminders on', value: input.remindersOptedIn ? 'Yes' : 'No' },
  ];

  return { stageReached, metrics };
}

interface ProviderWindow extends Window {
  plausible?: unknown;
  posthog?: unknown;
}

/** Detect which aggregate analytics providers are live in this browser. */
export function detectProvider(gaId: string): ProviderStatus {
  const w = (typeof window !== 'undefined' ? window : {}) as ProviderWindow;
  const ga4 = Boolean(gaId) && typeof (w as { gtag?: unknown }).gtag === 'function';
  const plausible = typeof w.plausible === 'function';
  const posthog = Boolean(w.posthog);
  return { ga4, plausible, posthog, anyConnected: ga4 || plausible || posthog };
}
