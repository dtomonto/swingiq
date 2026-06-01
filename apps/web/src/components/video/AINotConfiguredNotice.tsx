'use client';

// ============================================================
// SwingIQ — AI Not Configured Notice
// Shown when no AI vision provider is configured. This is the strict
// no-fake state: the video was received but cannot be inspected, so we
// say so plainly and never fabricate mechanical feedback.
// ============================================================

import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function AINotConfiguredNotice({
  message,
  onRetry,
  onStartOver,
}: {
  message: string;
  onRetry?: () => void;
  onStartOver?: () => void;
}) {
  return (
    <div className="max-w-xl mx-auto">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center space-y-4">
        <div className="flex justify-center">
          <span className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-100">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </span>
        </div>
        <h2 className="text-lg font-bold text-gray-900">
          AI visual analysis isn&apos;t set up yet
        </h2>
        <p className="text-sm text-gray-700 leading-relaxed">{message}</p>

        <div className="rounded-xl bg-white border border-amber-100 p-4 text-left">
          <p className="text-xs font-semibold text-gray-700 mb-1">Why you&apos;re seeing this</p>
          <p className="text-xs text-gray-600 leading-relaxed">
            SwingIQ only shows mechanical feedback that an AI vision model actually produced from
            your frames. Because no AI vision provider is connected, there&apos;s nothing real to
            show — and we won&apos;t invent it. Add an AI vision key (Anthropic, OpenAI, or Google)
            to enable real analysis.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 justify-center pt-1">
          {onRetry && (
            <Button variant="outline" onClick={onRetry}>
              <RefreshCw className="w-4 h-4" />
              Try again
            </Button>
          )}
          {onStartOver && (
            <Button variant="ghost" onClick={onStartOver}>
              Analyze a different video
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
