import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { patternRepo } from '@/lib/intelligence-os/store';
import { generateFixPacketFromPattern } from '@/lib/intelligence-os/service';
import { IntelligenceTabs } from '../../IntelligenceTabs';
import { FixPacketDownload } from '../../FixPacketDownload';

export const metadata: Metadata = { title: 'Intelligence OS · Pattern | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

export default async function PatternDetailPage({ params }: { params: Promise<{ patternId: string }> }) {
  const { patternId } = await params;
  const p = await patternRepo.get(patternId);
  if (!p) notFound();
  const packet = await generateFixPacketFromPattern(patternId);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title={p.patternTitle}
        breadcrumb={
          <Link href="/admin/intelligence-os/patterns" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Patterns
          </Link>
        }
        badge={<StatusBadge tone={p.status === 'open' ? 'warning' : 'watch'}>{p.status}</StatusBadge>}
        description={`${p.patternType} · seen ×${p.occurrenceCount} · ${p.evidenceCount} evidence`}
      />
      <IntelligenceTabs />

      <SectionCard title="Summary"><p className="text-sm leading-relaxed text-foreground">{p.summary}</p></SectionCard>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <SectionCard title="Recommended prevention"><p className="text-sm text-foreground">{p.recommendedPrevention || '—'}</p></SectionCard>
        <SectionCard title="Recommended automation"><p className="text-sm text-foreground">{p.recommendedAutomation || '—'}</p></SectionCard>
      </div>

      {packet && (
        <SectionCard title="Claude Code fix packet" description="Generated from this recurring pattern">
          <div className="mb-3"><FixPacketDownload promptText={packet.markdownPrompt} patternId={p.id} /></div>
          <textarea readOnly value={packet.markdownPrompt} rows={12} className="w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs text-foreground" />
        </SectionCard>
      )}

      <SectionCard title="Related">
        <ul className="space-y-1 text-sm">
          {p.relatedTaskIds.map((t) => <li key={t}><Link href={`/admin/intelligence-os/tasks/${t}`} className="text-link hover:underline">Task: {t}</Link></li>)}
          {p.relatedKnowledgeIds.map((kid) => <li key={kid}><span className="text-muted-foreground">Knowledge:</span> {kid}</li>)}
          {p.relatedReportIds.map((r) => <li key={r}><span className="text-muted-foreground">Report:</span> {r}</li>)}
          {p.relatedTaskIds.length + p.relatedKnowledgeIds.length + p.relatedReportIds.length === 0 && <li className="text-muted-foreground">None linked.</li>}
        </ul>
      </SectionCard>
    </div>
  );
}
