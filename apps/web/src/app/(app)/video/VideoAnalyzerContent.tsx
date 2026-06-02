'use client';

// ============================================================
// SwingIQ — Golf Swing Video Analyzer
// Real AI visual analysis: extract frames in the browser -> send only
// still frames to the AI vision provider -> render the validated,
// video-grounded result. If no provider is configured, show the strict
// "not configured" notice (never fabricated feedback).
// ============================================================

import { useState, useCallback, useEffect } from 'react';
import { VideoUpload, VideoPreviewCard } from '@/components/video/VideoUpload';
import { CameraAngleSelector } from '@/components/video/CameraAngleSelector';
import { SwingVideoPlayer } from '@/components/video/SwingVideoPlayer';
import { AnalysisProgress, type AnalysisStage } from '@/components/video/AnalysisProgress';
import { AIVisualAnalysisPanel } from '@/components/video/AIVisualAnalysisPanel';
import { AINotConfiguredNotice } from '@/components/video/AINotConfiguredNotice';
import { RecordingGuide } from '@/components/video/RecordingGuide';
import { VideoWelcomeBack } from '@/components/video/VideoWelcomeBack';
import { VideoProgress } from '@/components/video/VideoProgress';
import { AnalysisTransparency } from '@/components/trust/AnalysisTransparency';
import { Button } from '@/components/ui/Button';
import { extractSwingFrames } from '@/lib/frame-extraction';
import { detectSwingPose, type PoseMetrics } from '@/lib/pose';
import { PoseSignalsCard } from '@/components/video/PoseSignalsCard';
import {
  saveVideoAnalysis,
  toPreviousSummary,
  downloadAnalysisJson,
  deleteVideoAnalysis,
  type SavedVideoAnalysis,
} from '@/lib/video/history';
import { useVideoHistory } from '@/lib/video/useVideoHistory';
import { cn } from '@/lib/utils';
import type { SwingVideoMetadata, AIVisualAnalysis } from '@swingiq/core';
import { ChevronLeft, Loader2, AlertCircle, Zap, Download, RefreshCw } from 'lucide-react';

type AnalysisStep = 'upload' | 'configure' | 'analyzing' | 'results';
type CameraAngleOption = 'down_the_line' | 'face_on' | 'unknown';

