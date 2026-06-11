// ============================================================
// /admin/uploads — uploads & media (metadata)
// ============================================================

import type { Metadata } from 'next';
import { Upload, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { NotConnected } from '@/components/admin/states/NotConnected';
import { EmptyState } from '@/components/ui/EmptyState';
import { listAnalyses } from '@/lib/admin/data/analyses';
import { UploadsTable } from './UploadsTable';

export const metadata: Metadata = { title: 'Uploads & Media | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

export default async function AdminUploadsPage() {
  const res = await listAnalyses();

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Uploads & Media"
        icon={Upload}
        description="Every swing a user has analyzed, as media records. Search and inspect by file, user or sport."
        actions={res.connected ? <StatusBadge tone="info">{res.total} records</StatusBadge> : null}
      />

      {/* The single most important honesty note for this section. */}
      <div className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/[0.05] px-4 py-3 text-sm text-link">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Swing videos are processed on each user&apos;s device and are <strong>never uploaded</strong> to
          SwingVantage. This page lists the analysis <strong>metadata</strong> (file name, sport, score, when)
          — there is no stored video or image file to download, by design.
        </span>
      </div>

      {!res.connected ? (
        <NotConnected detail={res.reason ?? 'Not connected.'} envVars={['SUPABASE_SERVICE_ROLE_KEY']} />
      ) : res.total === 0 ? (
        <SectionCard>
          <EmptyState title="No media records yet" description="Analyzed swings will appear here as metadata." />
        </SectionCard>
      ) : (
        <SectionCard>
          <UploadsTable rows={res.rows} />
        </SectionCard>
      )}

      <HelpPanel>
        <p>
          <strong className="text-foreground">What this is.</strong> The media operations view. Because videos
          never leave the device, &ldquo;media management&rdquo; here means reviewing the records of what was
          analyzed, spotting patterns, and clicking through to the AI result.
        </p>
        <p>
          <strong className="text-foreground">Why there&apos;s no storage meter.</strong> There&apos;s no
          server-side video storage to measure — a deliberate privacy and cost choice. If hosted media is
          added later (e.g. opt-in shareable clips), storage and CDN status would surface here.
        </p>
        <p>
          <strong className="text-foreground">What to do next.</strong> Click a record to open the full analysis
          (same detail as AI Analyses).
        </p>
      </HelpPanel>
    </div>
  );
}
