// ============================================================
// SwingVantage — Agent: Growth Coordinator — Orchestrator
// ------------------------------------------------------------
// Runs all seven growth agents over one AgentContext and decides
// the single in-app surface worth showing, by priority:
//
//   1) NOT activated  → activation (get them to the first "aha")
//   2) at-risk/critical churn → re-engage (win them back)
//   3) an earn-moment fired   → referral (ask at peak emotion)
//   4) otherwise               → none (stay quiet)
//
// Dispatch (outbound) is computed independently and always
// returned, so a caller can deliver win-back messages regardless
// of which in-app surface won. Pure, deterministic, never throws.
// ============================================================

import type { AgentContext } from '../types';
import { scoreChurnRisk } from '../churn/engine';
import { buildActivation } from '../activation/engine';
import { buildDispatch } from '../dispatch/engine';
import { buildReferralPrompt } from '../earn-moments/engine';
import type { GrowthAgentsResult, GrowthInputs, GrowthSurface } from './types';

function decideSurface(
  ctx: AgentContext,
  churn: GrowthAgentsResult['churn'],
  activation: GrowthAgentsResult['activation'],
  dispatch: GrowthAgentsResult['dispatch'],
  referral: GrowthAgentsResult['referral'],
): GrowthSurface {
  // 1) Pre-activation always wins — nothing else matters before the first aha.
  if (activation.status !== 'activated' && activation.nudge) {
    return {
      kind: 'activation',
      title: activation.nudge.headline,
      body: activation.nudge.body,
      action: { label: activation.nudge.action.label, href: activation.nudge.action.href },
      reason: `Activation step "${activation.currentStepId}" (${activation.percent}% complete).`,
    };
  }

  // 2) Activated but slipping → win them back.
  if (churn.band === 'at_risk' || churn.band === 'critical') {
    const msg = dispatch.message;
    const action = msg
      ? { label: msg.cta.label, href: msg.cta.href }
      : null;
    return {
      kind: 'reengage',
      title: msg?.title ?? 'Welcome back',
      body: msg?.body ?? 'Pick up where you left off with one quick step.',
      action,
      reason: `Churn ${churn.band} (${churn.score}) → ${churn.intervention.angle}.`,
    };
  }

  // 3) A real win just happened → ask for a referral at peak emotion.
  if (referral.show) {
    return {
      kind: 'referral',
      title: referral.headline,
      body: referral.body,
      action: { label: referral.cta.label, href: referral.cta.href },
      reason: `Earn-moment: ${referral.moment?.kind ?? 'unknown'}.`,
    };
  }

  // 4) Nothing worth saying.
  return {
    kind: 'none',
    title: '',
    body: '',
    action: null,
    reason: 'No growth surface warranted right now.',
  };
}

/**
 * Run the full growth agent suite and return every sub-result plus the single
 * chosen in-app surface. Inputs are optional; each agent degrades honestly when
 * its extra signals are absent.
 */
export function runGrowthAgents(ctx: AgentContext, inputs: GrowthInputs = {}): GrowthAgentsResult {
  const churn = scoreChurnRisk(ctx, inputs.churnSignals);
  const activation = buildActivation(ctx, inputs.activation);
  const dispatch = buildDispatch(ctx, churn, inputs.dispatch);
  const referral = buildReferralPrompt(ctx, inputs.referral);

  const primary = decideSurface(ctx, churn, activation, dispatch, referral);

  return {
    churn,
    activation,
    dispatch,
    referral,
    primary,
    generatedAt: ctx.now,
  };
}
