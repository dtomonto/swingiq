'use client';

import { AlertTriangle, FileText, Link2, Users, Bug, Megaphone, Plus, CheckCircle2, Circle, Bell } from 'lucide-react';
import { MetricStat } from '@/components/admin/MetricStat';
import { SectionCard } from '@/components/admin/SectionCard';
import { StatusBadge } from '@/components/admin/StatusBadge';
import type { SignalDashboard, AdapterStatus, NotificationSeverity } from '@/lib/signal-radar/types';
import type { AdapterHealthSummary } from '@/lib/signal-radar/adapters';
import { ADAPTER_STATE_LABEL, ADAPTER_STATE_TONE } from '@/lib/signal-radar/labels';
import { Btn, DistributionBars, EmptyState, SignalBadges } from './ui';

const NOTE_TONE: Record<NotificationSeverity, 'danger' | 'warning' | 'info' | 'neutral'> = {
  critical: 'danger', high: 'warning', medium: 'info', low: 'neutral',
};

export function Overview({
  dashboard, adapters, adapterSummary, usingSample, onOpenSignal, onAdd, onGoTab,
}: {
  dashboard: SignalDashboard;
  adapters: AdapterStatus[];
  adapterSummary: AdapterHealthSummary;
  usingSample: boolean;
  onOpenSignal: (id: string) => void;
  onAdd: () => void;
  onGoTab: (t: 'inbox' | 'competitors' | 'settings') => void;
}) {
  const t = dashboard.totals;

  return (
    <div className="space-y-5">
      {/* Executive summary cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricStat label="New signals" value={t.newCount} icon={Bell} />
        <MetricStat label="High priority" value={t.highPriority} icon={AlertTriangle} tone={t.highPriority ? 'warning' : 'default'} />
        <MetricStat label="Negative / risk" value={t.negativeRisk} icon={AlertTriangle} tone={t.negativeRisk ? 'warning' : 'default'} />
        <MetricStat label="SEO opportunities" value={t.seoOpportunities} icon={FileText} />
        <MetricStat label="Product feedback" value={t.productFeedback} icon={Bug} />
        <MetricStat label="Backlink leads" value={t.backlinkOpportunities} icon={Link2} />
        <MetricStat label="Partnership leads" value={t.partnershipLeads} icon={Users} />
        <MetricStat
          label="Live sources"
          value={`${adapterSummary.live}/${adapterSummary.total}`}
          icon={Megaphone}
          tone="success"
          hint={adapterSummary.failing ? `${adapterSummary.failing} failing` : undefined}
        />
      </div>

      {usingSample && (
        <SectionCard title="First-run checklist" description="A few steps to turn the radar on for real.">
          <ul className="space-y-2 text-sm">
            <ChecklistItem done label="Brand, sport & competitor terms are pre-configured" hint="Tune them in Settings any time" />
            <ChecklistItem done={false} label="Add or import your first real signal" action={<Btn size="sm" tone="primary" onClick={onAdd}><Plus className="h-3.5 w-3.5" /> Add</Btn>} />
            <ChecklistItem done={false} label="Set up Google Alerts and paste a digest" hint="Settings → adapters explains how" />
            <ChecklistItem done={false} label="Review your first signals and convert an opportunity" />
          </ul>
        </SectionCard>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Needs attention */}
        <SectionCard
          className="lg:col-span-2"
          title="Needs attention"
          description="Highest-priority active signals — what to act on first."
          actions={<Btn size="sm" onClick={() => onGoTab('inbox')}>Open inbox</Btn>}
        >
          {dashboard.needsAttention.length === 0 ? (
            <EmptyState title="No active signals yet" hint="Add or import signals to populate the queue." action={<Btn tone="primary" onClick={onAdd}><Plus className="h-4 w-4" /> Add signal</Btn>} />
          ) : (
            <ul className="divide-y divide-gray-800">
              {dashboard.needsAttention.map((s) => (
                <li key={s.id}>
                  <button onClick={() => onOpenSignal(s.id)} className="w-full py-3 text-left transition-colors hover:bg-gray-800/40">
                    <div className="flex items-start justify-between gap-3">
                      <p className="line-clamp-2 text-sm text-gray-200">{s.title || s.cleanText}</p>
                      <span className="shrink-0 text-xs text-gray-500">{s.sourceName}</span>
                    </div>
                    <div className="mt-1.5"><SignalBadges signal={s} /></div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        {/* Notifications rail */}
        <SectionCard title="Alerts" description="Auto-derived from your signals.">
          {dashboard.notifications.length === 0 ? (
            <p className="text-xs text-gray-600">No alerts. New high-priority, negative or opportunity signals appear here.</p>
          ) : (
            <ul className="space-y-2">
              {dashboard.notifications.slice(0, 8).map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => n.signalId && onOpenSignal(n.signalId)}
                    className="w-full rounded-lg border border-gray-800 bg-gray-950/40 p-2.5 text-left transition-colors hover:bg-gray-800/40"
                  >
                    <div className="flex items-center gap-2">
                      <StatusBadge tone={NOTE_TONE[n.severity]}>{n.severity}</StatusBadge>
                      <span className="text-xs font-medium text-gray-200">{n.title}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-gray-500">{n.detail}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      {/* Mini mention map + adapter health */}
      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="By sport" description="Where demand is concentrated."><DistributionBars buckets={dashboard.bySport} /></SectionCard>
        <SectionCard title="By intent" description="What people want."><DistributionBars buckets={dashboard.byIntent} /></SectionCard>
        <SectionCard title="By sentiment" description="Tone of the conversation."><DistributionBars buckets={dashboard.bySentiment} /></SectionCard>
      </div>

      <SectionCard
        title="Source health"
        description="Keyless sources are live today; automated adapters are scaffolded and honest about it."
        actions={<Btn size="sm" onClick={() => onGoTab('settings')}>Configure</Btn>}
      >
        <ul className="grid gap-2 sm:grid-cols-2">
          {adapters.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-2 rounded-lg border border-gray-800 bg-gray-950/40 px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm text-gray-200">{a.name}</p>
                <p className="truncate text-xs text-gray-600">{a.blurb}</p>
              </div>
              <StatusBadge tone={ADAPTER_STATE_TONE[a.state]}>{ADAPTER_STATE_LABEL[a.state]}</StatusBadge>
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}

function ChecklistItem({ done, label, hint, action }: { done: boolean; label: string; hint?: string; action?: React.ReactNode }) {
  return (
    <li className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2">
        {done ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Circle className="h-4 w-4 text-gray-600" />}
        <span className={done ? 'text-gray-400 line-through' : 'text-gray-200'}>{label}</span>
        {hint && <span className="text-xs text-gray-600">— {hint}</span>}
      </span>
      {action}
    </li>
  );
}
