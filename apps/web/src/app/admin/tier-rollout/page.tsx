// ============================================================
// /admin/tier-rollout — gradual paid-tier launch control
// ------------------------------------------------------------
// Admin-guarded by app/admin/layout (ADMIN_EMAILS allowlist /
// ADMIN_SECRET). Reads the live rollout mode + per-tier waitlist demand
// server-side and hands them to a client toggle that flips between
// "Free option" and "Full rollout".
// ============================================================

import type { Metadata } from 'next';
import { Coins } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import {
  getTierRolloutMode,
  getTierInterestCounts,
  isTierRolloutPersistent,
} from '@/lib/billing/tier-rollout-server';
import { TierRolloutControl } from './TierRolloutControl';

export const metadata: Metadata = { title: 'Tier Rollout | Admin', robots: 'noindex, nofollow' };
export const dynamic = 'force-dynamic';

export default async function AdminTierRolloutPage() {
  const [mode, counts] = await Promise.all([getTierRolloutMode(), getTierInterestCounts()]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Tier Rollout"
        icon={Coins}
        description="Roll the paid membership tiers out gradually. While gated, Pro & Team collect signed-in waitlist interest so you can see real demand before launching."
      />
      <TierRolloutControl initialMode={mode} counts={counts} persistent={isTierRolloutPersistent()} />
    </div>
  );
}
