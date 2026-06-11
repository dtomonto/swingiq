'use client';

import { useEffect } from 'react';
import type { SportId, SwingVideoMetadata } from '@swingiq/core';
import { consumePendingClip, peekPendingClip, subscribePendingClip } from '../handoff';

type OnClip = (file: File, metadata: SwingVideoMetadata, objectUrl: string) => void;

/**
 * Bridges a RecordAssist clip into an analyzer. On mount (and whenever a clip
 * arrives) it consumes the pending clip matching `sport` and replays it through
 * the analyzer's existing `handleVideoReady`, so the guided recorder lands
 * straight on the configure screen with frames warming — no re-upload.
 */
export function useRecordAssistHandoff(sport: SportId, onClip: OnClip): void {
  useEffect(() => {
    const tryConsume = () => {
      if (!peekPendingClip()) return;
      const clip = consumePendingClip(sport);
      if (clip) onClip(clip.file, clip.metadata, clip.objectUrl);
    };
    tryConsume();
    return subscribePendingClip(tryConsume);
  }, [sport, onClip]);
}
