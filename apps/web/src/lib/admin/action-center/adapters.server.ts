// ============================================================
// SwingVantage Admin — Action Center: server adapters (SERVER-ONLY)
// ------------------------------------------------------------
// Each adapter wraps an EXISTING accessor and reports what needs the owner.
// No business logic is duplicated — adapters only count + phrase + deep-link.
// Every adapter is defensive: it returns [] on any failure so one broken
// source can never take down the inbox.
//
// Server-only (imports server data layers + node:fs-backed stores). The
// client-localStorage queues (e.g. Generated Fixes) are added by the client
// island in the approvals page, not here.
// ============================================================

import type { ActionItem, ActionSourceAdapter } from './types';
import { loadFindings } from '@/lib/admin/audits/data';
import { loadAlertCounts } from '@/lib/feature-education/server/data';
import { scanForOpportunities } from '@/lib/video-studio';
import { runLinkAgent } from '@/lib/growth/link-intelligence';

// NOTE: A "Publishing / changelog drafts" adapter (wrapping updates-store's
// readPublishSnapshot) is intentionally NOT wired here yet — that module is a
// concurrent, not-yet-on-origin feature. Re-add it as one more entry in
// SERVER_ADAPTERS once @/lib/admin/updates-store ships to master.

// ── Audit findings → the high-priority open items ────────────────────────────
const auditAdapter: ActionSourceAdapter = {
  id: 'audits',
  label: 'Audit Reports',
  collect() {
    const findings = loadFindings();
    const openCritical = findings.filter(
      (f) => f.trackStatus !== 'done' && (f.priority === 'P0' || f.priority === 'P1'),
    );
    if (openCritical.length === 0) return [];
    const hasP0 = openCritical.some((f) => f.priority === 'P0');
    return [
      {
        id: 'audits:open-critical',
        source: 'audits',
        sourceLabel: 'Audit Reports',
        title: `${openCritical.length} high-priority audit finding${openCritical.length === 1 ? '' : 's'} need action`,
        detail: hasP0
          ? 'Includes at least one P0 (critical). Track or resolve from the Audit Reports hub.'
          : 'P1 findings from your scheduled audits. Track or resolve from the Audit Reports hub.',
        severity: hasP0 ? 'critical' : 'warning',
        count: openCritical.length,
        href: '/admin/audits',
        cta: 'Open Audit Reports',
      },
    ];
  },
};

// ── Feature Education → drafts awaiting review (+ content gaps) ───────────────
const featureEducationAdapter: ActionSourceAdapter = {
  id: 'feature-education',
  label: 'Feature Education',
  async collect() {
    const c = await loadAlertCounts();
    const items: ActionItem[] = [];
    if (c.needsReview > 0) {
      items.push({
        id: 'feature-education:needs-review',
        source: 'feature-education',
        sourceLabel: 'Feature Education',
        title: `${c.needsReview} learning draft${c.needsReview === 1 ? '' : 's'} await review`,
        detail: 'Auto-generated tutorials / how-tos / docs ready for your approval before publishing.',
        severity: 'warning',
        count: c.needsReview,
        href: '/admin/feature-education',
        cta: 'Review drafts',
      });
    }
    if (c.gaps > 0) {
      items.push({
        id: 'feature-education:gaps',
        source: 'feature-education',
        sourceLabel: 'Feature Education',
        title: `${c.gaps} feature${c.gaps === 1 ? '' : 's'} need learning content`,
        detail: `${c.drift} drift finding${c.drift === 1 ? '' : 's'}. New features are auto-detected as you ship.`,
        severity: 'info',
        count: c.gaps,
        href: '/admin/feature-education',
        cta: 'Open Feature Education',
      });
    }
    return items;
  },
};

// ── Video Studio → uncovered video opportunities to review ───────────────────
const videoStudioAdapter: ActionSourceAdapter = {
  id: 'video-studio',
  label: 'Video Studio',
  collect() {
    // Only meaningful, uncovered gaps (priority >= 60) so the inbox stays signal.
    const gaps = scanForOpportunities({ includeCovered: false, minPriority: 60 });
    if (gaps.length === 0) return [];
    return [
      {
        id: 'video-studio:opportunities',
        source: 'video-studio',
        sourceLabel: 'Video Studio',
        title: `${gaps.length} video opportunit${gaps.length === 1 ? 'y' : 'ies'} to review`,
        detail: `Top: ${gaps[0].businessRationale}`,
        severity: 'info',
        count: gaps.length,
        href: '/admin/video-studio',
        cta: 'Open Video Studio',
      },
    ];
  },
};

// ── Link Intelligence (SEO) → internal-link recommendations to review ────────
const linkIntelligenceAdapter: ActionSourceAdapter = {
  id: 'link-intelligence',
  label: 'SEO / Link Intelligence',
  collect() {
    const result = runLinkAgent();
    const needsReview = result.recommendations.filter((r) => !r.autoSafe);
    const items: ActionItem[] = [];
    if (needsReview.length > 0) {
      items.push({
        id: 'link-intelligence:recs',
        source: 'link-intelligence',
        sourceLabel: 'SEO / Link Intelligence',
        title: `${needsReview.length} internal-link recommendation${needsReview.length === 1 ? '' : 's'} to review`,
        detail: 'SEO opportunities the link agent found — review and apply the ones you approve.',
        severity: 'info',
        count: needsReview.length,
        href: '/admin/growth/internal-links',
        cta: 'Review SEO links',
      });
    }
    if (result.run.orphansFound > 0) {
      items.push({
        id: 'link-intelligence:orphans',
        source: 'link-intelligence',
        sourceLabel: 'SEO / Link Intelligence',
        title: `${result.run.orphansFound} orphan page${result.run.orphansFound === 1 ? '' : 's'} need an inbound link`,
        detail: 'Orphan pages are invisible to search until something links to them.',
        severity: 'warning',
        count: result.run.orphansFound,
        href: '/admin/growth/internal-links',
        cta: 'Fix orphans',
      });
    }
    return items;
  },
};

/** All server-side Action Center adapters, in a stable order. */
export const SERVER_ADAPTERS: ActionSourceAdapter[] = [
  auditAdapter,
  featureEducationAdapter,
  linkIntelligenceAdapter,
  videoStudioAdapter,
];
