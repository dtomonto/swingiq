// ============================================================
// SwingVantage — Growth Agents (ADMIN debug view)
// ------------------------------------------------------------
// Admin-only: shows the live growth-agent read for the current
// account WITH full internal detail (churn drivers, dispatch
// decision, referral moment). Access is gated by app/admin/layout
// (ADMIN_EMAILS allowlist / ADMIN_SECRET; dev-permissive).
//
// Note: the non-debug GrowthAgentsPanel is also mounted on the
// regular dashboard for all users — only this detailed view is
// admin-restricted.
// ============================================================

import { GrowthAgentsPanel } from '@/components/growth';

export const metadata = {
  title: 'Growth Agents · Admin · SwingVantage',
  robots: 'noindex, nofollow',
};

export default function AdminGrowthAgentsPage() {
  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6 space-y-5">
      <header>
        <h1 className="text-xl font-bold text-gray-100">Growth Agents</h1>
        <p className="text-sm text-gray-400 mt-1">
          Live read from the seven growth agents for the current account, with full
          per-agent detail. Admin-only — this exposes internal reasoning (churn
          drivers, the dispatch decision, referral moments).
        </p>
      </header>

      {/* Themed surface so the panel's tokens render correctly inside the
          dark admin chrome. */}
      <div className="bg-background text-foreground rounded-xl border border-border p-4 sm:p-6">
        <GrowthAgentsPanel showDebug />
      </div>
    </div>
  );
}
