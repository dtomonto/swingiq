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
import { WhatHappensToMyVideo } from '@/components/trust/WhatHappensToMyVideo';
import { SafeUploadExplainer } from '@/components/trust/SafeUploadExplainer';

export function VideoPageRouter() {
  const { activeSport } = useSport();

  return (
    <>
      {/* Pre-analysis quality + filming tips (agent layer). Collapses when empty. */}
      <div className="px-6 pt-6 max-w-5xl mx-auto empty:hidden">
        <IntakeQualityHint />
      </div>

      {/* Upload trust + safety, collapsible so it never blocks the tool. */}
      <div className="px-6 pt-4 max-w-5xl mx-auto">
        <details className="group">
          <summary className="cursor-pointer list-none text-sm font-medium text-primary hover:underline">
            What happens to my video? (privacy &amp; upload tips)
          </summary>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <WhatHappensToMyVideo />
            <SafeUploadExplainer />
          </div>
        </details>
      </div>

      {activeSport === 'golf' ? <VideoAnalyzerContent /> : <SportVideoAnalyzerContent />}
    </>
  );
}
