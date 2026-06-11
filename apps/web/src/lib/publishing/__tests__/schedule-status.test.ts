import { summarizeScheduleStatus } from '../schedule-status';
import type { PublishableEntity, PublishEntityType, PublishMode, PublishStatus, DeploymentStatus } from '../types';

function entity(o: {
  entityId: string;
  entityType?: PublishEntityType;
  publishMode?: PublishMode;
  status?: PublishStatus;
  scheduledFor?: string;
  deploymentStatus?: DeploymentStatus;
}): PublishableEntity {
  const entityType = o.entityType ?? 'update';
  const id = `${entityType}:${o.entityId}`;
  return {
    id,
    entityType,
    entityId: o.entityId,
    title: id,
    status: o.status ?? 'scheduled',
    publishMode: o.publishMode ?? 'instant',
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
const SOONER = '2030-01-01T00:00:00Z';
const NOW = '2026-06-10T12:00:00Z';

describe('publishing/summarizeScheduleStatus', () => {
  it('counts instant due items as dueNow and ignores future/draft', () => {
    const s = summarizeScheduleStatus(
      [
        entity({ entityId: 'due', scheduledFor: PAST }),
        entity({ entityId: 'later', scheduledFor: FUTURE }),
        entity({ entityId: 'draft', status: 'draft', scheduledFor: PAST }),
        entity({ entityId: 'noTime' }),
      ],
      NOW,
      true,
    );
    expect(s.dueNow).toBe(1);
    expect(s.upcoming).toBe(1);
    expect(s.dueBlocked).toBe(0);
  });

  it('marks due deploy-backed items as dueNow when the executor IS configured', () => {
    const s = summarizeScheduleStatus(
      [entity({ entityId: 'd1', publishMode: 'deploy_backed', scheduledFor: PAST })],
      NOW,
      true,
    );
    expect(s.dueNow).toBe(1);
    expect(s.dueBlocked).toBe(0);
  });

  it('marks due deploy-backed items as dueBlocked when the executor is NOT configured', () => {
    const s = summarizeScheduleStatus(
      [entity({ entityId: 'd1', publishMode: 'deploy_backed', scheduledFor: PAST })],
      NOW,
      false,
    );
    expect(s.dueNow).toBe(0);
    expect(s.dueBlocked).toBe(1);
  });

  it('treats an in-flight deploy (queued) as neither due nor blocked', () => {
    const s = summarizeScheduleStatus(
      [entity({ entityId: 'd1', publishMode: 'deploy_backed', scheduledFor: PAST, deploymentStatus: 'queued' })],
      NOW,
      false,
    );
    expect(s.dueNow).toBe(0);
    expect(s.dueBlocked).toBe(0);
  });

  it('counts failed status and failed deploymentStatus, and reports the soonest upcoming time', () => {
    const s = summarizeScheduleStatus(
      [
        entity({ entityId: 'f1', status: 'failed' }),
        entity({ entityId: 'f2', publishMode: 'deploy_backed', status: 'scheduled', scheduledFor: PAST, deploymentStatus: 'failed' }),
        entity({ entityId: 'soon', scheduledFor: SOONER }),
        entity({ entityId: 'far', scheduledFor: FUTURE }),
      ],
      NOW,
      true,
    );
    expect(s.failed).toBe(2);
    expect(s.upcoming).toBe(2);
    expect(s.nextScheduledFor).toBe(SOONER);
    // f2 is a deploy-backed item whose last deploy failed (deploymentStatus
    // 'failed' is not "in flight"), so the cron will retry it → dueNow.
    expect(s.dueNow).toBe(1);
  });

  it('is all-zero for an empty queue', () => {
    const s = summarizeScheduleStatus([], NOW, true);
    expect(s).toEqual({ dueNow: 0, dueBlocked: 0, upcoming: 0, nextScheduledFor: null, failed: 0 });
  });
});
