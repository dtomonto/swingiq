'use client';

// ============================================================
// SwingVantage — Athlete General Intelligence: Dashboard
// ------------------------------------------------------------
// Reads the locally-stored Motion Lab sessions, runs the AGI engine, and
// renders the unified athlete model, ranked insights (with their reasoning
// chains), cross-sport transfers, and the one prioritised plan. Honest by
// design: every value shows basis + confidence; nothing is fetched or sent.
// ============================================================

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BrainCircuit,
  Sparkles,
  ArrowRightLeft,
  Target,
  ChevronRight,
  FlaskConical,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  ThumbsUp,
  ThumbsDown,
  CalendarClock,
  RotateCcw,
} from 'lucide-react';
import { useAthleteGI } from '@/lib/agi/adapters/useAthleteGI';
import {
  runAthleteGI,
  DEMO_BUNDLE,
  loadInsightFeedback,
  recordInsightFeedback,
  buildAthleteSummary,
  loadCommitment,
  commitPlan,
  markCommitmentDone,
  isRetestDue,
  type InsightVerdict,
  type AgiCommitment,
} from '@/lib/agi';
import { track, ANALYTICS_EVENTS } from '@/lib/analytics';
import { AgiReportCard } from './AgiReportCard';
import type {
  AthleteGIResult,
  Basis,
  CapabilityState,
  GeneralPlan,
  Insight,
  InsightKind,
} from '@/lib/agi';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

// ── small helpers ─────────────────────────────────────────────

const BASIS_LABEL: Record<Basis, string> = {
  measured: 'Measured',
  estimated: 'Estimated',
  ai_inferred: 'AI-inferred',
  user_entered: 'Self-reported',
  placeholder: 'Placeholder',
};

function scoreColor(score: number | null): string {
  if (score === null) return 'bg-muted';
  if (score < 50) return 'bg-error';
  if (score < 70) return 'bg-warning';
  return 'bg-success';
}

function scoreText(score: number | null): string {
  if (score === null) return 'text-muted-foreground';
  if (score < 50) return 'text-error';
  if (score < 70) return 'text-warning';
  return 'text-success';
}

const KIND_META: Record<InsightKind, { label: string; badge: Parameters<typeof Badge>[0]['variant'] }> = {
  readiness: { label: 'Today', badge: 'warning' },
  keystone: { label: 'Keystone', badge: 'critical' },
  goal: { label: 'Your goal', badge: 'info' },
  progress: { label: 'Progress', badge: 'success' },
  strength: { label: 'Strength', badge: 'success' },
  transfer: { label: 'Transfer', badge: 'info' },
  imbalance: { label: 'Transfer gap', badge: 'warning' },
  recurring: { label: 'Recurring', badge: 'high' },
  plateau: { label: 'Plateau', badge: 'warning' },
  consistency: { label: 'Consistency', badge: 'warning' },
  coverage: { label: 'Next data', badge: 'default' },
};

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

// ── sub-components ─────────────────────────────────────────────

function CapabilityBar({ cap }: { cap: CapabilityState }) {
  const observed = cap.score !== null;
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-foreground">{cap.name}</span>
        <span className={cn('text-sm font-semibold tabular-nums', scoreText(cap.score))}>
          {observed ? `${cap.score}` : '—'}
          <span className="text-[10px] text-muted-foreground font-normal">/100</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', scoreColor(cap.score))}
          style={{ width: observed ? `${cap.score}%` : '0%' }}
        />
      </div>
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        {observed ? (
          <>
            {cap.band && <span className="capitalize font-medium text-foreground/80">{cap.band}</span>}
            <span>·</span>
            <span>{BASIS_LABEL[cap.basis]}</span>
            <span>·</span>
            <span>{pct(cap.confidence)} conf.</span>
            {cap.breadth >= 2 && (
              <>
                <span>·</span>
                <span className="text-accent-secondary font-medium">spans {cap.breadth} sports</span>
              </>
            )}
            {cap.trajectory && cap.trajectory.direction !== 'flat' && cap.trajectory.deltaFromFirst !== null && (
              <span
                className={cn(
                  'flex items-center gap-0.5 font-medium',
                  cap.trajectory.direction === 'up' ? 'text-success' : 'text-error',
                )}
              >
                {cap.trajectory.direction === 'up' ? (
                  <TrendingUp className="w-2.5 h-2.5" aria-hidden="true" />
                ) : (
                  <TrendingDown className="w-2.5 h-2.5" aria-hidden="true" />
                )}
                {cap.trajectory.deltaFromFirst > 0 ? '+' : ''}
                {cap.trajectory.deltaFromFirst}
              </span>
            )}
          </>
        ) : (
          <span>Not observed yet</span>
        )}
      </div>
    </div>
  );
}

