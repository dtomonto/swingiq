// ============================================================
// /api/admin/intelligence-os/resolve — run the intelligence router
// ------------------------------------------------------------
// Lets admins (and, later, instrumented features) ask the First-Party
// Intelligence OS to answer a request via the cheapest reliable path. This
// route never calls a third-party model itself — if AI is required it returns
// a `needsThirdParty` decision so the caller decides (honest, no fabrication).
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin, contextCan } from '@/lib/admin/context';
import { resolveWithFirstPartyIntelligence } from '@/lib/intelligence-os/router';
import { AiSource, Sport } from '@/lib/intelligence-os/types';

const RequestSchema = z.object({
  query: z.string().min(1),
  feature: z.string().min(1),
  source: AiSource,
  sport: Sport.nullable().optional(),
  userId: z.string().nullable().optional(),
  personalized: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!contextCan(admin, 'analytics.view')) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'validation', issues: parsed.error.issues }, { status: 400 });
  }

  try {
    const { decision, event } = await resolveWithFirstPartyIntelligence(parsed.data);
    return NextResponse.json({ ok: true, decision, eventId: event.id });
  } catch (err) {
    return NextResponse.json({ error: 'resolve_failed', message: (err as Error).message }, { status: 500 });
  }
}
