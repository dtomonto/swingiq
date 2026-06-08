// ============================================================
// CentralIntelligenceOS — Coach Mix: Learned-Concept Review Queue
// ------------------------------------------------------------
// The admin gate. Every extracted concept lands here as `pending` and
// influences NOTHING until an admin acts on it. Pure, immutable state
// transitions so the queue is trivial to test and wire to any store.
// ============================================================

import type { LearnedConcept, ReviewStatus } from './types';

/** Apply a review decision, returning a NEW concept (never mutates). */
function transition(
  concept: LearnedConcept,
  status: ReviewStatus,
  patch: Partial<LearnedConcept> = {},
): LearnedConcept {
  return {
    ...concept,
    ...patch,
    reviewStatus: status,
    reviewedAt: new Date().toISOString(),
  };
}

export function approveConcept(concept: LearnedConcept, reviewerNotes?: string): LearnedConcept {
  return transition(concept, 'approved', reviewerNotes ? { reviewerNotes } : {});
}

/** Approve with an admin-edited original rewrite (the safe, preferred path). */
export function editAndApproveConcept(
  concept: LearnedConcept,
  editedRewrite: string,
  reviewerNotes?: string,
): LearnedConcept {
  return transition(concept, 'approved', {
    suggestedRewrite: editedRewrite,
    ...(reviewerNotes ? { reviewerNotes } : {}),
  });
}

export function rejectConcept(concept: LearnedConcept, reviewerNotes?: string): LearnedConcept {
  return transition(concept, 'rejected', reviewerNotes ? { reviewerNotes } : {});
}

export function archiveConcept(concept: LearnedConcept): LearnedConcept {
  return transition(concept, 'archived');
}

export function markNeedsSourceReview(concept: LearnedConcept, reviewerNotes?: string): LearnedConcept {
  return transition(concept, 'needs_source_review', reviewerNotes ? { reviewerNotes } : {});
}

/** Concepts still awaiting a decision (what the admin queue shows first). */
export function pendingConcepts(concepts: LearnedConcept[]): LearnedConcept[] {
  return concepts.filter(
    (c) => c.reviewStatus === 'pending' || c.reviewStatus === 'needs_source_review',
  );
}

/**
 * THE GATE. The only concepts permitted to influence user-facing product
 * behavior: explicitly approved. Anything pending/rejected/archived or
 * flagged for source review is excluded — including every `high` IP-risk
 * concept that has not been approved with an original rewrite.
 */
export function approvedInfluencingConcepts(concepts: LearnedConcept[]): LearnedConcept[] {
  return concepts.filter((c) => c.reviewStatus === 'approved');
}

/** Queue health summary for the admin dashboard. */
export interface ReviewQueueStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  archived: number;
  needsSourceReview: number;
  highIpRiskPending: number;
}

export function reviewQueueStats(concepts: LearnedConcept[]): ReviewQueueStats {
  const stat: ReviewQueueStats = {
    total: concepts.length,
    pending: 0,
    approved: 0,
    rejected: 0,
    archived: 0,
    needsSourceReview: 0,
    highIpRiskPending: 0,
  };
  for (const c of concepts) {
    if (c.reviewStatus === 'pending') stat.pending += 1;
    else if (c.reviewStatus === 'approved') stat.approved += 1;
    else if (c.reviewStatus === 'rejected') stat.rejected += 1;
    else if (c.reviewStatus === 'archived') stat.archived += 1;
    else if (c.reviewStatus === 'needs_source_review') stat.needsSourceReview += 1;
    if (c.ipRisk === 'high' && c.reviewStatus !== 'approved' && c.reviewStatus !== 'rejected') {
      stat.highIpRiskPending += 1;
    }
  }
  return stat;
}
