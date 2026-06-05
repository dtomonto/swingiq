'use client';

// ============================================================
// SwingVantage — AI Not Configured Notice
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
      <div className="rounded-2xl border border-warning/30 bg-warning/10 p-6 text-center space-y-4">
        <div className="flex justify-center">
          <span className="flex items-center justify-center w-12 h-12 rounded-full bg-warning/15">
            <AlertTriangle className="w-6 h-6 text-warning" />
          </span>
        </div>
        <h2 className="text-lg font-bold text-foreground">
          AI visual analysis isn&apos;t set up yet
        </h2>
        <p className="text-sm text-foreground leading-relaxed">{message}</p>

        <div className="rounded-xl bg-card border border-warning/30 p-4 text-left">
          <p className="text-xs font-semibold text-foreground mb-1">Why you&apos;re seeing this</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            SwingVantage only shows mechanical feedback that an AI vision model actually produced from
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
