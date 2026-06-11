// ============================================================
// SignalRadar OS — alert rules (PURE)
// ------------------------------------------------------------
// The derived notifications (notifications.ts) are the raw alert stream;
// alert rules are the operator's subscription over them: a minimum
// severity threshold plus per-kind muting. Pure + deterministic so the
// dashboard, jest and any future digest forwarder agree on what fires.
// ============================================================

import type {
  SignalNotification, SignalRadarConfig, NotificationSeverity, SignalNotificationKind,
} from './types';

export const SEVERITY_ORDER: Record<NotificationSeverity, number> = {
  critical: 3, high: 2, medium: 1, low: 0,
};

/** Filter raw notifications down to the alerts that should fire. */
export function applyAlertRules(
  notifications: SignalNotification[],
  config: Pick<SignalRadarConfig, 'alertMinSeverity' | 'mutedAlertKinds'>,
): SignalNotification[] {
  const min = SEVERITY_ORDER[config.alertMinSeverity];
  const muted = new Set<SignalNotificationKind>(config.mutedAlertKinds);
  return notifications.filter((n) => SEVERITY_ORDER[n.severity] >= min && !muted.has(n.kind));
}

export interface AlertSummary {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export function summarizeAlerts(alerts: SignalNotification[]): AlertSummary {
  const s: AlertSummary = { total: alerts.length, critical: 0, high: 0, medium: 0, low: 0 };
  for (const a of alerts) s[a.severity]++;
  return s;
}
