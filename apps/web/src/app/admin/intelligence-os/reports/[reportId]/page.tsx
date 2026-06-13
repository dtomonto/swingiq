import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { reportRepo } from '@/lib/intelligence-os/store';
import type { TaskSeverity } from '@/lib/intelligence-os/types';
import { IntelligenceTabs } from '../../IntelligenceTabs';
import { ReportActions } from './ReportActions';

export const metadata: Metadata = { title: 'Intelligence OS · Report | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

const SEV_TONE: Record<TaskSeverity, 'critical' | 'warning' | 'watch' | 'routine'> = {
  critical: 'critical', high: 'warning', medium: 'watch', low: 'routine', info: 'routine',
};

export default async function ReportDetailPage({ params }: { params: Promise<{ reportId: string }> }) {
  const { reportId } = await params;
  const report = await reportRepo.get(reportId);
  if (!report) notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title={report.title}
        breadcrumb={
          <Link href="/admin/intelligence-os/reports" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Reports
          </Link>
        }
        badge={<StatusBadge tone={report.retentionTier === 'hot' ? 'routine' : report.retentionTier === 'warm' ? 'watch' : 'neutral'}>{report.retentionTier}</StatusBadge>}
        description={`${report.type} · ${report.lifecycleStatus} · ${report.severitySummary}`}
      />
      <IntelligenceTabs />

      {report.dataSource !== 'real' && (
        <p className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          Source: <strong>{report.dataSource}</strong> — not yet confirmed from a live data source.
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <SectionCard title="Executive summary">
            <p className="text-sm leading-relaxed text-foreground">{report.executiveSummary || 'No summary captured.'}</p>
          </SectionCard>

          <SectionCard title={`Findings (${report.findings.length})`}>
            {report.findings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No findings recorded.</p>
            ) : (
              <ul className="space-y-3">
                {report.findings.map((f) => (
                  <li key={f.id} className="rounded-lg border border-border p-3 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge tone={SEV_TONE[f.severity]}>{f.severity}</StatusBadge>
                      <span className="font-medium text-foreground">{f.title}</span>
                    </div>
                    <p className="mt-1 text-muted-foreground">{f.detail}</p>
                    {f.recommendation && <p className="mt-1 text-foreground"><span className="text-muted-foreground">Recommendation:</span> {f.recommendation}</p>}
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          {report.recommendedActions.length > 0 && (
            <SectionCard title="Recommended actions">
              <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">{report.recommendedActions.map((a, i) => <li key={i}>{a}</li>)}</ul>
            </SectionCard>
          )}

          {report.fullBody ? (
            <SectionCard title="Full report body" description="Retained while hot">
              <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground">{report.fullBody}</pre>
            </SectionCard>
          ) : (
            <SectionCard title="Full report body">
              <p className="text-sm text-muted-foreground">Body dropped at the {report.retentionTier} tier — summary, findings and generated tasks are preserved.</p>
            </SectionCard>
          )}
        </div>

        <div className="space-y-6">
          <SectionCard title="Actions"><ReportActions report={report} /></SectionCard>

          <SectionCard title="Generated tasks">
            {report.generatedTaskIds.length === 0 ? (
              <p className="text-sm text-muted-foreground">None yet — use “Generate tasks”.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {report.generatedTaskIds.map((t) => (
                  <li key={t}><Link href={`/admin/intelligence-os/tasks/${t}`} className="text-link hover:underline">{t}</Link></li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard title="Details">
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Source</dt><dd>{report.source}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Created</dt><dd>{report.createdAt.slice(0, 10)}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Updated</dt><dd>{report.updatedAt.slice(0, 10)}</dd></div>
            </dl>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
