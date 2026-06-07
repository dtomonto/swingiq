// ============================================================
// Link Intelligence Agent — notifications
// ------------------------------------------------------------
// Turns the agent's findings into a small, prioritized notification feed for
// the hub (and, optionally, the GrowthOS overview). Derived only from real
// signals — never invented.
// ============================================================

import type {
  LinkNotification, LinkFinding, InternalLinkRecommendation, ClusterHealth,
} from './types';
import type { AuthorityOpportunity } from '../types';
import { id } from './id';

export interface NotificationInput {
  findings: LinkFinding[];
  recommendations: InternalLinkRecommendation[];
  opportunities: AuthorityOpportunity[];
  clusters: ClusterHealth[];
  providerConnected: boolean;
}

const HUB = '/admin/growth/link-intelligence';

export function deriveNotifications(input: NotificationInput): LinkNotification[] {
  const now = new Date().toISOString();
  const out: LinkNotification[] = [];
  const push = (n: Omit<LinkNotification, 'createdAt'>) => out.push({ ...n, createdAt: now });

  const orphans = input.findings.filter((f) => f.findingType === 'orphan');
  if (orphans.length > 0) {
    push({ id: id('ntf', 'orphans'), kind: 'orphan', severity: 'high', title: `${orphans.length} orphan page${orphans.length === 1 ? '' : 's'} found`, detail: 'Pages with no internal path from the homepage — add a contextual link to each.', href: `${HUB}/../internal-links` });
  }

  const broken = input.findings.filter((f) => f.findingType === 'broken-internal');
  if (broken.length > 0) {
    push({ id: id('ntf', 'broken'), kind: 'broken-link', severity: 'high', title: `${broken.length} broken internal link${broken.length === 1 ? '' : 's'}`, detail: 'Internal links pointing at URLs that don\'t resolve — fix or remove.', href: `${HUB}/../internal-links` });
  }

  const pending = input.recommendations.filter((r) => r.status === 'pending');
  if (pending.length > 0) {
    push({ id: id('ntf', 'recs'), kind: 'rec-ready', severity: 'medium', title: `${pending.length} internal-link recommendation${pending.length === 1 ? '' : 's'} ready`, detail: `${input.recommendations.filter((r) => r.autoSafe).length} are safe to auto-apply; the rest need a quick review.`, href: `${HUB}/../internal-links` });
  }

  const newOpps = input.opportunities.filter((o) => o.status === 'idea');
  if (newOpps.length > 0) {
    push({ id: id('ntf', 'outreach'), kind: 'outreach-approval', severity: 'medium', title: `${newOpps.length} backlink opportunit${newOpps.length === 1 ? 'y' : 'ies'} to review`, detail: 'White-hat opportunities discovered — qualify, draft outreach, then approve to send.', href: '/admin/growth/pr' });
  }

  for (const c of input.clusters.filter((c) => c.pageCount >= 2 && c.authorityScore < 45).slice(0, 3)) {
    push({ id: id('ntf', 'cluster', c.id), kind: 'cluster-decline', severity: 'medium', title: `${c.label} cluster authority is low (${c.authorityScore}/100)`, detail: `${c.orphanCount} orphan(s), avg depth ${c.avgDepth}. Strengthen pillar + interlinking.`, href: HUB });
  }

  if (!input.providerConnected) {
    push({ id: id('ntf', 'provider'), kind: 'provider-disconnected', severity: 'low', title: 'Connect a backlink data provider for live data', detail: 'Backlink + competitor panels run on curated examples until Ahrefs/Semrush/Search Console is connected.', href: '/admin/integrations' });
  }

  const order = { critical: 0, high: 1, medium: 2, low: 3 } as const;
  return out.sort((a, b) => order[a.severity] - order[b.severity]);
}
