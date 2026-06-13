'use client';

// ============================================================
// TierInvite — calm, zero-pressure early-access invitation.
// ------------------------------------------------------------
// Renders ONLY when (a) the admin master switch is on, (b) this slot is enabled
// in /admin/operating-mode, (c) the target tier is still on the waitlist, and
// (d) the visitor hasn't already joined or dismissed it. Placement is fully
// admin-controlled and dynamic (no redeploy).
//
// No-pressure by design: no urgency, scarcity, countdowns, or "upgrade" framing.
// It only ever offers to register interest in something not yet available, is
// dismissible, and remembers the dismissal so it never nags.
// ============================================================

import { useEffect, useState } from 'react';
import { Sparkles, Check, Loader2, X } from 'lucide-react';

type WaitlistTier = 'AI_SWING_REPORT' | 'PREMIUM_RETEST_PLAN';
type SlotId = 'post-diagnosis' | 'dashboard' | 'pricing' | 'todays-tasks';

interface PlacementsSnapshot {
  invitationsEnabled: boolean;
  slots: Record<string, { enabled: boolean; tier: WaitlistTier; headline: string | null }>;
  availability: Record<string, 'waitlist' | 'active'>;
  joined: Record<string, boolean> | null;
  signedIn: boolean;
}

const DEFAULT_HEADLINE: Record<WaitlistTier, string> = {
  AI_SWING_REPORT: 'A deeper AI Swing Report is on the way',
  PREMIUM_RETEST_PLAN: 'A premium video-backed retest plan is on the way',
};

const TIER_BLURB: Record<WaitlistTier, string> = {
  AI_SWING_REPORT:
    'A more personalized, AI-enhanced breakdown with prioritized fixes and a retest plan.',
  PREMIUM_RETEST_PLAN:
    'Video-backed evidence, measurement context, coaching synthesis, and before/after progress.',
};

function dismissKey(slot: SlotId, tier: WaitlistTier) {
  return `sv-tier-invite-dismissed:${slot}:${tier}`;
}

export function TierInvite({ slot, className }: { slot: SlotId; className?: string }) {
  const [snap, setSnap] = useState<PlacementsSnapshot | null>(null);
  const [joined, setJoined] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [needsSignIn, setNeedsSignIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch('/api/intelligence/placements')
      .then((r) => r.json())
      .then((d: PlacementsSnapshot) => {
        if (!alive) return;
        setSnap(d);
        const tier = d.slots?.[slot]?.tier;
        if (tier) {
          setJoined(Boolean(d.joined?.[tier]));
          try {
            if (localStorage.getItem(dismissKey(slot, tier))) setDismissed(true);
          } catch {
            /* storage blocked — just show */
          }
        }
      })
      .catch(() => {
        /* on error, render nothing rather than a broken card */
        if (alive) setSnap(null);
      });
    return () => {
      alive = false;
    };
  }, [slot]);

  if (!snap || !snap.invitationsEnabled) return null;
  const setting = snap.slots?.[slot];
  if (!setting?.enabled) return null;
  const tier = setting.tier;
  // Only invite interest in a tier that is genuinely not yet available.
  if (snap.availability?.[tier] !== 'waitlist') return null;
  if (dismissed) return null;

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(dismissKey(slot, tier), '1');
    } catch {
      /* ignore */
    }
  }

  async function join() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/intelligence/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (res.status === 401 || data?.signInRequired) {
        setNeedsSignIn(true);
        return;
      }
      if (!res.ok || !data?.ok) {
        setError(data?.error ?? 'Please try again.');
        return;
      }
      setJoined(true);
    } catch {
      setError('Network error — please try again.');
    } finally {
      setBusy(false);
    }
  }

  const headline = setting.headline || DEFAULT_HEADLINE[tier];

  return (
    <div
      className={`relative rounded-xl border border-border bg-card/60 p-4 ${className ?? ''}`}
      role="complementary"
      aria-label="Early-access invitation"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground transition hover:bg-card hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-link" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">{headline}</p>
          {joined ? (
            <p className="flex items-center gap-1.5 text-sm text-success-text">
              <Check className="h-4 w-4" /> You&apos;re on the early-access list — we&apos;ll reach out. Thanks!
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">{TIER_BLURB[tier]}</p>
              <p className="text-xs text-muted-foreground">
                We&apos;re rolling it out gradually. If you&apos;d like early access, add your name — no rush,
                and it won&apos;t change your current plan.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1.5">
                {needsSignIn ? (
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = '/login';
                    }}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-card"
                  >
                    Sign in to add your name
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={join}
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-card disabled:opacity-60"
                  >
                    {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                    Join the early-access list
                  </button>
                )}
                <button
                  type="button"
                  onClick={dismiss}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
                >
                  Maybe later
                </button>
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
