'use client';

// ============================================================
// SwingVantage — /refer · ReferralOS
// Invite friends, grow the free user base, climb the reward ladder.
// ============================================================

import { Gift } from 'lucide-react';
import { ReferralHub } from '@/components/referral/ReferralHub';

export default function ReferPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-5 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Gift size={20} aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-xl font-bold text-foreground">Invite Friends</h1>
          <p className="text-xs text-muted-foreground">Bring your circle — improve together, earn rewards</p>
        </div>
      </div>

      <ReferralHub />
    </div>
  );
}
