// Intelligence OS — Action Task detail. The executive view every Critical /
// High Priority / Needs Attention badge routes to: summary, evidence, impact,
// root cause, recommended fix, the Claude Code repair prompt (copy/download),
// status workflow, notes, related items and resolution history.

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { IntelNav } from '@/components/admin/intelligence-os/IntelNav';
import { FixPacketActions } from '@/components/admin/intelligence-os/FixPacketActions';
import { TaskActions } from '@/components/admin/intelligence-os/TaskActions';
import { tasksRepo } from '@/lib/intelligence-os/store';
import { generateClaudeFixPrompt } from '@/lib/intelligence-os/fix-packet';
import { severityTone } from '@/lib/intelligence-os/types';

export const dynamic = 'force-dynamic';

const pct = (n: number | null | undefined) => (n == null ? 'unknown' : `${Math.round(n * 100)}%`);

function List({ items }: { items: string[] }) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">None recorded.</p>;
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm text-foreground">
      {items.map((it, i) => <li key={i}>{it}</li>)}
    </ul>
  );
}

export default async function TaskDetailPage({ params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  const task = await tasksRepo.get(taskId);
  if (!task) notFound();

  const prompt = generateClaudeFixPrompt(task);

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6">
      <PageHeader
        title={task.title}
        breadcrumb={
          <Link href="/admin/intelligence-os/tasks" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Action Tasks
          </Link>
        }
        badge={<StatusBadge tone={severityTone(task.severity)}>{task.severity} · {task.priority}</StatusBadge>}
        description={`${task.category} · ${task.affectedRoute ?? task.affectedFeature ?? '—'} · seen ${task.occurrenceCount}× · confidence ${pct(task.confidenceScore)}`}
      />
      <IntelNav />

      {task.dataSource !== 'real' && (
        <p className="mb-4 rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          Source: <strong>{task.dataSource}</strong> — illustrative until a live data source is wired.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <SectionCard title="Executive summary">
            <p className="text-sm leading-relaxed text-foreground">{task.evidenceSummary}</p>
            <p className="mt-2 text-sm text-muted-foreground">Suggested next action: {task.suggestedNextAction}</p>
          </SectionCard>

          <SectionCard title="Impact">
            <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <div><dt className="text-muted-foreground">User</dt><dd>{task.userImpact}</dd></div>
              <div><dt className="text-muted-foreground">Business</dt><dd>{task.businessImpact}</dd></div>
              {task.revenueImpact && <div><dt className="text-muted-foreground">Revenue</dt><dd>{task.revenueImpact}</dd></div>}
              {task.brandTrustImpact && <div><dt className="text-muted-foreground">Brand trust</dt><dd>{task.brandTrustImpact}</dd></div>}
              {task.aiQualityImpact && <div><dt className="text-muted-foreground">AI quality</dt><dd>{task.aiQualityImpact}</dd></div>}
            </dl>
          </SectionCard>

          <SectionCard title="Root-cause hypothesis">
            <p className="text-sm leading-relaxed text-foreground">{task.rootCauseHypothesis}</p>
          </SectionCard>

          <SectionCard title="Reproduction steps">
            <List items={task.reproductionSteps} />
          </SectionCard>

          <SectionCard title="Acceptance criteria">
            <List items={task.acceptanceCriteria} />
          </SectionCard>

          <SectionCard title="Claude Code repair prompt" description="Specific, ready to paste into Claude Code">
            <div className="mb-3"><FixPacketActions promptText={prompt} taskId={task.id} /></div>
            <pre className="max-h-96 overflow-auto rounded-lg border border-border bg-muted/40 p-3 text-xs leading-relaxed text-foreground whitespace-pre-wrap">{prompt}</pre>
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="Workflow">
            <TaskActions task={task} />
          </SectionCard>

          <SectionCard title="Details">
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Source</dt><dd>{task.source}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Fix complexity</dt><dd>{task.fixComplexity}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Effort</dt><dd>{task.estimatedEffort ?? '—'}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-muted-foreground">First detected</dt><dd>{task.firstDetectedAt.slice(0, 10)}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Last detected</dt><dd>{task.lastDetectedAt.slice(0, 10)}</dd></div>
            </dl>
          </SectionCard>

          {task.affectedFilePaths.length > 0 && (
            <SectionCard title="Likely files">
              <ul className="space-y-1 text-xs text-foreground">
                {task.affectedFilePaths.map((f) => <li key={f}><code className="break-all">{f}</code></li>)}
              </ul>
            </SectionCard>
          )}

          <SectionCard title="Related">
            <ul className="space-y-1 text-sm">
              {task.relatedReports.map((r) => <li key={r}><span className="text-muted-foreground">Report:</span> {r}</li>)}
              {task.relatedEvents.map((e) => <li key={e}><span className="text-muted-foreground">Event:</span> {e}</li>)}
              {task.relatedTasks.map((t) => <li key={t}><Link href={`/admin/intelligence-os/tasks/${t}`} className="text-link hover:underline">{t}</Link></li>)}
              {task.relatedReports.length + task.relatedEvents.length + task.relatedTasks.length === 0 && <li className="text-muted-foreground">None linked.</li>}
            </ul>
          </SectionCard>

          {task.internalLearningTags.length > 0 && (
            <SectionCard title="Learning tags">
              <div className="flex flex-wrap gap-1.5">
                {task.internalLearningTags.map((t) => <StatusBadge key={t} tone="watch">{t}</StatusBadge>)}
              </div>
            </SectionCard>
          )}
        </div>
      </div>

      {/* Notes + history */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Notes">
          {task.notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notes yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {task.notes.map((n, i) => (
                <li key={i} className="rounded-lg border border-border bg-muted/30 p-2">
                  <span className="text-xs text-muted-foreground">{n.at.slice(0, 16).replace('T', ' ')} · {n.author}</span>
                  <p className="mt-0.5">{n.body}</p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
        <SectionCard title="Resolution history">
          {task.history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No history yet.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {task.history.map((h, i) => (
                <li key={i} className="flex gap-2">
                  <span className="shrink-0 text-xs text-muted-foreground">{h.at.slice(0, 16).replace('T', ' ')}</span>
                  <span><strong>{h.event}</strong>{h.detail ? ` — ${h.detail}` : ''}</span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
