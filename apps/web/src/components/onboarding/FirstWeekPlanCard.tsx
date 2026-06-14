'use client';

// FirstWeekPlanCard — the guided First 7 Days, surfaced on the dashboard for new
// athletes. Derives real signals from the store (analyses, sessions, profile),
// builds the deterministic plan, and leads with today's single step. Self-hides
// once the athlete graduates (all done, or past day 7). No new infrastructure.

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle, Compass, ArrowRight } from 'lucide-react';
import { useSwingVantageStore } from '@/store';
import { buildFirstWeekPlan, type FirstWeekSignals } from '@/lib/onboarding/first-week';

function earliestISO(...dates: (string | number | null | undefined)[]): string | null {
  const ts = dates
    .map((d) => (d == null ? NaN : new Date(d).getTime()))
    .filter((n) => Number.isFinite(n)) as number[];
  return ts.length ? new Date(Math.min(...ts)).toISOString() : null;
}

export function FirstWeekPlanCard() {
  const sessions = useSwingVantageStore((s) => s.sessions);
  const analyses = useSwingVantageStore((s) => s.video_analyses);
  const profile = useSwingVantageStore((s) => s.profile);
  const onboardingComplete = useSwingVantageStore((s) => s.settings.onboarding_complete);

  const [mounted, setMounted] = useState(false);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => setMounted(true), []);

  const plan = useMemo(() => {
    const firstSeenAt = earliestISO(
      ...sessions.map((s) => (s as { date?: string; created_at?: string }).date ?? (s as { created_at?: string }).created_at),
      ...analyses.map((a) => (a as { created_at?: string }).created_at),
    );
    const signals: FirstWeekSignals = {
      firstSeenAt,
      hasProfile: Boolean(onboardingComplete) || Boolean(profile?.skill_level),
      analysesCount: analyses.length,
      sessionsCount: sessions.length,
    };
    return buildFirstWeekPlan(signals);
  }, [sessions, analyses, profile, onboardingComplete]);

  if (!mounted || plan.graduated) return null;

  const today = plan.days.find((d) => d.day === plan.currentDay) ?? plan.days[0];

  return (
    <section aria-label="Your first week" className="mb-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-sm font-bold text-foreground">
          <Compass className="h-4 w-4 text-primary" /> Your first week · day {plan.currentDay} of {plan.totalDays}
        </p>
        <span className="text-xs text-muted-foreground">{plan.completedCount}/{plan.totalDays} done</span>
      </div>

      {/* Today's step — the single thing to do now */}
      <div className="mt-2 rounded-lg border border-border bg-card p-3">
        <p className="text-2xs font-semibold uppercase tracking-wide text-primary">Today</p>
        <p className="mt-0.5 text-sm font-semibold text-foreground">{today.title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{today.description}</p>
        <Link
          href={today.cta.href}
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
        >
          {today.cta.label} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mt-2 text-xs font-medium text-primary hover:underline"
      >
        {expanded ? 'Hide the full week' : 'See the full week'}
      </button>

      {expanded && (
        <ul className="mt-2 space-y-1">
          {plan.days.map((d) => (
            <li key={d.day} className="flex items-center gap-2 text-xs">
              {d.done ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
              ) : (
                <Circle className={`h-3.5 w-3.5 shrink-0 ${d.day === plan.currentDay ? 'text-primary' : 'text-muted-foreground/40'}`} />
              )}
              <span className={d.done ? 'text-muted-foreground line-through' : d.day === plan.currentDay ? 'font-medium text-foreground' : 'text-muted-foreground'}>
                Day {d.day}: {d.title}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
