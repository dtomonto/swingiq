// ============================================================
// PublishingOS — scheduled-publish status (PURE)
// ------------------------------------------------------------
// A small, side-effect-free roll-up of the scheduling queue, used by the admin
// Action Center adapter to push "reminders & next steps" onto the dashboard:
//   • dueNow      — scheduled entities the hourly cron will publish next run
//   • dueBlocked  — due deploy-backed entities stuck because the GitHub
//                   executor isn't configured (they'd be skipped forever)
//   • upcoming    — entities scheduled for a future time (+ the next time)
//   • failed      — entities a publish/deploy attempt left in a failed state
//
// Semantics mirror cron.server.ts exactly so the dashboard never disagrees with
// what the worker actually does:
//   - "due"        = status 'scheduled' AND scheduledFor ≤ now
//   - deploy-backed = publishMode 'deploy_backed' (everything else publishes
//                     instantly via a durable override)
//   - "in flight"  = a deploy-backed item whose deploymentStatus is already set
//                    (queued/building/…) and not failed — the cron skips these,
//                    so they are neither "due" work nor "blocked".
// PURE: no IO, no env reads — the caller passes `nowIso` and whether the
// executor is configured, so this stays trivially unit-testable.
// ============================================================

import type { PublishableEntity } from './types';

export interface PublishScheduleStatus {
  /** Scheduled & due that the cron will publish on its next run. */
  dueNow: number;
  /** Due deploy-backed entities blocked by a missing GitHub executor. */
  dueBlocked: number;
  /** Scheduled for a future time (not yet due). */
  upcoming: number;
  /** Earliest upcoming `scheduledFor` (ISO), or null when none are upcoming. */
  nextScheduledFor: string | null;
  /** Entities a publish/deploy attempt left in a failed state (need a retry). */
  failed: number;
}

function isDeployBacked(e: PublishableEntity): boolean {
  return e.publishMode === 'deploy_backed';
}

/** Matches the cron's in-flight guard: a deploy already queued/building/live. */
function isDeployInFlight(e: PublishableEntity): boolean {
  return !!e.deploymentStatus && e.deploymentStatus !== 'none' && e.deploymentStatus !== 'failed';
}

function isFailed(e: PublishableEntity): boolean {
  return e.status === 'failed' || e.deploymentStatus === 'failed';
}

/** Roll up the scheduling queue into the counts the dashboard needs. */
export function summarizeScheduleStatus(
  entities: PublishableEntity[],
  nowIso: string,
  executorConfigured: boolean,
): PublishScheduleStatus {
  let dueNow = 0;
  let dueBlocked = 0;
  let upcoming = 0;
  let nextScheduledFor: string | null = null;
  let failed = 0;

  for (const e of entities) {
    if (isFailed(e)) failed++;

    if (e.status !== 'scheduled' || !e.scheduledFor) continue;

    if (e.scheduledFor > nowIso) {
      upcoming++;
      if (nextScheduledFor === null || e.scheduledFor < nextScheduledFor) nextScheduledFor = e.scheduledFor;
      continue;
    }

    // Due now (scheduledFor ≤ now).
    if (isDeployBacked(e)) {
      if (isDeployInFlight(e)) continue; // cron skips in-flight deploys
      if (executorConfigured) dueNow++;
      else dueBlocked++;
    } else {
      dueNow++; // instant publishes always action on the next tick
    }
  }

  return { dueNow, dueBlocked, upcoming, nextScheduledFor, failed };
}
