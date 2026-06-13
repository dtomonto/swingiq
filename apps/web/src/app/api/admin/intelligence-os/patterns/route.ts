// GET  /api/admin/intelligence-os/patterns          — list pattern memories
// GET  /api/admin/intelligence-os/patterns?fixPacket=<id> — generate a fix packet
// POST /api/admin/intelligence-os/patterns          — record/dedupe a pattern
import { NextResponse } from 'next/server';
import { patternRepo } from '@/lib/intelligence-os/store';
import { recordPattern } from '@/lib/intelligence-os/router';
import { generateFixPacketFromPattern } from '@/lib/intelligence-os/service';
import { PATTERN_TYPES, SPORTS } from '@/lib/intelligence-os/types';
import { guard, readJson } from '../_guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { error } = await guard('logs.view');
  if (error) return error;
  const url = new URL(req.url);
  const fixPacket = url.searchParams.get('fixPacket');
  if (fixPacket) {
    const packet = await generateFixPacketFromPattern(fixPacket);
    return packet ? NextResponse.json({ ok: true, packet }) : NextResponse.json({ error: 'not-found' }, { status: 404 });
  }
  const type = url.searchParams.get('type');
  let items = await patternRepo.list();
  if (type) items = items.filter((p) => p.patternType === type);
  items.sort((a, b) => b.occurrenceCount - a.occurrenceCount);
  return NextResponse.json({ ok: true, items, total: items.length });
}

export async function POST(req: Request) {
  const { error } = await guard('ai.review');
  if (error) return error;
  const b = await readJson<Record<string, unknown>>(req);
  if (!b.patternTitle) return NextResponse.json({ error: 'patternTitle-required' }, { status: 400 });
  const pattern = await recordPattern({
    patternTitle: String(b.patternTitle),
    patternType: PATTERN_TYPES.includes(b.patternType as never) ? b.patternType as never : 'recurring-user-question',
    summary: String(b.summary ?? ''),
    affectedFeature: String(b.affectedFeature ?? 'unknown'),
    affectedSport: SPORTS.includes(b.affectedSport as never) ? b.affectedSport as never : 'none',
    affectedRoute: b.affectedRoute ? String(b.affectedRoute) : null,
    relatedEventId: b.relatedEventId ? String(b.relatedEventId) : null,
    recommendedPrevention: b.recommendedPrevention ? String(b.recommendedPrevention) : undefined,
    recommendedAutomation: b.recommendedAutomation ? String(b.recommendedAutomation) : undefined,
    tags: Array.isArray(b.tags) ? (b.tags as string[]) : undefined,
  });
  return NextResponse.json({ ok: true, pattern });
}
