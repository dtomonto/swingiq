'use client';

// ============================================================
// SwingVantage — GrowthAgentsPanel
// ------------------------------------------------------------
// The drop-in surface for the growth agents. It runs the
// coordinator via useGrowthAgents() and renders the single chosen
// surface + the activation checklist + an engagement-health badge.
// Hydration-safe (skeleton until ready). Optional debug view dumps
// every sub-result for transparency.
// ============================================================

import { useGrowthAgents } from '@/lib/agents/growth';
import type { GrowthInputs } from '@/lib/agents/growth';
import { GrowthSurfaceCard } from './GrowthSurfaceCard';
import { ActivationChecklist } from './ActivationChecklist';
import { ChurnRiskBadge } from './ChurnRiskBadge';

export function GrowthAgentsPanel({
  inputs,
  showDebug = false,
}: {
  inputs?: GrowthInputs;
  showDebug?: boolean;
}) {
  const { ready, result } = useGrowthAgents(inputs);

  if (!ready || !result) {
    return <div className="h-28 rounded-xl bg-muted animate-pulse" aria-hidden="true" />;
  }

  const { primary, churn, activation } = result;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">Your next step</h2>
        <ChurnRiskBadge band={churn.band} score={churn.score} />
      </div>

      {primary.kind === 'none' ? (
        <div className="bg-card rounded-xl border border-border shadow-xs p-4">
          <p className="text-sm text-muted-foreground">
            You’re all set — nothing needs your attention right now. Keep up the great work.
          </p>
        </div>
      ) : (
        <GrowthSurfaceCard surface={primary} />
      )}

      {activation.status !== 'activated' && <ActivationChecklist activation={activation} />}

      {showDebug && (
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer select-none">Agent detail (debug)</summary>
          <pre className="mt-2 overflow-auto rounded-lg bg-muted p-3 leading-relaxed">
            {JSON.stringify(
              {
                primarySurface: primary.kind,
                reason: primary.reason,
                churn: { band: churn.band, score: churn.score, drivers: churn.drivers },
                activation: { status: activation.status, percent: activation.percent, currentStep: activation.currentStepId },
                dispatch: { send: result.dispatch.send, channel: result.dispatch.message?.channel ?? null, reason: result.dispatch.reason },
                referral: { show: result.referral.show, moment: result.referral.moment?.kind ?? null },
              },
              null,
              2,
            )}
          </pre>
        </details>
      )}
    </div>
  );
}
