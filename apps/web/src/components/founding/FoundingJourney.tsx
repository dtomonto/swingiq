'use client';

// ============================================================
// Founding Journey — the per-sport, layered "become a Founding Member" path.
// Each sport is its OWN journey: the athlete completes enough of THEIR sport's
// founding challenges (grouped by feature, each a milestone + sub-challenges) to
// lock in a free-for-life account. Progress is read from REAL store activity
// (never self-reported). We never reference or push another sport — the picker
// only chooses which single sport's journey to view. Public (works logged-out
// as a preview). Claiming the number is handled by useFoundingProgress.
// ============================================================

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle, ArrowRight, Trophy, Gift } from 'lucide-react';
import { useSwingVantageStore } from '@/store';
import { useFoundingProgress } from './useFoundingProgress';
import { buildSportJourney, type JourneyChallengeView } from '@/lib/founding-journey/sport-journey';
import { JOURNEY_SPORTS } from '@/lib/community/challenge-generator';
import { FOUNDING_REQUIRED_COUNT, FOUNDING_PERK, formatMemberNumber } from '@/lib/central-intelligence';
import type { SportId } from '@swingiq/core';
import type { ChallengeContext } from '@/lib/community/types';

export function FoundingJourney() {
  const { mounted, completion, memberNumber, campaign } = useFoundingProgress();
  const sessions = useSwingVantageStore((s) => s.sessions);
  const videoAnalyses = useSwingVantageStore((s) => s.video_analyses);

  const detectedSport = (completion.sport ?? null) as SportId | null;
  const [picked, setPicked] = useState<SportId | null>(null);
  const sport: SportId = picked ?? detectedSport ?? 'golf';

  const journey = useMemo(() => {
    const ctx: ChallengeContext = { sessions, videoAnalyses, lastExportAt: null, exportCount: 0, joinedAt: '' };
    return buildSportJourney(sport, ctx);
  }, [sport, sessions, videoAnalyses]);

  if (!mounted) {
    return <div className="mx-auto h-64 max-w-2xl animate-pulse rounded-theme bg-card" aria-hidden />;
  }

  const isMember = memberNumber != null;
  const sportLabel = JOURNEY_SPORTS.find((s) => s.id === sport)?.label ?? String(sport);
  const spotsLeft = campaign
    ? Math.max(0, (campaign.requiredCount ?? FOUNDING_REQUIRED_COUNT) - campaign.qualifiedCount)
    : null;

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
              The {sportLabel} Founding Journey
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Complete <strong className="text-foreground">{journey.required}</strong> of your {sportLabel} founding
              challenges to lock in a <strong className="text-foreground">free account for life</strong>.
              {spotsLeft != null && spotsLeft > 0 && campaign && (
                <> Just <strong className="text-foreground">{spotsLeft}</strong> of {campaign.requiredCount} spots left.</>
              )}
            </p>
          </>
        )}

        {campaign && (
          <p className="mt-3 font-mono text-xs text-muted-foreground">
            <span className="text-link">{campaign.qualifiedCount}</span> / {campaign.requiredCount} Founding Members
          </p>
        )}

        {!isMember && (
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-foreground">{journey.completed}/{journey.required} challenges done</span>
              <span className="text-muted-foreground">{journey.percent}% to your spot</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all ring-glow" style={{ width: `${journey.percent}%` }} />
            </div>
            {journey.eligible && (
              <p className="mt-3 rounded-lg bg-primary/10 px-3 py-2 text-sm font-semibold text-link">
                🎉 You&apos;ve completed your {sportLabel} journey — your Founding Member number is being locked in!
              </p>
            )}
          </div>
        )}
      </div>

      {/* Sport picker — choose which single sport's journey to follow. */}
      {!isMember && (
        <div>
          <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Your sport
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {JOURNEY_SPORTS.map((s) => (
              <button
                key={s.id}
                type="button"
                aria-pressed={s.id === sport}
                onClick={() => setPicked(s.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  s.id === sport
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted'
                }`}
              >
                {s.icon} {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Feature groups — each a milestone (parent) + its layered sub-challenges. */}
      <div className="space-y-4">
        {journey.groups.map((group) => (
          <div key={group.feature} className="rounded-theme border border-border bg-card p-4 shadow-theme">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="font-heading text-sm font-bold uppercase tracking-tight text-foreground">{group.label}</h3>
              <span className="shrink-0 font-mono text-xs text-muted-foreground">{group.completed}/{group.total}</span>
            </div>
            <ol className="space-y-2">
              {group.parent && <ChallengeRow item={group.parent} href={group.href} emphasized />}
              {group.children.map((child) => (
                <ChallengeRow key={child.challenge.id} item={child} href={group.href} />
              ))}
            </ol>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Every challenge is a real {sportLabel} feature, checked off from your own activity. Membership is free
        for the first {FOUNDING_REQUIRED_COUNT} who finish their sport&apos;s journey — and it stays free for life.
      </p>
    </div>
  );
}

function ChallengeRow({ item, href, emphasized }: { item: JourneyChallengeView; href: string; emphasized?: boolean }) {
  const { challenge, progress, done } = item;
  return (
    <li className={`flex items-start gap-3 rounded-lg border p-3 ${done ? 'border-primary/40 bg-primary/5' : 'border-border'} ${emphasized ? '' : 'ml-3'}`}>
      <span className="mt-0.5 shrink-0" aria-hidden="true">
        {done ? <CheckCircle2 size={18} className="text-primary" /> : <Circle size={18} className="text-muted-foreground" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold ${emphasized ? 'text-foreground' : 'text-foreground/90'}`}>
          {challenge.title.replace(/^[^:]+:\s*/, '')}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{challenge.description}</p>
        {!done && (
          <div className="mt-2 flex items-center gap-2">
            <Link
              href={href}
              className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Do it <ArrowRight size={13} aria-hidden="true" />
            </Link>
            {progress > 0 && <span className="font-mono text-xs text-muted-foreground">{progress}%</span>}
          </div>
        )}
      </div>
      <span className="ml-1 shrink-0 self-center text-xs font-medium text-muted-foreground">{done ? 'Done' : ''}</span>
    </li>
  );
}
