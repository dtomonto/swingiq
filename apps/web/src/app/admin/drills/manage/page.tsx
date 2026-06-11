// ============================================================
// /admin/drills/manage — Drill Editor
// ------------------------------------------------------------
// Create, edit and retire drills as a LOCAL-FIRST overlay on the code
// catalogs, then export the overlay as JSON to commit for a global
// change. The browser never writes to live production drill data — this
// is preview + export, matching the /admin/benchmarks override pattern.
// The server builds the base drill list; the client manages the overlay.
// ============================================================

import type { Metadata } from 'next';
import { SquarePen } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { DRILLS_CONTENT } from '@/data/drills-content';
import { ALL_DRILL_CANDIDATES } from '@/lib/drillmatch/catalog';
import type { BaseDrillLike, DrillDifficulty } from '@/lib/admin/drill-editor/merge';
import { DrillManager } from './DrillManager';

export const metadata: Metadata = { title: 'Drill Editor | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

const titleCase = (s: string) => s.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export default function AdminDrillEditorPage() {
  const base: BaseDrillLike[] = [
    ...DRILLS_CONTENT.map((d) => ({
      id: d.id,
      sport: d.sport,
      name: d.title,
      category: d.category || 'General',
      difficulty: d.difficulty as DrillDifficulty,
      targetFault: d.targetFault || '—',
      duration: d.duration || '—',
      sourceLabel: 'Content',
    })),
    ...ALL_DRILL_CANDIDATES.map((d) => ({
      id: d.id,
      sport: d.sport,
      name: d.name,
      category: d.families[0] ? titleCase(d.families[0]) : 'Fault fix',
      difficulty: d.difficulty as DrillDifficulty,
      targetFault: d.faultIds[0] ?? d.goal ?? '—',
      duration: d.repsOrDuration || '—',
      sourceLabel: 'DrillMatch',
    })),
  ].sort((a, b) => a.sport.localeCompare(b.sport) || a.name.localeCompare(b.name));

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Drill Editor"
        icon={SquarePen}
        description="Create, edit and retire drills as a preview overlay on the code catalogs, then export the overlay to commit it for everyone. Your edits are saved in this browser only — nothing is written to live production data until a developer commits the exported JSON."
      />

      <DrillManager baseDrills={base} />

      <HelpPanel>
        <p>
          <strong className="text-foreground">How editing works.</strong> Drills live in code
          (<code>data/drills-content.ts</code> and the DrillMatch catalog), so this editor builds a
          <em> local overlay</em> on top of them. You can override a code drill, create a brand-new custom
          drill, or retire one. Everything you do here is saved only in <em>your</em> browser.
        </p>
        <p>
          <strong className="text-foreground">Going global.</strong> When you are happy, click <em>Export
          JSON</em> and hand the file to a developer (or commit it yourself) to apply the change for all
          users. This keeps production data safe: no destructive writes ever happen from the browser.
        </p>
        <p>
          <strong className="text-foreground">Status &amp; safety.</strong> New and edited drills start as
          <em> draft</em>; mark them <em>active</em> when reviewed, or <em>retired</em> to phase one out.
          Deleting a custom drill or resetting all edits asks for confirmation first.
        </p>
      </HelpPanel>
    </div>
  );
}
