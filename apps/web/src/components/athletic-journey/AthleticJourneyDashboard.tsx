'use client';

// ============================================================
// SwingVantage — Athletic Journey: dashboard
// ------------------------------------------------------------
// The premium, mobile-first player-development operating system.
// Sport selector → live journey (Golf/Tennis) or in-development card.
// Every number shows its honesty: confidence, basis, and the missing
// data that would sharpen it. Nothing is fetched or sent.
// ============================================================

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Compass, Gauge, Sparkles, Target, Map as MapIcon, Trophy,
  Dumbbell, SlidersHorizontal, History as HistoryIcon, GitBranch,
  AlertTriangle, TrendingUp, ArrowUpRight, ArrowDownRight, Minus, ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useSport } from '@/contexts/SportContext';
import { useSwingVantageStore } from '@/store';
import { analyzeDeterministicSession } from '@/lib/intelligence/diagnose';
import { diagnosisToSkillCategory } from '@/lib/athletic-journey/diagnosis-focus';
import { track, ANALYTICS_EVENTS } from '@/lib/analytics';
import type { SportId } from '@swingiq/core';
import {
  JOURNEY_SPORTS,
  isJourneyLive,
  getSportAvailability,
  SPORT_AVAILABILITY_MESSAGE,
  type JourneyDashboard,
  type RatingAlignmentResult,
} from '@/lib/athletic-journey';
import { useAthleticJourney } from '@/lib/athletic-journey/adapters/useAthleticJourney';
import { SportSelector } from './SportSelector';
import { InDevelopmentCard } from './InDevelopmentCard';
import { JourneyMap } from './JourneyMap';
import { SkillTree } from './SkillTree';
import { MilestonePanel } from './MilestonePanel';
import { MissingDataPanel } from './MissingDataPanel';
import { PracticePrescriptionPanel } from './PracticePrescriptionPanel';
import { RatingPanel } from './RatingPanel';
import { JourneyHistory } from './JourneyHistory';
import { ConfidenceChip, CONFIDENCE_META, MomentumGauge } from './_shared';

// ── small layout helper ───────────────────────────────────────

function Section({
  title, icon: Icon, children, action,
}: {
  title: string;
  icon: typeof Compass;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2">
          <Icon size={16} className="text-primary" aria-hidden="true" /> {title}
        </CardTitle>
        {action}
      </CardHeader>
      <CardBody>{children}</CardBody>
    </Card>
  );
}

// ── rating alignment line ─────────────────────────────────────

const ALIGN_META: Record<RatingAlignmentResult['alignment'], { icon: typeof Minus; cls: string; label: string }> = {
  above: { icon: ArrowUpRight, cls: 'text-accent-secondary', label: 'Ability ahead of rating' },
  aligned: { icon: Minus, cls: 'text-success', label: 'Rating aligned' },
  below: { icon: ArrowDownRight, cls: 'text-warning', label: 'Results trail rating' },
  unknown: { icon: Minus, cls: 'text-muted-foreground', label: 'No rating yet' },
};

function RatingAlignmentLine({ alignment }: { alignment: RatingAlignmentResult }) {
  const m = ALIGN_META[alignment.alignment];
  const Icon = m.icon;
  return (
    <div className="flex items-start gap-2">
      <Icon size={16} className={cn('mt-0.5 shrink-0', m.cls)} aria-hidden="true" />
      <div>
        <p className={cn('text-xs font-semibold', m.cls)}>{m.label}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{alignment.explanation}</p>
      </div>
    </div>
  );
}

// ── hero current-stage card ───────────────────────────────────

