'use client';

// ============================================================
// FoundingProfileCard — profile/session progress + achievement
// ------------------------------------------------------------
// The user-facing companion to the global banner: shows profile
// completion, the next-best field to add, valid-session progress
// toward Founding status, what counts as a valid session, the earned
// Founding Member badge + session-milestone achievements, and a short
// trust note. Theme-token styled for the app surface (light/dark safe).
// ============================================================

import Link from 'next/link';
import { useState } from 'react';
import { CheckCircle2, ChevronDown, Trophy } from 'lucide-react';
import { useFoundingProgress } from './useFoundingProgress';
import { useCentralIntelligenceData } from '@/lib/central-intelligence/store';
import {
  FOUNDING_REQUIRED_SESSIONS,
  buildFoundingMemberBadge,
  earnedSessionMilestones,
  SESSION_MILESTONES,
} from '@/lib/central-intelligence';
import { DataTrustNote } from './DataTrustNote';

export function FoundingProfileCard() {
  const { mounted, completion, user, memberNumber, bannerState } = useFoundingProgress();
  const ci = useCentralIntelligenceData();
  const [showValid, setShowValid] = useState(false);

  if (!mounted) {
    return <div className="h-28 animate-pulse rounded-xl border border-border bg-card" aria-hidden="true" />;
  }

  const qualified = memberNumber != null || bannerState === 'qualified';
  const badge = buildFoundingMemberBadge(memberNumber);
  const earnedMilestones = new Set(earnedSessionMilestones(user.validSessionCount).map((m) => m.id));

  return (
    <section className="mb-6 rounded-xl border border-border bg-card p-4 shadow-sm" aria-label="Founding Member progress">
      {qualified ? (
        <div className="flex items-start gap-3">
          <span className="text-3xl" aria-hidden="true">{badge.achievement.icon}</span>
          <div>
            <h2 className="text-lg font-bold text-foreground">{badge.headline}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{badge.achievement.description}</p>
            {ci.foundingClaim?.qualifiedAt && (
              <p className="mt-1 text-xs text-muted-foreground">
                Qualified {new Date(ci.foundingClaim.qualifiedAt).toLocaleDateString()}.
              </p>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Trophy className="h-4 w-4 text-primary" aria-hidden="true" />
              Founding Member progress
            </h2>
            <span className="text-xs text-muted-foreground">Profile + {FOUNDING_REQUIRED_SESSIONS} sessions</span>
          </div>

          {/* Profile completion */}
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-foreground">Profile {completion.completionPercent}% complete</span>
              {completion.completed && <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" /> Complete</span>}
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${completion.completionPercent}%` }} />
            </div>
            {!completion.completed && completion.nextPrompt && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                Next: <span className="font-medium text-foreground">{completion.nextPrompt.label}</span> — {completion.nextPrompt.why}
              </p>
            )}
          </div>

          {/* Sessions */}
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-foreground">Sessions {user.validSessionCount}/{FOUNDING_REQUIRED_SESSIONS}</span>
              <button
                type="button"
                onClick={() => setShowValid((v) => !v)}
                className="inline-flex items-center gap-0.5 text-muted-foreground underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                aria-expanded={showValid}
              >
                What counts? <ChevronDown className={`h-3 w-3 transition ${showValid ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, (user.validSessionCount / FOUNDING_REQUIRED_SESSIONS) * 100)}%` }} />
            </div>
            {showValid && (
              <p className="mt-1.5 rounded-lg bg-muted/60 p-2 text-xs text-muted-foreground">
                A valid session is any completed swing diagnosis, video analysis, launch-monitor / simulator import,
                or manual session with real data. Empty, abandoned, failed, or deleted sessions don&apos;t count.
              </p>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {!completion.completed && (
              <Link href="/profile" className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                Complete profile
              </Link>
            )}
            {completion.completed && user.validSessionCount < FOUNDING_REQUIRED_SESSIONS && (
              <Link href="/sessions" className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                Record a session
              </Link>
            )}
          </div>
        </>
      )}

      {/* Milestone achievements */}
      <div className="mt-4 border-t border-border pt-3">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Milestones</p>
        <ul className="flex flex-wrap gap-2">
          {SESSION_MILESTONES.map((m) => {
            const earned = earnedMilestones.has(m.id);
            return (
              <li
                key={m.id}
                title={`${m.name} — ${m.description}`}
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-2xs ${
                  earned ? 'border-primary/40 bg-primary/10 text-foreground' : 'border-border bg-muted/40 text-muted-foreground opacity-60'
                }`}
              >
                <span aria-hidden="true">{m.icon}</span>
                {m.name}
                {earned && <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-3">
        <DataTrustNote compact />
      </div>
    </section>
  );
}
