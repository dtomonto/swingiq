// GET  /api/admin/intelligence-os/activity   — search/filter AI activity events
// POST /api/admin/intelligence-os/activity   — log an AI activity event (capture seam)
import { NextResponse } from 'next/server';
import { activityRepo } from '@/lib/intelligence-os/store';
import { logAIActivity, normalizeIntelligenceRequest, promoteEventToKnowledge } from '@/lib/intelligence-os';
import { getSettings } from '@/lib/intelligence-os/store';
import { SOURCE_SYSTEMS, SPORTS } from '@/lib/intelligence-os/types';
import { guard, readJson } from '../_guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { error } = await guard('logs.view');
  if (error) return error;
  const url = new URL(req.url);
  const q = (url.searchParams.get('q') ?? '').toLowerCase();
  const provider = url.searchParams.get('provider');
  const feature = url.searchParams.get('feature');
  const sport = url.searchParams.get('sport');
  const sort = url.searchParams.get('sort') ?? 'recent';

  let events = await activityRepo.list();
  if (q) events = events.filter((e) => `${e.userIntent} ${e.promptSummary} ${e.feature}`.toLowerCase().includes(q));
  if (provider) events = events.filter((e) => e.provider === provider);
  if (feature) events = events.filter((e) => e.feature === feature);
  if (sport) events = events.filter((e) => e.sport === sport);
  events.sort((a, b) =>
    sort === 'cost' ? b.estimatedCostCents - a.estimatedCostCents
      : sort === 'confidence' ? b.confidenceScore - a.confidenceScore
        : b.createdAt.localeCompare(a.createdAt));
  return NextResponse.json({ ok: true, events: events.slice(0, 200), total: events.length });
}

interface LogBody {
  action?: 'promote' | 'log';
  eventId?: string;
  sourceSystem?: string; feature?: string; sport?: string; request?: string; response?: string;
  provider?: string; model?: string; inputTokens?: number; outputTokens?: number; confidenceScore?: number;
}

export async function POST(req: Request) {
  const { error } = await guard('ai.review');
  if (error) return error;
  const body = await readJson<LogBody>(req);

  if (body.action === 'promote' && body.eventId) {
    const item = await promoteEventToKnowledge(body.eventId);
    if (!item) return NextResponse.json({ error: 'event-not-found' }, { status: 404 });
    return NextResponse.json({ ok: true, knowledge: item });
  }

  if (!body.request || !body.response) {
    return NextResponse.json({ error: 'request-and-response-required' }, { status: 400 });
  }
  const settings = await getSettings();
  const norm = normalizeIntelligenceRequest({
    sourceSystem: SOURCE_SYSTEMS.includes(body.sourceSystem as never) ? body.sourceSystem as never : 'manual-admin-entry',
    feature: body.feature || 'manual-admin-entry',
    sport: SPORTS.includes(body.sport as never) ? body.sport as never : 'none',
    request: body.request,
  }, settings);
  const event = await logAIActivity({
    req: norm,
    provider: (body.provider as never) ?? 'other',
    model: body.model ?? null,
    response: body.response,
    inputTokens: body.inputTokens ?? 0,
    outputTokens: body.outputTokens ?? 0,
    confidenceScore: body.confidenceScore ?? 0.5,
  });
  return NextResponse.json({ ok: true, event });
}
