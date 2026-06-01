'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { VideoUpload, VideoPreviewCard } from '@/components/video/VideoUpload';
import { CameraAngleSelector } from '@/components/video/CameraAngleSelector';
import { SwingVideoPlayer } from '@/components/video/SwingVideoPlayer';
import { SwingOverlayCanvas } from '@/components/video/SwingOverlayCanvas';
import { SwingPhaseTimeline } from '@/components/video/SwingPhaseTimeline';
import { CoachingPanel } from '@/components/video/CoachingPanel';
import { OverlayControls, type OverlaySettings } from '@/components/video/OverlayControls';
import { FeedbackPanel } from '@/components/video/FeedbackPanel';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { estimatePoseAtFrame, POSE_ESTIMATION_LABEL } from '@/lib/pose-estimation';
import { generateOverlay } from '@/lib/overlay-generator';
import type {
  SwingVideoMetadata,
  SwingVideoAnalysis,
  SwingOverlayData,
  SwingPhaseSegment,
  DrillOutcome,
  FeedbackRating,
} from '@swingiq/core';
import { ChevronLeft, Loader2, AlertCircle, Zap, Info } from 'lucide-react';

type AnalysisStep = 'upload' | 'configure' | 'analyzing' | 'results';

type CameraAngleOption = 'down_the_line' | 'face_on' | 'unknown';

