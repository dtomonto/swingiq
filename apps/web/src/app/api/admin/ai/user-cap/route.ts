// ============================================================
// /api/admin/ai/user-cap — edit the PER-USER daily AI spend cap
// ------------------------------------------------------------
// GET  → current per-user cap status.
// POST { dollars: number } → set the per-account daily cap (0 = unlimited);
//        { clear: true } reverts to the AI_PER_USER_DAILY_BUDGET_CENTS env
//        default. Once a user's estimated spend reaches the cap, AI auto-pauses
//        for that account until 00:00 UTC (their routes serve the keyless
//        fallback) — no operator action needed.
// Admin + settings.manage gated. Persists via the per-user cap store (Upstash
// when configured → fleet-wide + durable; else per-instance until restart).
// ============================================================

import { NextResponse } from 'next/server';
import { requireAdmin, contextCan } from '@/lib/admin/context';
import { getUserAiCapStatus, setUserCapOverrideCents } from '@/lib/ai/user-ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function guard() {
  const admin = await requireAdmin();
  if (!admin.ok) return { error: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) };
  if (!contextCan(admin, 'settings.manage')) {
    return { error: NextResponse.json({ error: 'forbidden' }, { status: 403 }) };
  }
  return { error: null };
}

export async function GET() {
  const { error } = await guard();
  if (error) return error;
  return NextResponse.json({ ok: true, userCap: await getUserAiCapStatus() });
}

export async function POST(req: Request) {
  const { error } = await guard();
  if (error) return error;

  let body: { dollars?: number; clear?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    /* empty body */
  }

  if (body.clear) {
    await setUserCapOverrideCents(null); // revert to the env default
  } else {
    const d = Number(body.dollars);
    if (!Number.isFinite(d) || d < 0) {
      return NextResponse.json({ error: 'invalid-amount' }, { status: 400 });
    }
    // 0 = explicitly uncapped; >0 = cap in dollars → cents.
    await setUserCapOverrideCents(Math.round(d * 100));
  }

  return NextResponse.json({ ok: true, userCap: await getUserAiCapStatus() });
}
