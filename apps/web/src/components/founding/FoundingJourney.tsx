'use client';

// ============================================================
// Founding Journey — the guided "become a Founding Member" checklist.
// A navigational tour of the whole product: every step routes to a real
// feature and is checked off from REAL store data (never self-reported). The
// REQUIRED steps are the server-verifiable founding gate; finishing them
// auto-claims a Founding Member number (handled by useFoundingProgress) and
// locks in a free-for-life account. Public page (works logged-out as a preview).
// ============================================================

import Link from 'next/link';
import { CheckCircle2, Circle, ArrowRight, Trophy, Lock, Gift } from 'lucide-react';
import { useSwingVantageStore, useLatestDiagnosedSession } from '@/store';
import { useFoundingProgress } from './useFoundingProgress';
import { computeJourney, type JourneySignals } from '@/lib/founding-journey/journey';
import {
  FOUNDING_REQUIRED_COUNT,
  FOUNDING_PERK,
  formatMemberNumber,
} from '@/lib/central-intelligence';
import { read as readBodySync } from '@/lib/bodysync/store';

export function FoundingJourney() {
  const { mounted, authed, completion, user, memberNumber, campaign } = useFoundingProgress();
  const sessions = useSwingVantageStore((s) => s.sessions);
  const clubs = useSwingVantageStore((s) => s.clubs);
  const sportEquipment = useSwingVantageStore((s) => s.sportEquipment);
  const latestDiagnosed = useLatestDiagnosedSession();

  if (!mounted) {
    return <div className="mx-auto h-64 max-w-2xl animate-pulse rounded-theme bg-card" aria-hidden />;
  }

  const distinctSports = new Set((sessions ?? []).map((s) => s.sport)).size;
  const hasEquipment =
    (clubs?.length ?? 0) > 0 ||
    Object.values(sportEquipment ?? {}).some((arr) => Array.isArray(arr) && arr.length > 0);
  let hasReadiness = false;
  try {
    hasReadiness = readBodySync().checkins.length > 0;
  } catch {
    hasReadiness = false;
  }

  const signals: JourneySignals = {
    authed,
    profileComplete: completion.completed,
    profilePercent: completion.completionPercent,
    validSessionCount: user.validSessionCount,
    distinctSports,
    hasDiagnosis: latestDiagnosed != null,
    hasEquipment,
    hasReadiness,
  };
  const journey = computeJourney(signals);
  const isMember = memberNumber != null;
  const spotsLeft = campaign ? Math.max(0, (campaign.requiredCount ?? FOUNDING_REQUIRED_COUNT) - campaign.qualifiedCount) : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Reward / status header */}
      <div className="rounded-theme border border-primary/30 bg-primary/5 p-6 text-center shadow-theme">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-link">
          <Gift size={14} aria-hidden="true" /> Free for life · first {FOUNDING_REQUIRED_COUNT}
        </span>
        {isMember ? (
          <>
            <h2 className="mt-4 flex items-center justify-center gap-2 font-heading text-2xl font-bold uppercase tracking-tight text-foreground">
              <Trophy className="text-primary" aria-hidden="true" /> Founding Member {formatMemberNumber(memberNumber!)}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{FOUNDING_PERK} Thank you for being one of the first.</p>
          </>
        ) : (
          <>
            <h2 className="mt-4 font-heading text-2xl font-bold uppercase tracking-tight text-foreground sm:text-3xl">
              The Founding Journey
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Complete the journey to lock in a <strong className="text-foreground">free account for life</strong> — one of the first {FOUNDING_REQUIRED_COUNT}.
              {spotsLeft != null && spotsLeft > 0 && campaign && (
                <> Just <strong className="text-foreground">{spotsLeft}</strong> of {campaign.requiredCount} spots left.</>
              )}
            </p>
          </>
        )}

        {/* Counter */}
        {campaign && (
          <p className="mt-3 font-mono text-xs text-muted-foreground">
            <span className="text-link">{campaign.qualifiedCount}</span> / {campaign.requiredCount} Founding Members
          </p>
        )}

        {/* Progress bar (hidden once a member) */}
        {!isMember && (
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-foreground">{journey.requiredCompleted}/{journey.requiredTotal} required steps</span>
              <span className="text-muted-foreground">{journey.percent}% explored</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all ring-glow" style={{ width: `${journey.percent}%` }} />
            </div>
            {journey.ready && (
              <p className="mt-3 rounded-lg bg-primary/10 px-3 py-2 text-sm font-semibold text-link">
                🎉 You&apos;ve met every requirement — your Founding Member number is being locked in!
              </p>
            )}
          </div>
        )}
      </div>

      {/* Checklist */}
      <ol className="space-y-2">
        {journey.steps.map((s) => (
          <li
            key={s.def.id}
            className={`flex items-start gap-3 rounded-theme border p-4 shadow-theme ${
              s.done ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'
            }`}
          >
            <span className="mt-0.5 shrink-0" aria-hidden="true">
              {s.done ? <CheckCircle2 className="text-primary" /> : <Circle className="text-muted-foreground" />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className={`font-heading font-semibold uppercase tracking-tight ${s.done ? 'text-foreground' : 'text-foreground'}`}>
                  {s.def.title}
                </h3>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  s.def.required ? 'bg-primary/15 text-link' : 'bg-secondary text-muted-foreground'
                }`}>
                  {s.def.required ? 'Required' : 'Recommended'}
                </span>
                {s.progressLabel && (
                  <span className="font-mono text-xs text-muted-foreground">{s.progressLabel}</span>
                )}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{s.def.blurb}</p>
              {!s.done && (
                <Link
                  href={s.def.cta.href}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  {s.def.cta.label}
                  <ArrowRight size={15} aria-hidden="true" />
                </Link>
              )}
            </div>
            <span className="ml-1 shrink-0 self-center text-xs font-medium text-muted-foreground">
              {s.done ? 'Done' : <Lock size={13} className="text-muted-foreground" aria-hidden="true" />}
            </span>
          </li>
        ))}
      </ol>

      <p className="text-center text-xs text-muted-foreground">
        Themes change the look only — your coaching, drills, and data never change. Membership is free for
        the first {FOUNDING_REQUIRED_COUNT} who finish the journey, and it stays free for life.
      </p>
    </div>
  );
}
