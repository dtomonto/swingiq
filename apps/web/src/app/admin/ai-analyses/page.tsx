// ============================================================
// /admin/ai-analyses — AI swing-analysis quality review
// ============================================================

import type { Metadata } from 'next';
import { Brain } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { MetricStat } from '@/components/admin/MetricStat';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { NotConnected } from '@/components/admin/states/NotConnected';
import { EmptyState } from '@/components/ui/EmptyState';
import { listAnalyses, NEEDS_REVIEW_BELOW, STRONG_AT_OR_ABOVE } from '@/lib/admin/data/analyses';
import { AnalysesTable } from './AnalysesTable';

export const metadata: Metadata = { title: 'AI Analyses | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

export default async function AdminAnalysesPage() {
  const res = await listAnalyses();

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="AI Analyses"
        icon={Brain}
        description="Every AI swing analysis SwingVantage has produced. Use the score-based queues to spot analyses worth a human look, and click any row to review the detected issues."
      />

      {!res.connected ? (
        <NotConnected detail={res.reason ?? 'Not connected.'} envVars={['SUPABASE_SERVICE_ROLE_KEY']} />
      ) : res.total === 0 ? (
        <SectionCard>
          <EmptyState
            title="No analyses yet"
            description="When users analyze swings, results appear here with quality queues and trends."
          />
        </SectionCard>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricStat label="Total" value={res.total} />
            <MetricStat
              label={`Needs review (<${NEEDS_REVIEW_BELOW})`} value={res.buckets.needsReview}
              tone={res.buckets.needsReview > 0 ? 'warning' : 'muted'}
            />
            <MetricStat label="Very low (<40)" value={res.buckets.lowScore} tone={res.buckets.lowScore > 0 ? 'warning' : 'muted'} />
            <MetricStat label={`Strong (≥${STRONG_AT_OR_ABOVE})`} value={res.buckets.strong} tone="success" />
          </div>
          <SectionCard>
            <AnalysesTable rows={res.rows} />
          </SectionCard>
        </>
      )}

      <HelpPanel>
        <p>
          <strong className="text-gray-300">What this is.</strong> A review surface for AI swing analyses. The
          queues are derived purely from the real overall score: low scores are the most likely to need a
          human eye or indicate a difficult clip.
        </p>
        <p>
          <strong className="text-gray-300">Honest limits.</strong> SwingVantage stores analysis
          <em> metadata</em> (sport, score, issue counts) — not the swing video, which is processed on-device
          and never uploaded. There is no separate &ldquo;confidence&rdquo; or &ldquo;failed&rdquo; flag in the
          data, so we don&apos;t invent one; the score is the honest signal.
        </p>
        <p>
          <strong className="text-gray-300">What to do next.</strong> Open a low-scoring analysis to see its
          detected issues and the originating session&apos;s diagnoses.
        </p>
      </HelpPanel>
    </div>
  );
}
