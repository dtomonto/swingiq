// ============================================================
// SwingVantage — Video Studio: SEO / AEO / GEO helpers
// ------------------------------------------------------------
// IN PLAIN ENGLISH (start here):
//   Builds the schema.org VideoObject markup for a PUBLIC video, plus an
//   answer-engine-friendly summary. Search and AI answer engines use this
//   to understand and surface the video. We only emit fields we can truly
//   populate (no fake views/ratings) — same honest rule as lib/seo.
// ============================================================

import { siteConfig, absoluteUrl } from '@/config/site';
import type { VideoAsset, VideoCreativeBrief } from './types';

type Json = Record<string, unknown>;

/** Seconds → ISO-8601 duration (e.g. 90 → "PT1M30S"). */
export function isoDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `PT${m}M${rem}S`;
}

export interface VideoObjectInput {
  asset: VideoAsset;
  /** Page the video is embedded on (site-relative). */
  path: string;
  /** Optional brief for richer description/transcript. */
  brief?: VideoCreativeBrief;
}

/**
 * schema.org VideoObject for a published video. `contentUrl` is only set
 * when a real (non-placeholder) file exists — we never claim a video that
 * isn't there. `thumbnailUrl` falls back to the generated poster.
 */
export function videoObjectSchema(input: VideoObjectInput): Json {
  const { asset, path, brief } = input;
  const contentUrl = asset.src ?? asset.mp4Src ?? asset.webmSrc ?? asset.hlsSrc;
  const thumb = asset.thumbnail ?? asset.poster;

  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: asset.title,
    description: brief?.aeoSummary ?? asset.description,
    ...(thumb ? { thumbnailUrl: thumb } : {}),
    uploadDate: asset.seoUploadDate,
    ...(asset.seoUpdatedDate ? { dateModified: asset.seoUpdatedDate } : {}),
    duration: isoDuration(asset.durationSec),
    ...(contentUrl ? { contentUrl } : {}),
    ...(asset.transcript ? { transcript: asset.transcript } : {}),
    embedUrl: absoluteUrl(path),
    inLanguage: 'en',
    isFamilyFriendly: true,
    isAccessibleForFree: true,
    publisher: {
      '@type': 'Organization',
      name: siteConfig.siteName,
      logo: absoluteUrl('/icon-512.png'),
    },
    ...(asset.captions.length
      ? {
          hasPart: asset.captions.map((c) => ({
            '@type': 'Clip',
            name: `${c.label} captions`,
          })),
        }
      : {}),
  };
}