export function VideoAnalyzerContent() {
  const [step, setStep] = useState<AnalysisStep>('upload');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoObjectUrl, setVideoObjectUrl] = useState<string | null>(null);
  const [videoMetadata, setVideoMetadata] = useState<SwingVideoMetadata | null>(null);
  const [cameraAngle, setCameraAngle] = useState<CameraAngleOption>('unknown');

  const [analysis, setAnalysis] = useState<AIVisualAnalysis | null>(null);
  const [notConfiguredMessage, setNotConfiguredMessage] = useState<string | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [stage, setStage] = useState<AnalysisStage>('preparing');
  const [poseMetrics, setPoseMetrics] = useState<PoseMetrics | null>(null);

  // Returning-user history (golf), compare toggle, and the just-saved record.
  // `useVideoHistory` reads localStorage after hydration and live-updates on
  // save/delete (no setState-in-effect needed).
  const history = useVideoHistory('golf');
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [savedRecord, setSavedRecord] = useState<SavedVideoAnalysis | null>(null);
  const [comparedToPrevious, setComparedToPrevious] = useState(false);

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
    },
    [],
  );

  const handleRemoveVideo = () => {
    if (videoObjectUrl) URL.revokeObjectURL(videoObjectUrl);
    setVideoFile(null);
    setVideoObjectUrl(null);
    setVideoMetadata(null);
    setAnalysis(null);
    setPoseMetrics(null);
    setNotConfiguredMessage(null);
    setAnalyzeError(null);
    setStep('upload');
  };

  const handleAnalyze = async () => {
    if (!videoFile || !videoMetadata) return;
    setAnalyzeError(null);
    setNotConfiguredMessage(null);
    setAnalysis(null);
    setSavedRecord(null);
    setStage('preparing');
    setStep('analyzing');

    // Optionally feed the previous swing's priorities to the AI as context.
    const latest = history[0] ?? null;
    const previous = compareEnabled && latest ? toPreviousSummary(latest) : null;
    setComparedToPrevious(Boolean(previous));

    try {
      // 1. Extract still frames from the whole clip, in the browser.
      setStage('extracting');
      const extraction = await extractSwingFrames(videoFile);

      // 2. On-device pose detection → objective body signals (best-effort).
      setStage('measuring');
      const pose = await detectSwingPose(extraction.frames);
      setPoseMetrics(pose.metrics);

      // 3. Send only the frames + metadata (+ pose summary) to the AI route.
      setStage('inspecting');
      const res = await fetch('/api/video-vision-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sport: 'golf',
          frames: extraction.frames.map((f) => f.dataUrl),
          metadata: {
            durationSeconds: extraction.durationSeconds,
            resolution: extraction.resolution,
            declaredCameraAngle: cameraAngle,
          },
          previous,
          poseSummary: pose.summary,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (data?.configured === false) {
        setNotConfiguredMessage(data.message as string);
        setStep('results');
        return;
      }

      if (!res.ok || !data?.analysis) {
        throw new Error(
          (data?.error as string) ?? `Analysis failed (server returned ${res.status}).`,
        );
      }

      setStage('building');
      const result = data.analysis as AIVisualAnalysis;
      setAnalysis(result);
      // Save to the user's local swing history for welcome-back + compare.
      const saved = saveVideoAnalysis({
        sport: 'golf',
        sportLabel: 'Golf',
        emoji: '⛳',
        declaredCameraAngle: cameraAngle,
        analysis: result,
      });
      setSavedRecord(saved);
      setStage('plan');
      setStep('results');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Analysis failed. Please try again.';
      setAnalyzeError(msg);
      setStep('configure');
    }
  };

  return (
    <div className="min-h-screen bg-muted">
      {/* Page header */}
      <div className="bg-card border-b border-border sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {step !== 'upload' && (
              <button
                onClick={() => {
                  if (step === 'results') setStep('configure');
                  else if (step === 'configure') setStep('upload');
                }}
                className="text-muted-foreground hover:text-foreground p-1 rounded-sm"
                aria-label="Back"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="text-lg font-bold text-foreground">Swing Video Analyzer</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">
                Upload · AI reviews your frames · Improve
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {(['upload', 'configure', 'results'] as const).map((s, i) => (
              <div
                key={s}
                className={cn(
                  'w-2 h-2 rounded-full transition-all',
                  step === s || (step === 'analyzing' && s === 'configure')
                    ? 'bg-primary w-4'
                    : i < ['upload', 'configure', 'results'].indexOf(step === 'analyzing' ? 'results' : step)
                    ? 'bg-primary/60'
                    : 'bg-muted',
                )}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* ── STEP 1: Upload ─────────────────────────────────── */}
        {step === 'upload' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-foreground">Upload your swing video</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Record from down the line or face on. SwingIQ&apos;s AI reviews the actual frames of
                your swing.
              </p>
            </div>

            <VideoWelcomeBack
              latest={history[0] ?? null}
              recent={history}
              compareEnabled={compareEnabled}
              onCompareChange={setCompareEnabled}
              onExport={downloadAnalysisJson}
              onDelete={handleDeleteHistory}
            />

            <VideoProgress history={history} />

            <RecordingGuide sport="golf" defaultOpen={history.length === 0} />

            <VideoUpload onVideoReady={handleVideoReady} />
          </div>
        )}

        {/* ── STEP 2: Configure ──────────────────────────────── */}
        {step === 'configure' && videoFile && videoMetadata && (
          <div className="max-w-2xl mx-auto space-y-6">
            <VideoPreviewCard file={videoFile} metadata={videoMetadata} onRemove={handleRemoveVideo} />

            <CameraAngleSelector value={cameraAngle} onChange={setCameraAngle} />

            {analyzeError && (
              <div className="flex items-start gap-3 rounded-lg bg-error/10 border border-error/30 p-3">
                <AlertCircle className="w-5 h-5 text-error shrink-0" />
                <p className="text-sm text-error">{analyzeError}</p>
              </div>
            )}

            <Button className="w-full" onClick={handleAnalyze}>
              <Zap className="w-4 h-4" />
              Analyze Swing with AI
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Only sampled still frames are sent to the AI vision provider for analysis — your
              original video never leaves this device and frames are not stored.
            </p>
          </div>
        )}

        {/* ── STEP 3: Analyzing ──────────────────────────────── */}
        {step === 'analyzing' && (
          <div className="py-10">
            <div className="text-center mb-8">
              <Loader2 className="w-8 h-8 animate-spin text-golf-fairway mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-foreground">Analyzing your swing</h2>
            </div>
            <AnalysisProgress stage={stage} />
          </div>
        )}

        {/* ── STEP 4: Results ────────────────────────────────── */}
        {step === 'results' && (
          <div className="space-y-5">
            {notConfiguredMessage ? (
              <AINotConfiguredNotice
                message={notConfiguredMessage}
                onRetry={handleAnalyze}
                onStartOver={handleRemoveVideo}
              />
            ) : analysis ? (
              <>
              {comparedToPrevious && (
                <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 flex items-start gap-2">
                  <RefreshCw className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground">
                    <span className="font-semibold">Compared to your last swing.</span> The AI had
                    your previous focus areas as context — but it judged only this new video and did
                    not assume you improved.
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,420px)_1fr] gap-5 items-start">
                {/* Left: video */}
                <div className="space-y-3 lg:sticky lg:top-20">
                  {videoObjectUrl && (
                    <div className="rounded-xl overflow-hidden bg-black">
                      <SwingVideoPlayer objectUrl={videoObjectUrl} />
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => setStep('configure')}>
                      Change settings
                    </Button>
                    <Button variant="ghost" onClick={handleRemoveVideo}>
                      New video
                    </Button>
                    {savedRecord && (
                      <Button variant="ghost" onClick={() => downloadAnalysisJson(savedRecord)}>
                        <Download className="w-4 h-4" />
                        Export
                      </Button>
                    )}
                  </div>
                  {savedRecord && (
                    <p className="text-xs text-muted-foreground">
                      Saved to your swing history on this device. Only the text analysis is stored —
                      never your video.
                    </p>
                  )}
                </div>

                {/* Right: AI analysis */}
                <div className="space-y-4">
                  {poseMetrics && <PoseSignalsCard metrics={poseMetrics} />}
                  <AIVisualAnalysisPanel analysis={analysis} />
                </div>
              </div>

              {/* How this video review was produced */}
              <AnalysisTransparency
                resultNoun="video review"
                videoAnalyzed
                basedOn={[
                  'Still frames sampled from your uploaded swing video',
                  `Declared camera angle: ${cameraAngle.replace(/_/g, ' ')}`,
                  'An AI vision review of those frames',
                ]}
                confidence={{
                  level: 'medium',
                  score: 50,
                  reason:
                    'an AI visual review of sampled frames — an informed estimate, not a biomechanical measurement',
                }}
                whatImproves={[
                  'Film from a clean down-the-line or face-on angle',
                  'Use good lighting and keep the whole swing in frame',
                  'Add launch-monitor or session data for measured numbers',
                  'Have a qualified coach confirm what the AI noticed',
                ]}
              />
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
