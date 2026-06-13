'use client';

// ============================================================
// Tier Rollout — admin control (client shell)
// ------------------------------------------------------------
// A two-position toggle the owner uses to roll the paid tiers out:
//   Free option  → only Free is active; Pro/Team show a waitlist CTA.
//   Full rollout → every paid tier is live (checkout / notify).
// Writes through the admin-guarded /api/admin/tier-rollout endpoint and
// shows live per-tier waitlist demand so the decision is data-backed.
// ============================================================

import { useState } from 'react';
import Link from 'next/link';
import { SectionCard } from '@/components/admin/SectionCard';
import { MetricStat } from '@/components/admin/MetricStat';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { BILLING_TIERS, type TierId, type TierRolloutMode } from '@/lib/billing/tiers';

interface Props {
  initialMode: TierRolloutMode;
  counts: Record<TierId, number>;
  persistent: boolean;
}

const TIER_NAME: Record<TierId, string> = Object.fromEntries(
  BILLING_TIERS.map((t) => [t.id, t.name]),
) as Record<TierId, string>;

const OPTIONS: Array<{ v: TierRolloutMode; label: string; hint: string }> = [
  { v: 'free', label: 'Free option', hint: 'Only Free is active — Pro & Team collect waitlist interest.' },
  { v: 'full', label: 'Full rollout', hint: 'All paid tiers go live (checkout / notify).' },
];

export function TierRolloutControl({ initialMode, counts, persistent }: Props) {
  const [mode, setMode] = useState<TierRolloutMode>(initialMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const waitlistTiers = BILLING_TIERS.filter((t) => t.id !== 'free');
  const totalInterest = waitlistTiers.reduce((sum, t) => sum + (counts[t.id] ?? 0), 0);

  const save = async (next: TierRolloutMode) => {
    if (next === mode) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/tier-rollout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: next }),
      });
      const json = (await res.json()) as { ok?: boolean; mode?: TierRolloutMode; error?: string };
      if (res.ok && json.ok && json.mode) {
        setMode(json.mode);
      } else {
        setError(json.error ?? 'Could not update rollout. Please try again.');
      }
    } catch {
      setError('Could not update rollout. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricStat
          label="Rollout"
          value={mode === 'full' ? 'Full' : 'Free only'}
          tone={mode === 'full' ? 'success' : 'muted'}
        />
        <MetricStat label="Waitlist (total)" value={totalInterest} />
        {waitlistTiers.map((t) => (
          <MetricStat key={t.id} label={`${t.name} interest`} value={counts[t.id] ?? 0} />
        ))}
      </div>

      <SectionCard
        title="Rollout mode"
        description="Choose how the paid tiers (Pro, Team) appear to athletes. Free is always active. This is the same switch as the membership-tier gate — flipping it here force-unlocks or force-locks that gate. Checkout opens automatically once Stripe is connected."
      >
        <div className="flex flex-wrap gap-2">
          {OPTIONS.map((o) => {
            const active = mode === o.v;
            return (
              <button
                key={o.v}
                disabled={saving}
                onClick={() => save(o.v)}
                className={`flex-1 min-w-[180px] rounded-lg border px-3 py-2.5 text-left text-xs transition disabled:opacity-50 ${
                  active
                    ? 'border-primary/50 bg-primary/15 text-link'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="block font-semibold">{o.label}</span>
                <span className="block text-[11px] text-muted-foreground">{o.hint}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted-foreground">Paid tiers:</span>
          <StatusBadge tone={mode === 'full' ? 'success' : 'neutral'}>
            {mode === 'full' ? 'Rolled out' : 'Waitlist only'}
          </StatusBadge>
          {!persistent && (
            <StatusBadge tone="warning">In-memory (set Supabase to persist fleet-wide)</StatusBadge>
          )}
        </p>
        {error && <p className="mt-2 text-xs text-error">{error}</p>}
      </SectionCard>

      <SectionCard
        title="Waitlist demand"
        description="Unique signed-in athletes who pressed “join the waitlist” for each tier. Use this to decide when to roll out."
      >
        {totalInterest === 0 ? (
          <p className="text-sm text-muted-foreground">
            No waitlist sign-ups yet. While in “Free option”, signed-in athletes can express interest in Pro
            and Team from the pricing page — their count shows up here.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {waitlistTiers.map((t) => (
              <li key={t.id} className="flex items-center justify-between py-2 text-sm">
                <span className="font-semibold text-foreground">
                  {TIER_NAME[t.id]} <span className="text-muted-foreground">· ${t.priceMonthly}/mo</span>
                </span>
                <StatusBadge tone={(counts[t.id] ?? 0) > 0 ? 'info' : 'neutral'}>
                  {counts[t.id] ?? 0} interested
                </StatusBadge>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <HelpPanel>
        <p>
          This is the gradual-launch switch for paid memberships. Keep it on <strong>Free option</strong>{' '}
          while you gauge demand — Pro and Team show a “join the waitlist” button to signed-in athletes, and
          every press is counted here (one per athlete per tier). When the numbers justify it, flip to{' '}
          <strong>Full rollout</strong> to turn the tiers on for everyone. No one is ever charged until Stripe
          is connected.
        </p>
        <p className="mt-2">
          Paid tiers <strong>never launch automatically</strong> — they require your explicit approval here
          (Full rollout). This toggle shares the{' '}
          <Link href="/admin/central-intelligence" className="text-link underline">
            membership-tier gate
          </Link>
          : the Founding campaign&apos;s automatic-at-cap unlock controls member messaging, but it will not
          switch the paid tiers on by itself until you flip this to Full rollout.
        </p>
      </HelpPanel>
    </div>
  );
}
