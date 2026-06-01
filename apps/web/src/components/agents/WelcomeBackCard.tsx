'use client';

import Link from 'next/link';
import { ChevronRight, X, Clock, Target, Dumbbell, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfidenceBadge } from './ConfidenceBadge';
import type { ResumeState } from '@/lib/agents';

// ============================================================
// Welcome Back / "Pick Up Where You Left Off"
// ------------------------------------------------------------
// The premium continuity feature for returning users. Presents
// a structured summary of where they left off and a clear,
// low-friction path to continue. Deterministic, fast, dismissible.
// ============================================================

function StatChip({ icon: Icon, label }: { icon: typeof Clock; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-green-100/90 bg-white/10 rounded-full px-2.5 py-1">
      <Icon size={12} aria-hidden="true" />
      {label}
    </span>
  );
}

export function WelcomeBackCard({
  resume,
  onDismiss,
}: {
  resume: ResumeState;
  onDismiss?: () => void;
}) {
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
      className="relative overflow-hidden rounded-2xl bg-linear-to-br from-green-700 via-green-800 to-golf-dark text-white p-6 shadow-md"
      role="region"
      aria-label="Welcome back"
    >
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss welcome back"
          className="absolute top-3 right-3 text-white/50 hover:text-white p-1.5 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-white/40"
        >
          <X size={18} />
        </button>
      )}

      <div className="max-w-3xl">
        <p className="text-green-300 text-xs font-semibold uppercase tracking-wide mb-1">
          Pick up where you left off
        </p>
        <h2 className="text-2xl font-bold mb-2">{resume.headline}</h2>
        <p className="text-green-50/90 text-sm leading-relaxed mb-4">{resume.summary}</p>

        {/* Context chips */}
        <div className="flex flex-wrap gap-2 mb-5">
          {resume.lastSessionDate && (
            <StatChip icon={Clock} label={`Last: ${resume.lastSessionDate}`} />
          )}
          {resume.lastFocus && <StatChip icon={Target} label={resume.lastFocus} />}
          {planLabel && <StatChip icon={Dumbbell} label={planLabel} />}
          {trendLabel && <StatChip icon={TrendingUp} label={trendLabel} />}
        </div>

        {/* Primary action */}
        <div className="flex flex-wrap items-center gap-3">
          <Link href={resume.nextBestAction.href}>
            <Button className="bg-white text-green-800 hover:bg-green-50 font-semibold">
              {resume.nextBestAction.label}
              <ChevronRight size={16} />
            </Button>
          </Link>

          {/* Secondary options */}
          {resume.options.slice(0, 3).map((opt) => (
            <Link key={opt.id} href={opt.href}>
              <button className="text-sm font-medium text-green-50 hover:text-white underline-offset-4 hover:underline px-1 py-1">
                {opt.label}
              </button>
            </Link>
          ))}
        </div>

        {/* Helper + confidence */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {resume.nextBestAction.helperText && (
            <p className="text-green-100/70 text-xs">{resume.nextBestAction.helperText}</p>
          )}
          <ConfidenceBadge confidence={resume.confidence} showReason={false} className="opacity-90" />
        </div>
      </div>
    </section>
  );
}
