// ============================================================
// /admin/drills — Drill Library
// ------------------------------------------------------------
// A read-only, unified inventory of every drill the product ships,
// aggregated from the real catalogs (data/drills-content.ts and the
// DrillMatch catalog). Lets an operator see coverage across sports,
// difficulty and source, and spot gaps or cross-catalog duplicates.
// ============================================================

import type { Metadata } from 'next';
import { Dumbbell, Layers, ShieldCheck, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { MetricStat } from '@/components/admin/MetricStat';
import { StatusBadge, type BadgeTone } from '@/components/admin/StatusBadge';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { DRILLS_CONTENT } from '@/data/drills-content';
import { ALL_DRILL_CANDIDATES } from '@/lib/drillmatch/catalog';
import {
  aggregateDrillLibrary, groupDrillsBySport, type DrillDifficulty,
} from '@/lib/admin/drill-library/aggregate';
import { titleize } from '@/lib/admin/format';

export const metadata: Metadata = { title: 'Drill Library | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

const DIFFICULTY_TONE: Record<DrillDifficulty, BadgeTone> = {
  beginner: 'success',
  intermediate: 'info',
  advanced: 'accent',
};

export default function AdminDrillLibraryPage() {
  const library = aggregateDrillLibrary(DRILLS_CONTENT, ALL_DRILL_CANDIDATES);
  const groups = groupDrillsBySport(library);
  const { stats } = library;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Drill Library"
        icon={Dumbbell}
        description="Every drill the product ships, unified across catalogs into one inventory — sport, category, difficulty, target fault, equipment and source. Read-only: this catalogs the real drills so you can see coverage and spot gaps or duplicates."
        actions={<StatusBadge tone="info">{stats.total} drills</StatusBadge>}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <MetricStat label="Drills" icon={Dumbbell} value={String(stats.total)} hint="all sources" />
        <MetricStat label="Sports" icon={Layers} value={String(stats.sports)} hint="covered" />
        <MetricStat label="Beginner" icon={Layers} value={String(stats.byDifficulty.beginner)} hint="difficulty" />
        <MetricStat label="Intermediate" icon={Layers} value={String(stats.byDifficulty.intermediate)} hint="difficulty" />
        <MetricStat label="Advanced" icon={Layers} value={String(stats.byDifficulty.advanced)} hint="difficulty" />
        <MetricStat label="With safety note" icon={ShieldCheck} value={String(stats.withSafety)} hint="guardrails" />
      </div>

      {library.duplicateNames.length > 0 && (
        <SectionCard
          title={
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-link" />
              Possible duplicate drills
              <span className="text-xs font-normal text-muted-foreground">{library.duplicateNames.length}</span>
            </span>
          }
          description="Drill names that appear in more than one catalog — worth checking whether they should be merged."
        >
          <ul className="space-y-1 text-sm text-muted-foreground">
            {library.duplicateNames.slice(0, 12).map((d) => (
              <li key={d.name}>
                <span className="text-foreground">{titleize(d.name)}</span>{' '}
                <span className="text-xs text-muted-foreground">({d.ids.join(', ')})</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {groups.map((group) => (
        <SectionCard
          key={group.sport}
          title={
            <span className="flex items-center gap-2">
              {titleize(group.sport)}
              <span className="text-xs font-normal text-muted-foreground">({group.drills.length})</span>
            </span>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-2xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="pb-2 pr-3">Drill</th>
                  <th className="pb-2 pr-3">Category</th>
                  <th className="pb-2 pr-3">Level</th>
                  <th className="pb-2 pr-3">Targets</th>
                  <th className="pb-2 pr-3">Time</th>
                  <th className="pb-2 pr-3">Equipment</th>
                  <th className="pb-2">Source</th>
                </tr>
              </thead>
              <tbody className="text-foreground">
                {group.drills.map((d) => (
                  <tr key={`${d.source}:${d.id}`} className="border-t border-border align-top">
                    <td className="py-2 pr-3">
                      <span className="font-medium text-foreground">{d.name}</span>
                      {d.safetyNote && (
                        <span className="ml-1 inline-flex" title={d.safetyNote}>
                          <ShieldCheck className="inline h-3 w-3 text-success-text" />
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-3 text-muted-foreground">{d.category}</td>
                    <td className="py-2 pr-3">
                      <StatusBadge tone={DIFFICULTY_TONE[d.difficulty]}>{d.difficulty}</StatusBadge>
                    </td>
                    <td className="max-w-[16rem] py-2 pr-3 text-muted-foreground">{d.targetFault}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{d.duration}</td>
                    <td className="py-2 pr-3 text-muted-foreground">{d.equipment.length ? d.equipment.join(', ') : '—'}</td>
                    <td className="py-2 text-muted-foreground">{d.source === 'drillmatch' ? 'DrillMatch' : 'Content'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      ))}

      <HelpPanel>
        <p>
          <strong className="text-foreground">What this is.</strong> One read-only view of every drill the
          product can recommend, pulled live from the real catalogs — the multi-sport content drills and the
          DrillMatch fault-fixing candidates. It exists so you can see coverage at a glance: which sports and
          difficulty levels are well-served, what targets faults, and where drills may be duplicated.
        </p>
        <p>
          <strong className="text-foreground">Sources.</strong> Drills marked <em>Content</em> come from the
          curated drill content set; <em>DrillMatch</em> drills are the fault-matched candidates the Fix Stack
          scores against. Equipment and safety notes are shown where the source provides them.
        </p>
        <p>
          <strong className="text-foreground">Editing.</strong> This board is read-only today. Drills are
          defined in code (<code>data/drills-content.ts</code> and the DrillMatch catalog); editing/creating
          drills from the admin UI is a planned follow-up tracked in the Data &amp; AI roadmap.
        </p>
      </HelpPanel>
    </div>
  );
}
