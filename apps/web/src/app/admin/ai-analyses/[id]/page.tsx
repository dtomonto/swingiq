// ============================================================
// /admin/ai-analyses/[id] — single analysis review
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Brain } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { MetricStat } from '@/components/admin/MetricStat';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { NotConnected } from '@/components/admin/states/NotConnected';
import { getAnalysis } from '@/lib/admin/data/analyses';
import { sportLabel } from '@/lib/admin/sports';
import { formatDate } from '@/lib/admin/format';

export const metadata: Metadata = { title: 'Analysis | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

/** Best-effort label for a diagnosis JSON object. */
function diagnosisLabel(d: unknown, i: number): string {
  if (d && typeof d === 'object') {
    const o = d as Record<string, unknown>;
    for (const k of ['title', 'issue', 'name', 'summary', 'primary_issue', 'fault']) {
      if (typeof o[k] === 'string' && o[k]) return o[k] as string;
    }
  }
  return `Diagnosis ${i + 1}`;
}

export default async function AdminAnalysisDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getAnalysis(id);

  const back = (
    <Link href="/admin/ai-analyses" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
      <ArrowLeft className="h-3.5 w-3.5" /> All analyses
    </Link>
  );

  if (!detail.connected) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-4 sm:p-6">
        {back}
        <NotConnected detail={detail.reason ?? 'Not connected.'} envVars={['SUPABASE_SERVICE_ROLE_KEY']} />
      </div>
    );
  }

  if (!detail.row) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-4 sm:p-6">
        {back}
        <SectionCard><p className="py-6 text-center text-sm text-muted-foreground">Analysis not found.</p></SectionCard>
      </div>
    );
  }

  const a = detail.row;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      {back}
      <PageHeader
        title={`${sportLabel(a.sport)} analysis`}
        icon={Brain}
        description={a.fileName ? `From ${a.fileName}` : `Analysis ${a.id}`}
      >
        <div className="mt-3 flex flex-wrap gap-2">
          <StatusBadge tone="accent">{sportLabel(a.sport)}</StatusBadge>
          {a.cameraAngle && <StatusBadge tone="neutral">{a.cameraAngle.replace(/_/g, ' ')}</StatusBadge>}
          {a.userEmail && (
            <Link href={`/admin/users/${a.userId}`}>
              <StatusBadge tone="info">{a.userEmail}</StatusBadge>
            </Link>
          )}
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricStat
          label="Overall score" value={a.overallScore || '—'}
          tone={a.overallScore >= 85 ? 'success' : a.overallScore < 60 && a.overallScore > 0 ? 'warning' : 'default'}
        />
        <MetricStat label="Issues" value={a.issuesCount} />
        <MetricStat label="Phases" value={a.phasesCount} />
        <MetricStat label="Date" value={a.createdAt ? formatDate(a.createdAt) : '—'} />
      </div>

      {a.primaryIssue && (
        <SectionCard title="Primary issue">
          <p className="text-sm text-foreground">{a.primaryIssue}</p>
        </SectionCard>
      )}

      <SectionCard
        title="Session diagnoses"
        description={detail.session ? `From session "${detail.session.name || detail.session.id}".` : 'No linked session.'}
      >
        {!detail.session || detail.session.diagnoses.length === 0 ? (
          <p className="text-sm text-muted-foreground">No detailed diagnoses stored for this analysis.</p>
        ) : (
          <ul className="space-y-1.5">
            {detail.session.diagnoses.map((d, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
                {diagnosisLabel(d, i)}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard title="Video">
        <p className="text-sm text-muted-foreground">
          The swing video itself is processed on the user&apos;s device and is never uploaded to SwingVantage,
          so there is no file to play here — only the analysis metadata above. This is a core privacy
          guarantee of the product.
        </p>
      </SectionCard>

      <HelpPanel>
        <p>
          <strong className="text-foreground">What this is.</strong> The full record of one AI swing analysis:
          its score, detected issues, originating session diagnoses and the user it belongs to.
        </p>
        <p>
          <strong className="text-foreground">What to do next.</strong> If the score looks wrong for the
          described issue, that&apos;s a signal to review the sport&apos;s analysis rules. Open the user to see
          this analysis in the context of their whole journey.
        </p>
      </HelpPanel>
    </div>
  );
}
