// ============================================================
// GET /api/video-studio/serve?placement=ID&sport=&device=
//
// PUBLIC + rate-limited. Resolves a placement id to its rules + the
// PUBLISHED asset to render (drafts are never returned). SmartVideoSlot
// can call this client-side to hydrate a placement. Returns fallback:true
// when there's nothing servable, so the slot shows its honest written state.
// ============================================================

import { NextResponse, type NextRequest } from 'next/server';
import { getRepo, resolvePlacement, SPORTS } from '@/lib/video-studio';
import type { StudioSport } from '@/lib/video-studio';
import { publishedAssetMap } from '@/lib/video-studio/server/data';
import { limited } from '@/lib/video-studio/server/guards';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const tooMany = await limited(req, 'video-studio-serve', 120);
  if (tooMany) return tooMany;

  const { searchParams } = new URL(req.url);
  const placementId = searchParams.get('placement');
  if (!placementId) {
    return NextResponse.json({ error: 'Missing ?placement=' }, { status: 400 });
  }
  const sportParam = searchParams.get('sport');
  const sport = (SPORTS as readonly string[]).includes(sportParam ?? '')
    ? (sportParam as StudioSport)
    : 'all';
  const deviceParam = searchParams.get('device');
  const device = deviceParam === 'mobile' || deviceParam === 'desktop' ? deviceParam : undefined;

  const repo = getRepo();
  const [studio, assets] = await Promise.all([repo.listPlacements(), publishedAssetMap(repo)]);
  const resolved = resolvePlacement(placementId, { studio, assets, sport, device });

  if (!resolved) return NextResponse.json({ error: 'Unknown placement.' }, { status: 404 });
  return NextResponse.json(resolved);
}
