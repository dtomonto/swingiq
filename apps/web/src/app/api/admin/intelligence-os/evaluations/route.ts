// GET  /api/admin/intelligence-os/evaluations — list evaluation records
// POST /api/admin/intelligence-os/evaluations — create an evaluation record
import { NextResponse } from 'next/server';
import { evaluationRepo } from '@/lib/intelligence-os/store';
import { createEvaluation } from '@/lib/intelligence-os/service';
import { EVALUATOR_TYPES } from '@/lib/intelligence-os/types';
import { guard, readJson } from '../_guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const { error } = await guard('logs.view');
  if (error) return error;
  const items = (await evaluationRepo.list()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return NextResponse.json({ ok: true, items, total: items.length });
}

export async function POST(req: Request) {
  const { error } = await guard('ai.review');
  if (error) return error;
  const b = await readJson<Record<string, unknown>>(req);
  if (!b.evaluatedObjectId || !b.evaluatedObjectType) {
    return NextResponse.json({ error: 'evaluated-object-required' }, { status: 400 });
  }
  const record = await createEvaluation({
    evaluatedObjectType: b.evaluatedObjectType as never,
    evaluatedObjectId: String(b.evaluatedObjectId),
    evaluatorType: EVALUATOR_TYPES.includes(b.evaluatorType as never) ? b.evaluatorType as never : 'admin-review',
    evaluatorRef: b.evaluatorRef ? String(b.evaluatorRef) : null,
    scores: (b.scores && typeof b.scores === 'object' ? b.scores : {}) as never,
    notes: b.notes ? String(b.notes) : undefined,
    recommendedAction: b.recommendedAction as never,
  });
  return NextResponse.json({ ok: true, record });
}