export function VideoAnalyzerContent() {
  // ── State ──────────────────────────────────────────────────
  const [step, setStep] = useState<AnalysisStep>('upload');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoObjectUrl, setVideoObjectUrl] = useState<string | null>(null);
  const [videoMetadata, setVideoMetadata] = useState<SwingVideoMetadata | null>(null);
  const [cameraAngle, setCameraAngle] = useState<CameraAngleOption>('unknown');
  const [analysis, setAnalysis] = useState<SwingVideoAnalysis | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  // Video playback state
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoElRef = useRef<HTMLVideoElement | null>(null);

  // Overlay
  const [overlayData, setOverlayData] = useState<SwingOverlayData | null>(null);
  const [overlaySettings, setOverlaySettings] = useState<OverlaySettings>({
    showSkeleton: true,
    showPlane: true,
    showShaft: true,
  });

  // Active phase (derived from currentTime + phase_segments)
  const [activePhase, setActivePhase] = useState<SwingPhaseSegment | null>(null);

  // ── Cleanup object URL on unmount ─────────────────────────
  useEffect(() => {
    return () => {
      if (videoObjectUrl) URL.revokeObjectURL(videoObjectUrl);
    };
  }, [videoObjectUrl]);

  // ── Handlers ──────────────────────────────────────────────

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
    setStep('upload');
  };

  const handleAnalyze = async () => {
    if (!videoMetadata) return;
    setAnalyzeError(null);
    setStep('analyzing');

    const metaWithAngle: SwingVideoMetadata = { ...videoMetadata, camera_angle: cameraAngle };

    try {
      const res = await fetch('/api/video-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_id: `vid_${Date.now()}`,
          user_id: 'local_user',
          session_id: null,
          metadata: metaWithAngle,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Server error' }));
        throw new Error(err.error ?? `Server returned ${res.status}`);
      }

      const data = await res.json();
      setAnalysis(data.analysis);
      setStep('results');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Analysis failed. Please try again.';
      setAnalyzeError(msg);
      setStep('configure');
    }
  };

  const handleTimeUpdate = useCallback(
    (time: number, dur: number) => {
      setCurrentTime(time);
      setDuration(dur);

      // Update active phase
      if (analysis?.phase_segments) {
        const qualifying = analysis.phase_segments.filter((p) => time >= p.start_time);
        const active = qualifying.length > 0 ? qualifying[qualifying.length - 1] : null;
        setActivePhase(active);
      }

      // Update overlay
      const videoEl = videoElRef.current;
      if (videoEl && dur > 0) {
        const landmarks = estimatePoseAtFrame(videoEl, time, dur);
        const overlay = generateOverlay(landmarks, time);
        setOverlayData(overlay);
      }
    },
    [analysis],
  );

  const handleVideoReady2 = useCallback((videoEl: HTMLVideoElement) => {
    videoElRef.current = videoEl;
    setDuration(videoEl.duration);
  }, []);

  const seekToPhase = useCallback((time: number) => {
    const videoEl = videoElRef.current;
    if (videoEl) videoEl.currentTime = time;
  }, []);

  const handleDrillInteraction = useCallback(
    async (_drillId: string, _outcome: DrillOutcome) => {
      // TODO: persist to Supabase via server action
      // For now, just log — learning profile update is non-blocking
    },
    [],
  );

  const handleFeedbackSubmit = useCallback(
    async (feedback: {
      overall_rating: FeedbackRating;
      most_useful_insight: string | null;
      least_useful_insight: string | null;
      free_text: string | null;
    }) => {
      // TODO: persist to Supabase via server action
      // Non-blocking — analysis continues regardless
      void feedback;
    },
    [],
  );

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {step !== 'upload' && (
              <button
                onClick={() => {
                  if (step === 'results') setStep('configure');
                  else if (step === 'configure') setStep('upload');
                }}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-sm"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="text-lg font-bold text-gray-900">Swing Video Analyzer</h1>
              <p className="text-xs text-gray-500 hidden sm:block">
                Upload · Analyze · Improve
              </p>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-1.5">
            {(['upload', 'configure', 'results'] as const).map((s, i) => (
              <div
                key={s}
                className={cn(
                  'w-2 h-2 rounded-full transition-all',
                  step === s || (step === 'analyzing' && s === 'configure')
                    ? 'bg-green-600 w-4'
                    : i < ['upload', 'configure', 'results'].indexOf(step === 'analyzing' ? 'results' : step)
                    ? 'bg-green-400'
                    : 'bg-gray-300',
                )}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* ── STEP 1: Upload ─────────────────────────────────── */}
        {step === 'upload' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900">Upload your swing video</h2>
              <p className="text-sm text-gray-500 mt-1">
                Record your swing from down the line or face on for the best analysis.
              </p>
            </div>
            <VideoUpload onVideoReady={handleVideoReady} />

            {/* Tips */}
            <Card>
              <CardBody className="space-y-3">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-500" />
                  <p className="text-sm font-semibold text-gray-700">Recording tips</p>
                </div>
                <ul className="space-y-2 text-sm text-gray-600">
                  {[
                    'Use a phone or camera on a tripod at hip height',
                    'Film from directly behind (down the line) or directly to the side (face on)',
                    'Ensure good lighting so the club and body are clearly visible',
                    'Film at least 3 full swings with the same club for pattern detection',
                    'Keep the entire swing in frame from address to finish',
                  ].map((tip, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-green-500 font-bold mt-0.5">·</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          </div>
        )}

        {/* ── STEP 2: Configure ──────────────────────────────── */}
        {(step === 'configure' || step === 'analyzing') && videoFile && videoMetadata && (
          <div className="max-w-2xl mx-auto space-y-6">
            <VideoPreviewCard
              file={videoFile}
              metadata={videoMetadata}
              onRemove={handleRemoveVideo}
            />

            <CameraAngleSelector
              value={cameraAngle}
              onChange={setCameraAngle}
              disabled={step === 'analyzing'}
            />

            {analyzeError && (
              <div className="flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 p-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <p className="text-sm text-red-700">{analyzeError}</p>
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleAnalyze}
              loading={step === 'analyzing'}
              disabled={step === 'analyzing'}
            >
              {step === 'analyzing' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing swing…
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Analyze Swing
                </>
              )}
            </Button>

            <div className="text-center">
              <p className="text-xs text-gray-400">
                Analysis runs in your browser — no video data is uploaded to any server.
              </p>
            </div>
          </div>
        )}

        {/* ── STEP 3: Results ────────────────────────────────── */}
        {step === 'results' && analysis && videoObjectUrl && videoMetadata && (
          <div className="space-y-4">
            {/* Score bar */}
            <div className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 p-4">
              <div className="text-center shrink-0">
                <div
                  className={cn(
                    'w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold border-4',
                    analysis.overall_visual_score >= 70
                      ? 'border-green-400 text-green-600 bg-green-50'
                      : analysis.overall_visual_score >= 50
                      ? 'border-amber-400 text-amber-600 bg-amber-50'
                      : 'border-red-400 text-red-600 bg-red-50',
                  )}
                >
                  {analysis.overall_visual_score}
                </div>
                <p className="text-xs text-gray-500 mt-1">Visual score</p>
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-semibold text-gray-900">Analysis complete</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {analysis.detected_issues.length} issue
                  {analysis.detected_issues.length !== 1 ? 's' : ''} detected ·{' '}
                  {analysis.drill_recommendations.length} drill
                  {analysis.drill_recommendations.length !== 1 ? 's' : ''} recommended ·{' '}
                  <span className="text-amber-600">All estimated</span>
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  ⚠ {POSE_ESTIMATION_LABEL}
                </p>
              </div>
            </div>

            {/* Main layout: video + coaching */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
              {/* Left: Video + overlay + timeline */}
              <div className="space-y-3">
                {/* Video with overlay */}
                <div className="relative rounded-xl overflow-hidden bg-black">
                  <SwingVideoPlayer
                    objectUrl={videoObjectUrl}
                    onTimeUpdate={handleTimeUpdate}
                    onReady={handleVideoReady2}
                  />
                  {/* Canvas overlay — positioned absolute over the video */}
                  <div className="absolute inset-0 pointer-events-none">
                    <SwingOverlayCanvas
                      overlayData={overlayData}
                      videoWidth={videoMetadata.width || 1920}
                      videoHeight={videoMetadata.height || 1080}
                      showSkeleton={overlaySettings.showSkeleton}
                      showPlane={overlaySettings.showPlane}
                      showShaft={overlaySettings.showShaft}
                      className="w-full h-full"
                    />
                  </div>
                </div>

                {/* Overlay controls */}
                <OverlayControls
                  settings={overlaySettings}
                  onChange={setOverlaySettings}
                />

                {/* Phase timeline */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <SwingPhaseTimeline
                    phases={analysis.phase_segments}
                    currentTime={currentTime}
                    duration={duration}
                    onSeekToPhase={seekToPhase}
                  />
                </div>
              </div>

              {/* Right: Coaching panel */}
              <CoachingPanel
                analysis={analysis}
                activePhase={activePhase}
                onDrillInteraction={handleDrillInteraction}
                className="h-[600px] lg:h-auto lg:max-h-[760px] sticky top-16"
              />
            </div>

            {/* Feedback */}
            <div className="max-w-md">
              <FeedbackPanel
                analysisId={analysis.id}
                onSubmit={handleFeedbackSubmit}
              />
            </div>

            {/* Re-analyze / new video */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('configure')}>
                Change settings
              </Button>
              <Button variant="ghost" onClick={handleRemoveVideo}>
                Analyze a different video
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
