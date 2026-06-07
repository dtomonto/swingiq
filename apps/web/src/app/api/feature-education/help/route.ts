// ============================================================
// GET /api/feature-education/help?route=/x — PUBLISHED in-app help for a route
// ------------------------------------------------------------
// Public + rate-limited (NOT admin-guarded): returns only assets that have
// been explicitly PUBLISHED, so there is nothing sensitive to leak. The
// in-app <FeatureHelp/> reader calls this to show contextual guidance.
// ============================================================

import { NextResponse, type NextRequest } from 'next/server';
import { limited } from '@/lib/feature-education/server/guards';
import { publishedInAppHelpForRoute } from '@/lib/feature-education/server/data';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const tooMany = await limited(req, 'fee-help', 120);
  if (tooMany) return tooMany;

  const route = req.nextUrl.searchParams.get('route') ?? '';
  if (!route) return NextResponse.json({ help: [] });

  const assets = await publishedInAppHelpForRoute(route);
  const help = assets
    .map((a) =>
      a.inAppHelp
        ? {
            id: a.id,
            placement: a.inAppHelp.placement,
            headline: a.inAppHelp.headline,
            body: a.inAppHelp.body,
            learnMoreHref: a.inAppHelp.learnMoreHref,
          }
        : null,
    )
    .filter(Boolean);
  return NextResponse.json({ help });
}
