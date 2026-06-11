'use client';

import { SectionCard } from '@/components/admin/SectionCard';
import { StatusBadge } from '@/components/admin/StatusBadge';
import type { SignalDashboard } from '@/lib/signal-radar/types';
import { DistributionBars, EmptyState } from './ui';

export function MentionMap({ dashboard, onOpenSignal }: {
  dashboard: SignalDashboard;
  onOpenSignal: (id: string) => void;
}) {
  if (dashboard.totals.all === 0) {
    return <EmptyState title="Nothing to map yet" hint="Collect signals to populate distributions, top sources and clusters." />;
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard title="By source" description="Where signals come from."><DistributionBars buckets={dashboard.bySource} /></SectionCard>
        <SectionCard title="By intent" description="What people are trying to do."><DistributionBars buckets={dashboard.byIntent} /></SectionCard>
        <SectionCard title="By sport" description="Sport demand distribution."><DistributionBars buckets={dashboard.bySport} /></SectionCard>
        <SectionCard title="By sentiment" description="Tone of the conversation."><DistributionBars buckets={dashboard.bySentiment} /></SectionCard>
        <SectionCard title="By priority" description="How urgent the backlog is."><DistributionBars buckets={dashboard.byPriority} /></SectionCard>
        <SectionCard title="Top domains" description="Most active sources."><DistributionBars buckets={dashboard.topDomains} emptyHint="No linked domains yet." /></SectionCard>
      </div>

      <SectionCard title="Signal clusters" description="Recurring themes — patterns worth a page, FAQ, feature or response.">
        {dashboard.clusters.length === 0 ? (
          <p className="text-xs text-muted-foreground/70">No repeated themes yet. Clusters appear once two or more signals share an intent + sport.</p>
        ) : (
          <ul className="space-y-2">
            {dashboard.clusters.map((cl) => (
              <li key={cl.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/40 px-3 py-2">
                <button onClick={() => cl.signalIds[0] && onOpenSignal(cl.signalIds[0])} className="min-w-0 flex-1 text-left text-sm text-foreground hover:text-link">
                  {cl.theme}
                </button>
                <StatusBadge tone="accent">{cl.size} signals</StatusBadge>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
