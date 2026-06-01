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
import { AnalysisTransparency } from '@/components/trust/AnalysisTransparency';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { extractSwingFrames } from '@/lib/frame-extraction';
import type { SwingVideoMetadata, AIVisualAnalysis } from '@swingiq/core';
import { ChevronLeft, Loader2, AlertCircle, Zap, Info } from 'lucide-react';

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

  useEffect(() => {
    return () => {
      if (videoObjectUrl) URL.revokeObjectURL(videoObjectUrl);
    };
  }, [videoObjectUrl]);

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
    setNotConfiguredMessage(null);
    setAnalyzeError(null);
    setStep('upload');
  };

  const handleAnalyze = async () => {
    if (!videoFile || !videoMetadata) return;
    setAnalyzeError(null);
    setNotConfiguredMessage(null);
    setAnalysis(null);
    setStage('preparing');
    setStep('analyzing');

    try {
      // 1. Extract still frames from the whole clip, in the browser.
      setStage('extracting');
      const extraction = await extractSwingFrames(videoFile);

      // 2. Send only the frames + metadata to the AI vision route.
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
      setAnalysis(data.analysis as AIVisualAnalysis);
      setStage('plan');
      setStep('results');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Analysis failed. Please try again.';
      setAnalyzeError(msg);
      setStep('configure');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {step !== 'upload' && (
              <button
                onClick={() => {
                  if (step === 'results') setStep('configure');
                  else if (step === 'configure') setStep('upload');
                }}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-sm"
                aria-label="Back"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="text-lg font-bold text-gray-900">Swing Video Analyzer</h1>
              <p className="text-xs text-gray-500 hidden sm:block">
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

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* ── STEP 1: Upload ─────────────────────────────────── */}
        {step === 'upload' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-900">Upload your swing video</h2>
              <p className="text-sm text-gray-500 mt-1">
                Record from down the line or face on. SwingIQ&apos;s AI reviews the actual frames of
                your swing.
              </p>
            </div>
            <VideoUpload onVideoReady={handleVideoReady} />

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
                    'Keep the entire swing in frame from address to finish',
                    'A clean, uncluttered background helps the AI see your body',
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
        {step === 'configure' && videoFile && videoMetadata && (
          <div className="max-w-2xl mx-auto space-y-6">
            <VideoPreviewCard file={videoFile} metadata={videoMetadata} onRemove={handleRemoveVideo} />

            <CameraAngleSelector value={cameraAngle} onChange={setCameraAngle} />

            {analyzeError && (
              <div className="flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 p-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                <p className="text-sm text-red-700">{analyzeError}</p>
              </div>
            )}

            <Button className="w-full" onClick={handleAnalyze}>
              <Zap className="w-4 h-4" />
              Analyze Swing with AI
            </Button>

            <p className="text-center text-xs text-gray-400">
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
              <h2 className="text-lg font-semibold text-gray-800">Analyzing your swing</h2>
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
              <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,420px)_1fr] gap-5 items-start">
                {/* Left: video */}
                <div className="space-y-3 lg:sticky lg:top-20">
                  {videoObjectUrl && (
                    <div className="rounded-xl overflow-hidden bg-black">
                      <SwingVideoPlayer objectUrl={videoObjectUrl} />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep('configure')}>
                      Change settings
                    </Button>
                    <Button variant="ghost" onClick={handleRemoveVideo}>
                      New video
                    </Button>
                  </div>
                </div>

                {/* Right: AI analysis */}
                <AIVisualAnalysisPanel analysis={analysis} />
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
