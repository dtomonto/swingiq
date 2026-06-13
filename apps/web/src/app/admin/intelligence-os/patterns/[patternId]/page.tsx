// Intelligence OS — Pattern detail. A recurring pattern with its prevention /
// automation recommendations and a one-click Claude Code fix packet derived
// from the pattern (no stored task required).

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { IntelNav } from '@/components/admin/intelligence-os/IntelNav';
import { FixPacketActions } from '@/components/admin/intelligence-os/FixPacketActions';
import { patternsRepo } from '@/lib/intelligence-os/store';
import { generateClaudeFixPrompt, patternToTaskLike } from '@/lib/intelligence-os/fix-packet';

export const dynamic = 'force-dynamic';

export default async function PatternDetailPage({ params }: { params: Promise<{ patternId: string }> }) {
  const { patternId } = await params;
  const p = await patternsRepo.get(patternId);
  if (!p) notFound();

  const prompt = generateClaudeFixPrompt(patternToTaskLike(p));

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6">
      <PageHeader
        title={p.patternTitle}
        breadcrumb={
          <Link href="/admin/intelligence-os/patterns" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Patterns
          </Link>
        }
        badge={<StatusBadge tone={p.status === 'Open' ? 'warning' : 'watch'}>{p.status}</StatusBadge>}
        description={`${p.patternType} · seen ${p.occurrenceCount}× · ${p.evidenceCount} evidence`}
      />
      <IntelNav />

      <div className="space-y-4">
        <SectionCard title="Summary">
          <p className="text-sm leading-relaxed text-foreground">{p.summary}</p>
        </SectionCard>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SectionCard title="Recommended prevention">
            <p className="text-sm text-foreground">{p.recommendedPrevention}</p>
          </SectionCard>
          <SectionCard title="Recommended automation">
            <p className="text-sm text-foreground">{p.recommendedAutomation}</p>
          </SectionCard>
        </div>

        <SectionCard title="Claude Code fix packet" description="Generated from this recurring pattern">
          <div className="mb-3"><FixPacketActions promptText={prompt} patternId={p.id} /></div>
          <pre className="max-h-96 overflow-auto rounded-lg border border-border bg-muted/40 p-3 text-xs leading-relaxed text-foreground whitespace-pre-wrap">{prompt}</pre>
        </SectionCard>

        <SectionCard title="Related">
          <ul className="space-y-1 text-sm">
            {p.relatedTaskIds.map((t) => <li key={t}><Link href={`/admin/intelligence-os/tasks/${t}`} className="text-link hover:underline">Task: {t}</Link></li>)}
            {p.relatedKnowledgeIds.map((kid) => <li key={kid}><span className="text-muted-foreground">Knowledge:</span> {kid}</li>)}
            {p.relatedReportIds.map((r) => <li key={r}><span className="text-muted-foreground">Report:</span> {r}</li>)}
            {p.relatedTaskIds.length + p.relatedKnowledgeIds.length + p.relatedReportIds.length === 0 && <li className="text-muted-foreground">None linked.</li>}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
