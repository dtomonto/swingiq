'use client';

// ============================================================
// SwingVantage — Multi-Sport Video Analyzer
// Tennis, baseball, slow-pitch, and fast-pitch softball.
// Real AI visual analysis: extract frames in the browser -> send only
// still frames to the AI vision provider -> render the validated,
// video-grounded result. No heuristic/estimated per-video feedback.
//
// The analysis runs as a BACKGROUND TASK (see lib/background-tasks), so
// the user can leave this page while it works and gets pulled back when
// it finishes. This component is a thin view over that task; frames +
// pose are prepared speculatively and a speed/quality tier can be chosen.
// ============================================================

import { useState, useCallback, useEffect } from 'react';
import { ChevronLeft, Loader2, AlertCircle, Info, Zap, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { VideoUpload, VideoPreviewCard } from '@/components/video/VideoUpload';
import { SwingVideoPlayer } from '@/components/video/SwingVideoPlayer';
import { AnalysisProgress } from '@/components/video/AnalysisProgress';
import { AIVisualAnalysisPanel } from '@/components/video/AIVisualAnalysisPanel';
import { AINotConfiguredNotice } from '@/components/video/AINotConfiguredNotice';
import { RecordingGuide } from '@/components/video/RecordingGuide';
import { VideoWelcomeBack } from '@/components/video/VideoWelcomeBack';
import { VideoProgress } from '@/components/video/VideoProgress';
import { TutorialVideo } from '@/components/tutorial/TutorialVideo';
import { AnalysisTransparency } from '@/components/trust/AnalysisTransparency';
import { SportCardGrid } from '@/components/sport/SportSelector';
import { useSport } from '@/contexts/SportContext';
import { getSportConfig, SPORT_CAMERA_ANGLES } from '@swingiq/core';
import type { SportId, SwingVideoMetadata, VisionSpeed } from '@swingiq/core';
import { warmSwingPreparation, forgetPreparedSwing } from '@/lib/video/prepareSwing';
import { AnalysisSpeedSelector } from '@/components/video/AnalysisSpeedSelector';
import { PoseSignalsCard } from '@/components/video/PoseSignalsCard';
import { toPreviousSummary, downloadAnalysisJson, deleteVideoAnalysis } from '@/lib/video/history';
import { useVideoHistory } from '@/lib/video/useVideoHistory';
import { useSwingAnalysis } from '@/lib/video/useSwingAnalysis';

type AnalysisStep = 'upload' | 'configure' | 'analyzing' | 'results';

export function SportVideoAnalyzerContent() {
  const { activeSport, setActiveSport } = useSport();
  // `step` holds only the user-driven pre-analysis phase (upload / configure);
  // the analyzing/results phases are DERIVED from the live background task
  // below, so we never sync view state in an effect.
  const [step, setStep] = useState<'upload' | 'configure'>('upload');
  const [viewingResults, setViewingResults] = useState(true);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoObjectUrl, setVideoObjectUrl] = useState<string | null>(null);
  const [videoMetadata, setVideoMetadata] = useState<SwingVideoMetadata | null>(null);
  const [selectedSport, setSelectedSport] = useState<SportId>(activeSport);
  const [speed, setSpeed] = useState<VisionSpeed>('fast');

  // Returning-user history for the selected sport, compare toggle.
  // `useVideoHistory` reads localStorage after hydration and live-updates on
  // save/delete (no setState-in-effect needed).
  const history = useVideoHistory(selectedSport);
  const [compareEnabled, setCompareEnabled] = useState(false);

  // The analysis runs in a background task; this hook bridges to it and exposes
  // live stage/progress + the final result (and re-adopts an in-flight analysis
  // if the user navigated away and came back).
  const swing = useSwingAnalysis();

  // The displayed phase is derived from the live background task (running →
  // "analyzing", error → "configure", success → "results" until the user
  // changes settings); otherwise the user-driven `step` applies.
  const phase: AnalysisStep = swing.isRunning
    ? 'analyzing'
    : swing.status === 'error'
    ? 'configure'
    : swing.status === 'success' && viewingResults
    ? 'results'
    : step;

  // Reset the compare toggle whenever the user switches sport.
  const handleSelectSport = useCallback((sport: SportId) => {
    setSelectedSport(sport);
    setCompareEnabled(false);
  }, []);

  useEffect(() => {
    return () => {
      if (videoObjectUrl) URL.revokeObjectURL(videoObjectUrl);
    };
  }, [videoObjectUrl]);

  const handleDeleteHistory = useCallback((id: string) => {
    deleteVideoAnalysis(id);
  }, []);

  const handleVideoReady = useCallback(
    (file: File, metadata: SwingVideoMetadata, objectUrl: string) => {
      setVideoFile(file);
      setVideoMetadata({ ...metadata, camera_angle: 'unknown' });
      setVideoObjectUrl(objectUrl);
      setStep('configure');
      // Speculatively extract frames + run pose now, while the user configures —
      // so clicking "Analyze" jumps almost straight to the AI call.
      warmSwingPreparation(file);
    },
    [],
  );

  const handleRemoveVideo = () => {
    if (videoObjectUrl) URL.revokeObjectURL(videoObjectUrl);
    forgetPreparedSwing(videoFile);
    setVideoFile(null);
    setVideoObjectUrl(null);
    setVideoMetadata(null);
    swing.reset(true);
    setViewingResults(true);
    setStep('upload');
  };

  const handleAnalyze = () => {
    if (!videoFile || !videoMetadata || selectedSport === 'golf') return;
    setActiveSport(selectedSport);

    const sportConfig = getSportConfig(selectedSport);
    const latest = history[0] ?? null;
    const previous = compareEnabled && latest ? toPreviousSummary(latest) : null;

    setViewingResults(true);
    swing.start(
      {
        videoFile,
        sport: selectedSport,
        sportLabel: sportConfig?.name ?? 'Swing',
        emoji: sportConfig?.emoji,
        declaredCameraAngle: videoMetadata.camera_angle,
        previous,
        speed,
      },
      {
        title: `Analyzing your ${(sportConfig?.name ?? 'swing').toLowerCase()} swing`,
        description: videoFile.name,
        viewHref: '/video',
      },
    );
  };

  const config = selectedSport !== 'golf' ? getSportConfig(selectedSport) : null;

  // ── Step 1: Upload ─────────────────────────────────────────
  if (phase === 'upload') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Swing Video Analyzer</h1>
          <p className="text-sm text-muted-foreground">
            Upload a swing video and SwingVantage&apos;s AI reviews the actual frames — golf, tennis,
            baseball, and softball.
          </p>
        </div>

        <Card>
          <CardBody className="space-y-3">
            <p className="text-sm font-semibold text-foreground">Which sport are you analyzing?</p>
            <SportCardGrid selectedSport={selectedSport} onSelect={handleSelectSport} />
          </CardBody>
        </Card>

        <VideoWelcomeBack
          latest={history[0] ?? null}
          recent={history}
          compareEnabled={compareEnabled}
          onCompareChange={setCompareEnabled}
          onExport={downloadAnalysisJson}
          onDelete={handleDeleteHistory}
        />

        <VideoProgress history={history} />

        {/* New here? A short "how to record" tutorial, right where it helps. */}
        {history.length === 0 && (
          <TutorialVideo placement="upload-record" sport={selectedSport} page="/video" />
        )}

        {selectedSport !== 'golf' && (
          <RecordingGuide sport={selectedSport} defaultOpen={history.length === 0} />
        )}

        <VideoUpload onVideoReady={handleVideoReady} enableRecording sport={selectedSport} />

        <div className="rounded-xl bg-accent-secondary/10 border border-accent-secondary/25 p-4">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-accent-secondary shrink-0 mt-0.5" />
            <p className="text-xs text-accent-secondary">
              <strong>Real AI video review.</strong> SwingVantage samples still frames across your whole
              swing and an AI vision model assesses what it can actually see — with an honest
              confidence level and video-quality notes.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 2: Configure ──────────────────────────────────────
  if (phase === 'configure') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRemoveVideo}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Configure Analysis</h1>
        </div>

        {videoFile && videoMetadata && (
          <VideoPreviewCard file={videoFile} metadata={videoMetadata} onRemove={handleRemoveVideo} />
        )}

        <Card>
          <CardBody className="space-y-3">
            <p className="text-sm font-semibold text-foreground">Sport</p>
            <SportCardGrid selectedSport={selectedSport} onSelect={handleSelectSport} />
          </CardBody>
        </Card>

        {config && (
          <Card>
            <CardBody className="space-y-3">
              <p className="text-sm font-semibold text-foreground">
                Camera Angle{' '}
                <span className="text-xs font-normal text-muted-foreground">
                  (helps the AI verify what it&apos;s seeing)
                </span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(SPORT_CAMERA_ANGLES[selectedSport] ?? SPORT_CAMERA_ANGLES['golf']).map((opt) => {
                  const isSelected = (videoMetadata?.camera_angle ?? 'unknown') === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setVideoMetadata((prev) =>
                          prev ? ({ ...prev, camera_angle: opt.value } as typeof prev) : prev,
                        )
                      }
                      className={`flex items-start gap-2 p-3 rounded-lg border text-left transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-card hover:border-border'
                      }`}
                    >
                      <div
                        className={`w-3 h-3 rounded-full border-2 mt-0.5 shrink-0 ${
                          isSelected ? 'border-primary bg-primary' : 'border-border'
                        }`}
                      />
                      <div>
                        <p className={`text-xs font-semibold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                          {opt.label}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{opt.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        )}

        <Card>
          <CardBody>
            <AnalysisSpeedSelector value={speed} onChange={setSpeed} />
          </CardBody>
        </Card>

        {swing.error && (
          <div className="rounded-xl bg-error/10 border border-error/30 p-4 flex gap-2">
            <AlertCircle className="w-4 h-4 text-error shrink-0 mt-0.5" />
            <p className="text-sm text-error">{swing.error}</p>
          </div>
        )}

        <Button onClick={handleAnalyze} disabled={!videoFile || selectedSport === 'golf'} className="w-full" size="lg">
          {selectedSport === 'golf' ? 'Select a non-golf sport above' : (
            <>
              <Zap className="w-4 h-4" />
              Analyze {config?.name ?? 'Swing'} Video with AI
            </>
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Only sampled still frames are sent to the AI vision provider — your original video never
          leaves this device and frames are not stored.
        </p>
      </div>
    );
  }

  // ── Step 3: Analyzing ──────────────────────────────────────
  if (phase === 'analyzing') {
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <Loader2 className="w-8 h-8 animate-spin text-golf-fairway mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-foreground">Analyzing your swing</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            This can take a couple of minutes. You can leave this page — SwingVantage keeps working in the
            background and lets you know the moment it&apos;s ready.
          </p>
        </div>
        <AnalysisProgress stage={swing.stage} />
      </div>
    );
  }

  // ── Step 4: Results ────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => {
            setViewingResults(false);
            setStep('configure');
          }}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Back"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            {config && <span>{config.emoji}</span>}
            {config?.name ?? 'Swing'} AI Analysis
          </h1>
        </div>
      </div>

      {swing.notConfiguredMessage ? (
        <AINotConfiguredNotice
          message={swing.notConfiguredMessage}
          onRetry={handleAnalyze}
          onStartOver={handleRemoveVideo}
        />
      ) : swing.analysis ? (
        <>
        {swing.comparedToPrevious && (
          <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 flex items-start gap-2">
            <RefreshCw className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-foreground">
              <span className="font-semibold">Compared to your last swing.</span> The AI had your
              previous focus areas as context — but it judged only this new video and did not assume
              you improved.
            </p>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,420px)_1fr] gap-5 items-start">
          <div className="space-y-3 lg:sticky lg:top-20">
            {videoObjectUrl && (
              <div className="rounded-xl overflow-hidden bg-black">
                <SwingVideoPlayer objectUrl={videoObjectUrl} />
              </div>
            )}

            {/* General coaching reference — NOT detected from this video */}
            {config && (
              <details className="rounded-xl border border-border bg-card">
                <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-foreground">
                  General {config.name} phase reference
                  <span className="block text-xs font-normal text-muted-foreground">
                    Educational reference — not detected from your video
                  </span>
                </summary>
                <div className="px-4 pb-4 space-y-2">
                  {config.phase_sequence.map((phaseId) => {
                    const def = config.phases[phaseId];
                    if (!def) return null;
                    return (
                      <div key={phaseId} className="rounded-lg bg-muted border border-border p-2.5">
                        <p className="text-xs font-semibold text-foreground">{def.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{def.coaching_cue}</p>
                      </div>
                    );
                  })}
                </div>
              </details>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setViewingResults(false);
                  setStep('configure');
                }}
              >
                Change settings
              </Button>
              <Button variant="ghost" onClick={handleRemoveVideo}>
                New video
              </Button>
              {swing.savedRecord && (
                <Button variant="ghost" onClick={() => downloadAnalysisJson(swing.savedRecord!)}>
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              )}
            </div>
            {swing.savedRecord && (
              <p className="text-xs text-muted-foreground">
                Saved to your swing history on this device. Only the text analysis is stored — never
                your video.
              </p>
            )}
          </div>

          <div className="space-y-4">
            {swing.poseMetrics && <PoseSignalsCard metrics={swing.poseMetrics} />}
            <AIVisualAnalysisPanel analysis={swing.analysis} />
          </div>
        </div>

        {/* First results? Show "how to read your analysis" once, then let it go. */}
        {history.length <= 1 && (
          <TutorialVideo placement="results-read" sport={selectedSport} page="/video" />
        )}

        {/* How this video review was produced */}
        <AnalysisTransparency
          resultNoun="video review"
          videoAnalyzed
          basedOn={[
            'Still frames sampled from your uploaded swing video',
            `Declared camera angle: ${(videoMetadata?.camera_angle ?? 'unknown').replace(/_/g, ' ')}`,
            'An AI vision review of those frames',
          ]}
          confidence={{
            level: 'medium',
            score: 50,
            reason:
              'an AI visual review of sampled frames — an informed estimate, not a biomechanical measurement',
          }}
          whatImproves={[
            'Film from a clean, recommended camera angle',
            'Use good lighting and keep the whole swing in frame',
            'Add more videos over time to see a trend',
            'Have a qualified coach confirm what the AI noticed',
          ]}
        />
        </>
      ) : null}
    </div>
  );
}
