import type { Metadata } from 'next';
import Link from 'next/link';
import { BrainCircuit, Coins, Database, FileCheck2, Repeat, ClipboardList, FileText } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { MetricCard } from '@/components/admin/MetricStat';
import { SectionCard } from '@/components/admin/SectionCard';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { getIntelligenceOverview } from '@/lib/intelligence-os/dashboard';
import { IntelligenceTabs } from './IntelligenceTabs';

export const metadata: Metadata = {
  title: 'Intelligence OS | Admin',
  robots: 'noindex, nofollow',
};
export const dynamic = 'force-dynamic';

function cents(n: number): string {
  return `$${(n / 100).toFixed(2)}`;
}

export default async function IntelligenceOSPage() {
  const data = await getIntelligenceOverview();
  const m = data.metrics;
  const a = data.actionOs;
  const hasActivity = m.thirdPartyCalls > 0 || m.aiCallsAvoided > 0 || m.knowledgeItemsTotal > 0;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="First-Party Intelligence OS"
        icon={BrainCircuit}
        description="The operating layer that learns from every AI call so repeated answers, fixes and coaching can be served by first-party knowledge instead of repeatedly paying third-party models. Capture → normalize → dedupe → evaluate → promote → retrieve → reduce token use."
        badge={
          <StatusBadge tone={data.persistent ? 'healthy' : 'watch'}>
            {data.persistent ? 'Database-backed' : 'In-process (keyless)'}
          </StatusBadge>
        }
      />
      <IntelligenceTabs />

      {!data.persistent && (
        <div className="rounded-lg border border-warning/30 bg-warning/[0.05] p-3 text-sm text-warning-text">
          Supabase is not configured, so the Intelligence OS is running in the keyless in-process fallback. Data is
          per-process and resets on cold start. Set <code>SUPABASE_SERVICE_ROLE_KEY</code> to persist across deploys —
          it reuses the existing <code>growth_records</code> table (no new migration required).
        </div>
      )}

      {/* Token economics — the strategic goal */}
      <SectionCard title="Token economics" description="Third-party spend vs first-party savings. Costs are estimates labeled accordingly.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <MetricCard label="Third-party AI calls" value={m.thirdPartyCalls} icon={Repeat} />
          <MetricCard label="Third-party tokens" value={m.thirdPartyTokens.toLocaleString()} />
          <MetricCard label="Estimated AI cost" value={cents(m.estimatedAiCostCents)} tone="warning" />
          <MetricCard label="AI calls avoided" value={m.aiCallsAvoided} icon={Coins} tone="success" />
          <MetricCard label="Tokens avoided" value={m.tokensAvoided.toLocaleString()} tone="success" />
          <MetricCard label="Estimated cost saved" value={cents(m.estimatedCostSavedCents)} tone="success" />
          <MetricCard label="Cache hit rate" value={`${Math.round(m.cacheHitRate * 100)}`} unit="%" />
          <MetricCard label="Canonical answers served" value={m.canonicalAnswersServed} />
        </div>
      </SectionCard>

      {/* Knowledge pipeline */}
      <SectionCard title="Knowledge pipeline" description="How much the system has learned and what awaits human review.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <MetricCard label="Knowledge items" value={m.knowledgeItemsTotal} icon={Database} />
          <MetricCard label="Awaiting review" value={m.knowledgeAwaitingReview} icon={FileCheck2} tone={m.knowledgeAwaitingReview > 0 ? 'warning' : 'default'} />
          <MetricCard label="Canonical answers" value={m.canonicalAnswersTotal} />
          <MetricCard label="Open patterns" value={m.patternsOpen} />
          <MetricCard label="Evaluations" value={m.evaluationsTotal} />
        </div>
      </SectionCard>

      {/* Action OS — clickable task queue + report library */}
      <SectionCard
        title="Action OS"
        description="Clickable tasks and the report library. Every Critical / High Priority / Needs Attention item opens a real detail view."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Link href="/admin/intelligence-os/tasks" aria-label="Open critical tasks">
            <MetricCard label="Critical tasks" value={a.criticalTasks} icon={ClipboardList} tone={a.criticalTasks > 0 ? 'warning' : 'default'} />
          </Link>
          <Link href="/admin/intelligence-os/tasks" aria-label="Open high-priority tasks">
            <MetricCard label="High priority" value={a.highPriorityTasks} tone={a.highPriorityTasks > 0 ? 'warning' : 'default'} />
          </Link>
          <Link href="/admin/intelligence-os/tasks" aria-label="Open needs-attention tasks">
            <MetricCard label="Needs attention" value={a.needsAttentionTasks} />
          </Link>
          <Link href="/admin/intelligence-os/tasks" aria-label="Open opportunities">
            <MetricCard label="Opportunities" value={a.openOpportunities} tone={a.openOpportunities > 0 ? 'success' : 'default'} />
          </Link>
          <Link href="/admin/intelligence-os/reports" aria-label="Open report library">
            <MetricCard label="Reports" value={a.reportsTotal} icon={FileText} />
          </Link>
          <Link href="/admin/intelligence-os/reports" aria-label="Open report library by tier">
            <MetricCard label="Reports (hot/warm/cold)" value={`${a.reportsHot}/${a.reportsWarm}/${a.reportsCold}`} />
          </Link>
        </div>
      </SectionCard>

      {!hasActivity && (
        <EmptyState
          title="No AI activity captured yet"
          description="Once an AI feature adopts resolveWithFirstPartyIntelligence() (or posts to /api/admin/intelligence-os/activity), captured events, knowledge candidates and token savings appear here. Nothing is fabricated — this stays empty until real signal flows in."
        />
      )}

      {hasActivity && (
        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard title="Highest-value repeated questions" description="Repeated prompts that cost the most — prime candidates for canonical answers.">
            {data.highestValueRepeatedQuestions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No repeated questions yet.</p>
            ) : (
              <ul className="space-y-2">
                {data.highestValueRepeatedQuestions.map((q, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate text-foreground">{q.intent || '(unlabeled)'}</span>
                    <span className="shrink-0 text-muted-foreground">×{q.count} · {cents(q.estCostCents)}</span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Highest-cost workflows" description="Where third-party spend concentrates by feature.">
            {data.highestCostWorkflows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No workflow costs yet.</p>
            ) : (
              <ul className="space-y-2">
                {data.highestCostWorkflows.map((f, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate text-foreground">{f.feature}</span>
                    <span className="shrink-0 text-muted-foreground">{f.calls} calls · {cents(f.costCents)}</span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Top reusable knowledge" description="Most-used first-party answers.">
            {data.topReusableKnowledge.length === 0 ? (
              <p className="text-sm text-muted-foreground">No knowledge items yet.</p>
            ) : (
              <ul className="space-y-2">
                {data.topReusableKnowledge.map((k) => (
                  <li key={k.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate text-foreground">{k.title}</span>
                    <span className="shrink-0"><StatusBadge tone={k.validationStatus === 'approved' ? 'healthy' : 'watch'}>{k.validationStatus}</StatusBadge></span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Recurring issues" description="Top AI-quality and technical patterns worth automating away.">
            {data.topRecurringAiQualityIssues.length === 0 && data.topRecurringTechnicalIssues.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recurring issues detected yet.</p>
            ) : (
              <ul className="space-y-2">
                {[...data.topRecurringAiQualityIssues, ...data.topRecurringTechnicalIssues].map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate text-foreground">{p.patternTitle}</span>
                    <span className="shrink-0 text-muted-foreground">×{p.occurrenceCount}</span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Generated {new Date(data.generatedAt).toLocaleString()} · data source: <strong>{data.dataSource}</strong>
        {' · '}semantic matching: <strong>{data.similarityBackend}</strong>
        {data.similarityBackend === 'lexical' && ' (set OPENAI_API_KEY to enable real embeddings)'}
      </p>
    </div>
  );
}
