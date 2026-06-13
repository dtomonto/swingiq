'use client';

// ============================================================
// TierWaitlistButton — register interest in a GAI tier on waitlist.
// ------------------------------------------------------------
// Drop-in for the AI Swing Report / Premium Retest Plan tiers while they are on
// `waitlist` rollout. Reads /api/intelligence/waitlist for the tier's status +
// whether the signed-in user already joined, then lets them register interest
// with one tap. Renders nothing once the tier is fully rolled out (the parent
// shows the normal CTA). Signed-out users are routed to sign in first.
// ============================================================

import { useEffect, useState } from 'react';
import { Bell, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

type WaitlistTier = 'AI_SWING_REPORT' | 'PREMIUM_RETEST_PLAN';

interface WaitlistSnapshot {
  availability: Record<string, 'waitlist' | 'active'>;
  joined: Record<string, boolean> | null;
  signedIn: boolean;
}

const TIER_LABELS: Record<WaitlistTier, string> = {
  AI_SWING_REPORT: 'AI Swing Report',
  PREMIUM_RETEST_PLAN: 'Premium Retest Plan',
};

export function TierWaitlistButton({
  tier,
  className,
  signInHref = '/login',
}: {
  tier: WaitlistTier;
  className?: string;
  signInHref?: string;
}) {
  const [snap, setSnap] = useState<WaitlistSnapshot | null>(null);
  const [joined, setJoined] = useState(false);
  const [busy, setBusy] = useState(false);
  const [needsSignIn, setNeedsSignIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch('/api/intelligence/waitlist')
      .then((r) => r.json())
      .then((d: WaitlistSnapshot & { ok?: boolean }) => {
        if (!alive) return;
        setSnap(d);
        setJoined(Boolean(d.joined?.[tier]));
      })
      .catch(() => {
        if (alive) setSnap({ availability: { [tier]: 'waitlist' }, joined: null, signedIn: false });
      });
    return () => {
      alive = false;
    };
  }, [tier]);

  // Still loading, or the tier is fully rolled out → no waitlist UI needed.
  if (!snap) return null;
  if (snap.availability?.[tier] === 'active') return null;

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

  if (joined) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-sm font-medium text-success-text ${className ?? ''}`}>
        <Check className="h-4 w-4" /> You&apos;re on the waitlist
      </span>
    );
  }

  if (needsSignIn) {
    return (
      <Button
        variant="outline"
        size="sm"
        className={className}
        onClick={() => {
          window.location.href = signInHref;
        }}
      >
        Sign in to join the waitlist
      </Button>
    );
  }

  return (
    <span className={`inline-flex flex-col items-start gap-1 ${className ?? ''}`}>
      <Button variant="outline" size="sm" onClick={join} disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
        Join the waitlist
      </Button>
      <span className="text-xs text-muted-foreground">
        {TIER_LABELS[tier]} is rolling out gradually — add your name and we&apos;ll let you in.
      </span>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </span>
  );
}
