// ============================================================
// PublishingOS — risk classification (pure)
// ------------------------------------------------------------
// Every entity type has a baseline blast radius. Some ACTIONS escalate it (an
// unpublish or rollback of a high-traffic page is riskier than editing a
// draft). The admin UI uses the resulting RiskLevel to decide how much
// confirmation/validation to demand:
//
//   low      → one-click confirm
//   medium   → preview + affected routes/components
//   high     → explicit confirm + validation output + rollback plan
//   critical → blocked from instant publish; requires engineering review
// ============================================================

import type { PublishEntityType, RiskLevel, PublishAction } from './types';

const ORDER: RiskLevel[] = ['low', 'medium', 'high', 'critical'];

/** Baseline risk for each publishable surface. */
const BASE_RISK: Record<PublishEntityType, RiskLevel> = {
  update: 'low',
  'dev-update': 'low',
  announcement: 'low',
  'roadmap-entry': 'low',
  'nav-item': 'medium',
  'homepage-module': 'medium',
  'blog-post': 'medium',
  'library-video': 'medium',
  'seo-page': 'medium',
  'sport-config': 'high',
  milestone: 'high',
  'trust-copy': 'high',
  'feature-flag': 'high',
};

/** Surfaces where a careless change can hurt acquisition, revenue or legal. */
const HIGH_STAKES: ReadonlySet<PublishEntityType> = new Set<PublishEntityType>([
  'trust-copy',
  'feature-flag',
  'sport-config',
]);

/** Return the higher of two risk levels. */
export function maxRisk(a: RiskLevel, b: RiskLevel): RiskLevel {
  return ORDER.indexOf(a) >= ORDER.indexOf(b) ? a : b;
}

/** Bump a risk level up by one notch (capped at critical). */
function escalate(level: RiskLevel): RiskLevel {
  const i = Math.min(ORDER.indexOf(level) + 1, ORDER.length - 1);
  return ORDER[i];
}

/**
 * Classify the risk of performing `action` on an entity of `entityType`.
 * Unpublishing or rolling back a high-stakes surface escalates one notch.
 */
export function classifyRisk(
  entityType: PublishEntityType,
  action: PublishAction = 'publish',
): RiskLevel {
  let level = BASE_RISK[entityType] ?? 'medium';
  const removing = action === 'unpublish' || action === 'rollback' || action === 'archive';
  if (removing && HIGH_STAKES.has(entityType)) level = escalate(level);
  return level;
}

/** Confirmation depth the UI must enforce for a given risk level. */
export type ConfirmationDepth = 'simple' | 'preview' | 'explicit' | 'blocked';

export function confirmationDepth(level: RiskLevel): ConfirmationDepth {
  switch (level) {
    case 'low':
      return 'simple';
    case 'medium':
      return 'preview';
    case 'high':
      return 'explicit';
    case 'critical':
      return 'blocked';
  }
}

/** True when this risk level may be published instantly (DB override). */
export function allowsInstantPublish(level: RiskLevel): boolean {
  return level !== 'critical';
}

/** Plain-English, non-engineer explanation of why a level was assigned. */
export function explainRisk(entityType: PublishEntityType, level: RiskLevel): string {
  if (level === 'critical') {
    return 'Critical change — it can affect auth, billing or security. Requires engineering review before it can go live.';
  }
  if (HIGH_STAKES.has(entityType)) {
    return 'High-stakes surface — a mistake here can affect acquisition, revenue or legal/trust. Publishing needs explicit confirmation and a rollback plan.';
  }
  if (level === 'high') {
    return 'High-impact change to a search- or product-critical surface. Review the affected routes and keep a rollback target ready.';
  }
  if (level === 'medium') {
    return 'Moderate impact — preview the change and the routes it touches before publishing.';
  }
  return 'Low-impact content change. A simple confirmation is enough.';
}
