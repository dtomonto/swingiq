import { selectDueEntities, processScheduledPublishes } from '../cron.server';
import { upsertEntity, getPublishOverrides, getEntity, __resetMemoryStore } from '../store';
import { __resetJobStore } from '../executor/jobs.server';
import type { PublishableEntity, PublishEntityType, PublishMode, DeploymentStatus } from '../types';

function entity(o: {
  entityType: PublishEntityType;
  entityId: string;
  publishMode: PublishMode;
  status?: PublishableEntity['status'];
  scheduledFor?: string;
  deploymentStatus?: DeploymentStatus;
}): PublishableEntity {
  const id = `${o.entityType}:${o.entityId}`;
  return {
    id,
    entityType: o.entityType,
    entityId: o.entityId,
    title: id,
    status: o.status ?? 'scheduled',
    publishMode: o.publishMode,
    riskLevel: 'low',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    version: 1,
    validationStatus: 'passed',
    deploymentStatus: o.deploymentStatus ?? 'none',
    scheduledFor: o.scheduledFor,
  };
}

const PAST = '2020-01-01T00:00:00Z';
const FUTURE = '2999-01-01T00:00:00Z';
const NOW = '2026-06-10T12:00:00Z';

describe('publishing/cron selectDueEntities (pure)', () => {
  it('selects only scheduled entities whose time has passed', () => {
    const ents = [
      entity({ entityType: 'update', entityId: 'due', publishMode: 'instant', scheduledFor: PAST }),
      entity({ entityType: 'update', entityId: 'future', publishMode: 'instant', scheduledFor: FUTURE }),
      entity({ entityType: 'update', entityId: 'noTime', publishMode: 'instant' }),
      entity({ entityType: 'update', entityId: 'draft', publishMode: 'instant', status: 'draft', scheduledFor: PAST }),
    ];
    expect(selectDueEntities(ents, NOW).map((e) => e.entityId)).toEqual(['due']);
  });
});

describe('publishing/cron processScheduledPublishes', () => {
  beforeEach(() => {
    __resetMemoryStore();
    __resetJobStore();
    delete process.env.GITHUB_TOKEN;
    delete process.env.GITHUB_REPO;
  });

  it('publishes instant entities and skips deploy-backed when the executor is unconfigured', async () => {
    await upsertEntity(entity({ entityType: 'update', entityId: 'u1', publishMode: 'instant', scheduledFor: PAST }));
    await upsertEntity(entity({ entityType: 'milestone', entityId: 'm1', publishMode: 'deploy_backed', scheduledFor: PAST }));
    await upsertEntity(entity({ entityType: 'update', entityId: 'later', publishMode: 'instant', scheduledFor: FUTURE }));

    const res = await processScheduledPublishes(NOW);
    expect(res.due).toBe(2);
    expect(res.published).toBe(1);
    expect(res.skipped).toBe(1); // deploy-backed with no GITHUB_TOKEN → skipped, not failed
    expect((await getPublishOverrides('update'))['u1']).toBe(true);
    expect((await getEntity('update:u1'))?.status).toBe('published');
  });

  it('is idempotent: an instant publish is not re-actioned on the next run', async () => {
    await upsertEntity(entity({ entityType: 'update', entityId: 'u1', publishMode: 'instant', scheduledFor: PAST }));
    await processScheduledPublishes(NOW);
    const again = await processScheduledPublishes(NOW);
    expect(again.published).toBe(0);
  });
});
