// ============================================================
// Admin — data-pipeline / linkage health cards (server-safe)
// ------------------------------------------------------------
// Renders the "does the data link up?" summary (sessions → diagnosis →
// analyses) for one user or fleet-wide. A "gap" is a data-integrity issue
// (e.g. shots recorded but no diagnosis), NOT a failure — failures stay
// anonymized in ReliabilityOS, so nothing here attributes a crash to a person.
// ============================================================

import { SectionCard } from './SectionCard';
import { MetricStat } from './MetricStat';
import { StatusBadge } from './StatusBadge';
import type { PipelineHealth } from '@/lib/admin/data/pipeline-health';

function StatusPill({ status }: { status: PipelineHealth['status'] }) {
  return (
    <StatusBadge tone={status === 'healthy' ? 'success' : 'warning'}>
      {status === 'healthy' ? 'Healthy' : 'Needs attention'}
    </StatusBadge>
  );
}

function HealthBody({ health }: { health: PipelineHealth }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricStat label="Sessions" value={health.sessions.total} />
        <MetricStat label="Diagnosed" value={health.sessions.scored} tone="success" />
        <MetricStat label="Unscored" value={health.sessions.unscored} tone={health.sessions.unscored ? 'warning' : 'default'} />
        <MetricStat label="Analyses" value={health.analyses.total} />
      </div>
      {health.gaps.length > 0 ? (
        <ul className="mt-4 space-y-1.5">
          {health.gaps.map((g) => (
            <li key={g} className="flex items-center gap-2 text-sm text-warning-text">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-warning" aria-hidden="true" />
              {g}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          No linkage gaps — every session with shots has a diagnosis.
        </p>
      )}
    </>
  );
}

/** One account's pipeline health (user-detail page). */
export function UserPipelineHealthCard({ health }: { health: PipelineHealth }) {
  return (
    <SectionCard
      title="Pipeline health"
      description="How this account's data links up: sessions → diagnosis → analyses. Derived from their own records — never from failure events."
      actions={<StatusPill status={health.status} />}
    >
      <HealthBody health={health} />
    </SectionCard>
  );
}

/** Fleet-wide pipeline health (users list page). */
export function SystemPipelineHealthCard({ health }: { health: PipelineHealth }) {
  return (
    <SectionCard
      title="Data pipeline health"
      description="Fleet-wide linkage across every account: sessions → diagnosis → analyses."
      actions={<StatusPill status={health.status} />}
    >
      <HealthBody health={health} />
      <p className="mt-3 text-[11px] text-muted-foreground/70">
        Counts are exact. A &ldquo;gap&rdquo; means data didn&rsquo;t link up (e.g. shots recorded with no
        diagnosis), not a crash — failures stay anonymized in Reliability.
      </p>
    </SectionCard>
  );
}
