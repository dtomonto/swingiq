// ============================================================
// /api/admin/copilot — Admin Copilot (read-only)
// ------------------------------------------------------------
// Answers a founder/operator question from the live, aggregate admin
// snapshot. Re-asserts admin (+ RBAC analytics.view) on every call.
//
// SAFETY: this endpoint is strictly READ-ONLY. It composes existing
// honest data sources and returns a structured answer — it never
// publishes, emails, deletes, or mutates anything. The deterministic
// engine is the default; an optional, env-gated, clearly-labeled AI
// layer can refine the answer when explicitly enabled.
//
//   POST { query: string }            → free-text question
//   POST { intent: CopilotIntent }    → a known suggested question
// ============================================================

import { NextResponse } from 'next/server';
import { requireAdmin, contextCan } from '@/lib/admin/context';
import { buildCopilotSnapshot } from '@/lib/admin/copilot/snapshot';
import { answerCopilotQuestion, answerCopilotIntent } from '@/lib/admin/copilot/engine';
import { runCopilotAi } from '@/lib/admin/copilot/ai-seam';
import { ensureCopilotAiAdapter } from '@/lib/admin/copilot/ai-adapter';
import { COPILOT_INTENTS, type CopilotIntent } from '@/lib/admin/copilot/questions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_INTENTS = new Set<string>(COPILOT_INTENTS.map((i) => i.id));

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!contextCan(admin, 'analytics.view')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  let body: { query?: string; intent?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* empty body */
  }

  const query = typeof body.query === 'string' ? body.query.slice(0, 500) : '';
  const intent = typeof body.intent === 'string' && VALID_INTENTS.has(body.intent) ? (body.intent as CopilotIntent) : null;

  if (!query && !intent) {
    return NextResponse.json({ error: 'invalid', message: 'Provide a `query` string or a valid `intent`.' }, { status: 400 });
  }

  const snapshot = await buildCopilotSnapshot();
  const computed = intent ? answerCopilotIntent(snapshot, intent) : answerCopilotQuestion(snapshot, query);

  // Optional AI refinement — off by default; falls back to the computed answer.
  // Registers the real model adapter once; it self-gates on provider + budget.
  ensureCopilotAiAdapter();
  const enhanced = await runCopilotAi({ query: query || intent || '', snapshot, computed });
  const answer = enhanced ?? computed;

  return NextResponse.json({
    ok: true,
    answer,
    meta: {
      generatedAt: snapshot.generatedAt,
      connected: snapshot.connected,
      actor: admin.email ?? 'header-admin',
    },
  });
}
