// ============================================================
// GET /api/video-studio/providers  — provider status + budget + storage
// Admin-only. Drives the Settings tab (honest "what's connected").
// ============================================================

import { NextResponse, type NextRequest } from 'next/server';
import { getProviderConfigs, globalMaxCostCents, getRepo } from '@/lib/video-studio';
import { requireAdmin } from '@/lib/video-studio/server/guards';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  const repo = getRepo();
  return NextResponse.json({
    providers: getProviderConfigs(),
    budgetCents: globalMaxCostCents(),
    storage: { persistent: repo.isPersistent(), label: repo.backendLabel() },
  });
}
