// ============================================================
// SwingVantage Admin — Copilot: snapshot builder (SERVER-ONLY)
// ------------------------------------------------------------
// Composes the SAME honest data sources the Command Center uses into the
// privacy-safe aggregate snapshot the deterministic engine consumes:
//   • platform metrics (service-role counts)   lib/admin/data/metrics
//   • system / integration status              lib/admin/data/system
//   • derived smart alerts                      lib/admin/alerts
//   • the Action Center inbox                   lib/admin/action-center
//   • feature-education coverage counts         lib/feature-education
//   • the admin nav model                       lib/admin/nav
//
// Aggregate-only by design — no per-user rows ever enter the snapshot.
// Every source is wrapped so one failure degrades gracefully.
// NEVER import this from a client component.
// ============================================================

import { getPlatformMetrics } from '@/lib/admin/data/metrics';
import { getSystemStatus } from '@/lib/admin/data/system';
import { deriveAlerts } from '@/lib/admin/alerts';
import { collectServerActions } from '@/lib/admin/action-center';
import { loadAlertCounts } from '@/lib/feature-education/server/data';
import { NAV_ITEMS } from '@/lib/admin/nav';
import type { CopilotSnapshot } from './types';

type Severity = 'critical' | 'warning' | 'info' | 'success';
const SEVERITIES: Severity[] = ['critical', 'warning', 'info', 'success'];
const asSeverity = (s: string): Severity => (SEVERITIES.includes(s as Severity) ? (s as Severity) : 'info');

export async function buildCopilotSnapshot(): Promise<CopilotSnapshot> {
  const system = getSystemStatus();
  const caps = system.capabilities;

  const [metrics, actions, fe] = await Promise.all([
    getPlatformMetrics().catch(() => null),
    collectServerActions().catch(() => []),
    loadAlertCounts().catch(() => ({ features: 0, gaps: 0, drift: 0, needsReview: 0 })),
  ]);

  const safeMetrics =
    metrics ??
    ({
      connected: false,
      reason: 'Platform metrics unavailable.',
      counts: { golfProfiles: null, sportProfiles: null, sessions: null, analyses: null, community: null, authUsers: null },
      authUsersCapped: false,
      sportUsage: [],
      recentAnalyses: [],
    } as const);

  const alerts = deriveAlerts(system, safeMetrics as Parameters<typeof deriveAlerts>[1]);

  const built = NAV_ITEMS.filter((i) => i.built).length;

  return {
    generatedAt: new Date().toISOString(),
    connected: safeMetrics.connected,
    connectReason: safeMetrics.connected ? undefined : safeMetrics.reason,
    counts: {
      authUsers: safeMetrics.counts.authUsers,
      golfProfiles: safeMetrics.counts.golfProfiles,
      sportProfiles: safeMetrics.counts.sportProfiles,
      sessions: safeMetrics.counts.sessions,
      analyses: safeMetrics.counts.analyses,
      community: safeMetrics.counts.community,
    },
    authUsersCapped: safeMetrics.authUsersCapped,
    sportUsage: safeMetrics.sportUsage.map((s) => ({ sport: s.sport, sessions: s.sessions })),
    integrations: system.integrations.map((i) => ({ id: i.id, name: i.name, connected: i.connected })),
    capabilities: {
      auth: caps.auth,
      aiVision: caps.aiVision,
      aiCoach: caps.aiCoach,
      ocr: caps.ocr,
      email: caps.email,
      billing: caps.billing,
      ads: caps.ads,
      auditAccess: caps.auditAccess,
    },
    alerts: alerts.map((a) => ({
      id: a.id,
      severity: asSeverity(a.severity),
      title: a.title,
      detail: a.detail,
      href: a.href,
      cta: a.cta,
    })),
    actions: actions.map((a) => ({
      id: a.id,
      sourceLabel: a.sourceLabel,
      title: a.title,
      detail: a.detail,
      severity: asSeverity(a.severity),
      count: a.count,
      href: a.href,
      cta: a.cta,
    })),
    featureEducation: {
      features: fe.features,
      gaps: fe.gaps,
      drift: fe.drift,
      needsReview: fe.needsReview,
    },
    sections: {
      built,
      total: NAV_ITEMS.length,
      soon: NAV_ITEMS.filter((i) => !i.built).map((i) => i.label),
    },
  };
}
