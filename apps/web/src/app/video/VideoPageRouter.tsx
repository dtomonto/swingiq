'use client';

// ============================================================
// VideoPageRouter — sport-aware dispatcher
// Renders the golf analyzer or the multi-sport analyzer
// depending on which sport is currently active.
// ============================================================

import { useSport } from '@/contexts/SportContext';
import { VideoAnalyzerContent } from './VideoAnalyzerContent';
import { SportVideoAnalyzerContent } from './SportVideoAnalyzerContent';

export function VideoPageRouter() {
  const { activeSport } = useSport();

  if (activeSport === 'golf') {
    return <VideoAnalyzerContent />;
  }

  return <SportVideoAnalyzerContent />;
}
