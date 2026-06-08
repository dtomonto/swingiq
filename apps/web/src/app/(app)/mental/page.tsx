'use client';

// ============================================================
// SwingVantage — Mental Performance (in-app hub)
// Quick-start resets, the deterministic coach, suggested routine, active plan,
// and personal insights. Local-first + consent-gated. Mobile-first.
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Brain, NotebookPen, CalendarRange, Frown, Wind, ShieldQuestion, Sparkles, ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useMentalPerformance } from '@/lib/mental-performance/useMentalPerformance';
import type { CoachSeed } from '@/components/mental-performance/MentalCoach';
import { MentalCoach } from '@/components/mental-performance/MentalCoach';
import { MentalProfileCard } from '@/components/mental-performance/MentalProfileCard';
import { SafetyDisclaimer } from '@/components/mental-performance/SafetyDisclaimer';

const QUICK_STARTS: Array<{ key: string; label: string; icon: typeof Wind; seed: CoachSeed }> = [
  { key: 'mistake', label: 'I made a mistake — help me reset', icon: Wind, seed: { mode: 'reset' } },
  { key: 'nervous', label: 'I’m nervous before playing', icon: ShieldQuestion, seed: { emotion: 'nervous', mode: 'pre_game' } },
  { key: 'confidence', label: 'I lost confidence', icon: Frown, seed: { mistake: 'lost_confidence', emotion: 'defeated', mode: 'confidence' } },
];

export default function MentalHubPage() {
  const mp = useMentalPerformance();
  const [seed, setSeed] = useState<CoachSeed | null>(null);
  const [seedKey, setSeedKey] = useState(0);

  // Honor ?intent= deep-links from the dashboard without useSearchParams.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const intent = new URLSearchParams(window.location.search).get('intent');
    const match = QUICK_STARTS.find((q) => q.key === intent);
    if (match) { setSeed(match.seed); setSeedKey((k) => k + 1); }
  }, []);

  const start = (s: CoachSeed) => { setSeed(s); setSeedKey((k) => k + 1); };

  const insights = mp.insights;
  const topTrigger = insights.topTriggers[0];

  const headerStats = useMemo(
    () => [
      { label: 'Moments logged', value: insights.total },
      { label: 'Pressure readiness', value: insights.pressureReadiness != null ? `${insights.pressureReadiness}` : '—' },
    ],
    [insights],
  );

  // ── Gentle consent intro ──
  if (!mp.consented || !mp.enabled) {
    return (
      <div className="mx-auto max-w-xl p-4 sm:p-6">
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Brain size={28} aria-hidden="true" />
          </span>
          <h1 className="mt-3 text-2xl font-bold text-foreground">Mental Performance</h1>
          <p className="mt-2 text-muted-foreground">
            Your mechanics matter. Your response after the mistake matters just as much. Get instant resets,
            build composure, and turn mistakes into training intelligence.
          </p>
          <Button className="mt-5" size="lg" onClick={() => mp.consent()}>
            <Sparkles size={18} /> Get started
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">
            Nothing is stored unless you choose to. You can turn this off or delete your data anytime.
          </p>
        </div>
        <div className="mt-4"><SafetyDisclaimer variant="full" /></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Brain size={20} aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-foreground">Mental Performance</h1>
            <p className="text-sm text-muted-foreground">Recover faster. Compete composed.</p>
          </div>
        </div>
        <div className="hidden gap-4 sm:flex">
          {headerStats.map((s) => (
            <div key={s.label} className="text-right">
              <div className="text-lg font-bold text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </header>

      {/* Quick starts */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Quick start</h2>
        <div className="mt-2 grid gap-2">
          {QUICK_STARTS.map((q) => {
            const Icon = q.icon;
            const active = seed === q.seed;
            return (
              <button
                key={q.key}
                onClick={() => start(q.seed)}
                className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                  active ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary'
                }`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon size={18} aria-hidden="true" />
                </span>
                <span className="font-medium text-foreground">{q.label}</span>
              </button>
            );
          })}
          <Link href="/mental/plans" className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:border-primary">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CalendarRange size={18} aria-hidden="true" />
            </span>
            <span className="font-medium text-foreground">Build my routine (training plans)</span>
            <ArrowRight size={16} className="ml-auto text-muted-foreground" aria-hidden="true" />
          </Link>
        </div>
      </section>

      {/* Coach */}
      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Mental Performance Coach</h2>
        <MentalCoach key={seedKey} seed={seed ?? undefined} />
      </section>

      {/* Suggested routine + insight */}
      <section className="grid gap-3 sm:grid-cols-2">
        <Link href={`/mental-performance/${mp.suggestedRoutine.sports[0]}/${mp.suggestedRoutine.slug}`}
          className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Suggested reset</div>
          <div className="mt-1 font-semibold text-foreground">{mp.suggestedRoutine.title}</div>
          <p className="mt-1 text-sm text-muted-foreground">{mp.suggestedRoutine.situation}</p>
        </Link>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your pattern</div>
          <p className="mt-1 text-sm text-foreground">{insights.headline}</p>
          {topTrigger && (
            <Link href="/mental/journal" className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline">
              <NotebookPen size={14} aria-hidden="true" /> See your journal insights
            </Link>
          )}
        </div>
      </section>

      {/* Active plan */}
      {mp.activePlan && (
        <Link href="/mental/plans" className="block rounded-xl border border-primary/40 bg-primary/5 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-primary">Active plan</div>
              <div className="mt-1 font-semibold text-foreground">Day {mp.activePlan.currentDay} — keep going</div>
            </div>
            <ArrowRight size={18} className="text-primary" aria-hidden="true" />
          </div>
        </Link>
      )}

      <MentalProfileCard />

      <div className="flex flex-wrap gap-2">
        <Link href="/mental/journal"><Button variant="outline" size="sm"><NotebookPen size={15} /> Journal</Button></Link>
        <Link href="/mental/plans"><Button variant="outline" size="sm"><CalendarRange size={15} /> Plans</Button></Link>
        <Link href="/mental-performance"><Button variant="ghost" size="sm">Learn more</Button></Link>
      </div>

      <SafetyDisclaimer variant="full" />
    </div>
  );
}
