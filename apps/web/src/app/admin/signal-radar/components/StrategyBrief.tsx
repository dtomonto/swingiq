'use client';

import { ArrowRight, FileText, Bug, ShieldAlert, Sparkles, TrendingUp, Swords } from 'lucide-react';
import { SectionCard } from '@/components/admin/SectionCard';
import { StatusBadge } from '@/components/admin/StatusBadge';
import type { StrategyBrief as Brief } from '@/lib/signal-radar/strategy';
import { priorityTone } from '@/lib/signal-radar/labels';
import { EmptyState } from './ui';

export function StrategyBrief({ brief, onOpenSignal }: {
  brief: Brief;
  onOpenSignal: (id: string) => void;
}) {
  if (brief.signalCount === 0) {
    return <EmptyState icon={Sparkles} title="No brief yet" hint="Collect signals and SignalRadar will summarize what changed, what matters, and what to do next." />;
  }

  const linkList = (items: { title: string; signalId: string }[]) => (
    <ul className="space-y-1.5">
      {items.map((it) => (
        <li key={it.signalId}>
          <button onClick={() => onOpenSignal(it.signalId)} className="w-full text-left text-sm text-gray-300 hover:text-amber-300">
            {it.title}
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="space-y-4">
      <SectionCard title="SignalRadar Strategy Brief" description={brief.headline}>
        <ul className="space-y-1.5">
          {brief.highlights.map((h, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
              <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" /> {h}
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title="Do these first" description="Highest-priority actions across all signals.">
        {brief.topActions.length === 0 ? (
          <p className="text-xs text-gray-600">No active items.</p>
        ) : (
          <ol className="space-y-2">
            {brief.topActions.map((a) => (
              <li key={a.signalId}>
                <button onClick={() => a.signalId && onOpenSignal(a.signalId)} className="w-full rounded-lg border border-gray-800 bg-gray-950/40 p-2.5 text-left transition-colors hover:bg-gray-800/40">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-sm font-medium text-amber-300">
                      <ArrowRight className="h-3.5 w-3.5" /> {a.action}
                    </span>
                    <StatusBadge tone={priorityTone(a.priority)}>P{a.priority}</StatusBadge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-gray-400">{a.detail}</p>
                </button>
              </li>
            ))}
          </ol>
        )}
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title={<span className="flex items-center gap-2"><FileText className="h-4 w-4 text-gray-400" /> Content to create</span>}>
          {brief.contentToCreate.length ? linkList(brief.contentToCreate) : <p className="text-xs text-gray-600">No content openings.</p>}
        </SectionCard>
        <SectionCard title={<span className="flex items-center gap-2"><Bug className="h-4 w-4 text-gray-400" /> Product to fix</span>}>
          {brief.productToFix.length ? linkList(brief.productToFix) : <p className="text-xs text-gray-600">No product issues.</p>}
        </SectionCard>
        <SectionCard title={<span className="flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-gray-400" /> Reputation to watch</span>}>
          {brief.reputationToWatch.length ? linkList(brief.reputationToWatch) : <p className="text-xs text-gray-600">No reputation risks.</p>}
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Sport to watch">
          {brief.sportToWatch ? (
            <p className="text-sm text-gray-300">
              <span className="font-semibold text-amber-300">{brief.sportToWatch.label}</span> is generating the most demand
              ({brief.sportToWatch.count} signals) — consider prioritizing that surface.
            </p>
          ) : <p className="text-xs text-gray-600">No sport-specific demand yet.</p>}
        </SectionCard>
        <SectionCard title={<span className="flex items-center gap-2"><Swords className="h-4 w-4 text-gray-400" /> Competitor gaining attention</span>}>
          {brief.competitorGainingAttention ? (
            <p className="text-sm text-gray-300">
              <span className="font-semibold text-amber-300">{brief.competitorGainingAttention.name}</span> is the most-referenced
              competitor ({brief.competitorGainingAttention.count} signals).
            </p>
          ) : <p className="text-xs text-gray-600">No competitor chatter yet.</p>}
        </SectionCard>
      </div>

      {brief.topOpportunity && (
        <SectionCard title="Top opportunity right now" description="The single highest-priority signal to act on.">
          <button onClick={() => onOpenSignal(brief.topOpportunity!.signalId)} className="w-full rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-left transition-colors hover:bg-amber-500/15">
            <span className="flex items-center gap-2 text-sm font-medium text-amber-200">
              <Sparkles className="h-4 w-4" /> {brief.topOpportunity.action}
            </span>
            <p className="mt-1 text-xs text-amber-100/80">{brief.topOpportunity.title}</p>
          </button>
        </SectionCard>
      )}
    </div>
  );
}
