'use client';

// ============================================================
// SwingIQ — Fix Stack Card
// ------------------------------------------------------------
// The branded "One Fix First" view: a single highest-leverage
// fix expressed as Feel Cue → Drill → Retest, with honest
// confidence, the one mistake to avoid, a feedback loop, and
// optional alternative drills. Built entirely from the
// DrillMatch / Fix Stack engine — no copy is invented here.
// ============================================================

import { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Hand,
  Dumbbell,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
  Clock,
  Gauge,
  Wrench,
  ChevronDown,
  Info,
} from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { ConfidenceBadge } from '@/components/agents/ConfidenceBadge';
import { cn } from '@/lib/utils';
import { track } from '@/lib/analytics';
import type { FixStack, RankedDrill } from '@/lib/drillmatch';
import { DrillFeedbackControl } from './DrillFeedbackControl';

function StepLabel({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">
        {n}
      </span>
      <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{title}</span>
    </div>
  );
}

function MetaChip({ icon: Icon, children }: { icon: typeof Clock; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Icon size={12} />
      {children}
    </span>
  );
}

function AlternativeDrill({ alt }: { alt: RankedDrill }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">{alt.drill.name}</p>
        <span className="text-xs text-muted-foreground shrink-0">{alt.score}% match</span>
      </div>
      {alt.reasons.filter((r) => r.weight > 0).length > 0 && (
        <p className="text-xs text-muted-foreground mt-1">
          {alt.reasons.filter((r) => r.weight > 0).slice(0, 2).map((r) => r.label).join(' · ')}
        </p>
      )}
      <a
        href={alt.drill.youtubeSearchUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
      >
        <ExternalLink size={11} /> Watch how
      </a>
    </div>
  );
}

export function FixStackCard({
  fixStack,
  onFeedback,
  className,
}: {
  fixStack: FixStack;
  /** Fired after the user records a drill verdict, so the parent can re-rank. */
  onFeedback?: () => void;
  className?: string;
}) {
  const [showSteps, setShowSteps] = useState(true);
  const [showAlts, setShowAlts] = useState(false);
  const { drill, retest, feelCue } = fixStack;

  return (
    <Card className={cn('border-primary/30', className)}>
      <CardBody className="space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wide">
              <Sparkles size={13} /> Your One Fix
            </div>
            <h2 className="text-lg font-bold text-foreground mt-1">{fixStack.faultName}</h2>
          </div>
          <ConfidenceBadge confidence={fixStack.confidence} />
        </div>

        {/* Step 1 — Feel Cue */}
        <div className="rounded-lg bg-muted/60 border border-border p-4">
          <StepLabel n={1} title={feelCue.title} />
          <div className="flex gap-2 mt-2">
            <Hand size={16} className="text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-foreground leading-relaxed">{feelCue.body}</p>
          </div>
        </div>

        {/* Step 2 — Drill */}
        <div className="rounded-lg bg-muted/60 border border-border p-4">
          <StepLabel n={2} title="Drill" />
          <div className="flex gap-2 mt-2">
            <Dumbbell size={16} className="text-primary shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{drill.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{drill.goal}</p>
              <p className="text-xs text-primary mt-1">Why this drill: {drill.why}</p>

              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                <MetaChip icon={Clock}>~{drill.estimatedMinutes} min · {drill.repsOrDuration}</MetaChip>
                <MetaChip icon={Gauge}>{drill.difficulty}</MetaChip>
                {drill.equipment.length > 0 && (
                  <MetaChip icon={Wrench}>{drill.equipment.join(', ')}</MetaChip>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowSteps((s) => !s)}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary mt-2 hover:underline"
                aria-expanded={showSteps}
              >
                <ChevronDown size={13} className={cn('transition-transform', showSteps && 'rotate-180')} />
                {showSteps ? 'Hide steps' : 'Show steps'}
              </button>

              {showSteps && (
                <ol className="list-decimal list-inside space-y-1 mt-2 text-sm text-foreground/90">
                  {drill.steps.map((s, i) => (
                    <li key={i} className="leading-relaxed">{s}</li>
                  ))}
                </ol>
              )}

              {drill.safetyNote && (
                <p className="flex items-start gap-1.5 text-xs text-warning bg-warning/10 px-2 py-1.5 rounded mt-2">
                  <AlertTriangle size={12} className="shrink-0 mt-0.5" /> {drill.safetyNote}
                </p>
              )}

              <a
                href={drill.youtubeSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track('drill_started', { drill_id: drill.id, fault_id: fixStack.faultId, sport: fixStack.sport })}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:opacity-90 w-fit mt-3"
              >
                <ExternalLink size={11} /> Watch a demo · coaches like {drill.coachingHint}
              </a>
            </div>
          </div>
        </div>

        {/* Mistake to avoid */}
        <div className="flex items-start gap-2 text-sm">
          <AlertTriangle size={15} className="text-warning shrink-0 mt-0.5" />
          <p className="text-foreground/90"><span className="font-semibold">Avoid:</span> {fixStack.mistakeToAvoid}</p>
        </div>

        {/* Step 3 — Retest */}
        <div className="rounded-lg bg-muted/60 border border-border p-4">
          <StepLabel n={3} title="Retest" />
          <div className="flex gap-2 mt-2">
            <RefreshCw size={16} className="text-primary shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground">{retest.whatToReassess}</p>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="font-semibold text-foreground/80">You&apos;ll know it worked when:</span> {retest.improvedWhen}
              </p>
              <details className="mt-2">
                <summary className="text-xs font-medium text-primary cursor-pointer">Keep it a fair test →</summary>
                <ul className="list-disc list-inside text-xs text-muted-foreground mt-1 space-y-0.5">
                  {retest.sameConditions.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </details>
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                <span className="text-xs font-semibold text-foreground">Retest {retest.dueLabel}</span>
                <Link href="/retest" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  Go to Retest →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback loop */}
        <div className="border-t border-border pt-4">
          <DrillFeedbackControl
            drillId={drill.id}
            faultId={fixStack.faultId}
            sport={fixStack.sport}
            onRecorded={() => onFeedback?.()}
          />
        </div>

        {/* Alternatives */}
        {fixStack.alternatives.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setShowAlts((s) => !s)}
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
              aria-expanded={showAlts}
            >
              <ChevronDown size={13} className={cn('transition-transform', showAlts && 'rotate-180')} />
              {showAlts ? 'Hide other drills' : `Show ${fixStack.alternatives.length} other drills that fit`}
            </button>
            {showAlts && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                {fixStack.alternatives.map((alt) => (
                  <AlternativeDrill key={alt.drill.id} alt={alt} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Honest basis note */}
        <p className="flex items-start gap-1.5 text-xs text-muted-foreground border-t border-border pt-3">
          <Info size={12} className="shrink-0 mt-0.5" /> {fixStack.basisNote}
        </p>
      </CardBody>
    </Card>
  );
}
