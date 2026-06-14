'use client';

// ============================================================
// SwingVantage — Owner Insights dashboard (client)
// ------------------------------------------------------------
// North-Star + funnel framework (always known) + honest provider status
// + a clearly-labeled THIS-ACCOUNT snapshot. Dark admin styling.
// ============================================================

import { useMemo } from 'react';
import { Star, Activity, BarChart3, CheckCircle2, XCircle } from 'lucide-react';
import { useSwingVantageStore } from '@/store';
import { useReferral } from '@/lib/referral';
import { useTeam } from '@/lib/team';
import { read as readReengage } from '@/lib/reengage';
import { GA_ID } from '@/lib/analytics';
import {
  NORTH_STAR, FUNNEL, buildLocalSnapshot, detectProvider,
} from '@/lib/insights';
import type { FunnelStage } from '@/lib/insights';

const DAY_MS = 86_400_000;

const PHASE_BADGE: Record<FunnelStage['phase'], { label: string; cls: string }> = {
  now: { label: 'Focus now', cls: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' },
  next: { label: 'Next', cls: 'text-amber-400 bg-amber-400/10 border-amber-400/30' },
  later: { label: 'Later', cls: 'text-muted-foreground bg-muted-foreground/10 border-border' },
};

export function InsightsDashboard() {
  const { sessions, video_analyses, training } = useSwingVantageStore();
  const referral = useReferral();
  const team = useTeam();

  const snapshot = useMemo(() => {
    const times = [
      ...sessions.map((s) => new Date(s.created_at).getTime()),
      ...video_analyses.map((v) => new Date(v.created_at).getTime()),
      training.last_practice_date ? new Date(training.last_practice_date).getTime() : NaN,
    ].filter((t) => !Number.isNaN(t));
    const last = times.length ? Math.max(...times) : null;
    const prefs = readReengage().prefs;
    return buildLocalSnapshot({
      sessionCount: sessions.length,
      videoAnalysisCount: video_analyses.length,
      diagnosedCount: sessions.filter((s) => (s.diagnoses?.length ?? 0) > 0).length,
      streakDays: training.streak_days ?? 0,
      daysSinceLastActivity: last === null ? null : Math.floor((Date.now() - last) / DAY_MS),
      referralShares: referral.stats.shareCount,
      referralSignups: referral.stats.signupCount,
      teamSize: team.state.athletes.length,
      remindersOptedIn: prefs.inApp || prefs.push || prefs.email,
    });
  }, [sessions, video_analyses, training, referral.stats, team.state.athletes.length]);

  const provider = useMemo(() => detectProvider(GA_ID), []);

  return (
    <div className="space-y-6">
      {/* North Star */}
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 text-amber-400">
          <Star size={18} aria-hidden="true" />
          <h2 className="font-semibold">North-Star Metric</h2>
        </div>
        <p className="mt-2 text-lg font-bold text-foreground">{NORTH_STAR.name}</p>
        <p className="mt-1 text-sm text-muted-foreground">{NORTH_STAR.definition}</p>
        <p className="mt-2 text-sm text-muted-foreground"><span className="font-medium text-muted-foreground">Why this one:</span> {NORTH_STAR.why}</p>
      </section>

      {/* Provider status (honest) */}
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 text-foreground">
          <BarChart3 size={18} aria-hidden="true" />
          <h2 className="font-semibold">Where the aggregate numbers live</h2>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <ProviderPill label="GA4" on={provider.ga4} />
          <ProviderPill label="Plausible" on={provider.plausible} />
          <ProviderPill label="PostHog" on={provider.posthog} />
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          {provider.anyConnected
            ? 'A provider is connected. Cross-user funnel, retention cohorts, and traffic live in that dashboard — this page is the scoreboard + a local preview.'
            : 'No analytics provider is connected yet, so there are no aggregate numbers to show — and this page won’t pretend otherwise. Set NEXT_PUBLIC_GA_ID (or add Plausible/PostHog) to unlock cross-user metrics.'}
        </p>
      </section>

      {/* Funnel */}
      <section>
        <h2 className="mb-2 px-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">The funnel (what to watch, in order)</h2>
        <div className="space-y-2">
          {FUNNEL.map((stage, i) => {
            const reached = isReached(stage.id, snapshot.stageReached);
            const badge = PHASE_BADGE[stage.phase];
            return (
              <div key={stage.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">{i + 1}</span>
                    <h3 className="font-semibold text-foreground">{stage.label}</h3>
                    {reached && <CheckCircle2 size={15} className="text-emerald-400" aria-label="Reached on this account" />}
                  </div>
                  <span className={`rounded-sm border px-2 py-0.5 text-[11px] font-medium ${badge.cls}`}>{badge.label}</span>
                </div>
                <p className="mt-1.5 text-sm text-muted-foreground">{stage.question}</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <p className="text-sm"><span className="text-muted-foreground">Metric:</span> <span className="text-foreground">{stage.metric}</span></p>
                  <p className="text-sm"><span className="text-muted-foreground">Target:</span> <span className="text-foreground">{stage.target}</span></p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Local snapshot */}
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 text-foreground">
          <Activity size={18} aria-hidden="true" />
          <h2 className="font-semibold">This account (local preview)</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Computed from your own device data — a real preview of each metric’s shape, not aggregate user numbers.
          Furthest stage reached here: <span className="font-medium text-emerald-400">{labelFor(snapshot.stageReached)}</span>.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {snapshot.metrics.map((m) => (
            <div key={m.key} className="rounded-lg border border-border bg-background p-3">
              <p className="text-xl font-bold text-foreground">{m.value}</p>
              <p className="text-xs text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ProviderPill({ label, on }: { label: string; on: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium ${on ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-400' : 'border-border bg-muted text-muted-foreground'}`}>
      {on ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
      {label}
    </span>
  );
}

const ORDER = ['acquisition', 'activation', 'retention', 'referral', 'revenue'] as const;
function isReached(stage: string, reached: string): boolean {
  return ORDER.indexOf(stage as (typeof ORDER)[number]) <= ORDER.indexOf(reached as (typeof ORDER)[number]);
}
function labelFor(id: string): string {
  return FUNNEL.find((s) => s.id === id)?.label ?? id;
}
