'use client';

// ============================================================
// SwingIQ — Multi-Sport Video Analyzer
// Tennis, baseball, slow-pitch, and fast-pitch softball.
// Real AI visual analysis: extract frames in the browser -> send only
// still frames to the AI vision provider -> render the validated,
// video-grounded result. No heuristic/estimated per-video feedback.
// ============================================================

import { useState, useCallback, useEffect } from 'react';
import { ChevronLeft, Loader2, AlertCircle, Info, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { VideoUpload, VideoPreviewCard } from '@/components/video/VideoUpload';
import { SwingVideoPlayer } from '@/components/video/SwingVideoPlayer';
import { AnalysisProgress, type AnalysisStage } from '@/components/video/AnalysisProgress';
import { AIVisualAnalysisPanel } from '@/components/video/AIVisualAnalysisPanel';
import { AINotConfiguredNotice } from '@/components/video/AINotConfiguredNotice';
import { AnalysisTransparency } from '@/components/trust/AnalysisTransparency';
import { SportCardGrid } from '@/components/sport/SportSelector';
import { useSport } from '@/contexts/SportContext';
import { getSportConfig, SPORT_CAMERA_ANGLES } from '@swingiq/core';
import type { SportId, AIVisualAnalysis, SwingVideoMetadata } from '@swingiq/core';
import { extractSwingFrames } from '@/lib/frame-extraction';

type AnalysisStep = 'upload' | 'configure' | 'analyzing' | 'results';

export function SportVideoAnalyzerContent() {
  const { activeSport, setActiveSport } = useSport();
  const [step, setStep] = useState<AnalysisStep>('upload');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoObjectUrl, setVideoObjectUrl] = useState<string | null>(null);
  const [videoMetadata, setVideoMetadata] = useState<SwingVideoMetadata | null>(null);
  const [selectedSport, setSelectedSport] = useState<SportId>(activeSport);

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
    if (!videoFile || !videoMetadata || selectedSport === 'golf') return;
    setAnalyzeError(null);
    setNotConfiguredMessage(null);
    setAnalysis(null);
    setStage('preparing');
    setStep('analyzing');
    setActiveSport(selectedSport);

    try {
      setStage('extracting');
      const extraction = await extractSwingFrames(videoFile);

      setStage('inspecting');
      const res = await fetch('/api/video-vision-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sport: selectedSport,
          frames: extraction.frames.map((f) => f.dataUrl),
          metadata: {
            durationSeconds: extraction.durationSeconds,
            resolution: extraction.resolution,
            declaredCameraAngle: videoMetadata.camera_angle,
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
        throw new Error((data?.error as string) ?? `Analysis failed (server returned ${res.status}).`);
      }

      setStage('building');
      setAnalysis(data.analysis as AIVisualAnalysis);
      setStage('plan');
      setStep('results');
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : 'Analysis failed.');
      setStep('configure');
    }
  };

  const config = selectedSport !== 'golf' ? getSportConfig(selectedSport) : null;

  // ── Step 1: Upload ─────────────────────────────────────────
  if (step === 'upload') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Swing Video Analyzer</h1>
          <p className="text-sm text-gray-500">
            Upload a swing video and SwingIQ&apos;s AI reviews the actual frames — golf, tennis,
            baseball, and softball.
          </p>
        </div>

        <Card>
          <CardBody className="space-y-3">
            <p className="text-sm font-semibold text-gray-700">Which sport are you analyzing?</p>
            <SportCardGrid selectedSport={selectedSport} onSelect={setSelectedSport} />
          </CardBody>
        </Card>

        <VideoUpload onVideoReady={handleVideoReady} />

        <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              <strong>Real AI video review.</strong> SwingIQ samples still frames across your whole
              swing and an AI vision model assesses what it can actually see — with an honest
              confidence level and video-quality notes.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 2: Configure ──────────────────────────────────────
  if (step === 'configure') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRemoveVideo}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Configure Analysis</h1>
        </div>

        {videoFile && videoMetadata && (
          <VideoPreviewCard file={videoFile} metadata={videoMetadata} onRemove={handleRemoveVideo} />
        )}

        <Card>
          <CardBody className="space-y-3">
            <p className="text-sm font-semibold text-gray-700">Sport</p>
            <SportCardGrid selectedSport={selectedSport} onSelect={setSelectedSport} />
          </CardBody>
        </Card>

        {config && (
          <Card>
            <CardBody className="space-y-3">
              <p className="text-sm font-semibold text-gray-700">
                Camera Angle{' '}
                <span className="text-xs font-normal text-gray-400">
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
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div
                        className={`w-3 h-3 rounded-full border-2 mt-0.5 shrink-0 ${
                          isSelected ? 'border-green-500 bg-green-500' : 'border-gray-300'
                        }`}
                      />
                      <div>
                        <p className={`text-xs font-semibold ${isSelected ? 'text-green-700' : 'text-gray-700'}`}>
                          {opt.label}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{opt.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        )}

        {analyzeError && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 flex gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{analyzeError}</p>
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

        <p className="text-center text-xs text-gray-400">
          Only sampled still frames are sent to the AI vision provider — your original video never
          leaves this device and frames are not stored.
        </p>
      </div>
    );
  }

  // ── Step 3: Analyzing ──────────────────────────────────────
  if (step === 'analyzing') {
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <Loader2 className="w-8 h-8 animate-spin text-golf-fairway mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-800">Analyzing your swing</h2>
        </div>
        <AnalysisProgress stage={stage} />
      </div>
    );
  }

  // ── Step 4: Results ────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setStep('configure')}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Back"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            {config && <span>{config.emoji}</span>}
            {config?.name ?? 'Swing'} AI Analysis
          </h1>
        </div>
      </div>

      {notConfiguredMessage ? (
        <AINotConfiguredNotice
          message={notConfiguredMessage}
          onRetry={handleAnalyze}
          onStartOver={handleRemoveVideo}
        />
      ) : analysis ? (
        <>
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,420px)_1fr] gap-5 items-start">
          <div className="space-y-3 lg:sticky lg:top-20">
            {videoObjectUrl && (
              <div className="rounded-xl overflow-hidden bg-black">
                <SwingVideoPlayer objectUrl={videoObjectUrl} />
              </div>
            )}

            {/* General coaching reference — NOT detected from this video */}
            {config && (
              <details className="rounded-xl border border-gray-200 bg-white">
                <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-gray-700">
                  General {config.name} phase reference
                  <span className="block text-xs font-normal text-gray-400">
                    Educational reference — not detected from your video
                  </span>
                </summary>
                <div className="px-4 pb-4 space-y-2">
                  {config.phase_sequence.map((phaseId) => {
                    const def = config.phases[phaseId];
                    if (!def) return null;
                    return (
                      <div key={phaseId} className="rounded-lg bg-gray-50 border border-gray-100 p-2.5">
                        <p className="text-xs font-semibold text-gray-700">{def.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{def.coaching_cue}</p>
                      </div>
                    );
                  })}
                </div>
              </details>
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

          <AIVisualAnalysisPanel analysis={analysis} />
        </div>

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
