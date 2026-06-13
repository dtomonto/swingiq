// ============================================================
// SwingVantage — GAI route context resolver (server-only)
// ------------------------------------------------------------
// Gathers the LIVE signals the pure router needs, from the systems that already
// own them: the operating-mode store, the keyless capability checks, the global
// AI budget guard, and the user's billing entitlement. Kept separate from the
// pure decision logic so the router stays unit-testable without any I/O.
//
// SECURITY: server-only (reads secret env, budget store, Supabase).
// ============================================================

import { isAiCoachConfigured, isAiVisionConfigured } from '@/lib/capabilities';
import { aiBudgetExceeded } from '@/lib/ai-budget';
import { getCurrentUserEntitlement } from '@/lib/billing/entitlements';
import type { TierId } from '@/lib/billing/tiers';
import { getOperatingModeState } from './operating-mode';
import type { RouteContext } from './router';
import type { AnalysisRequest } from './types';

/**
 * Resolve the live routing context for a request. Never throws — every signal
 * degrades to a safe default (heuristic-friendly) so a failure here can only
 * make the platform CHEAPER, never more expensive.
 */
export async function resolveRouteContext(
  req: AnalysisRequest,
  opts: { userPlan?: TierId } = {},
): Promise<RouteContext> {
  const [modeState, budgetExceeded, plan] = await Promise.all([
    getOperatingModeState().catch(() => null),
    aiBudgetExceeded().catch(() => false),
    opts.userPlan
      ? Promise.resolve(opts.userPlan)
      : getCurrentUserEntitlement().then((e) => e.tier).catch(() => 'free' as TierId),
  ]);

  // Premium video tiers need vision; report/coach tiers need a coach provider.
  const needsVision = req.tier === 'PREMIUM_RETEST_PLAN';
  const providerConfigured = needsVision ? isAiVisionConfigured() : isAiCoachConfigured();

  const costSavingAiTiers = modeState?.costSavingAiTiers ?? ['PREMIUM_RETEST_PLAN'];

  return {
    operatingMode: modeState?.mode ?? 'DEFAULT_AI_MODE',
    userPlan: plan,
    providerConfigured,
    // Provider health is assumed good; a real failure is caught at execution and
    // degrades to the heuristic floor (FALLBACK_HEURISTIC).
    providerHealthy: true,
    budgetAllows: !budgetExceeded,
    adminForceHeuristic: modeState?.forceHeuristic ?? false,
    adminKillSwitch: modeState?.killSwitch ?? false,
    adminAllowsAIOverrideForTier: costSavingAiTiers.includes(req.tier),
    // No reusable cache layer is wired yet; callers can inject one via deps.
    cacheHit: false,
    cacheAllowed: true,
  };
}
