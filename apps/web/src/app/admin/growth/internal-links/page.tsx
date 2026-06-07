// ============================================================
// /admin/growth/internal-links — internal-link recommendations + audit
// ------------------------------------------------------------
// Runs the agent live (computed from your real pages), overlays any persisted
// human decisions (approve/reject) onto the recommendations, and renders the
// link audit via the generic GrowthOS RecordModule. Acting on a recommendation
// persists it (so it survives re-runs).
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { Link2, Search, Hash } from 'lucide-react';
import { runLinkAgent } from '@/lib/growth/link-intelligence';
import { internalLinkRecsRepo } from '@/lib/growth/repository';
import { ModuleHeader, KpiCard, SectionCard } from '../_components/ui';
import { RecordModule } from '../_components/RecordModule';
import { RunAgentButton } from '../link-intelligence/RunAgentButton';
import { InternalLinksRecs } from './InternalLinksRecs';

export const metadata: Metadata = { title: 'Internal Links | GrowthOS', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

export default async function InternalLinksPage() {
  const r = runLinkAgent({ cadence: 'manual' });

  // Overlay any persisted human decision so re-runs never clobber it.
  const persisted = await internalLinkRecsRepo.list();
  const statusById = new Map(persisted.map((p) => [p.id, p.status]));
  const recs = r.recommendations.map((rec) => (statusById.has(rec.id) ? { ...rec, status: statusById.get(rec.id)! } : rec));

  const pending = recs.filter((x) => x.status === 'pending').length;
  const autoSafe = recs.filter((x) => x.autoSafe && x.status === 'pending').length;
  const applied = recs.filter((x) => x.status === 'applied' || x.status === 'auto-applied').length;

  const overOptimized = r.anchorProfiles.filter((p) => p.overOptimized).slice(0, 6);

  return (
    <div className="space-y-6">
      <ModuleHeader icon={Link2} title="Internal Links" description="Internal-link recommendations + a live audit (orphans, broken links, depth, anchors) computed from your real pages.">
        <RunAgentButton />
      </ModuleHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Recommendations" value={recs.length} icon={Link2} source="real" />
        <KpiCard label="Pending" value={pending} accent="text-amber-400" source="real" />
        <KpiCard label="Safe to auto-apply" value={autoSafe} accent="text-green-400" sublabel="one-click" source="real" />
        <KpiCard label="Applied" value={applied} accent="text-blue-400" source="real" />
      </div>

      <SectionCard title="Internal-link recommendations" icon={Link2}>
        <InternalLinksRecs recs={recs} />
      </SectionCard>

      {overOptimized.length > 0 && (
        <SectionCard title="Anchor health — over-optimized destinations" icon={Hash}>
          <ul className="space-y-2">
            {overOptimized.map((p) => (
              <li key={p.destinationUrl} className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-800/40 px-3 py-2">
                <span className="text-xs font-mono text-gray-300 truncate">{p.destinationUrl}</span>
                <span className="text-[11px] text-amber-400">diversity {p.diversityScore}/100 · {p.total} inbound</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-gray-600">Vary inbound anchors toward descriptive / partial-match phrasing to avoid over-optimization.</p>
        </SectionCard>
      )}

      <SectionCard title="Site link audit" icon={Search}>
        <RecordModule definitionId="link-audit" records={r.findings} hideNote />
        <p className="mt-3 text-[11px] text-gray-600">
          Findings are computed live. Run the agent to persist them (so they appear here after navigation and can be tracked).
        </p>
      </SectionCard>

      <div className="text-xs text-gray-500">
        Looking for the big picture? Open the{' '}
        <Link href="/admin/growth/link-intelligence" className="text-green-400 hover:underline">Link Intelligence hub</Link>.
      </div>
    </div>
  );
}
