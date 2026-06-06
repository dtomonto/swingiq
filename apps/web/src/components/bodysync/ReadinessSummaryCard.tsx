'use client';

// ============================================================
// SwingVantage — BodySync readiness summary (compact)
// Surfaces today's readiness + recommended session on the Dashboard and the
// AI Coach. Renders nothing unless the user has enabled BodySync and there's
// an assessment — so it never nags non-users.
// ============================================================

import Link from 'next/link';
import { HeartPulse, ChevronRight, PlusCircle } from 'lucide-react';
import { useBodySync, ZONE_META } from '@/lib/bodysync';

const TONE: Record<string, string> = {
  success: 'border-success/40 bg-success/5',
  warning: 'border-warning/40 bg-warning/5',
  error: 'border-error/40 bg-error/5',
};
const DOT: Record<string, string> = {
  success: 'bg-success', warning: 'bg-warning', error: 'bg-error',
};

const SESSION_LABEL: Record<string, string> = {
  recovery: 'Recovery / rest', mobility: 'Mobility', light_technical: 'Light technical',
  technical: 'Technical', full_practice: 'Full practice', speed_power: 'Speed & power',
  performance: 'Performance day',
};

export function ReadinessSummaryCard({ compact = false }: { compact?: boolean }) {
  const { enabled, consented, assessment, recommendation } = useBodySync();

  // Not using BodySync yet → a gentle, dismissible-by-absence nudge only on the
  // full (dashboard) variant; the compact AI-coach variant stays silent.
  if (!enabled || !consented) {
    if (compact) return null;
    return (
      <Link
        href="/bodysync"
        className="flex items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-4 hover:bg-muted/40"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <HeartPulse size={18} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-foreground">Tune coaching to how you feel</span>
          <span className="block text-xs text-muted-foreground">Turn on BodySync — a 30-sec check-in adapts today’s plan.</span>
        </span>
        <PlusCircle size={18} className="shrink-0 text-primary" aria-hidden="true" />
      </Link>
    );
  }

  if (!assessment) {
    return (
      <Link href="/bodysync" className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:bg-muted/40">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <HeartPulse size={18} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-foreground">Do today’s check-in</span>
          <span className="block text-xs text-muted-foreground">See your readiness and today’s recommended session.</span>
        </span>
        <ChevronRight size={18} className="shrink-0 text-muted-foreground" aria-hidden="true" />
      </Link>
    );
  }

  const meta = ZONE_META[assessment.zone];
  return (
    <Link href="/bodysync" className={`block rounded-2xl border p-4 hover:opacity-95 ${TONE[meta.tone]}`}>
      <div className="flex items-center gap-3">
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-card">
          <span className="text-base font-bold text-foreground">{assessment.readiness.score}</span>
          <span className={`absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full ring-2 ring-card ${DOT[meta.tone]}`} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span aria-hidden="true">{meta.emoji}</span>
            <span className="text-sm font-bold text-foreground">{meta.label}</span>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">· readiness</span>
          </div>
          {recommendation && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              Today: <span className="font-medium text-foreground">{SESSION_LABEL[recommendation.sessionType]}</span>
              {' · '}~{recommendation.durationMinutes} min · cap {recommendation.intensityCap}%
            </p>
          )}
        </div>
        <ChevronRight size={18} className="shrink-0 text-muted-foreground" aria-hidden="true" />
      </div>
      {!compact && assessment.injuryRisk.level !== 'none' && (
        <p className="mt-2 text-[11px] text-warning">
          ⚠ {assessment.injuryRisk.reasons[0]} — SwingVantage has eased today’s plan.
        </p>
      )}
    </Link>
  );
}
