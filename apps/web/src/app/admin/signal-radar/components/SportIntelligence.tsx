'use client';

import { useMemo, useState } from 'react';
import { Trophy, ArrowRight } from 'lucide-react';
import { SectionCard } from '@/components/admin/SectionCard';
import { MetricStat } from '@/components/admin/MetricStat';
import type { Signal, SignalRadarConfig, CompetitorDef, SignalSport } from '@/lib/signal-radar/types';
import { buildSportView, VIEWABLE_SPORTS } from '@/lib/signal-radar/sport';
import { SPORT_LABEL, SENTIMENT_LABEL } from '@/lib/signal-radar/labels';
import { DistributionBars, EmptyState, SignalBadges } from './ui';

export function SportIntelligence({ signals, config, competitors, onOpenSignal }: {
  signals: Signal[];
  config: SignalRadarConfig;
  competitors: CompetitorDef[];
  onOpenSignal: (id: string) => void;
}) {
  const [sport, setSport] = useState<SignalSport>('golf');
  const view = useMemo(
    () => buildSportView(signals, sport, config, competitors),
    [signals, sport, config, competitors],
  );

  // Per-sport volume for the selector badges.
  const counts = useMemo(() => {
    const m = {} as Record<SignalSport, number>;
    for (const s of VIEWABLE_SPORTS) m[s] = 0;
    for (const s of signals) {
      if (s.status === 'archived' || s.status === 'ignored') continue;
      if (m[s.classification.sport] !== undefined) m[s.classification.sport]++;
    }
    return m;
  }, [signals]);

  const sentimentBuckets = view.bySentiment.map((b) => ({ ...b, label: SENTIMENT_LABEL[b.key as keyof typeof SENTIMENT_LABEL] ?? b.label }));

  return (
    <div className="space-y-4">
      {/* Sport selector */}
      <div className="flex flex-wrap gap-1.5">
        {VIEWABLE_SPORTS.map((s) => (
          <button
            key={s}
            onClick={() => setSport(s)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              sport === s ? 'bg-primary/15 text-link' : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {SPORT_LABEL[s]}
            <span className="rounded-full bg-muted px-1.5 text-[10px] tabular-nums text-muted-foreground">{counts[s] ?? 0}</span>
          </button>
        ))}
      </div>

      {view.total === 0 ? (
        <EmptyState
          icon={Trophy}
          title={`No ${SPORT_LABEL[sport]} signals yet`}
          hint="Set up a Google Alert or import a sport-specific feed to start tracking this sport’s demand, questions and competitors."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MetricStat label="Signals" value={view.total} icon={Trophy} />
            <MetricStat label="Questions" value={view.topQuestions.length} />
            <MetricStat label="Pain points" value={view.painPoints.length} tone={view.painPoints.length ? 'warning' : 'default'} />
            <MetricStat label="Content openings" value={view.contentOpportunities.length} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard title="Sentiment" description={`How ${SPORT_LABEL[sport]} conversation feels.`}>
              <DistributionBars buckets={sentimentBuckets} />
            </SectionCard>
            <SectionCard title="Top competitors in this sport" description="Who shows up alongside this sport.">
              <DistributionBars buckets={view.topCompetitors} emptyHint="No competitors referenced in this sport yet." />
            </SectionCard>
          </div>

          <SectionCard title="Recommended next actions" description="What to do for this sport.">
            <ul className="space-y-1.5">
              {view.recommendedActions.map((a, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-link" /> {a}
                </li>
              ))}
            </ul>
          </SectionCard>

          <div className="grid gap-4 lg:grid-cols-3">
            <SignalList title="Top questions" signals={view.topQuestions} onOpenSignal={onOpenSignal} />
            <SignalList title="Pain points" signals={view.painPoints} onOpenSignal={onOpenSignal} />
            <SignalList title="Recent high-priority" signals={view.recentHighPriority} onOpenSignal={onOpenSignal} />
          </div>
        </>
      )}
    </div>
  );
}

function SignalList({ title, signals, onOpenSignal }: { title: string; signals: Signal[]; onOpenSignal: (id: string) => void }) {
  return (
    <SectionCard title={title}>
      {signals.length === 0 ? (
        <p className="text-xs text-muted-foreground/70">None.</p>
      ) : (
        <ul className="space-y-2">
          {signals.map((s) => (
            <li key={s.id}>
              <button onClick={() => onOpenSignal(s.id)} className="w-full rounded-lg border border-border bg-background/40 p-2.5 text-left transition-colors hover:bg-muted">
                <p className="line-clamp-2 text-xs text-foreground">{s.title || s.cleanText}</p>
                <div className="mt-1.5"><SignalBadges signal={s} /></div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}
