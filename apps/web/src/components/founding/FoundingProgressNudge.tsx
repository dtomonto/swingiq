'use client';

// ============================================================
// FoundingProgressNudge — compact, dashboard-level founding progress
// ------------------------------------------------------------
// The global counter banner shows the CAMPAIGN count ("Join the Founding
// 1,000"); this shows the signed-in user's OWN progress toward qualifying —
// profile completion + valid sessions — with one proximity-aware next step,
// right on the dashboard where they land every visit. It closes the
// qualify loop that the full card on /profile otherwise only shows if you
// go looking for it.
//
// Self-limiting: renders only for an authed, not-yet-qualified user while the
// campaign has room, and disappears the moment they qualify. Reuses
// useFoundingProgress + the shared config — no new state or logic.
// ============================================================

import Link from 'next/link';
import { Trophy, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useFoundingProgress } from './useFoundingProgress';
import { FOUNDING_REQUIRED_SESSIONS } from '@/lib/central-intelligence';
import { track, ANALYTICS_EVENTS } from '@/lib/analytics';

export function FoundingProgressNudge() {
  const { mounted, authed, completion, user, memberNumber, campaign } = useFoundingProgress();

  // Only nudge a signed-in user who can still qualify.
  if (!mounted || !authed) return null;
  if (memberNumber != null) return null; // already a Founding Member
  if (campaign?.full) return null; // all 1,000 spots claimed

  const sessions = Math.min(user.validSessionCount, FOUNDING_REQUIRED_SESSIONS);
  const sessionsLeft = Math.max(0, FOUNDING_REQUIRED_SESSIONS - user.validSessionCount);
  const profilePct = completion.completionPercent;
  const profileDone = completion.completed;
  const sessionsPct = Math.min(100, (user.validSessionCount / FOUNDING_REQUIRED_SESSIONS) * 100);

  // One proximity-aware headline + the single most useful next action.
  let headline = 'Join the Founding 1,000';
  let next: { href: string; label: string; cta: string };
  if (!profileDone) {
    next = { href: '/profile', label: 'Complete your profile', cta: 'founding_nudge_profile' };
  } else if (sessionsLeft > 0) {
    next = { href: '/sessions', label: 'Record a session', cta: 'founding_nudge_session' };
    if (sessionsLeft <= 3) {
      headline = `Almost a Founding Member — ${sessionsLeft} session${sessionsLeft === 1 ? '' : 's'} to go`;
    }
  } else {
    // Profile complete + sessions met: qualification is being claimed automatically.
    headline = 'You qualify — locking in your Founding spot…';
    next = { href: '/profile', label: 'See your status', cta: 'founding_nudge_status' };
  }

  return (
    <section
      aria-label="Founding Member progress"
      className="mb-4 rounded-xl border border-primary/30 bg-primary/5 p-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-bold text-foreground">
            <Trophy className="h-4 w-4 text-primary" aria-hidden="true" />
            {headline}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2">
            {/* Profile mini-bar */}
            <div className="min-w-[140px] flex-1">
              <div className="mb-0.5 flex items-center justify-between text-[11px]">
                <span className="font-medium text-foreground">Profile {profilePct}%</span>
                {profileDone && (
                  <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                )}
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${profilePct}%` }} />
              </div>
            </div>
            {/* Sessions mini-bar */}
            <div className="min-w-[140px] flex-1">
              <div className="mb-0.5 flex items-center justify-between text-[11px]">
                <span className="font-medium text-foreground">
                  Sessions {sessions}/{FOUNDING_REQUIRED_SESSIONS}
                </span>
                {sessionsLeft === 0 && (
                  <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                )}
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${sessionsPct}%` }} />
              </div>
            </div>
          </div>
        </div>
        <Link
          href={next.href}
          onClick={() => track(ANALYTICS_EVENTS.FOUNDING_CTA_CLICKED, { cta: next.cta, surface: 'dashboard_nudge' })}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {next.label}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
