// ============================================================
// PublishingOS — status state machine (pure)
// ------------------------------------------------------------
// The single source of truth for which status changes are legal. The service
// layer asks `canTransition(from, to)` before mutating anything, so an entity
// can never jump from `draft` straight to `live` without passing review/
// validation, and a `published` item can only move to `archived`/`rolled_back`/
// back to `draft` (unpublish) — never to `failed` out of nowhere.
// ============================================================

import type { PublishStatus, PublishAction } from './types';

/** Allowed next-statuses for each current status. */
const TRANSITIONS: Record<PublishStatus, PublishStatus[]> = {
  // draft → published is allowed: it is the one-click instant publish. The real
  // guardrails are the risk classifier + validation gate, not an artificial
  // multi-hop. review/validated remain available for high-stakes pipelines.
  draft: ['draft', 'review', 'validated', 'scheduled', 'published', 'archived'],
  review: ['draft', 'validated', 'scheduled', 'published', 'review', 'archived'],
  validated: ['draft', 'review', 'scheduled', 'published', 'failed', 'archived'],
  scheduled: ['published', 'draft', 'failed', 'archived'],
  published: ['draft', 'archived', 'rolled_back', 'published'],
  failed: ['draft', 'validated', 'archived', 'failed'],
  rolled_back: ['draft', 'validated', 'published', 'archived'],
  archived: ['draft'],
};

/** True when `to` is a legal next status from `from`. */
export function canTransition(from: PublishStatus, to: PublishStatus): boolean {
  if (from === to) return true; // idempotent re-saves are always fine
  return TRANSITIONS[from]?.includes(to) ?? false;
}

/** The legal next statuses from `from` (for rendering action menus). */
export function nextStatuses(from: PublishStatus): PublishStatus[] {
  return TRANSITIONS[from] ?? [];
}

/** Map an admin action verb to the status it drives the entity into. */
export function statusForAction(action: PublishAction): PublishStatus | undefined {
  switch (action) {
    case 'submit_review':
      return 'review';
    case 'validate':
      return 'validated';
    case 'schedule':
      return 'scheduled';
    case 'publish':
      return 'published';
    case 'unpublish':
      return 'draft';
    case 'archive':
      return 'archived';
    case 'rollback':
      return 'rolled_back';
    case 'fail':
      return 'failed';
    case 'create':
    case 'edit':
      return 'draft';
    default:
      return undefined;
  }
}

/** Statuses that are publicly visible (must never include drafts/failures). */
export const PUBLIC_STATUSES: ReadonlySet<PublishStatus> = new Set<PublishStatus>(['published']);

/** True when an entity in this status should render on public surfaces. */
export function isPubliclyVisible(status: PublishStatus): boolean {
  return PUBLIC_STATUSES.has(status);
}

/** Terminal-ish states an admin can still act on but that are not "in flight". */
export function isActionable(status: PublishStatus): boolean {
  return status !== 'archived';
}
