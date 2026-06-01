'use client';

import { useMemo } from 'react';
import { CheckCircle2, Camera, Lightbulb } from 'lucide-react';
import { useAgentContext } from '@/hooks/useAgentContext';
import { assessIntakeQuality } from '@/lib/agents';

// Friendly, NON-blocking pre-analysis quality hint. Improves upload quality
// before analysis. Shows nothing if the upload is already perfect.

export function IntakeQualityHint() {
  const { ready, ctx } = useAgentContext();

  const result = useMemo(() => (ctx ? assessIntakeQuality(ctx) : null), [ctx]);

  if (!ready || !result) return null;

  const nothingToSay = result.improvements.length === 0 && result.filmingTips.length === 0;
  if (nothingToSay) return null;

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4" role="note" aria-label="Upload tips">
      <div className="flex items-start gap-2.5">
        <CheckCircle2 size={18} className="text-blue-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-blue-900">{result.headline}</p>

          {result.improvements.length > 0 && (
            <ul className="mt-1.5 space-y-1">
              {result.improvements.map((tip, i) => (
                <li key={i} className="text-xs text-blue-800 flex items-start gap-1.5">
                  <Lightbulb size={12} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
                  {tip}
                </li>
              ))}
            </ul>
          )}

          {result.filmingTips.length > 0 && (
            <div className="mt-2">
              <p className="text-xs font-semibold text-blue-900 flex items-center gap-1">
                <Camera size={12} aria-hidden="true" /> Filming tips
              </p>
              <ul className="mt-1 space-y-0.5">
                {result.filmingTips.map((tip, i) => (
                  <li key={i} className="text-xs text-blue-800">• {tip}</li>
                ))}
              </ul>
            </div>
          )}

          {result.allowContinueAnyway && (
            <p className="text-xs text-blue-500 mt-2">These are optional — you can continue either way.</p>
          )}
        </div>
      </div>
    </div>
  );
}
