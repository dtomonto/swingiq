// ============================================================
// /api/admin/ai/features — turn user-facing AI features on/off from the dashboard
// ------------------------------------------------------------
// GET  → the full switchboard snapshot (per-feature state + baseline + source).
// POST → one of:
//        { id, enabled }      set a single feature on/off
//        { id, clear: true }  revert a single feature to the env baseline
//        { all: true|false }  master: turn EVERY user AI feature on/off
//        { clearAll: true }   drop all overrides (revert to baseline)
// Admin + settings.manage gated. Durable via the AI feature switchboard
// (Upstash when configured → fleet-wide; else per-instance). Admin-only AI tools
// are unaffected — they are gated separately and stay on.
// ============================================================

import { NextResponse } from 'next/server';
import { requireAdmin, contextCan } from '@/lib/admin/context';
import {
  getAiFeatureSnapshot,
  setAiFeatureEnabled,
  clearAiFeatureOverride,
  setAllUserAiEnabled,
  clearAllFeatureOverrides,
} from '@/lib/ai/ai-features';

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
  return NextResponse.json({ ok: true, snapshot: await getAiFeatureSnapshot() });
}

export async function POST(req: Request) {
  const { error } = await guard();
  if (error) return error;

  let body: { id?: string; enabled?: boolean; clear?: boolean; all?: boolean; clearAll?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    /* empty body */
  }

  try {
    if (body.clearAll) {
      await clearAllFeatureOverrides();
    } else if (typeof body.all === 'boolean') {
      await setAllUserAiEnabled(body.all);
    } else if (body.id && body.clear) {
      await clearAiFeatureOverride(body.id);
    } else if (body.id && typeof body.enabled === 'boolean') {
      await setAiFeatureEnabled(body.id, body.enabled);
    } else {
      return NextResponse.json({ error: 'invalid-request' }, { status: 400 });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'error';
    if (msg.startsWith('unknown_feature')) return NextResponse.json({ error: 'unknown-feature' }, { status: 400 });
    return NextResponse.json({ error: 'save-failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, snapshot: await getAiFeatureSnapshot() });
}
