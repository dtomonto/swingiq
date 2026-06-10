// ============================================================
// PublishingOS — service layer (SERVER-ONLY)
// ------------------------------------------------------------
// Orchestrates a publish decision end-to-end: classify risk, enforce the status
// state machine, persist the durable override, append the immutable audit event,
// and snapshot the entity. This is the single entry point the API routes call —
// it is the thing that makes "view-only" into a real, durable, reversible action
// without ever writing to the filesystem.
// ============================================================

import type {
  PublishEntityType,
  PublishAction,
  PublishEvent,
  PublishableEntity,
  PublishStatus,
  RiskLevel,
} from './types';
import { classifyRisk, allowsInstantPublish, confirmationDepth, explainRisk } from './risk';
import { canTransition, statusForAction } from './transitions';
import {
  setPublishOverride,
  appendEvent,
  upsertEntity,
  getEntity,
  listEvents,
  isPublishingPersistent,
} from './store';

let counter = 0;
function uid(prefix: string): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter.toString(36)}`;
}

export interface PublishDecisionInput {
  entityType: PublishEntityType;
  entityId: string;
  title: string;
  slug?: string;
  action: Extract<PublishAction, 'publish' | 'unpublish' | 'archive' | 'rollback'>;
  actorEmail?: string;
  /** Required acknowledgement for high/critical-risk actions. */
  riskAcknowledged?: boolean;
  message?: string;
  affectedRoutes?: string[];
  cacheTags?: string[];
}

export type PublishDecisionResult =
  | {
      ok: true;
      published: boolean;
      status: PublishStatus;
      risk: RiskLevel;
      persistent: boolean;
      entity: PublishableEntity;
      event: PublishEvent;
    }
  | {
      ok: false;
      reason: 'blocked-critical' | 'needs-risk-ack' | 'invalid-transition' | 'invalid-action';
      risk: RiskLevel;
      message: string;
    };

/**
 * Record an admin publish decision durably. Instant for low/medium risk;
 * high-risk requires `riskAcknowledged`; critical is blocked from instant
 * publish and must go through engineering (deploy-backed) review.
 */
export async function recordPublishDecision(
  input: PublishDecisionInput,
): Promise<PublishDecisionResult> {
  const risk = classifyRisk(input.entityType, input.action);
  const toStatus = statusForAction(input.action);
  if (!toStatus) {
    return { ok: false, reason: 'invalid-action', risk, message: `Unsupported action "${input.action}".` };
  }

  // Critical-risk changes never run instantly — any critical action (publish OR
  // a destructive unpublish/rollback of a high-stakes surface) is blocked from
  // the instant path and must go through engineering / deploy-backed review.
  if (!allowsInstantPublish(risk)) {
    return {
      ok: false,
      reason: 'blocked-critical',
      risk,
      message: explainRisk(input.entityType, risk),
    };
  }

  // High-risk actions require an explicit acknowledgement from the operator.
  if (confirmationDepth(risk) === 'explicit' && !input.riskAcknowledged) {
    return {
      ok: false,
      reason: 'needs-risk-ack',
      risk,
      message: `${explainRisk(input.entityType, risk)} Confirm to proceed.`,
    };
  }

  const id = `${input.entityType}:${input.entityId}`;
  const existing = await getEntity(id);
  const fromStatus: PublishStatus = existing?.status ?? 'draft';

  if (!canTransition(fromStatus, toStatus)) {
    return {
      ok: false,
      reason: 'invalid-transition',
      risk,
      message: `Cannot move from "${fromStatus}" to "${toStatus}".`,
    };
  }

  const published = input.action === 'publish';
  const now = new Date().toISOString();

  // 1) Durable publish-state override — the production-safe live toggle.
  await setPublishOverride(input.entityType, input.entityId, published, input.actorEmail);

  // 2) Entity snapshot (versioned).
  const entity: PublishableEntity = {
    id,
    entityType: input.entityType,
    entityId: input.entityId,
    title: input.title,
    slug: input.slug,
    status: toStatus,
    publishMode: 'instant',
    riskLevel: risk,
    updatedBy: input.actorEmail,
    publishedBy: published ? input.actorEmail : existing?.publishedBy,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    publishedAt: published ? now : existing?.publishedAt,
    version: (existing?.version ?? 0) + 1,
    previousVersionId: existing?.id,
    validationStatus: 'passed',
    deploymentStatus: 'none',
    affectedRoutes: input.affectedRoutes ?? existing?.affectedRoutes,
    cacheTags: input.cacheTags ?? existing?.cacheTags,
  };
  await upsertEntity(entity);

  // 3) Immutable audit event.
  const event: PublishEvent = {
    id: uid('evt'),
    publishableEntityId: id,
    entityType: input.entityType,
    eventType: input.action,
    actorEmail: input.actorEmail,
    fromStatus,
    toStatus,
    version: entity.version,
    message: input.message ?? `${input.action} ${input.entityType} "${input.title}"`,
    createdAt: now,
  };
  await appendEvent(event);

  return {
    ok: true,
    published,
    status: toStatus,
    risk,
    persistent: isPublishingPersistent(),
    entity,
    event,
  };
}

/** Recent publish events for the activity feed (newest-first). */
export async function getRecentEvents(limit = 50): Promise<PublishEvent[]> {
  const all = await listEvents();
  return all.slice(0, limit);
}
