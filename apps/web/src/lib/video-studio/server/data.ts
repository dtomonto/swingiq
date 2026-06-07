// ============================================================
// SwingVantage — Video Studio: server data helpers
// ------------------------------------------------------------
// Small shared helpers for the API routes + admin page so opportunity
// lookups behave the same everywhere, including when nothing is persisted
// yet (in-memory repo): we transparently run a scan and match by id.
// ============================================================

import { scanForOpportunities } from '../opportunity-engine';
import type { VideoOpportunity, VideoAsset } from '../types';
import type { VideoStudioRepo } from '../repo';

/**
 * Get an opportunity by id from the repo, scanning to (re)populate when it
 * isn't there. Always resolves to the deterministic opportunity for a known
 * id, so approve/brief/generate work even on a cold in-memory repo.
 */
export async function getOrScanOpportunity(
  repo: VideoStudioRepo,
  id: string,
): Promise<VideoOpportunity | undefined> {
  let opp = await repo.getOpportunity(id);
  if (!opp) {
    const scan = scanForOpportunities();
    await repo.saveOpportunities(scan).catch(() => {});
    opp = scan.find((o) => o.id === id);
  }
  return opp;
}

/** Published assets indexed by id (for placement resolution / serving). */
export async function publishedAssetMap(repo: VideoStudioRepo): Promise<Record<string, VideoAsset>> {
  const assets = await repo.listPublishedAssets();
  return Object.fromEntries(assets.map((a) => [a.id, a]));
}
