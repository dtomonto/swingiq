'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { BillingTier, TierId, TierRolloutMode } from '@/lib/billing/tiers';

type Phase = 'idle' | 'loading' | 'done' | 'error';

interface TierStatus {
  mode: TierRolloutMode;
  billingLive: boolean;
  signedIn: boolean;
  interested: TierId[];
}

/**
 * Paid-tier call to action. Three states, decided by the rollout mode the
 * admin controls plus whether Stripe is configured:
 *  • Rolled out + billing live → real "Upgrade" → Stripe Checkout.
 *  • Rolled out + no billing    → email "notify me" (legacy coming-soon).
 *  • Not rolled out (default)   → signed-in "join the waitlist" so we can
 *    count how many users want the tier before turning it on.
 */
export function PricingCTA({ tier }: { tier: BillingTier }) {
  const [status, setStatus] = useState<TierStatus | null>(null);
  const [email, setEmail] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    let active = true;
    fetch('/api/billing/tier-status')
      .then((r) => r.json())
      .then((s: TierStatus) => {
        if (!active) return;
        setStatus(s);
        setJoined(Array.isArray(s.interested) && s.interested.includes(tier.id));
      })
      .catch(() => active && setStatus({ mode: 'free', billingLive: false, signedIn: false, interested: [] }));
    return () => {
      active = false;
    };
  }, [tier.id]);

  const upgrade = async () => {
    setPhase('loading');
    setMessage(null);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: tier.id }),
      });
      const data = (await res.json()) as { ok?: boolean; url?: string; message?: string; reason?: string };
      if (data.ok && data.url) {
        window.location.href = data.url;
        return;
      }
      if (data.reason === 'auth_required') {
        window.location.href = `/login?next=${encodeURIComponent('/pricing')}`;
        return;
      }
      setPhase('error');
      setMessage(data.message ?? 'Checkout is unavailable right now.');
    } catch {
      setPhase('error');
      setMessage('Checkout is unavailable right now.');
    }
  };

  const joinWaitlist = async () => {
    setPhase('loading');
    setMessage(null);
    try {
      const res = await fetch('/api/billing/tier-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: tier.id }),
      });
      const data = (await res.json()) as { ok?: boolean; alreadyInterested?: boolean; reason?: string };
      if (res.status === 401 || data.reason === 'auth_required') {
        window.location.href = `/login?next=${encodeURIComponent('/pricing')}`;
        return;
      }
      if (res.ok && data.ok) {
        setJoined(true);
        setPhase('idle');
        setMessage(null);
        return;
      }
      setPhase('error');
      setMessage('We could not add you to the waitlist right now. Please try again.');
    } catch {
      setPhase('error');
      setMessage('We could not add you to the waitlist right now. Please try again.');
    }
  };

  const notifyByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhase('loading');
    setMessage(null);
    try {
      const source = tier.id === 'team' ? 'team_waitlist' : 'pro_waitlist';
      const res = await fetch('/api/email-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source }),
      });
      const data = (await res.json()) as { ok?: boolean; persisted?: boolean; error?: string };
      if (res.ok && data.ok) {
        setPhase('done');
        setMessage(
          data.persisted
            ? `Thanks! We'll email you when ${tier.name} launches.`
            : `Thanks! We noted your interest in ${tier.name}. (Email storage isn't connected yet, so nothing was saved.)`,
        );
      } else {
        setPhase('error');
        setMessage(data.error ?? 'Please try again.');
      }
    } catch {
      setPhase('error');
      setMessage('Please try again.');
    }
  };

  if (status === null) {
    return <div className="h-12 w-full animate-pulse rounded-xl bg-muted" aria-hidden />;
  }

  const rolledOut = status.mode === 'full';

  // 1. Rolled out + billing configured → real upgrade.
  if (rolledOut && status.billingLive) {
    return (
      <div>
        <Button onClick={upgrade} loading={phase === 'loading'} className="w-full" size="lg">
          Upgrade to {tier.name} · ${tier.priceMonthly}/mo
        </Button>
        {message && <p className="mt-2 text-xs text-warning">{message}</p>}
      </div>
    );
  }

  // 2. Rolled out but billing not connected → legacy email "notify me".
  if (rolledOut && !status.billingLive) {
    if (phase === 'done') {
      return <p className="rounded-xl bg-success/10 border border-success/30 p-3 text-sm text-success">{message}</p>;
    }
    return (
      <div className="space-y-2">
        <div
          className="w-full rounded-xl border border-border bg-muted py-3 text-center text-sm font-semibold text-muted-foreground"
          aria-label={`${tier.name} coming soon`}
        >
          Coming Soon
        </div>
        <form onSubmit={notifyByEmail} className="space-y-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            className="w-full border border-border rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-ring focus:border-transparent outline-hidden"
          />
          <Button type="submit" loading={phase === 'loading'} variant="outline" className="w-full" size="lg">
            Notify me when {tier.name} launches
          </Button>
          {message && <p className="text-xs text-warning">{message}</p>}
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Free stays free. {tier.name} is coming later — leave your email and we&apos;ll let you know.
          </p>
        </form>
      </div>
    );
  }

  // 3. Default: not rolled out → signed-in waitlist (counts demand).
  if (joined) {
    return (
      <div className="space-y-2">
        <p className="rounded-xl bg-success/10 border border-success/30 p-3 text-sm text-success">
          You&apos;re on the {tier.name} waitlist — we&apos;ll let you know the moment it rolls out.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        className="w-full rounded-xl border border-border bg-muted py-3 text-center text-sm font-semibold text-muted-foreground"
        aria-label={`${tier.name} rolling out soon`}
      >
        Rolling out gradually
      </div>
      <Button
        onClick={joinWaitlist}
        loading={phase === 'loading'}
        variant="outline"
        className="w-full"
        size="lg"
      >
        {status.signedIn ? `Join the ${tier.name} waitlist` : `Sign in to join the ${tier.name} waitlist`}
      </Button>
      {message && <p className="text-xs text-warning">{message}</p>}
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Put your name on the waitlist — {tier.name} is rolling out gradually. We&apos;ll roll it out to the
        athletes who want it first.
      </p>
    </div>
  );
}
