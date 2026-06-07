// ============================================================
// /api/growth/seed — load GrowthOS starter data into the DB (admin-guarded)
// ------------------------------------------------------------
// One-time helper: upserts the demo seed records into Supabase so a fresh
// install has useful starter content. Idempotent (upsert by id). No-op-safe
// when Supabase isn't configured (writes go to the in-process store).
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { seedGrowthData, isGrowthPersistent } from '@/lib/growth/repository';

function isAdmin(req: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return process.env.NODE_ENV === 'development';
  return req.headers.get('x-admin-secret') === secret;
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: 'Admin authorization required.' }, { status: 401 });
  }
  try {
    const result = await seedGrowthData();
    return NextResponse.json({ ok: true, ...result, persistent: isGrowthPersistent() });
  } catch (err) {
    console.error('[GrowthOS seed] failed:', err);
    return NextResponse.json({ error: 'Seeding failed. Check server logs.' }, { status: 500 });
  }
}
