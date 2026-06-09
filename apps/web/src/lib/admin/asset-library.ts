// ============================================================
// SwingVantage Admin — Digital Asset Library (SERVER-SAFE aggregator)
// ------------------------------------------------------------
// One internal catalog of every piece of GENERATED media across the app.
// Registry-derived (not a filesystem crawl), so it stays self-maintaining:
// new recordings/assets appear automatically because we read the same
// registries the product uses.
//
// Extensible by design: add a media source = add one collector function and
// push it into buildAssetLibrary(). Today: library training videos, feature
// walkthroughs (Tutorial Center), and Video Studio assets. Brand/social
// creative can plug in the same way later.
//
// Read-only: this catalogs what exists; it never mutates media.
// ============================================================

import { getLibraryItems } from '@/lib/library';
import { getRepo } from '@/lib/video-studio';

export type AssetSource = 'training-video' | 'feature-walkthrough' | 'video-studio';
export type AssetFileKind = 'mp4' | 'poster' | 'captions';

export interface AssetFile {
  kind: AssetFileKind;
  /** Public path or URL to the concrete file. */
  path: string;
}

export interface AssetRecord {
  id: string;
  title: string;
  description?: string;
  source: AssetSource;
  sourceLabel: string;
  /** Thumbnail/poster for the grid. */
  poster?: string;
  durationSec?: number;
  durationLabel?: string;
  /** The concrete generated files this asset is made of. */
  files: AssetFile[];
  /** A real recording/render exists (vs. a planned or placeholder asset). */
  recorded: boolean;
  /** Exposed on a public surface. */
  public: boolean;
  /** Video Studio placeholder (poster/captions only, no real footage yet). */
  placeholder?: boolean;
  category?: string;
  /** Where the asset is surfaced (route or surface name). */
  usedOn?: string;
}

export interface AssetLibrary {
  records: AssetRecord[];
  stats: {
    total: number;
    bySource: Record<AssetSource, number>;
    recorded: number;
    publicCount: number;
    totalDurationSec: number;
    fileCount: number;
  };
}

function fmtDuration(totalSec?: number): string | undefined {
  if (!totalSec || totalSec <= 0) return undefined;
  const m = Math.floor(totalSec / 60);
  const s = Math.round(totalSec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Library training videos + feature walkthroughs that have real media. */
function collectLibrary(): AssetRecord[] {
  return getLibraryItems()
    .filter((i) => i.hasRecording)
    .map((i): AssetRecord => {
      const files: AssetFile[] = [];
      if (i.mp4Src) files.push({ kind: 'mp4', path: i.mp4Src });
      if (i.poster) files.push({ kind: 'poster', path: i.poster });
      if (i.captionsSrc) files.push({ kind: 'captions', path: i.captionsSrc });
      const isWalkthrough = i.source === 'tutorial';
      return {
        id: i.id,
        title: i.title,
        description: i.description,
        source: isWalkthrough ? 'feature-walkthrough' : 'training-video',
        sourceLabel: isWalkthrough ? 'Feature walkthrough' : 'Training video',
        poster: i.poster,
        durationSec: i.durationSec,
        durationLabel: i.durationLabel,
        files,
        recorded: true,
        public: i.public,
        category: i.category,
        usedOn: i.public ? `/learn/${i.id}` : '/library',
      };
    });
}

/** Video Studio generated assets — best-effort (empty when no store/backend). */
async function collectVideoStudio(): Promise<AssetRecord[]> {
  try {
    const assets = await getRepo().listAssets();
    return assets.map((a): AssetRecord => {
      const files: AssetFile[] = [];
      const playable = a.mp4Src ?? a.src;
      const poster = a.poster ?? a.thumbnail;
      if (playable) files.push({ kind: 'mp4', path: playable });
      if (poster) files.push({ kind: 'poster', path: poster });
      if (a.captions?.[0]?.src) files.push({ kind: 'captions', path: a.captions[0].src });
      return {
        id: a.id,
        title: a.title,
        description: a.description,
        source: 'video-studio',
        sourceLabel: 'Video Studio',
        poster,
        durationSec: a.durationSec,
        durationLabel: fmtDuration(a.durationSec),
        files,
        recorded: !a.isPlaceholder,
        public: a.published,
        placeholder: a.isPlaceholder,
        usedOn: a.published ? 'In-app placements' : undefined,
      };
    });
  } catch {
    return []; // never break the catalog if the Video Studio store is unavailable
  }
}

const EMPTY_BY_SOURCE: Record<AssetSource, number> = {
  'training-video': 0,
  'feature-walkthrough': 0,
  'video-studio': 0,
};

/** Build the full, deduped, sorted asset catalog with summary stats. */
export async function buildAssetLibrary(): Promise<AssetLibrary> {
  const collected = [...collectLibrary(), ...(await collectVideoStudio())];

  // Dedupe by source+id (an asset can only appear once).
  const seen = new Set<string>();
  const records = collected.filter((r) => {
    const key = `${r.source}:${r.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  records.sort(
    (a, b) => a.sourceLabel.localeCompare(b.sourceLabel) || a.title.localeCompare(b.title),
  );

  const bySource: Record<AssetSource, number> = { ...EMPTY_BY_SOURCE };
  let recorded = 0;
  let publicCount = 0;
  let totalDurationSec = 0;
  let fileCount = 0;
  for (const r of records) {
    bySource[r.source] += 1;
    if (r.recorded) recorded += 1;
    if (r.public) publicCount += 1;
    totalDurationSec += r.durationSec ?? 0;
    fileCount += r.files.length;
  }

  return {
    records,
    stats: { total: records.length, bySource, recorded, publicCount, totalDurationSec, fileCount },
  };
}
