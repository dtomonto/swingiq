// ============================================================
// PublishingOS — scheduled-publish processor (SERVER-ONLY)
// ------------------------------------------------------------
// The timer-driven worker behind the cron route. It finds entities whose
// `scheduledFor` is due and actions them by publish mode:
//   • instant      → recordPublishDecision (durable override flips live now)
//   • deploy_backed → runOverridePromotion (opens a GitHub PR via the executor)
// Idempotent: an instant publish moves the entity to `published` (no longer due);
// a deploy-backed one is marked `deploymentStatus:'queued'` so a PR isn't opened
// again every tick. Keyless-safe: deploy-backed entities are skipped (not failed)
// when the executor isn't configured.
// ============================================================

import type { PublishableEntity, PublishEntityType } from './types';
import { listEntities, upsertEntity } from './store';
import { recordPublishDecision } from './service';
import { runOverridePromotion } from './executor/run.server';

/** PURE: scheduled entities whose time has come (scheduledFor ≤ now). */
export function selectDueEntities(entities: PublishableEntity[], nowIso: string): PublishableEntity[] {
  return entities.filter((e) => e.status === 'scheduled' && !!e.scheduledFor && e.scheduledFor <= nowIso);
}

export type CronOutcome = 'published' | 'pr_opened' | 'skipped' | 'failed';

export interface CronItemResult {
  id: string;
  entityType: PublishEntityType;
  publishMode: string;
  outcome: CronOutcome;
  detail?: string;
}

export interface CronResult {
  now: string;
  due: number;
  published: number;
  prsOpened: number;
  skipped: number;
  failed: number;
  items: CronItemResult[];
}

export async function processScheduledPublishes(nowIso: string = new Date().toISOString()): Promise<CronResult> {
  const due = selectDueEntities(await listEntities(), nowIso);
  const items: CronItemResult[] = [];

  for (const e of due) {
    const base = { id: e.id, entityType: e.entityType, publishMode: e.publishMode };

    if (e.publishMode === 'deploy_backed') {
      // Don't open a second PR while one is already in flight.
      if (e.deploymentStatus && e.deploymentStatus !== 'none' && e.deploymentStatus !== 'failed') {
        items.push({ ...base, outcome: 'skipped', detail: 'deploy already in flight' });
        continue;
      }
      const r = await runOverridePromotion({
        entityType: e.entityType, entityId: e.entityId, published: true, title: e.title, actorEmail: 'cron',
      });
      if (!r.configured) {
        items.push({ ...base, outcome: 'skipped', detail: r.reason });
      } else if (r.ok) {
        await upsertEntity({ ...e, deploymentStatus: 'queued', deploymentId: r.job.id, updatedAt: nowIso });
        items.push({ ...base, outcome: 'pr_opened', detail: r.prUrl });
      } else {
        await upsertEntity({ ...e, deploymentStatus: 'failed', updatedAt: nowIso });
        items.push({ ...base, outcome: 'failed', detail: r.error });
      }
    } else {
      const r = await recordPublishDecision({
        entityType: e.entityType, entityId: e.entityId, title: e.title, slug: e.slug,
        action: 'publish', actorEmail: 'cron', riskAcknowledged: true, message: 'Scheduled publish (cron)',
      });
      if (r.ok) items.push({ ...base, outcome: 'published' });
      else items.push({ ...base, outcome: r.reason === 'blocked-critical' ? 'skipped' : 'failed', detail: r.message });
    }
  }

  return {
    now: nowIso,
    due: due.length,
    published: items.filter((i) => i.outcome === 'published').length,
    prsOpened: items.filter((i) => i.outcome === 'pr_opened').length,
    skipped: items.filter((i) => i.outcome === 'skipped').length,
    failed: items.filter((i) => i.outcome === 'failed').length,
    items,
  };
}
