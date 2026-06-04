'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { BillingTier } from '@/lib/billing/tiers';

type Phase = 'idle' | 'loading' | 'done' | 'error';

/**
 * Paid-tier call to action.
 *  • Billing live (Stripe configured)  → real "Upgrade" → Stripe Checkout.
 *  • Billing not configured (default)  → waitlist email capture (no charge).
 */
export function PricingCTA({ tier }: { tier: BillingTier }) {
  const [billingLive, setBillingLive] = useState<boolean | null>(null);
  const [email, setEmail] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/capabilities')
      .then((r) => r.json())
      .then((c: { billing?: boolean }) => active && setBillingLive(!!c.billing))
      .catch(() => active && setBillingLive(false));
    return () => {
      active = false;
    };
  }, []);

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

  const joinWaitlist = async (e: React.FormEvent) => {
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
            ? `You're on the ${tier.name} waitlist — we'll email you when it launches.`
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

  if (billingLive === null) {
    return <div className="h-12 w-full animate-pulse rounded-xl bg-muted" aria-hidden />;
  }

  if (billingLive) {
    return (
      <div>
        <Button onClick={upgrade} loading={phase === 'loading'} className="w-full" size="lg">
          Upgrade to {tier.name} · ${tier.priceMonthly}/mo
        </Button>
        {message && <p className="mt-2 text-xs text-warning">{message}</p>}
      </div>
    );
  }

  if (phase === 'done') {
    return <p className="rounded-xl bg-success/10 border border-success/30 p-3 text-sm text-success">{message}</p>;
  }

  return (
    <form onSubmit={joinWaitlist} className="space-y-2">
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
        Join the {tier.name} waitlist
      </Button>
      {message && <p className="text-xs text-warning">{message}</p>}
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Free stays free. No charge today — we&apos;ll email you when {tier.name} launches.
      </p>
    </form>
  );
}
