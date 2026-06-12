// ============================================================
// /api/admin/ai/budget — edit the daily AI spend cap from the dashboard
// ------------------------------------------------------------
// GET  → current budget status.
// POST { dollars: number } → set the cap (0 = unlimited); { clear: true }
//        reverts to the AI_DAILY_BUDGET_CENTS env default.
// Admin + settings.manage gated. Persists via the existing AI-budget store
// (Upstash when configured → fleet-wide + durable; else per-instance).
// ============================================================

import { NextResponse } from 'next/server';
import { requireAdmin, contextCan } from '@/lib/admin/context';
import { getAiBudgetStatus, setBudgetOverrideCents } from '@/lib/ai-budget';

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
  return NextResponse.json({ ok: true, budget: await getAiBudgetStatus() });
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
    await setBudgetOverrideCents(null); // revert to the env default
  } else {
    const d = Number(body.dollars);
    if (!Number.isFinite(d) || d < 0) {
      return NextResponse.json({ error: 'invalid-amount' }, { status: 400 });
    }
    // 0 = explicitly uncapped; >0 = cap in dollars → cents.
    await setBudgetOverrideCents(Math.round(d * 100));
  }

  return NextResponse.json({ ok: true, budget: await getAiBudgetStatus() });
}