const TRUST_TONE: Record<string, string> = {
  A: 'text-success border-success/40 bg-success/10',
  B: 'text-success border-success/30 bg-success/5',
  C: 'text-warning border-warning/40 bg-warning/10',
  D: 'text-muted-foreground border-border bg-muted/40',
};

function TrustBadge({ trust }: { trust: AthleteGIResult['trust'] }) {
  return (
    <details className="ml-auto">
      <summary
        className={cn(
          'flex items-center gap-1 text-[11px] font-semibold rounded-full border px-2 py-0.5 cursor-pointer select-none',
          TRUST_TONE[trust.grade] ?? TRUST_TONE.D,
        )}
      >
        <ShieldCheck className="w-3 h-3" aria-hidden="true" />
        Trust {trust.grade}
      </summary>
      <div className="absolute right-4 mt-1 w-64 z-10 rounded-lg border border-border bg-card p-3 shadow-md text-left">
        <p className="text-xs font-medium text-foreground">{trust.headline}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">Meta-confidence {trust.score}/100</p>
        <ul className="mt-1.5 space-y-1">
          {trust.reasons.map((reason, i) => (
            <li key={i} className="text-[10px] text-muted-foreground flex items-start gap-1">
              <span aria-hidden="true">•</span>
              {reason}
            </li>
          ))}
        </ul>
        {trust.nextStep && (
          <Link
            href={trust.nextStep.href}
            onClick={() => track(ANALYTICS_EVENTS.AGI_NEXTSTEP_CLICKED, { grade: trust.grade })}
            className="mt-2 block rounded-md bg-primary/10 px-2 py-1.5 text-[10px] font-medium text-primary hover:bg-primary/15"
          >
            → {trust.nextStep.text}
          </Link>
        )}
      </div>
    </details>
  );
}

