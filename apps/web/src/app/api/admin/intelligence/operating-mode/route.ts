// ============================================================
// /api/admin/intelligence/operating-mode — view + switch the GAI posture
// ------------------------------------------------------------
// GET  → current operating-mode state + tier configs + observability rollup.
// POST { mode?, forceHeuristic?, killSwitch?, costSavingAiTiers? }
//      → merge a patch into the operating-mode state (stamps actor + time).
//
// Read = logs.view; changes = settings.manage. Persists via the operating-mode
// store (Upstash when configured → fleet-wide + durable, else per-instance).
// ============================================================

import { NextResponse } from 'next/server';
import { requireAdmin, contextCan } from '@/lib/admin/context';
import {
  getOperatingModeState,
  setOperatingModeState,
  getIntelligenceObservability,
  getTierWaitlistCounts,
  DEFAULT_TIER_CONFIGS,
} from '@/lib/intelligence';
import type { IntelligenceTier, OperatingMode, TierRolloutStatus } from '@/lib/intelligence';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_TIERS: IntelligenceTier[] = ['INSTANT_ESTIMATE', 'AI_SWING_REPORT', 'PREMIUM_RETEST_PLAN'];

async function guard(perm: 'logs.view' | 'settings.manage') {
  const admin = await requireAdmin();
  if (!admin.ok) return { error: NextResponse.json({ error: 'unauthorized' }, { status: 401 }), admin: null };
  if (!contextCan(admin, perm)) {
    return { error: NextResponse.json({ error: 'forbidden' }, { status: 403 }), admin: null };
  }
  return { error: null as null, admin };
}

export async function GET() {
  const { error } = await guard('logs.view');
  if (error) return error;
  const [state, observability, waitlist] = await Promise.all([
    getOperatingModeState(),
    getIntelligenceObservability(14),
    getTierWaitlistCounts(),
  ]);
  return NextResponse.json({ ok: true, state, tiers: DEFAULT_TIER_CONFIGS, observability, waitlist });
}

export async function POST(req: Request) {
  const { error, admin } = await guard('settings.manage');
  if (error) return error;

  let body: {
    mode?: string;
    forceHeuristic?: boolean;
    killSwitch?: boolean;
    costSavingAiTiers?: unknown;
    tierRollout?: unknown;
  } = {};
  try {
    body = await req.json();
  } catch {
    /* empty body */
  }

  const patch: Parameters<typeof setOperatingModeState>[0] = { actor: admin?.email ?? 'header-admin' };

  if (body.mode !== undefined) {
    if (body.mode !== 'DEFAULT_AI_MODE' && body.mode !== 'COST_SAVING_MODE') {
      return NextResponse.json({ error: 'invalid-mode' }, { status: 400 });
    }
    patch.mode = body.mode as OperatingMode;
  }
  if (body.forceHeuristic !== undefined) {
    if (typeof body.forceHeuristic !== 'boolean') {
      return NextResponse.json({ error: 'invalid-forceHeuristic' }, { status: 400 });
    }
    patch.forceHeuristic = body.forceHeuristic;
  }
  if (body.killSwitch !== undefined) {
    if (typeof body.killSwitch !== 'boolean') {
      return NextResponse.json({ error: 'invalid-killSwitch' }, { status: 400 });
    }
    patch.killSwitch = body.killSwitch;
  }
  if (body.costSavingAiTiers !== undefined) {
    if (!Array.isArray(body.costSavingAiTiers)) {
      return NextResponse.json({ error: 'invalid-costSavingAiTiers' }, { status: 400 });
    }
    const tiers = body.costSavingAiTiers.filter((t): t is IntelligenceTier =>
      VALID_TIERS.includes(t as IntelligenceTier),
    );
    patch.costSavingAiTiers = tiers;
  }
  if (body.tierRollout !== undefined) {
    if (!body.tierRollout || typeof body.tierRollout !== 'object') {
      return NextResponse.json({ error: 'invalid-tierRollout' }, { status: 400 });
    }
    const rollout: Partial<Record<IntelligenceTier, TierRolloutStatus>> = {};
    for (const [tier, status] of Object.entries(body.tierRollout as Record<string, unknown>)) {
      if (!VALID_TIERS.includes(tier as IntelligenceTier)) continue;
      if (status === 'active' || status === 'waitlist') rollout[tier as IntelligenceTier] = status;
    }
    patch.tierRollout = rollout;
  }

  const state = await setOperatingModeState(patch);
  return NextResponse.json({ ok: true, state });
}
