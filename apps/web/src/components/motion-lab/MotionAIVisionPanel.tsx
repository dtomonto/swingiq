'use client';

// ============================================================
// SwingVantage — Motion Lab: AI Vision Review
// ------------------------------------------------------------
// Brings the cloud AI-vision review (previously the standalone Video
// Analysis tool) INTO Motion Lab, run on the SAME clip the lab just
// reconstructed in 3D. It reuses the exact pipeline the old analyzer
// used — `useSwingAnalysis` → `runSwingAnalysis` → /api/video-vision-analysis
// → `AIVisualAnalysisPanel` — so there is no second implementation to
// keep in sync.
//
// It is OPT-IN: Motion Lab's on-device 3D result renders instantly; the
// AI review (which sends sampled still frames to a third-party provider)
// only runs when the user asks for it. Privacy/honesty are unchanged from
// the original tool: the full video never leaves the device, only sampled
// frames are sent, and results stay an honest visual estimate. When no AI
// vision provider is configured we show the same plain "not set up" notice
// rather than fabricating feedback.
// ============================================================

import { Sparkles, Zap, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { AnalysisProgress } from '@/components/video/AnalysisProgress';
import { AIVisualAnalysisPanel } from '@/components/video/AIVisualAnalysisPanel';
import { AINotConfiguredNotice } from '@/components/video/AINotConfiguredNotice';
import { useSwingAnalysis } from '@/lib/video/useSwingAnalysis';
import type { CaptureContext } from '@/lib/motion-lab';
import type { VisualSport } from '@swingiq/core';

interface Props {
  /** The clip Motion Lab just analysed (in-memory File from the live session). */
  file: File;
  capture: CaptureContext;
  sportLabel: string;
  emoji?: string;
}

export function MotionAIVisionPanel({ file, capture, sportLabel, emoji }: Props) {
  // Same hook the old analyzer used: runs the AI review as a background task so
  // the user can leave Motion Lab while it works and is pulled back when ready.
  const swing = useSwingAnalysis();

  const run = () => {
    swing.start(
      {
        videoFile: file,
        // CaptureContext.sport is SportId, which VisualSport mirrors exactly.
        sport: capture.sport as VisualSport,
        sportLabel,
        emoji,
        // CameraView ('face_on' | 'down_the_line' | 'side' | 'unknown') matches
        // the analyzer's declared-angle vocabulary 1:1.
        declaredCameraAngle: capture.view,
        previous: null,
        speed: 'balanced',
      },
      {
        title: `AI vision review · ${sportLabel.toLowerCase()}`,
        description: file.name,
        viewHref: '/motion-lab',
      },
    );
  };

  // ── Running ────────────────────────────────────────────────
  if (swing.isRunning) {
    return (
      <div className="max-w-xl mx-auto py-6">
        <div className="text-center mb-6">
          <Loader2 className="w-7 h-7 animate-spin text-primary mx-auto mb-2" />
          <h3 className="text-base font-semibold text-foreground">Running AI vision review</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Sampling still frames and asking an AI vision model what it can see. You can keep using
            Motion Lab — this finishes in the background.
          </p>
        </div>
        <AnalysisProgress stage={swing.stage} />
      </div>
    );
  }

  // ── Result / not-configured / error ────────────────────────
  if (swing.status === 'success') {
    if (swing.notConfiguredMessage) {
      return (
        <AINotConfiguredNotice
          message={swing.notConfiguredMessage}
          onRetry={run}
          onStartOver={() => swing.reset()}
        />
      );
    }
    if (swing.analysis) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground">AI Vision Review</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={run}>
              <Zap className="w-4 h-4" /> Re-run
            </Button>
          </div>
          <AIVisualAnalysisPanel analysis={swing.analysis} />
        </div>
      );
    }
  }

  // ── Idle (and error) — the opt-in CTA ──────────────────────
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardBody className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-base font-bold text-foreground">AI Vision Review</h2>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {emoji && <span className="mr-1">{emoji}</span>}
          On top of the on-device 3D reconstruction, get a second read from an AI vision model — it
          samples still frames across your {sportLabel.toLowerCase()} and describes what it can
          actually see, with honest confidence and a phase-by-phase priority list.
        </p>

        {swing.error && (
          <div className="rounded-lg bg-error/10 border border-error/30 p-3 flex gap-2">
            <AlertCircle className="w-4 h-4 text-error shrink-0 mt-0.5" />
            <p className="text-sm text-error">{swing.error}</p>
          </div>
        )}

        <Button onClick={run} className="w-full sm:w-auto">
          <Zap className="w-4 h-4" /> Run AI vision review
        </Button>

        <div className="flex items-start gap-2 rounded-lg bg-card border border-border p-2.5">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            A few sampled still frames are sent to a third-party AI provider (such as Google or
            OpenAI) and processed in that provider&apos;s cloud. Your full video is never uploaded,
            and the frames are not stored. Everything else in Motion Lab stays entirely on your
            device.
          </p>
        </div>
      </CardBody>
    </Card>
  );
}
