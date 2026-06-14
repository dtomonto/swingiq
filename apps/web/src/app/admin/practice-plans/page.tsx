// ============================================================
// /admin/practice-plans — Practice Plan Management
// ------------------------------------------------------------
// Plans are GENERATED per athlete by the practice-planner agent — there
// is no static template registry. So this previews the REAL planner's
// output across sports and skill levels (plus a youth variant), letting
// an operator review structure, coverage and quality. Read-only.
// ============================================================

import type { Metadata } from 'next';
import { ClipboardCheck, Layers, Dumbbell, Clock } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { MetricStat } from '@/components/admin/MetricStat';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { buildSamplePlans, groupSamplesBySport } from '@/lib/admin/practice-plans/samples';

export const metadata: Metadata = { title: 'Practice Plans | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

export default function AdminPracticePlansPage() {
  const catalog = buildSamplePlans();
  const groups = groupSamplesBySport(catalog);
  const { stats } = catalog;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Practice Plans"
        icon={ClipboardCheck}
        description="Practice plans are generated per athlete by the planner — there is no static template list. This previews the real planner's output across sports and skill levels (and a youth variant) so you can review structure, coverage and quality. Read-only."
        actions={<StatusBadge tone="info">{stats.samples} sample plans</StatusBadge>}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricStat label="Sports" icon={Layers} value={String(stats.sports)} hint="covered" />
        <MetricStat label="Variants / sport" icon={ClipboardCheck} value={String(stats.variants)} hint="levels previewed" />
        <MetricStat label="Sample plans" icon={ClipboardCheck} value={String(stats.samples)} hint="generated live" />
        <MetricStat label="Avg drills / plan" icon={Dumbbell} value={String(stats.avgDrills)} hint="main work" />
      </div>

      {groups.map((group) => (
        <SectionCard
          key={group.sport}
          title={
            <span className="flex items-center gap-2">
              {group.sportLabel}
              <span className="text-xs font-normal text-muted-foreground">({group.samples.length} variants)</span>
            </span>
          }
        >
          <div className="grid gap-3 lg:grid-cols-2">
            {group.samples.map((s) => (
              <div key={`${s.sport}:${s.variant}`} className="rounded-xl border border-border bg-background/40 p-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-medium text-foreground">{s.variant}</h3>
                  <div className="flex items-center gap-1.5">
                    {s.youth && <StatusBadge tone="accent">youth-scaled</StatusBadge>}
                    <StatusBadge tone="neutral">
                      <Clock className="h-3 w-3" /> {s.plan.estimatedTimeMinutes} min
                    </StatusBadge>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Focus: <span className="text-foreground">{s.plan.practiceFocus}</span>
                </p>

                <p className="mt-2 text-xs text-muted-foreground">
                  <span className="text-muted-foreground">Warm-up:</span> {s.plan.warmup}
                </p>

                <ol className="mt-2 space-y-1.5">
                  {s.plan.mainDrills.map((d, i) => (
                    <li key={i} className="text-sm text-foreground">
                      <span className="font-medium text-foreground">{i + 1}. {d.name}</span>
                      <span className="text-muted-foreground"> — {d.repsOrTime}</span>
                      <span className="block text-xs text-muted-foreground">{d.why}</span>
                    </li>
                  ))}
                </ol>

                <p className="mt-2 text-xs text-muted-foreground">
                  <span className="text-muted-foreground">Pressure test:</span> {s.plan.pressureTest}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  <span className="text-muted-foreground">Success:</span> {s.plan.successMetric}
                </p>
                <p className="mt-2 text-2xs text-muted-foreground/70">
                  Equipment: {s.plan.equipmentNeeded.join(', ')}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      ))}

      <HelpPanel>
        <p>
          <strong className="text-foreground">What this is.</strong> A live preview of the practice planner.
          Because plans are personalized per athlete (built from their current priority, skill level and
          available time), there is no fixed list to manage — instead this shows representative plans the
          planner produces, so you can sanity-check structure and coverage across every sport.
        </p>
        <p>
          <strong className="text-foreground">Youth scaling.</strong> The youth variant demonstrates the
          planner&apos;s safety behavior: shorter sessions and gentler success metrics for younger athletes.
          Coaching is performance-only — never medical.
        </p>
        <p>
          <strong className="text-foreground">Editing.</strong> Plan logic lives in code
          (<code>lib/agents/workflows/practice-planner.ts</code>). A future iteration could add saved,
          editable plan templates backed by the local-first + optional-Supabase-mirror pattern.
        </p>
      </HelpPanel>
    </div>
  );
}
