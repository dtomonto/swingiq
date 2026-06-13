// GET   /api/admin/intelligence-os/knowledge  — search/filter knowledge items
// POST  /api/admin/intelligence-os/knowledge  — create a manual knowledge item
// PATCH /api/admin/intelligence-os/knowledge  — review/update/outcome/canonicalize
import { NextResponse } from 'next/server';
import { knowledgeRepo } from '@/lib/intelligence-os/store';
import {
  createKnowledge, reviewKnowledge, updateKnowledge, recordKnowledgeOutcome, canonicalizeKnowledge,
} from '@/lib/intelligence-os/service';
import { KNOWLEDGE_TYPES, VALIDATION_STATUSES, SPORTS } from '@/lib/intelligence-os/types';
import { guard, readJson } from '../_guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { error } = await guard('logs.view');
  if (error) return error;
  const url = new URL(req.url);
  const q = (url.searchParams.get('q') ?? '').toLowerCase();
  const status = url.searchParams.get('status');
  const sport = url.searchParams.get('sport');
  const type = url.searchParams.get('type');

  let items = await knowledgeRepo.list();
  if (q) items = items.filter((k) => `${k.title} ${k.canonicalQuestion} ${k.topic} ${k.userIntent}`.toLowerCase().includes(q));
  if (status) items = items.filter((k) => k.validationStatus === status);
  if (sport) items = items.filter((k) => k.sport === sport);
  if (type) items = items.filter((k) => k.knowledgeType === type);
  items.sort((a, b) => b.usageCount - a.usageCount || b.confidenceScore - a.confidenceScore);
  return NextResponse.json({ ok: true, items, total: items.length });
}

export async function POST(req: Request) {
  const { error } = await guard('ai.review');
  if (error) return error;
  const b = await readJson<Record<string, unknown>>(req);
  if (!b.title || !b.canonicalAnswer) return NextResponse.json({ error: 'title-and-answer-required' }, { status: 400 });
  const item = await createKnowledge({
    title: String(b.title),
    knowledgeType: KNOWLEDGE_TYPES.includes(b.knowledgeType as never) ? b.knowledgeType as never : 'coaching-answer',
    sport: SPORTS.includes(b.sport as never) ? b.sport as never : 'none',
    topic: String(b.topic ?? ''),
    userIntent: String(b.userIntent ?? b.title),
    canonicalQuestion: String(b.canonicalQuestion ?? b.title),
    canonicalAnswer: String(b.canonicalAnswer),
    structuredSteps: Array.isArray(b.structuredSteps) ? (b.structuredSteps as string[]) : undefined,
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
    const item = await reviewKnowledge(id, b.status as never, admin.email);
    return item ? NextResponse.json({ ok: true, item }) : NextResponse.json({ error: 'not-found' }, { status: 404 });
  }
  if (b.action === 'outcome' && (b.outcome === 'success' || b.outcome === 'failure')) {
    const item = await recordKnowledgeOutcome(id, b.outcome);
    return item ? NextResponse.json({ ok: true, item }) : NextResponse.json({ error: 'not-found' }, { status: 404 });
  }
  if (b.action === 'canonicalize') {
    const canonical = await canonicalizeKnowledge(id);
    return canonical ? NextResponse.json({ ok: true, canonical }) : NextResponse.json({ error: 'not-found' }, { status: 404 });
  }
  // generic field update
  const patch = b.patch && typeof b.patch === 'object' ? b.patch as Record<string, unknown> : {};
  const item = await updateKnowledge(id, patch);
  return item ? NextResponse.json({ ok: true, item }) : NextResponse.json({ error: 'not-found' }, { status: 404 });
}
