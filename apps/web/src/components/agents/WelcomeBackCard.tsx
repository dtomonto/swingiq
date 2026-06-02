'use client';

import Link from 'next/link';
import { ChevronRight, X, Clock, Target, Dumbbell, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfidenceBadge } from './ConfidenceBadge';
import type { ResumeState } from '@/lib/agents';
import { buildTodaysFix, FIX_FRAMING } from '@/lib/coaching/fixFraming';

// ============================================================
// Today's Fix / Welcome Back — returning-user centerpiece
// ------------------------------------------------------------
// Reframes the deterministic resume workflow as a personal
// "Today's Fix": one priority, what to do today, how you'll know
// it worked, and when to retest — with a clear Continue / Retest /
// Rebuild path. Fast, deterministic, dismissible. The reframing
// lives in `lib/coaching/fixFraming.ts`; this component only
// renders it (props are unchanged so dashboard wiring is intact).
// ============================================================

function StatChip({ icon: Icon, label }: { icon: typeof Clock; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-primary-foreground/90 bg-card/10 rounded-full px-2.5 py-1">
      <Icon size={12} aria-hidden="true" />
      {label}
    </span>
  );
}

/** One scannable row of the "One Fix Today" pattern. */
function FixRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
      <dt className="text-xs font-semibold uppercase tracking-wide text-primary-foreground/70 sm:w-40 sm:shrink-0">
        {label}
      </dt>
      <dd className="text-sm text-primary-foreground/95 leading-snug">{value}</dd>
    </div>
  );
}

export function WelcomeBackCard({
  resume,
  onDismiss,
}: {
  resume: ResumeState;
  onDismiss?: () => void;
}) {
  const fix = buildTodaysFix(resume);

  const planLabel =
    resume.practicePlanStatus === 'in_progress'
      ? 'Plan in progress'
      : resume.practicePlanStatus === 'completed'
        ? 'Plan completed'
        : null;

  const trendLabel =
    resume.progressTrend === 'improving'
      ? 'Trending up'
      : resume.progressTrend === 'declining'
        ? 'Slight dip'
        : resume.progressTrend === 'stable'
          ? 'Holding steady'
          : null;

  return (
    <section
      className="relative overflow-hidden rounded-2xl bg-linear-to-br from-primary to-primary/75 text-primary-foreground p-6 shadow-md"
      aria-label="Today's fix"
    >
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss today's fix"
          className="absolute top-3 right-3 text-white/50 hover:text-white p-1.5 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-white/40"
        >
          <X size={18} />
        </button>
      )}

      <div className="max-w-3xl">
        <p className="text-primary-foreground/80 text-xs font-semibold uppercase tracking-wide mb-1">
          {fix.eyebrow}
        </p>
        <h2 className="text-2xl font-bold mb-2">{resume.headline}</h2>
        <p className="text-primary-foreground/90 text-sm leading-relaxed mb-4">{resume.summary}</p>

        {fix.comeback && (
          <p className="text-sm font-medium text-white bg-card/10 rounded-lg px-3 py-2 mb-4">
            {fix.comeback}
          </p>
        )}

        {/* Context chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {resume.lastSessionDate && (
            <StatChip icon={Clock} label={`Last: ${resume.lastSessionDate}`} />
          )}
          {fix.priority && <StatChip icon={Target} label={fix.priority} />}
          {planLabel && <StatChip icon={Dumbbell} label={planLabel} />}
          {trendLabel && <StatChip icon={TrendingUp} label={trendLabel} />}
        </div>

        {/* The "One Fix Today" block */}
        <dl className="space-y-2 rounded-xl bg-black/10 p-4 mb-5">
          {fix.priority && <FixRow label={FIX_FRAMING.focusLabel} value={fix.priority} />}
          <FixRow label={FIX_FRAMING.whatToDoLabel} value={fix.whatToDoToday} />
          <FixRow label={FIX_FRAMING.howToKnowLabel} value={fix.howToKnowItWorked} />
          <FixRow label={FIX_FRAMING.whenToRetestLabel} value={fix.whenToRetest} />
        </dl>

        {/* Continue / Retest / Rebuild */}
        <div className="flex flex-wrap items-center gap-3">
          <Link href={fix.primary.href}>
            <Button className="bg-card text-primary hover:bg-primary/10 font-semibold">
              {fix.primary.label}
              <ChevronRight size={16} />
            </Button>
          </Link>

          {fix.retest && (
            <Link href={fix.retest.href}>
              <button className="text-sm font-medium text-primary-foreground hover:text-white underline-offset-4 hover:underline px-1 py-1">
                {fix.retest.label}
              </button>
            </Link>
          )}
          {fix.rebuild && (
            <Link href={fix.rebuild.href}>
              <button className="text-sm font-medium text-primary-foreground hover:text-white underline-offset-4 hover:underline px-1 py-1">
                {fix.rebuild.label}
              </button>
            </Link>
          )}
        </div>

        {/* Confidence */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <ConfidenceBadge confidence={resume.confidence} showReason={false} className="opacity-90" />
        </div>
      </div>
    </section>
  );
}
