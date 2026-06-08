'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { CalendarRange, ArrowLeft, Check, Play, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useMentalPerformance } from '@/lib/mental-performance/useMentalPerformance';
import { buildPlan, planCatalog } from '@/lib/mental-performance/plans';
import { getRoutine } from '@/lib/mental-performance/routines';
import type { MentalSport, PlanType, TrainingPlan, PlanAssignment } from '@/lib/mental-performance/types';
import { SafetyDisclaimer } from '@/components/mental-performance/SafetyDisclaimer';

function rebuildPlan(assignment: PlanAssignment): TrainingPlan | null {
  const [slug, sport] = assignment.planId.split('__');
  const spec = planCatalog().find((p) => p.slug === slug);
  if (!spec) return null;
  return buildPlan(spec.planType as PlanType, (sport as MentalSport) ?? 'universal');
}

export default function MentalPlansPage() {
  const mp = useMentalPerformance();
  const catalog = useMemo(() => planCatalog(), []);
  const active = mp.activePlan;
  const activePlan = useMemo(() => (active ? rebuildPlan(active) : null), [active]);

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
      <header className="flex items-center gap-3">
        <Link href="/mental" className="text-muted-foreground hover:text-foreground"><ArrowLeft size={20} /></Link>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <CalendarRange size={20} aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-xl font-bold text-foreground">Mental Training Plans</h1>
          <p className="text-sm text-muted-foreground">Build the habit. Adapts to your sport.</p>
        </div>
      </header>

      {/* Active plan */}
      {active && activePlan && (
        <section className="rounded-2xl border border-primary/40 bg-primary/5 p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-primary">Active plan</div>
              <h2 className="mt-0.5 text-lg font-bold text-foreground">{activePlan.title}</h2>
              <p className="text-sm text-muted-foreground">{activePlan.summary}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => mp.abandonPlan(active.id)} aria-label="End plan">
              <X size={15} /> End
            </Button>
          </div>

          <ol className="mt-4 space-y-2">
            {activePlan.days.map((d) => {
              const done = active.completedDays.includes(d.day);
              const current = active.currentDay === d.day && active.status === 'active';
              const routine = d.routineId ? getRoutine(d.routineId) : null;
              return (
                <li
                  key={d.day}
                  className={`rounded-xl border p-3 ${current ? 'border-primary bg-card' : 'border-border bg-card'}`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      done ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      {done ? <Check size={14} /> : d.day}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-foreground">{d.skillFocus}</div>
                      <p className="text-sm text-muted-foreground">{d.exercise}</p>
                      <p className="mt-1 text-sm text-foreground">{d.sportApplication}</p>
                      {routine && (
                        <Link href={`/mental-performance/${routine.sports[0]}/${routine.slug}`} className="mt-1 inline-block text-xs text-primary hover:underline">
                          Routine: {routine.title} →
                        </Link>
                      )}
                      {current && (
                        <Button size="sm" className="mt-2" onClick={() => mp.advancePlanDay(active.id, d.day, activePlan.days.length)}>
                          <Check size={14} /> Mark day done
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
          {active.status === 'completed' && (
            <p className="mt-3 rounded-lg bg-primary/10 p-3 text-center text-sm font-medium text-primary">
              Plan complete — nice work. Start another below anytime.
            </p>
          )}
        </section>
      )}

      {/* Catalog */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Choose a plan</h2>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          {catalog.map((p) => (
            <div key={p.slug} className="flex flex-col rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">{p.title}</h3>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {p.durationDays > 0 ? `${p.durationDays} days` : 'Session'}
                </span>
              </div>
              <p className="mt-1 flex-1 text-sm text-muted-foreground">{p.goal}</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => mp.assignPlan(buildPlan(p.planType as PlanType, mp.activeSport))}
              >
                <Play size={14} /> Start for {mp.activeSport === 'universal' ? 'any sport' : mp.activeSport.replace('_', ' ')}
              </Button>
            </div>
          ))}
        </div>
      </section>

      <SafetyDisclaimer variant="full" />
    </div>
  );
}