function InsightCard({
  insight,
  verdict,
  onFeedback,
}: {
  insight: Insight;
  verdict?: InsightVerdict;
  onFeedback?: (v: InsightVerdict) => void;
}) {
  const meta = KIND_META[insight.kind];
  return (
    <Card className={insight.kind === 'keystone' ? 'ring-1 ring-error/30' : undefined}>
      <CardBody className="space-y-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={meta.badge}>{meta.label}</Badge>
          <h3 className="text-sm font-semibold text-foreground">{insight.title}</h3>
          <span className="ml-auto text-[10px] text-muted-foreground tabular-nums">
            {BASIS_LABEL[insight.basis]} · {pct(insight.confidence)} conf.
          </span>
        </div>

        <p className="text-sm text-foreground leading-relaxed">{insight.summary}</p>

        <div className="flex items-start gap-2 rounded-lg bg-muted/40 px-3 py-2">
          <Target className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-xs text-foreground">
            <span className="font-medium">Do this:</span> {insight.action}
          </p>
        </div>

        {insight.reasoning.length > 0 && (
          <details
            className="group"
            onToggle={(e) => {
              if ((e.currentTarget as HTMLDetailsElement).open) {
                track(ANALYTICS_EVENTS.AGI_INSIGHT_EXPANDED, { kind: insight.kind, capability: insight.capability ?? 'none' });
              }
            }}
          >
            <summary className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer select-none hover:text-foreground">
              <ChevronRight className="w-3 h-3 transition-transform group-open:rotate-90" aria-hidden="true" />
              Show the reasoning ({insight.reasoning.length} steps)
            </summary>
            <ol className="mt-2 ms-2 space-y-2 border-s border-border ps-3">
              {insight.reasoning.map((step, i) => (
                <li key={i} className="text-xs">
                  <p className="text-foreground">{step.claim}</p>
                  {step.evidence.length > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Evidence: {step.evidence.join(' · ')}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </details>
        )}

        {onFeedback && (
          <div className="flex items-center gap-2 border-t border-border pt-2">
            <span className="text-[10px] text-muted-foreground">Useful?</span>
            <button
              type="button"
              aria-label="This is helpful"
              onClick={() => onFeedback('up')}
              className={cn('p-1 rounded hover:bg-muted', verdict === 'up' ? 'text-success' : 'text-muted-foreground')}
            >
              <ThumbsUp className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Not me — hide this"
              onClick={() => onFeedback('down')}
              className={cn('p-1 rounded hover:bg-muted', verdict === 'down' ? 'text-error' : 'text-muted-foreground')}
            >
              <ThumbsDown className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function PlanSection({ result, demo }: { result: AthleteGIResult; demo: boolean }) {
  const { plan } = result;
  if (!plan.keystone) return null;
  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-foreground">Your one-focus plan</h2>
          <span className="ml-auto text-[10px] text-muted-foreground tabular-nums">
            {BASIS_LABEL[plan.basis]} · {pct(plan.confidence)} conf.
          </span>
        </div>

        {plan.todayNote && (
          <p className="text-xs text-foreground rounded-lg bg-warning/10 border border-warning/30 px-3 py-2">
            {plan.todayNote}
          </p>
        )}

        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-1.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" aria-hidden="true" />
            <span className="text-sm font-semibold text-foreground">Keystone: {plan.keystone.name}</span>
          </div>
          <p className="text-xs text-muted-foreground">{plan.keystone.why}</p>
          {plan.keystone.drills.length > 0 && (
            <ul className="mt-1 space-y-1">
              {plan.keystone.drills.map((d, i) => (
                <li key={i} className="text-xs flex items-start gap-1.5">
                  <CheckCircle2
                    className={cn('w-3 h-3 shrink-0 mt-0.5', d.proven ? 'text-success' : 'text-muted-foreground')}
                    aria-hidden="true"
                  />
                  <span className={d.proven ? 'text-success font-medium' : 'text-foreground'}>{d.fix}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {plan.supporting.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Supporting</p>
            {plan.supporting.map((s) => (
              <div key={s.capability} className="text-xs text-foreground">
                <span className="font-medium">{s.name}</span> — {s.why}
              </div>
            ))}
          </div>
        )}

        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">A sample week</p>
          <div className="grid grid-cols-7 gap-1">
            {plan.week.map((d) => (
              <div key={d.day} className="rounded-md border border-border bg-card/50 p-1.5 text-center">
                <p className="text-[10px] font-semibold text-foreground">{d.day}</p>
                <p className="text-[9px] text-muted-foreground leading-tight mt-0.5 min-h-[2.4em]">{d.focus}</p>
                <p className="text-[9px] text-primary font-medium mt-0.5">{d.minutes ? `${d.minutes}m` : '—'}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground border-t border-border pt-2 flex items-start gap-1.5">
          <AlertTriangle className="w-3 h-3 text-warning shrink-0 mt-0.5" aria-hidden="true" />
          {plan.retestReminder}
        </p>

        <CommitmentPanel plan={plan} demo={demo} />
      </CardBody>
    </Card>
  );
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return iso.slice(0, 10);
  }
}

/** The agentic step: approve the plan → it persists + sets a retest reminder. */
function CommitmentPanel({ plan, demo }: { plan: GeneralPlan; demo: boolean }) {
  const [commitment, setCommitment] = useState<AgiCommitment | null>(loadCommitment);
  const [confirming, setConfirming] = useState(false);

  if (demo) {
    return (
      <p className="text-[11px] text-muted-foreground border-t border-border pt-2">
        Committing to a plan is available on your own data.
      </p>
    );
  }

  const active = commitment && commitment.status === 'active';
  const committedToThis = active && commitment!.capability === plan.keystone?.capability;

  function doCommit() {
    const c = commitPlan(plan);
    setCommitment(c);
    setConfirming(false);
    track(ANALYTICS_EVENTS.AGI_PLAN_COMMITTED, { capability: plan.keystone?.capability ?? 'none' });
  }
  function doDone() {
    markCommitmentDone();
    setCommitment(loadCommitment());
  }

  if (committedToThis) {
    return (
      <div className="rounded-lg border border-success/30 bg-success/10 p-3 text-xs space-y-2">
        <p className="flex items-start gap-1.5 text-foreground">
          <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            You committed to <span className="font-semibold">{commitment!.name}</span> on {fmtDate(commitment!.committedAt)}.
            Retest due <span className="font-medium">{fmtDate(commitment!.retestDueAt)}</span>.
          </span>
        </p>
        <button type="button" onClick={doDone} className="text-[11px] font-medium text-muted-foreground hover:text-foreground underline-offset-2 hover:underline">
          Mark done
        </button>
      </div>
    );
  }

  return (
    <div className="border-t border-border pt-2 space-y-1.5">
      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <CalendarClock className="w-3.5 h-3.5" aria-hidden="true" />
          Commit to this plan
        </button>
      ) : (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
          <p className="text-xs text-foreground">
            This sets <span className="font-semibold">{plan.keystone?.name}</span> as your focus and a retest
            reminder in 2 weeks. It saves only on this device. Confirm?
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={doCommit} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90">
              Yes, commit
            </button>
            <button type="button" onClick={() => setConfirming(false)} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted">
              Cancel
            </button>
          </div>
        </div>
      )}
      {active && !committedToThis && (
        <p className="text-[10px] text-muted-foreground">
          Currently committed to {commitment!.name} — committing here replaces it.
        </p>
      )}
    </div>
  );
}

function EmptyState({ onSeeDemo }: { onSeeDemo: () => void }) {
  return (
    <Card>
      <CardBody className="text-center py-10 space-y-3">
        <BrainCircuit className="w-10 h-10 text-muted-foreground mx-auto" aria-hidden="true" />
        <h2 className="text-base font-semibold text-foreground">Nothing to reason about — yet</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Athlete General Intelligence reasons across every motion you analyse. Run one Motion Lab
          analysis and it instantly builds your cross-sport model. Analyse a second sport and it
          starts finding what transfers between them.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center pt-1">
          <Link
            href="/motion-lab"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <FlaskConical className="w-4 h-4" aria-hidden="true" />
            Open Motion Lab
          </Link>
          <button
            type="button"
            onClick={onSeeDemo}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            See a sample athlete
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground">No data needed — preview the full analysis on an example athlete.</p>
      </CardBody>
    </Card>
  );
}

// ── main ──────────────────────────────────────────────────────

export function AthleteGIDashboard() {
  const live = useAthleteGI();
  const [demo, setDemo] = useState(false);
  const demoResult = useMemo(() => runAthleteGI(DEMO_BUNDLE), []);
  const result = demo ? demoResult : live;

  const { model, insights, transfers, trust, keystoneTranslations, provenDrills } = result;
  const hasData = model.dataMap.totalSessions > 0;
  const goal = model.identity?.primaryGoal;

  // Engine-usage analytics: fire once per populated view (live or demo).
  const keystoneCap = insights.find((i) => i.kind === 'keystone')?.capability;
  useEffect(() => {
    if (!hasData) return;
    track(ANALYTICS_EVENTS.AGI_VIEWED, { demo, coverage: Math.round(model.coverage * 100), trust: trust.grade });
    if (keystoneCap) track(ANALYTICS_EVENTS.AGI_KEYSTONE_SHOWN, { capability: keystoneCap, demo });
    track(ANALYTICS_EVENTS.AGI_NARRATED, { demo, source: 'local' });
  }, [hasData, demo, keystoneCap, model.coverage, trust.grade]);

  function seeDemo() {
    setDemo(true);
    track(ANALYTICS_EVENTS.AGI_DEMO_VIEWED, {});
  }

  // Insight feedback ("useful?"): hide down-voted insights; capture the signal.
  const [feedback, setFeedback] = useState<Record<string, InsightVerdict>>(loadInsightFeedback);
  function onInsightFeedback(id: string, kind: string, v: InsightVerdict) {
    recordInsightFeedback(id, v);
    setFeedback((f) => ({ ...f, [id]: v }));
    track(ANALYTICS_EVENTS.AGI_INSIGHT_FEEDBACK, { id, kind, verdict: v });
  }
  const shownInsights = demo ? insights : insights.filter((i) => feedback[i.id] !== 'down');

  // Plain-English narrative (the grounded summarizer handed off from the engine).
  const narrative = useMemo(() => (hasData ? buildAthleteSummary(result).narrative : ''), [hasData, result]);

  // Agentic loop: if a committed plan's retest date has passed, prompt it.
  const committedFocus = useState(loadCommitment)[0];
  const retestDue = !demo && isRetestDue(committedFocus, new Date().toISOString());
  useEffect(() => {
    if (retestDue && committedFocus) track(ANALYTICS_EVENTS.AGI_RETEST_DUE, { capability: committedFocus.capability });
  }, [retestDue, committedFocus]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <header className="space-y-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <BrainCircuit className="w-5 h-5 text-primary" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground leading-tight">Athlete General Intelligence</h1>
            <p className="text-xs text-muted-foreground">
              One reasoning engine across all your sports — finds the few things that move everything.
            </p>
          </div>
          {hasData && (
            <div className="ml-auto flex items-center gap-2 relative">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Gauge className="w-3.5 h-3.5" aria-hidden="true" />
                {pct(model.coverage)}
              </span>
              <TrustBadge trust={trust} />
            </div>
          )}
        </div>

        {/* Honest framing */}
        <p className="text-[11px] text-muted-foreground/90 leading-relaxed rounded-lg bg-muted/40 px-3 py-2">
          <span className="font-medium text-foreground">What &ldquo;general&rdquo; means here:</span>{' '}
          breadth and transfer across sports — one engine instead of many narrow ones. It is not a
          claim of human-level AI. Every number comes from your own analysed sessions (single-camera
          pose is an estimate, never a lab measurement), and nothing here is medical advice.{' '}
          <Link href="/athlete-general-intelligence" className="text-primary hover:underline">
            How it works →
          </Link>
        </p>

        {goal && (
          <p className="text-xs text-foreground flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden="true" />
            <span className="text-muted-foreground">Your stated goal:</span>
            <span className="font-medium">&ldquo;{goal}&rdquo;</span>
          </p>
        )}
      </header>

      {!hasData ? (
        <EmptyState onSeeDemo={seeDemo} />
      ) : (
        <>
          {retestDue && committedFocus && (
            <div className="flex items-center gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs">
              <RotateCcw className="w-4 h-4 text-warning shrink-0" aria-hidden="true" />
              <span className="text-foreground">
                <span className="font-semibold">Retest due</span> — you committed to {committedFocus.name} on{' '}
                {fmtDate(committedFocus.committedAt)}. Re-analyse to see if it moved.
              </span>
              <Link href="/motion-lab" className="ml-auto shrink-0 font-medium text-warning hover:underline">
                Re-analyse →
              </Link>
            </div>
          )}

          {demo && (
            <div className="flex items-center gap-2 rounded-lg border border-accent-secondary/30 bg-accent-secondary/10 px-3 py-2 text-xs">
              <Sparkles className="w-4 h-4 text-accent-secondary shrink-0" aria-hidden="true" />
              <span className="text-foreground">
                <span className="font-semibold">Sample athlete</span> — this is example data so you can see what the engine produces. Your own analysis appears here once you capture a session.
              </span>
              <button
                type="button"
                onClick={() => setDemo(false)}
                className="ml-auto shrink-0 font-medium text-accent-secondary hover:underline"
              >
                Exit sample
              </button>
            </div>
          )}

          {/* Your read — the plain-English narrative (grounded, deterministic) */}
          {narrative && (
            <Card className="bg-primary/5 border-primary/20">
              <CardBody className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" aria-hidden="true" />
                  <h2 className="text-sm font-semibold text-foreground">Your read</h2>
                </div>
                <p className="text-sm text-foreground leading-relaxed">{narrative}</p>
              </CardBody>
            </Card>
          )}

          {/* World model */}
          <Card>
            <CardBody className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-foreground">Your athletic profile</h2>
                <span className="ml-auto text-[10px] text-muted-foreground">
                  {model.dataMap.totalSessions} session{model.dataMap.totalSessions === 1 ? '' : 's'} ·{' '}
                  {model.sports.length} sport{model.sports.length === 1 ? '' : 's'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground -mt-2">
                Sport-neutral capabilities — the traits you carry between sports. The same number is
                built from every sport that exercises it.
              </p>
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
                {model.capabilities.map((cap) => (
                  <CapabilityBar key={cap.capability} cap={cap} />
                ))}
              </div>

              {/* Plain-language glossary (R7) */}
              <details className="border-t border-border pt-2">
                <summary className="text-xs text-muted-foreground cursor-pointer select-none hover:text-foreground">
                  What do these mean? (plain English)
                </summary>
                <dl className="mt-2 space-y-1.5">
                  {model.capabilities.map((cap) => (
                    <div key={cap.capability} className="text-xs">
                      <dt className="font-medium text-foreground inline">{cap.name}: </dt>
                      <dd className="text-muted-foreground inline">{cap.description}</dd>
                    </div>
                  ))}
                </dl>
              </details>
            </CardBody>
          </Card>

          {/* Insights */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary" aria-hidden="true" />
              What the engine concludes
            </h2>
            {shownInsights.map((insight) => (
              <InsightCard
                key={insight.id}
                insight={insight}
                verdict={feedback[insight.id]}
                onFeedback={demo ? undefined : (v) => onInsightFeedback(insight.id, insight.kind, v)}
              />
            ))}
          </section>

          {/* Plan */}
          <PlanSection result={result} demo={demo} />

          {/* Keystone, phrased in each of your sports */}
          {keystoneTranslations.length > 0 && (
            <Card>
              <CardBody className="space-y-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" aria-hidden="true" />
                  <h2 className="text-sm font-semibold text-foreground">Your keystone, in each sport</h2>
                </div>
                <ul className="space-y-1.5">
                  {keystoneTranslations.map((t) => (
                    <li key={t.sport} className="text-xs text-foreground">
                      <span className="font-medium">{t.sportLabel}:</span>{' '}
                      <span className="text-muted-foreground">{t.text}</span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          )}

          {/* What's worked for you */}
          {provenDrills.length > 0 && (
            <Card>
              <CardBody className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success" aria-hidden="true" />
                  <h2 className="text-sm font-semibold text-foreground">What&apos;s worked for you</h2>
                  <span className="ml-auto text-[10px] text-muted-foreground">your own drill feedback</span>
                </div>
                <ul className="space-y-1.5">
                  {provenDrills.slice(0, 6).map((d) => (
                    <li key={d.drillId} className="text-xs text-foreground flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-success shrink-0" aria-hidden="true" />
                      <span className="font-medium">{d.drillName}</span>
                      <span className="text-[10px] text-muted-foreground">
                        helped {d.helpedCount}×{d.capability ? ` · ${d.capability}` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="text-[10px] text-muted-foreground/80 border-t border-border pt-2">
                  These are the drills you marked as helping — the plan above leads with them.
                </p>
              </CardBody>
            </Card>
          )}

          {/* Transfers */}
          {transfers.length > 0 && (
            <Card>
              <CardBody className="space-y-3">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-accent-secondary" aria-hidden="true" />
                  <h2 className="text-sm font-semibold text-foreground">What transfers between your sports</h2>
                </div>
                <ul className="space-y-2.5">
                  {transfers.slice(0, 6).map((t, i) => (
                    <li key={i} className="text-xs border-s-2 border-accent-secondary/40 ps-3">
                      <p className="font-medium text-foreground">{t.principle}</p>
                      <p className="text-muted-foreground mt-0.5">{t.rationale}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        <span className="font-medium text-foreground">{t.fromSport}:</span> {t.fromExpression}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        <span className="font-medium text-foreground">{t.toSport}:</span> {t.toExpression}
                      </p>
                    </li>
                  ))}
                </ul>
                <p className="text-[10px] text-muted-foreground/80 border-t border-border pt-2">
                  {transfers[0]?.note}
                </p>
              </CardBody>
            </Card>
          )}

          {/* Share / export */}
          <AgiReportCard result={result} />

          {/* Footer disclaimer */}
          <p className="text-[10px] text-muted-foreground/70 leading-relaxed">{result.disclaimer}</p>
        </>
      )}
    </div>
  );
}
