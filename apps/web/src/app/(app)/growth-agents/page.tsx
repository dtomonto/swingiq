// ============================================================
// SwingVantage — Growth Agents (internal showcase)
// ------------------------------------------------------------
// A live read from the seven growth agents based on the current
// account's real data. Doubles as the verification surface for the
// growth system and a reference for wiring GrowthAgentsPanel into
// the dashboard.
// ============================================================

import { GrowthAgentsPanel } from '@/components/growth';

export const metadata = { title: 'Growth Agents · SwingVantage' };

export default function GrowthAgentsPage() {
  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6 space-y-6">
      <header>
        <h1 className="text-xl font-bold text-foreground">Growth Agents</h1>
        <p className="text-sm text-muted-foreground mt-1">
          A live read from the seven growth agents (churn, activation, re-engagement,
          referral, and more), computed from your current data. Everything here is
          deterministic and runs with no AI key.
        </p>
      </header>

      <GrowthAgentsPanel showDebug />
    </div>
  );
}
