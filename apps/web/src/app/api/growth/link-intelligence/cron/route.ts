// ============================================================
// GET /api/growth/link-intelligence/cron — scheduled agent entry point.
//
// Vercel Cron hits this (GET) with `Authorization: Bearer <CRON_SECRET>`.
// Also callable manually by a logged-in admin. Allow-listed in middleware.ts
// (cron has no Supabase session) and self-protects via the secret / admin
// check. ?cadence=daily|weekly|monthly (default weekly).
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedAdmin } from '@/lib/social/admin-guard';
import { runLinkAgent, persistLinkAgentResult } from '@/lib/growth/link-intelligence';
import type { LinkRunCadence } from '@/lib/growth/types';

// Generous ceiling for cold starts + Supabase latency (handler itself ~2s).
export const maxDuration = 60;

const CADENCES: LinkRunCadence[] = ['daily', 'weekly', 'monthly'];

async function authorized(req: NextRequest): Promise<boolean> {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get('authorization') === `Bearer ${secret}`) return true;
  if (await isAuthorizedAdmin(req)) return true;
  if (!secret && process.env.NODE_ENV !== 'production') return true;
  return false;
}

export async function GET(req: NextRequest) {
  if (!(await authorized(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const raw = new URL(req.url).searchParams.get('cadence');
  const cadence: LinkRunCadence = CADENCES.includes(raw as LinkRunCadence) ? (raw as LinkRunCadence) : 'weekly';

  const result = runLinkAgent({ cadence });
  const { persisted } = await persistLinkAgentResult(result);

  return NextResponse.json({
    ok: true,
    cadence,
    persisted,
    summary: result.run.summary,
    internalLinkHealth: result.run.internalLinkHealth,
    notifications: result.notifications.length,
  });
}

// Allow manual POST too (admin "run now").
export const POST = GET;