function CurrentStageCard({ d }: { d: JourneyDashboard }) {
  const pct = Math.round((d.stageOrderEstimate / 10) * 100);
  return (
    <Card className="overflow-hidden">
      <div className="px-6 py-5 bg-gradient-to-br from-primary/10 to-accent-secondary/10 border-b border-border">
        <div className="flex items-center gap-2">
          <Badge variant="info">{d.currentStage.code}</Badge>
          <Badge variant="default">{d.currentStage.tier}</Badge>
          <span className="ml-auto"><ConfidenceChip level={d.confidence} /></span>
        </div>
        <h2 className="mt-2 text-2xl font-bold text-foreground">{d.currentStage.name}</h2>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{d.narrative.stageSummary}</p>

        {/* pathway position */}
        <div className="mt-4">
          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
            <span>New</span><span>Professional</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
          {d.nextStage && (
            <p className="mt-1.5 text-xs text-muted-foreground">
              Next target: <span className="font-medium text-foreground">{d.nextStage.code} · {d.nextStage.name}</span>
            </p>
          )}
        </div>
      </div>

      <CardBody className="space-y-4">
        {/* momentum + alignment */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 flex items-center gap-1.5">
              <Gauge size={13} aria-hidden="true" /> Journey momentum
            </p>
            <MomentumGauge score={d.momentum.score} band={d.momentum.band} />
            <p className="mt-1 text-[11px] text-muted-foreground">{d.momentum.note}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 flex items-center gap-1.5">
              <ShieldCheck size={13} aria-hidden="true" /> Rating alignment
            </p>
            <RatingAlignmentLine alignment={d.ratingAlignment} />
          </div>
        </div>

        {/* confidence + honesty notes */}
        <div className="rounded-theme border border-border bg-muted/30 p-3 space-y-1.5">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{CONFIDENCE_META[d.confidence].label}.</span>{' '}
            {CONFIDENCE_META[d.confidence].blurb}
            {d.redistributedWeight && ' Some categories have no data yet, so weighting was redistributed and confidence lowered.'}
          </p>
          {d.regressionRisk && (
            <p className="text-xs text-warning flex items-center gap-1.5">
              <AlertTriangle size={13} aria-hidden="true" /> You&apos;ve been quiet for a while — a short session restarts your momentum.
            </p>
          )}
        </div>

        {/* momentum-is-not-skill disclaimer */}
        <p className="text-[10px] text-muted-foreground">
          Momentum measures development activity and improvement velocity, not absolute skill.
        </p>
      </CardBody>
    </Card>
  );
}

// ── AI coach summary ──────────────────────────────────────────

// Optional LLM re-word is OFF by default (no AI spend). Enable by setting
// NEXT_PUBLIC_JOURNEY_AI_REWORD=1 and configuring a provider server-side.
const AI_REWORD_ENABLED = process.env.NEXT_PUBLIC_JOURNEY_AI_REWORD === '1';

function AICoachSummary({ d }: { d: JourneyDashboard }) {
  const [n, setN] = useState(d.narrative);
  const [loading, setLoading] = useState(false);
  useEffect(() => setN(d.narrative), [d.narrative]);

  async function refine() {
    setLoading(true);
    try {
      const res = await fetch('/api/athletic-journey/narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ narrative: d.narrative }),
      });
      if (res.ok) {
        const data = (await res.json()) as { narrative?: typeof d.narrative };
        if (data?.narrative) setN(data.narrative);
      }
    } catch {
      /* keep the deterministic narrative on any failure */
    } finally {
      setLoading(false);
    }
  }

  return (
    <Section
      title="Your AI coach read"
      icon={Sparkles}
      action={
        AI_REWORD_ENABLED ? (
          <button
            type="button"
            onClick={refine}
            disabled={loading}
            className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
          >
            {loading ? 'Refining…' : n.enhanced ? 'Refined ✓' : 'Refine wording'}
          </button>
        ) : undefined
      }
    >
      <p className="text-sm text-foreground leading-relaxed">{n.coachNote}</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold text-success mb-1">Strengths</p>
          <ul className="space-y-1">
            {n.strengths.map((s, i) => (
              <li key={i} className="text-xs text-muted-foreground flex gap-1.5"><span className="text-success mt-px">+</span>{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold text-warning mb-1">Development gaps</p>
          <ul className="space-y-1">
            {n.developmentGaps.map((s, i) => (
              <li key={i} className="text-xs text-muted-foreground flex gap-1.5"><span className="text-warning mt-px">→</span>{s}</li>
            ))}
          </ul>
        </div>
      </div>

      {n.contradictoryEvidence.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold text-foreground mb-1">What contradicts this stage</p>
          <ul className="space-y-1">
            {n.contradictoryEvidence.map((s, i) => (
              <li key={i} className="text-xs text-muted-foreground flex gap-1.5"><span className="text-muted-foreground mt-px">•</span>{s}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 rounded-theme border border-border bg-muted/30 p-3">
        <p className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
          <Target size={13} aria-hidden="true" /> Recommended next actions
        </p>
        <ol className="space-y-1">
          {n.recommendedNextActions.map((s, i) => (
            <li key={i} className="text-xs text-foreground flex gap-2">
              <span className="font-bold text-primary">{i + 1}.</span>{s}
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}

// ── main ──────────────────────────────────────────────────────

export function AthleticJourneyDashboard() {
  const { activeSport } = useSport();
  const initial: SportId = JOURNEY_SPORTS.includes(activeSport) ? activeSport : 'golf';
  const [viewSport, setViewSport] = useState<SportId>(initial);
  const ratingRef = useRef<HTMLDivElement | null>(null);

  const live = isJourneyLive(viewSport);
  const dashboard = useAthleticJourney(viewSport);

  // Tie the athlete's current likely cause to a skill-tree category so the tree
  // can flag the branch they're working on now. Token-free + honest: derived
  // from their reported miss (golf) or latest video-detected issue (other
  // sports), and only when the engine confidently matches a curated cause.
  const { profile, video_analyses } = useSwingVantageStore();
  const focusCategory = useMemo(() => {
    const miss =
      viewSport === 'golf'
        ? profile?.current_miss?.trim()
        : [...video_analyses]
            .filter((v) => v.sport === viewSport && v.primary_issue)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]?.primary_issue;
    if (!miss) return undefined;
    const d = analyzeDeterministicSession({ sport: viewSport, issue: miss });
    return d.primary.generated ? undefined : diagnosisToSkillCategory(d);
  }, [viewSport, profile?.current_miss, video_analyses]);

  // Page view + deep-link to the rating panel (?panel=rating).
  useEffect(() => {
    track(ANALYTICS_EVENTS.ATHLETIC_JOURNEY_VIEWED, { sport: viewSport });
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('panel') === 'rating') {
      setTimeout(() => ratingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stage-calculated analytics (once per sport+stage).
  const calcKey = dashboard ? `${dashboard.sport}:${dashboard.currentStage.code}:${dashboard.confidence}` : null;
  const lastCalc = useRef<string | null>(null);
  useEffect(() => {
    if (calcKey && calcKey !== lastCalc.current) {
      lastCalc.current = calcKey;
      if (dashboard) {
        track(ANALYTICS_EVENTS.JOURNEY_STAGE_CALCULATED, {
          sport: dashboard.sport, stage_code: dashboard.currentStage.code,
          confidence: dashboard.confidence, momentum_band: dashboard.momentum.band,
        });
        // WS-07 — the athlete's journey state changed (stage/confidence). One
        // event the whole overhaul (Today, dashboard card, profile) keys off.
        track(ANALYTICS_EVENTS.ATHLETE_JOURNEY_UPDATED, {
          sport: dashboard.sport, stage: dashboard.currentStage.code,
          momentum_band: dashboard.momentum.band, confidence: dashboard.confidence,
        });
      }
    }
  }, [calcKey, dashboard]);

  const onSelect = (s: SportId) => {
    setViewSport(s);
    track(ANALYTICS_EVENTS.JOURNEY_SPORT_SELECTED, { sport: s, live: isJourneyLive(s) });
  };

  const scrollToRating = () => ratingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  const availability = getSportAvailability(viewSport);
  const header = useMemo(
    () => (
      <header>
        <div className="flex items-center gap-2">
          <Compass size={22} className="text-primary" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-foreground">Athletic Journey</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
          Your personalized roadmap from where you are now toward elite performance — built from your
          profile, videos, logged play, and practice. Honest about what it knows and what it doesn&apos;t.
        </p>
        <p className="mt-2 text-xs text-muted-foreground max-w-2xl rounded-theme border border-border bg-muted/40 p-2.5">
          {SPORT_AVAILABILITY_MESSAGE}
        </p>
      </header>
    ),
    [],
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-5">
      {header}

      <Section title="Choose your sport" icon={GitBranch}>
        <SportSelector viewSport={viewSport} onSelect={onSelect} />
      </Section>

      {!live || !dashboard ? (
        <InDevelopmentCard availability={availability} />
      ) : (
        <>
          <CurrentStageCard d={dashboard} />
          <AICoachSummary d={dashboard} />

          <div className="grid gap-5 lg:grid-cols-2">
            <Section title="Unlock the next stage" icon={Target}>
              {dashboard.nextStage ? (
                <>
                  <p className="text-sm text-muted-foreground mb-2">
                    To reach <span className="font-medium text-foreground">{dashboard.nextStage.code} · {dashboard.nextStage.name}</span>:
                  </p>
                  <ul className="space-y-1.5">
                    {dashboard.unlockRequirements.map((u) => (
                      <li key={u.id} className="text-sm text-foreground flex gap-2">
                        <span className="text-warning mt-0.5">→</span>{u.label}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  You&apos;re at the top of the modeled pathway. The work shifts to sustaining results across events.
                </p>
              )}
            </Section>

            <Section title="Sharpen your journey" icon={Sparkles}>
              <MissingDataPanel sport={viewSport} items={dashboard.missingData} onRatingClick={scrollToRating} />
            </Section>
          </div>

          <Section title="Your journey map" icon={MapIcon}>
            <JourneyMap
              sport={viewSport}
              currentOrder={dashboard.currentStage.order}
              nextOrder={dashboard.nextStage?.order ?? null}
            />
          </Section>

          <div className="grid gap-5 lg:grid-cols-2">
            <Section title="Skill tree" icon={GitBranch}>
              <SkillTree sport={viewSport} branches={dashboard.branches} focusCategory={focusCategory} />
            </Section>
            <Section title="Milestones" icon={Trophy}>
              <MilestonePanel sport={viewSport} milestones={dashboard.milestones} />
            </Section>
          </div>

          <Section title="Your weekly practice plan" icon={Dumbbell}>
            <PracticePrescriptionPanel sport={viewSport} prescription={dashboard.prescription} />
          </Section>

          <div className="grid gap-5 lg:grid-cols-2">
            <div ref={ratingRef}>
              <Section title="Ratings & inputs (optional)" icon={SlidersHorizontal}>
                <RatingPanel sport={viewSport} />
              </Section>
            </div>
            <Section title="Your progress over time" icon={HistoryIcon}>
              <JourneyHistory sport={viewSport} />
            </Section>
          </div>

          <p className="text-[11px] text-muted-foreground flex items-start gap-1.5 px-1">
            <TrendingUp size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
            {dashboard.disclaimer}
          </p>
        </>
      )}
    </div>
  );
}
