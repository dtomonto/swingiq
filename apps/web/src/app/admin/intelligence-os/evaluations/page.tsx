import type { Metadata } from 'next';
import { ClipboardCheck } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { evaluationRepo } from '@/lib/intelligence-os/store';
import { IntelligenceTabs } from '../IntelligenceTabs';

export const metadata: Metadata = { title: 'Intelligence OS · Evaluations | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

function avg(...xs: number[]) { return xs.reduce((a, b) => a + b, 0) / xs.length; }

export default async function EvaluationsPage() {
  const items = (await evaluationRepo.list()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Intelligence OS · Evaluations"
        icon={ClipboardCheck}
        description="Scores that decide whether an AI output, knowledge item or canonical answer is good enough to reuse. Evaluations come from user feedback, admin review, automated heuristics and retest/report outcomes."
      />
      <IntelligenceTabs />
      <SectionCard title="Evaluation records">
        {items.length === 0 ? (
          <EmptyState title="No evaluations yet" description="Record evaluations via POST /api/admin/intelligence-os/evaluations or the review actions on knowledge/canonical answers." />
        ) : (
          <ul className="divide-y divide-border">
            {items.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate text-foreground">{e.evaluatedObjectType} · {e.evaluatedObjectId}</p>
                  <p className="text-xs text-muted-foreground">{e.evaluatorType} · avg {avg(e.scoreAccuracy, e.scoreUsefulness, e.scoreSafety, e.scoreClarity, e.scoreCompleteness, e.scoreReusePotential, e.scoreCostEfficiency).toFixed(2)}</p>
                </div>
                <StatusBadge tone={e.passFail === 'pass' ? 'healthy' : 'critical'}>{e.passFail}</StatusBadge>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
