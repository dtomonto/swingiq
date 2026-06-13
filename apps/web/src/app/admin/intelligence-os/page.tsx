// First-Party Intelligence OS — Overview. The command center for turning AI
// activity into reusable first-party intelligence so third-party models become
// exception handlers, not the default engine.

import Link from 'next/link';
import { BrainCircuit, Coins, Recycle, AlertTriangle, Sparkles, Database } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { MetricStat } from '@/components/admin/MetricStat';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { IntelNav } from '@/components/admin/intelligence-os/IntelNav';
import { getOverviewSnapshot } from '@/lib/intelligence-os/metrics';

export const dynamic = 'force-dynamic';

const money = (n: number) => `$${n.toFixed(2)}`;
const k = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

export default async function IntelligenceOsOverview() {
  const s = await getOverviewSnapshot();

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <PageHeader
        title="First-Party Intelligence OS"
        icon={BrainCircuit}
        description="Learn from every AI interaction, report and outcome so SwingVantage progressively owns its knowledge — third-party models become exception handlers, not the default engine."
        badge={
          <StatusBadge tone={s.persistent ? 'healthy' : 'watch'}>
            {s.persistent ? 'Live data' : 'Demo data (local)'}
          </StatusBadge>
        }
      />
      <IntelNav />

      {/* Top KPI grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <MetricStat label="3P AI calls" icon={Coins} value={k(s.thirdPartyCalls)} hint="captured" />
        <MetricStat label="3P est. cost" icon={Coins} value={money(s.thirdPartyCost)} hint="estimated" />
        <MetricStat label="AI calls avoided" icon={Recycle} value={k(s.aiCallsAvoided)} status={s.aiCallsAvoided > 0 ? 'good' : undefined} />
        <MetricStat label="Tokens avoided" icon={Recycle} value={k(s.tokensAvoided)} />
        <MetricStat label="Est. cost saved" icon={Coins} value={money(s.estimatedCostSaved)} status={s.estimatedCostSaved > 0 ? 'good' : undefined} />
        <MetricStat label="Cache hit rate" icon={Recycle} value={`${Math.round(s.cacheHitRate * 100)}%`} />
        <MetricStat label="Canonical answers" icon={Sparkles} value={String(s.canonicalAnswers)} hint={`${k(s.canonicalServed)} served`} />
        <MetricStat label="Knowledge items" icon={Database} value={String(s.knowledgeItems)} hint={`${s.knowledgeAwaitingReview} awaiting review`} />
        <MetricStat label="Recurring patterns" icon={AlertTriangle} value={String(s.openPatterns)} hint="open / monitoring" />
        <MetricStat label="Open opportunities" icon={Sparkles} value={String(s.openOpportunities)} />
      </div>

      {/* Action OS priority strip — clickable */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link href="/admin/intelligence-os/tasks?severity=critical" className="rounded-xl border border-error/35 bg-error/[0.04] p-4 transition-colors hover:border-error/60">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Critical tasks</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-error-text">{s.criticalTasks}</p>
          <p className="mt-1 text-xs text-link">Open queue →</p>
        </Link>
        <Link href="/admin/intelligence-os/tasks?severity=high" className="rounded-xl border border-warning/35 bg-warning/[0.04] p-4 transition-colors hover:border-warning/60">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">High priority</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-warning-text">{s.highPriorityTasks}</p>
          <p className="mt-1 text-xs text-link">Open queue →</p>
        </Link>
        <Link href="/admin/intelligence-os/tasks?status=attention" className="rounded-xl border border-primary/30 bg-primary/[0.05] p-4 transition-colors hover:border-primary/50">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Needs attention</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-link">{s.needsAttentionTasks}</p>
          <p className="mt-1 text-xs text-link">Open queue →</p>
        </Link>
      </div>

      {/* Learning lists */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SectionCard title="Top repeated questions" description="Prime canonical-answer candidates">
          <ul className="space-y-2 text-sm">
            {s.topRepeatedQuestions.length === 0 && <li className="text-muted-foreground">None yet.</li>}
            {s.topRepeatedQuestions.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2">
                <Link href={`/admin/intelligence-os/patterns/${p.id}`} className="min-w-0 truncate text-link hover:underline">{p.patternTitle}</Link>
                <span className="shrink-0 tabular-nums text-muted-foreground">{p.occurrenceCount}×</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Top reusable knowledge" description="Most-used first-party answers">
          <ul className="space-y-2 text-sm">
            {s.topReusableKnowledge.length === 0 && <li className="text-muted-foreground">None yet.</li>}
            {s.topReusableKnowledge.map((kn) => (
              <li key={kn.id} className="flex items-center justify-between gap-2">
                <Link href="/admin/intelligence-os/knowledge" className="min-w-0 truncate text-link hover:underline">{kn.title}</Link>
                <span className="shrink-0 tabular-nums text-muted-foreground">{kn.usageCount}×</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Top recurring issues" description="What keeps breaking">
          <ul className="space-y-2 text-sm">
            {s.topRecurringIssues.length === 0 && <li className="text-muted-foreground">None yet.</li>}
            {s.topRecurringIssues.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2">
                <Link href={`/admin/intelligence-os/patterns/${p.id}`} className="min-w-0 truncate text-link hover:underline">{p.patternTitle}</Link>
                <span className="shrink-0 tabular-nums text-muted-foreground">{p.occurrenceCount}×</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      {!s.persistent && (
        <p className="mt-6 text-xs text-muted-foreground">
          Showing the keyless demo dataset (in-process). Apply{' '}
          <code className="rounded bg-muted px-1">apps/web/supabase-intelligence-os.sql</code> and configure Supabase to persist real captured data.
        </p>
      )}
    </div>
  );
}
