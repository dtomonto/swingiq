// ============================================================
// /admin/operating-mode — GAI Operating Mode & Intelligence
// ------------------------------------------------------------
// One screen to set the platform's posture toward AI spend (Default AI Mode ↔
// Cost-Saving Mode), tune the three GAI analysis tiers, and watch the routing
// observability (heuristic/hybrid/full-AI split, cache + fallback rate,
// estimated spend vs cost avoided). Read = logs.view; changes = settings.manage.
// ============================================================

import type { Metadata } from 'next';
import Link from 'next/link';
import { Gauge } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { MetricStat } from '@/components/admin/MetricStat';
import { HelpPanel } from '@/components/admin/HelpPanel';
import { OperatingModeControl } from '@/components/admin/OperatingModeControl';
import { TierInvitationsControl } from '@/components/admin/TierInvitationsControl';
import { EducationalLink } from '@/components/learn/EducationalLink';
import {
  getOperatingModeState,
  getIntelligenceObservability,
  getTierWaitlistCounts,
  getPlacementState,
  PLACEMENT_SLOTS,
  DEFAULT_TIER_CONFIGS,
} from '@/lib/intelligence';

export const metadata: Metadata = {
  title: 'Operating Mode | Admin',
  robots: 'noindex, nofollow',
};
export const dynamic = 'force-dynamic';

const dollars = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const pct = (n: number) => `${Math.round(n * 100)}%`;

export default async function OperatingModePage() {
  const [state, obs, waitlist, placements] = await Promise.all([
    getOperatingModeState(),
    getIntelligenceObservability(14),
    getTierWaitlistCounts(),
    getPlacementState(),
  ]);

  const tiers = Object.values(DEFAULT_TIER_CONFIGS);
  const aiRoutes = obs.routeSplit.HYBRID + obs.routeSplit.FULL_AI;
  const heuristicRoutes =
    obs.routeSplit.HEURISTIC_ONLY + obs.routeSplit.FALLBACK_HEURISTIC + obs.routeSplit.ADMIN_FORCED_HEURISTIC;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Operating Mode"
        icon={Gauge}
        description="Set how SwingVantage GAI routes every analysis: best-quality AI when it adds value, or deterministic GAI + cache to protect spend. Switch posture here — no redeploy. Free and Instant Estimate requests are never billed to paid AI in Cost-Saving Mode."
      />

      <SectionCard title="Operating mode">
        <OperatingModeControl
          initial={state}
          waitlistCounts={waitlist.counts}
          waitlistAvailable={waitlist.available}
        />
      </SectionCard>

      <SectionCard title="Tier invitations (no-pressure placements)">
        <TierInvitationsControl initial={placements} slots={PLACEMENT_SLOTS} />
      </SectionCard>

      {/* ── Intelligence tiers ───────────────────────────── */}
      <SectionCard
        title="Intelligence tiers"
        description="The three GAI-powered analysis products and their default routing posture."
      >
        <div className="space-y-3">
          {tiers.map((t) => (
            <div key={t.tier} className="rounded-xl border border-border bg-card/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-2 font-semibold text-foreground">
                  {t.name}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      state.tierRollout[t.tier] === 'active'
                        ? 'bg-success-text/10 text-success-text'
                        : 'border border-border text-muted-foreground'
                    }`}
                  >
                    {state.tierRollout[t.tier] === 'active' ? 'Live' : 'Waitlist'}
                  </span>
                </span>
                <span className="flex flex-wrap gap-1.5 text-xs">
                  {t.usesHeuristic && <span className="rounded-full border border-border px-2 py-0.5 text-muted-foreground">Heuristic</span>}
                  {t.usesAI && <span className="rounded-full border border-border px-2 py-0.5 text-muted-foreground">AI</span>}
                  {t.usesVideo && <span className="rounded-full border border-border px-2 py-0.5 text-muted-foreground">Video</span>}
                  {t.usesCache && <span className="rounded-full border border-border px-2 py-0.5 text-muted-foreground">Cache</span>}
                  <span className="rounded-full border border-border px-2 py-0.5 text-muted-foreground">
                    {t.maxCostCents > 0 ? `≤ ${dollars(t.maxCostCents)}/analysis` : 'no paid AI'}
                  </span>
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── Observability ────────────────────────────────── */}
      <SectionCard
        title="Intelligence observability"
        description={`Route decisions over the last ${obs.windowDays} days.`}
        actions={
          <Link href="/admin/ai-provider" className="text-sm text-link hover:underline">
            AI Provider Control →
          </Link>
        }
      >
        {obs.available ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MetricStat label="Total analyses" value={String(obs.total)} tone="muted" />
              <MetricStat label="Heuristic / AI" value={`${heuristicRoutes} / ${aiRoutes}`} hint="route split" tone="muted" />
              <MetricStat label="Cache hit rate" value={pct(obs.cacheHitRate)} tone="success" />
              <MetricStat label="Fallback rate" value={pct(obs.fallbackRate)} tone={obs.fallbackRate > 0.25 ? 'warning' : 'muted'} />
              <MetricStat label="Est. spend" value={dollars(obs.estimatedSpendCents)} hint="upper bound" tone="muted" />
              <MetricStat label="Est. cost avoided" value={dollars(obs.estimatedAvoidedCents)} tone="success" />
              <MetricStat label="Avg confidence" value={pct(obs.averageConfidence)} tone="muted" />
              <MetricStat label="Top sport" value={obs.topSports[0]?.key ?? '—'} tone="muted" />
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            No durable analysis log yet. Apply <code>apps/web/supabase-intelligence.sql</code> in Supabase to
            record route decisions for cross-instance observability. Until then, routing still works — it just
            isn&apos;t persisted here.
          </div>
        )}
      </SectionCard>

      <HelpPanel>
        <p>
          <strong>What this is.</strong> The control surface for SwingVantage GAI — the layer that routes every
          analysis through the right mix of{' '}
          <EducationalLink term="heuristic-data">deterministic heuristics</EducationalLink>, cache, and{' '}
          <EducationalLink term="ai-sports">AI</EducationalLink> providers.
        </p>
        <p>
          <strong>Default AI Mode</strong> picks the best available quality per tier, still preferring heuristics
          and cache where they help. <strong>Cost-Saving Mode</strong> protects spend: free and Instant Estimate
          requests run on deterministic GAI, deeper tiers use AI only where you allow it, and every core flow
          (sport selection, diagnosis, report, drills, retest, upgrade) is preserved.
        </p>
        <p>
          Cost controls (daily budget, per-user caps, kill switch) live alongside the{' '}
          <Link href="/admin/ai-provider">AI Provider Control Center</Link>. See{' '}
          <code>docs/admin-operating-mode.md</code> and <code>docs/intelligence-routing.md</code>.
        </p>
      </HelpPanel>
    </div>
  );
}
