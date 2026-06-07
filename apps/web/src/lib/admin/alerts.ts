// ============================================================
// SwingVantage Admin — derived alerts (isomorphic, pure)
// ------------------------------------------------------------
// Turns REAL signals (system status + platform metrics) into the
// smart alert cards on the Command Center. No invented numbers —
// every alert is grounded in something we actually observed.
// ============================================================

import type { AuditSeverity } from './audit';
import type { SystemStatus } from './data/system';
import type { PlatformMetrics } from './data/metrics';

export interface AdminAlert {
  id: string;
  severity: AuditSeverity | 'success';
  title: string;
  detail: string;
  href?: string;
  cta?: string;
}

const SPORT_LABELS: Record<string, string> = {
  golf: 'Golf', tennis: 'Tennis', pickleball: 'Pickleball', padel: 'Padel',
  baseball: 'Baseball', softball_slow: 'Slow-pitch softball', softball_fast: 'Fast-pitch softball',
};

export function deriveAlerts(system: SystemStatus, metrics: PlatformMetrics): AdminAlert[] {
  const alerts: AdminAlert[] = [];

  // Service-role / cross-user data availability is the most consequential gap.
  if (!metrics.connected) {
    alerts.push({
      id: 'no-service-role',
      severity: 'warning',
      title: 'Live platform data is off',
      detail:
        'Set SUPABASE_SERVICE_ROLE_KEY to unlock cross-user counts, users, athletes and analyses.',
      href: '/admin/integrations',
      cta: 'Review integrations',
    });
  }

  // AI vision is core to the product promise.
  if (!system.capabilities.aiVision) {
    alerts.push({
      id: 'no-ai-vision',
      severity: 'warning',
      title: 'AI swing vision is not connected',
      detail: 'Video/image swing analysis is unavailable until a vision provider key is set.',
      href: '/admin/integrations',
      cta: 'Connect a provider',
    });
  }

  // Any integration down → a single rolled-up info alert.
  const down = system.integrations.filter((i) => !i.connected);
  if (down.length > 0 && metrics.connected) {
    alerts.push({
      id: 'integrations-down',
      severity: 'info',
      title: `${down.length} integration${down.length === 1 ? '' : 's'} not connected`,
      detail: down.map((i) => i.name).join(', ') + '.',
      href: '/admin/system-health',
      cta: 'Open system health',
    });
  }

  // Positive signal: most-used sport (real, from session counts).
  const top = metrics.sportUsage[0];
  if (top && top.sessions > 0) {
    alerts.push({
      id: 'top-sport',
      severity: 'success',
      title: `${SPORT_LABELS[top.sport] ?? top.sport} is your most-used sport`,
      detail: `${top.sessions} practice session${top.sessions === 1 ? '' : 's'} logged across accounts.`,
      href: '/admin/sports',
      cta: 'Tune sport content',
    });
  }

  // Connected but empty — guide first content.
  if (metrics.connected && (metrics.counts.analyses ?? 0) === 0) {
    alerts.push({
      id: 'no-analyses',
      severity: 'info',
      title: 'No swing analyses recorded yet',
      detail: 'Once users analyze swings, quality queues and trends populate here.',
      href: '/admin/ai-analyses',
      cta: 'Open AI analyses',
    });
  }

  return alerts;
}
