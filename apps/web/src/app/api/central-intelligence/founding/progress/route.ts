// ============================================================
// GET /api/central-intelligence/founding/progress
// ------------------------------------------------------------
// PUBLIC, privacy-safe campaign progress for the global counter banner.
// Returns ONLY aggregate numbers (qualified count, required count,
// membership gate) — never any individual user data. Cached briefly so
// the banner on every page doesn't hammer the database.
// ============================================================

import { NextResponse } from 'next/server';
import { getFoundingCampaignProgress } from '@/lib/central-intelligence/founding-server';

export const runtime = 'nodejs';
// Revalidate at most every 30s; the banner reads a near-real-time count.
export const revalidate = 30;

export async function GET() {
  try {
    const progress = await getFoundingCampaignProgress();
    return NextResponse.json(progress, {
      headers: { 'Cache-Control': 'public, max-age=30, stale-while-revalidate=120' },
    });
  } catch {
    // Never break page rendering — fall back to a safe empty-state count.
    return NextResponse.json(
      { qualifiedCount: 0, requiredCount: 1000, remaining: 1000, full: false, membershipTiersEnabled: false, membershipUnlockReason: 'unavailable' },
      { status: 200 },
    );
  }
}
