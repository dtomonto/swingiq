// ============================================================
// /api/admin/intelligence/placements — manage tier-invitation placements
// ------------------------------------------------------------
// GET  → current placement state + the slot registry.
// POST { invitationsEnabled?, slots? } → merge a patch (stamps actor + time).
//
// Read = logs.view; changes = settings.manage. Persists via the placements
// store (Upstash when configured → fleet-wide + durable, else per-instance), so
// the invitation strategy changes live without a redeploy.
// ============================================================

import { NextResponse } from 'next/server';
import { requireAdmin, contextCan } from '@/lib/admin/context';
import {
  getPlacementState,
  setPlacementState,
  PLACEMENT_SLOTS,
} from '@/lib/intelligence/placements';
import type { PlacementPatch, PlacementSlotId, WaitlistTier } from '@/lib/intelligence/placements';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SLOT_IDS = PLACEMENT_SLOTS.map((s) => s.id);
const TIERS: WaitlistTier[] = ['AI_SWING_REPORT', 'PREMIUM_RETEST_PLAN'];

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
  const state = await getPlacementState();
  return NextResponse.json({ ok: true, state, slots: PLACEMENT_SLOTS });
}

export async function POST(req: Request) {
  const { error, admin } = await guard('settings.manage');
  if (error) return error;

  let body: { invitationsEnabled?: unknown; slots?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    /* empty body */
  }

  const patch: PlacementPatch = { actor: admin?.email ?? 'header-admin' };

  if (body.invitationsEnabled !== undefined) {
    if (typeof body.invitationsEnabled !== 'boolean') {
      return NextResponse.json({ error: 'invalid-invitationsEnabled' }, { status: 400 });
    }
    patch.invitationsEnabled = body.invitationsEnabled;
  }

  if (body.slots !== undefined) {
    if (!body.slots || typeof body.slots !== 'object') {
      return NextResponse.json({ error: 'invalid-slots' }, { status: 400 });
    }
    const slots: PlacementPatch['slots'] = {};
    for (const [id, raw] of Object.entries(body.slots as Record<string, unknown>)) {
      if (!SLOT_IDS.includes(id as PlacementSlotId) || !raw || typeof raw !== 'object') continue;
      const o = raw as Record<string, unknown>;
      const setting: { enabled?: boolean; tier?: WaitlistTier; headline?: string | null } = {};
      if (typeof o.enabled === 'boolean') setting.enabled = o.enabled;
      if (TIERS.includes(o.tier as WaitlistTier)) setting.tier = o.tier as WaitlistTier;
      if (typeof o.headline === 'string' || o.headline === null) setting.headline = o.headline as string | null;
      slots[id as PlacementSlotId] = setting;
    }
    patch.slots = slots;
  }

  const state = await setPlacementState(patch);
  return NextResponse.json({ ok: true, state });
}
