// GET   /api/admin/intelligence-os/canonical  — list canonical answers
// POST  /api/admin/intelligence-os/canonical  — create a canonical answer
// PATCH /api/admin/intelligence-os/canonical  — review/update/invalidate
import { NextResponse } from 'next/server';
import { canonicalRepo } from '@/lib/intelligence-os/store';
import { createCanonicalAnswer, reviewCanonical, updateCanonical, invalidateCanonical } from '@/lib/intelligence-os/service';
import { ANSWER_FORMATS, VALIDATION_STATUSES, SPORTS } from '@/lib/intelligence-os/types';
import { guard, readJson } from '../_guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { error } = await guard('logs.view');
  if (error) return error;
  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  let items = await canonicalRepo.list();
  if (status) items = items.filter((c) => c.validationStatus === status);
  items.sort((a, b) => b.aiCallsAvoided - a.aiCallsAvoided);
  return NextResponse.json({ ok: true, items, total: items.length });
}

export async function POST(req: Request) {
  const { error } = await guard('ai.review');
  if (error) return error;
  const b = await readJson<Record<string, unknown>>(req);
  if (!b.canonicalQuestion || !b.canonicalAnswer) return NextResponse.json({ error: 'question-and-answer-required' }, { status: 400 });
  const item = await createCanonicalAnswer({
    canonicalQuestion: String(b.canonicalQuestion),
    canonicalAnswer: String(b.canonicalAnswer),
    answerFormat: ANSWER_FORMATS.includes(b.answerFormat as never) ? b.answerFormat as never : 'short-answer',
    topic: String(b.topic ?? ''),
    sport: SPORTS.includes(b.sport as never) ? b.sport as never : 'none',
    audience: (b.audience as never) ?? 'athlete',
    triggerPhrases: Array.isArray(b.triggerPhrases) ? (b.triggerPhrases as string[]) : undefined,
    confidenceScore: typeof b.confidenceScore === 'number' ? b.confidenceScore : undefined,
  });
  return NextResponse.json({ ok: true, item });
}

export async function PATCH(req: Request) {
  const { error, admin } = await guard('ai.review');
  if (error) return error;
  const b = await readJson<Record<string, unknown>>(req);
  const id = String(b.id ?? '');
  if (!id) return NextResponse.json({ error: 'id-required' }, { status: 400 });

  if (b.action === 'review' && VALIDATION_STATUSES.includes(b.status as never)) {
    const item = await reviewCanonical(id, b.status as never, admin.email);
    return item ? NextResponse.json({ ok: true, item }) : NextResponse.json({ error: 'not-found' }, { status: 404 });
  }
  if (b.action === 'invalidate') {
    const item = await invalidateCanonical(id, String(b.reason ?? 'manual invalidation'));
    return item ? NextResponse.json({ ok: true, item }) : NextResponse.json({ error: 'not-found' }, { status: 404 });
  }
  const patch = b.patch && typeof b.patch === 'object' ? b.patch as Record<string, unknown> : {};
  const item = await updateCanonical(id, patch);
  return item ? NextResponse.json({ ok: true, item }) : NextResponse.json({ error: 'not-found' }, { status: 404 });
}
