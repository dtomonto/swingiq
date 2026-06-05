// ============================================================
// SwingVantage — Video Studio: VideoObject JSON-LD
// ------------------------------------------------------------
// Emits schema.org VideoObject markup for a PUBLIC video so search/answer
// engines can understand it. Server-safe (no 'use client'). Only renders
// when given a published asset; never fabricates fields it can't fill.
// ============================================================

import { videoObjectSchema } from '@/lib/video-studio/seo';
import type { VideoAsset, VideoCreativeBrief } from '@/lib/video-studio/types';

interface VideoObjectSchemaProps {
  asset: VideoAsset;
  /** Site-relative path the video is embedded on. */
  path: string;
  brief?: VideoCreativeBrief;
}

export function VideoObjectSchema({ asset, path, brief }: VideoObjectSchemaProps) {
  if (!asset.published) return null;
  const graph = videoObjectSchema({ asset, path, brief });
  return (
    <script
      type="application/ld+json"
      // JSON is serialized by us from typed inputs — safe.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
