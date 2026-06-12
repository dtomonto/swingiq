// ============================================================
// /api/admin/ai/routing — view + re-route AI tasks from the dashboard
// ------------------------------------------------------------
// GET  → effective routing table (provider/model/enabled per task) + provider
//        health + override source. Optional ?mode=premium.
// POST { stage, provider?, model?, enabled? } → set a durable override.
//      { stage, clear: true }                 → revert that task to its default.
//      { clearAll: true }                     → revert every task.
// Admin + settings.manage gated (read needs logs.view). Persists via the
// AI-routing override store (Upstash when configured → fleet-wide + durable).
// ============================================================

import { NextResponse } from 'next/server';
import { requireAdmin, contextCan } from '@/lib/admin/context';
import { getEffectiveRouting } from '@/lib/ai/ai-ops/effective-routing';
import {
  setRoutingOverride,
  clearRoutingOverride,
  clearAllRoutingOverrides,
} from '@/lib/ai/ai-ops/routing-store';
import { getTaskByStage } from '@/lib/ai/ai-ops/task-registry';
import { ProviderStage, AiProviderName, AnalysisMode } from '@/lib/ai/ai-ops/schemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function guard(perm: 'logs.view' | 'settings.manage') {
  const admin = await requireAdmin();
  if (!admin.ok) return { error: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) };
  if (!contextCan(admin, perm)) {
    return { error: NextResponse.json({ error: 'forbidden' }, { status: 403 }), admin: null };
  }
  return { error: null, admin };
}

function parseMode(raw: string | null): AnalysisMode {
  return raw === 'premium' ? 'premium' : 'standard';
}

export async function GET(req: Request) {
  const { error } = await guard('logs.view');
  if (error) return error;
  const mode = parseMode(new URL(req.url).searchParams.get('mode'));
  const snapshot = await getEffectiveRouting(mode);
  return NextResponse.json({ ok: true, ...snapshot });
}

export async function POST(req: Request) {
  const { error } = await guard('settings.manage');
  if (error) return error;

  let body: {
    stage?: string;
    provider?: string;
    model?: string | null;
    enabled?: boolean;
    clear?: boolean;
    clearAll?: boolean;
  } = {};
  try {
    body = await req.json();
  } catch {
    /* empty body */
  }

  if (body.clearAll) {
    await clearAllRoutingOverrides();
    return NextResponse.json({ ok: true, ...(await getEffectiveRouting('standard')) });
  }

  const stageParse = ProviderStage.safeParse(body.stage);
  if (!stageParse.success) {
    return NextResponse.json({ error: 'invalid-stage' }, { status: 400 });
  }
  const stage = stageParse.data;

  if (body.clear) {
    await clearRoutingOverride(stage);
    return NextResponse.json({ ok: true, ...(await getEffectiveRouting('standard')) });
  }

  const task = getTaskByStage(stage);
  // Guard: only allow re-routing tasks that are reroutable, to a provider the
  // task actually permits (never let an LLM masquerade as the CV measurement).
  if (!task || !task.reroutable) {
    return NextResponse.json({ error: 'task-not-reroutable' }, { status: 400 });
  }

  const patch: { provider?: AiProviderName; model?: string | null; enabled?: boolean } = {};

  if (body.provider !== undefined) {
    const provParse = AiProviderName.safeParse(body.provider);
    if (!provParse.success || !task.allowedProviders.includes(provParse.data)) {
      return NextResponse.json({ error: 'invalid-provider' }, { status: 400 });
    }
    patch.provider = provParse.data;
  }
  if (body.model !== undefined) {
    if (body.model !== null && typeof body.model !== 'string') {
      return NextResponse.json({ error: 'invalid-model' }, { status: 400 });
    }
    patch.model = body.model;
  }
  if (body.enabled !== undefined) {
    if (typeof body.enabled !== 'boolean') {
      return NextResponse.json({ error: 'invalid-enabled' }, { status: 400 });
    }
    patch.enabled = body.enabled;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'nothing-to-update' }, { status: 400 });
  }

  await setRoutingOverride(stage, patch);
  return NextResponse.json({ ok: true, ...(await getEffectiveRouting('standard')) });
}
