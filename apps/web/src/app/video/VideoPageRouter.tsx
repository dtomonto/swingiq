'use client';

// ============================================================
// VideoPageRouter — sport-aware dispatcher
// Renders the golf analyzer or the multi-sport analyzer
// depending on which sport is currently active.
// ============================================================

import { useSport } from '@/contexts/SportContext';
import { VideoAnalyzerContent } from './VideoAnalyzerContent';
import { SportVideoAnalyzerContent } from './SportVideoAnalyzerContent';
import { IntakeQualityHint } from '@/components/agents/IntakeQualityHint';

export function VideoPageRouter() {
  const { activeSport } = useSport();

  return (
    <>
      {/* Pre-analysis quality + filming tips (agent layer). Collapses when empty. */}
      <div className="px-6 pt-6 max-w-5xl mx-auto empty:hidden">
        <IntakeQualityHint />
      </div>
      {activeSport === 'golf' ? <VideoAnalyzerContent /> : <SportVideoAnalyzerContent />}
    </>
  );
}
