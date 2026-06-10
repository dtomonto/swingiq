// ============================================================
// PublishingOS — entity detail view-model (PURE, client-safe)
// ------------------------------------------------------------
// The command center's queue answers "what can I publish?"; this builds the
// answer to "should I, and what happens if I do?" for ONE entity. It composes
// the pieces the rich data model already supports but the UI never surfaced:
// risk rationale, a pre-flight validation checklist, the lifecycle/version, the
// per-entity audit timeline, and the registry's honest area metadata.
//
// PURE and dependency-light (only the other pure publishing modules), so the
// detail drawer can build it client-side from data already in the payload —
// no extra server round-trip — and it is trivially unit-testable.
// ============================================================

import type {
  PublishableEntity,
  PublishEvent,
  PublishEntityType,
  PublishStatus,
  PublishMode,
  RiskLevel,
  PublishAction,
  PublishValidationResult,
} from './types';
import { classifyRisk, explainRisk, confirmationDepth, allowsInstantPublish, type ConfirmationDepth } from './risk';
import { areaForType, type SourceLabel } from './entity-registry';
import { validateEntity } from './validation';

/** The minimal queue-row shape the detail builder needs (decoupled from the
 *  server-only admin-data types so this stays client-importable). */
export interface DetailInput {
  entityType: PublishEntityType;
  entityId: string;
  title: string;
  slug?: string;
  published: boolean;
  category?: string;
  date?: string;
}

/** Surfaces that are meant to be indexed + rank — drives which pre-flight
 *  checks are relevant. Conservative: only true where we know a public,
 *  search-facing page is produced. */
const RANKING_TYPES: ReadonlySet<PublishEntityType> = new Set<PublishEntityType>([
  'seo-page',
  'blog-post',
  'milestone',
  'library-video',
]);

export interface DetailTimelineEntry {
  id: string;
  action: PublishAction;
  fromStatus?: PublishStatus;
  toStatus?: PublishStatus;
  actor: string;
  message: string;
  at: string;
}

export interface PublishDetailRisk {
  level: RiskLevel;
  explanation: string;
  confirmation: ConfirmationDepth;
  /** False for critical surfaces — those must go through engineering review. */
  allowsInstant: boolean;
}

export interface PublishDetailLifecycle {
  /** Whether a durable snapshot exists yet (false until first publish action). */
  hasSnapshot: boolean;
  status: PublishStatus;
  version: number;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
  publishedBy?: string;
  scheduledFor?: string;
}

export interface PublishDetailArea {
  source: SourceLabel;
  owner: string;
  publishMode: PublishMode;
  liveConnected: boolean;
  publicRoutes: string[];
  adminHref: string;
  recommendedAction: string;
}

export interface PublishDetail {
  /** `${entityType}:${entityId}` — the canonical entity key. */
  key: string;
  title: string;
  entityType: PublishEntityType;
  published: boolean;
  risk: PublishDetailRisk;
  validation: PublishValidationResult;
  lifecycle: PublishDetailLifecycle;
  timeline: DetailTimelineEntry[];
  area?: PublishDetailArea;
  affectedRoutes: string[];
  /** True when there is published history that an unpublish would revert. */
  canRevert: boolean;
}

export function entityKey(entityType: PublishEntityType, entityId: string): string {
  return `${entityType}:${entityId}`;
}

/**
 * Compose the full detail view-model for one entity.
 *
 * @param input         the queue row (entity identity + current live state)
 * @param entity        the durable snapshot, if one exists yet (post-publish)
 * @param events        this entity's audit events (any order — sorted here)
 * @param existingSlugs slugs taken by OTHER entities of the same type (collision check)
 */
export function buildPublishDetail(
  input: DetailInput,
  entity?: PublishableEntity,
  events: PublishEvent[] = [],
  existingSlugs: string[] = [],
): PublishDetail {
  const key = entityKey(input.entityType, input.entityId);
  const level = classifyRisk(input.entityType, 'publish');
  const area = areaForType(input.entityType);

  // Pre-flight validation on what the queue knows (title + slug). We do NOT
  // claim indexable/rank checks here because the queue row carries no body or
  // metadata — asserting a thin-content/meta failure we can't actually see
  // would be dishonest. The server runs the full content gate at publish time;
  // this is the honest, shallow pre-flight.
  const validation = validateEntity({
    entityType: input.entityType,
    title: input.title,
    slug: input.slug,
    existingSlugs,
  });

  const timeline: DetailTimelineEntry[] = [...events]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((e) => ({
      id: e.id,
      action: e.eventType,
      fromStatus: e.fromStatus,
      toStatus: e.toStatus,
      actor: e.actorEmail ?? 'system',
      message: e.message ?? `${e.eventType} ${e.entityType}`,
      at: e.createdAt,
    }));

  const lifecycle: PublishDetailLifecycle = {
    hasSnapshot: Boolean(entity),
    status: entity?.status ?? (input.published ? 'published' : 'draft'),
    version: entity?.version ?? 0,
    createdAt: entity?.createdAt,
    updatedAt: entity?.updatedAt,
    publishedAt: entity?.publishedAt,
    publishedBy: entity?.publishedBy,
    scheduledFor: entity?.scheduledFor,
  };

  // Affected routes: prefer the snapshot's recorded routes, else the registry's
  // public routes for this surface.
  const affectedRoutes =
    entity?.affectedRoutes && entity.affectedRoutes.length > 0
      ? entity.affectedRoutes
      : area?.publicRoutes ?? [];

  return {
    key,
    title: input.title,
    entityType: input.entityType,
    published: input.published,
    risk: {
      level,
      explanation: explainRisk(input.entityType, level),
      confirmation: confirmationDepth(level),
      allowsInstant: allowsInstantPublish(level),
    },
    validation,
    lifecycle,
    timeline,
    area: area
      ? {
          source: area.source,
          owner: area.owner,
          publishMode: area.publishMode,
          liveConnected: area.liveConnected,
          publicRoutes: area.publicRoutes,
          adminHref: area.adminHref,
          recommendedAction: area.recommendedAction,
        }
      : undefined,
    affectedRoutes,
    // You can revert (unpublish → draft) whenever the surface is currently live.
    canRevert: input.published,
  };
}

/** Whether a ranking/indexable surface — used by callers that want to warn that
 *  the shallow pre-flight here is not the full SEO content gate. */
export function isRankingType(entityType: PublishEntityType): boolean {
  return RANKING_TYPES.has(entityType);
}
