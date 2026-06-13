'use client';

// ============================================================
// SwingVantage — Golf Swing Video Analyzer
// Real AI visual analysis: extract frames in the browser -> send only
// still frames to the AI vision provider -> render the validated,
// video-grounded result. If no provider is configured, show the strict
// "not configured" notice (never fabricated feedback).
//
// The analysis runs as a BACKGROUND TASK (see lib/background-tasks), so
// the user can leave this page while it works and gets pulled back when
// it finishes. This component is a thin view over that task: stage,
// progress, and the final result are read straight off it. Frames + pose
// are prepared speculatively on the configure screen, and the user can
// pick a speed/quality tier before analyzing.
// ============================================================

import { useState, useCallback, useEffect } from 'react';
import { VideoUpload, VideoPreviewCard } from '@/components/video/VideoUpload';
import { CameraAngleSelector } from '@/components/video/CameraAngleSelector';
import { SwingVideoPlayer } from '@/components/video/SwingVideoPlayer';
import { AnalysisProgress } from '@/components/video/AnalysisProgress';
import { AIVisualAnalysisPanel } from '@/components/video/AIVisualAnalysisPanel';
import { AINotConfiguredNotice } from '@/components/video/AINotConfiguredNotice';
import { RecordingGuide } from '@/components/video/RecordingGuide';
import { VideoWelcomeBack } from '@/components/video/VideoWelcomeBack';
import { SavedAnalysisModal } from '@/components/video/SavedAnalysisModal';
import { VideoProgress } from '@/components/video/VideoProgress';
import { TutorialVideo } from '@/components/tutorial/TutorialVideo';
import { AnalysisTransparency } from '@/components/trust/AnalysisTransparency';
import { Button } from '@/components/ui/Button';
import { warmSwingPreparation, forgetPreparedSwing } from '@/lib/video/prepare-swing';
import { AnalysisSpeedSelector } from '@/components/video/AnalysisSpeedSelector';
import { PoseSignalsCard } from '@/components/video/PoseSignalsCard';
import { toPreviousSummary, downloadAnalysisJson, deleteVideoAnalysis } from '@/lib/video/history';
import { useVideoHistory } from '@/lib/video/useVideoHistory';
import { useRetests, findSportRetestTarget } from '@/lib/retest';
import { useSwingAnalysis } from '@/lib/video/useSwingAnalysis';
import { useRecordAssistHandoff } from '@/lib/record-assist/hooks/useRecordAssistHandoff';
import { useSwingSessionFanout } from '@/lib/swing-session/useSwingSessionFanout';
import type { SavedVideoAnalysis } from '@/lib/video/history';
import { cn } from '@/lib/utils';
import type { SwingVideoMetadata, VisionSpeed } from '@swingiq/core';
import { ChevronLeft, Loader2, AlertCircle, Zap, Download, RefreshCw } from 'lucide-react';

type AnalysisStep = 'upload' | 'configure' | 'analyzing' | 'results';
type CameraAngleOption = 'down_the_line' | 'face_on' | 'unknown';

export function VideoAnalyzerContent() {
  // `step` holds only the user-driven pre-analysis phase (upload / configure);
  // the analyzing/results phases are DERIVED from the live background task
  // below, so we never sync view state in an effect. `viewingResults` lets the
  // user step back to "configure" while a finished result still exists.
  const [step, setStep] = useState<'upload' | 'configure'>('upload');
  const [viewingResults, setViewingResults] = useState(true);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoObjectUrl, setVideoObjectUrl] = useState<string | null>(null);
  const [videoMetadata, setVideoMetadata] = useState<SwingVideoMetadata | null>(null);
  const [cameraAngle, setCameraAngle] = useState<CameraAngleOption>('unknown');
  const [speed, setSpeed] = useState<VisionSpeed>('fast');

  // Returning-user history (golf) + compare toggle.
  // `useVideoHistory` reads localStorage after hydration and live-updates on
  // save/delete (no setState-in-effect needed).
  const history = useVideoHistory('golf');
  // An open due/overdue retest for golf means this upload is likely a retest:
  // default "compare" on (and show a banner) until the user decides otherwise.
  // `compareChoice` is null until the user touches the toggle, so the auto-on
  // is purely derived — no setState-in-effect, and the user can always override.
  const { targets: retestTargets } = useRetests();
  const retestTarget = findSportRetestTarget(retestTargets, 'golf');
  const [compareChoice, setCompareChoice] = useState<boolean | null>(null);
  const compareEnabled = compareChoice ?? retestTarget !== null;
  // A saved analysis the user re-opened from their swing history.
  const [viewingSaved, setViewingSaved] = useState<SavedVideoAnalysis | null>(null);

  // The analysis itself runs in a background task; this hook bridges to it and
  // exposes live stage/progress + the final result (and re-adopts an in-flight
  // analysis if the user navigated away and came back).
  const swing = useSwingAnalysis();

  // The displayed phase is derived: a running task shows "analyzing", a failed
  // one drops back to "configure" (with the error), a finished one shows
  // "results" until the user chooses to change settings; otherwise the
  // user-driven `step` (upload/configure) applies.
  const phase: AnalysisStep = swing.isRunning
    ? 'analyzing'
    : swing.status === 'error'
    ? 'configure'
    : swing.status === 'success' && viewingResults
    ? 'results'
    : step;

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
      // Speculatively extract frames + run pose now, while the user reads the
      // configure screen — so clicking "Analyze" jumps almost straight to the AI.
      warmSwingPreparation(file);
    },
    [],
  );

  // Deep handoff: a clip recorded in RecordAssist (/record-assist) lands here
  // straight on the configure screen — same path as an upload, no re-upload.
  useRecordAssistHandoff('golf', handleVideoReady);

  // One upload, fans out: quietly run the on-device Motion Lab pipeline for this
  // same clip so the 3D Swing Avatar (/avatar) is ready without a re-upload.
  useSwingSessionFanout(videoFile, videoMetadata, 'golf');

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
    if (!videoFile || !videoMetadata) return;

    // Optionally feed the previous swing's priorities to the AI as context.
    const latest = history[0] ?? null;
    const previous = compareEnabled && latest ? toPreviousSummary(latest) : null;

    setViewingResults(true);
    swing.start(
      {
        videoFile,
        sport: 'golf',
        sportLabel: 'Golf',
        emoji: '⛳',
        declaredCameraAngle: cameraAngle,
        previous,
        speed,
      },
      {
        title: 'Analyzing your golf swing',
        description: videoFile.name,
        viewHref: '/video',
      },
    );
  };

  return (
    <div className="min-h-screen bg-muted">
      {/* Page header */}
      <div className="bg-card border-b border-border sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {phase !== 'upload' && (
              <button
                onClick={() => {
                  if (phase === 'results') {
                    setViewingResults(false);
                    setStep('configure');
                  } else if (phase === 'configure') setStep('upload');
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
                  phase === s || (phase === 'analyzing' && s === 'configure')
                    ? 'bg-primary w-4'
                    : i < ['upload', 'configure', 'results'].indexOf(phase === 'analyzing' ? 'results' : phase)
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
        {phase === 'upload' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-foreground">Upload your swing video</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Record from down the line or face on. SwingVantage&apos;s AI reviews the actual frames of
                your swing.
              </p>
            </div>

            <VideoWelcomeBack
              latest={history[0] ?? null}
              recent={history}
              compareEnabled={compareEnabled}
              onCompareChange={setCompareChoice}
              onExport={downloadAnalysisJson}
              onDelete={handleDeleteHistory}
              retestTarget={retestTarget}
              onView={setViewingSaved}
            />

            <VideoProgress history={history} />

            {/* New here? A short "how to record" tutorial, right where it helps —
                poster-first, click-to-play, with written steps as a fallback. */}
            {history.length === 0 && <TutorialVideo placement="upload-record" sport="golf" page="/video" />}

            <RecordingGuide sport="golf" defaultOpen={history.length === 0} />

            <VideoUpload onVideoReady={handleVideoReady} enableRecording sport="golf" />
          </div>
        )}

        {/* ── STEP 2: Configure ──────────────────────────────── */}
        {phase === 'configure' && videoFile && videoMetadata && (
          <div className="max-w-2xl mx-auto space-y-6">
            <VideoPreviewCard file={videoFile} metadata={videoMetadata} onRemove={handleRemoveVideo} />

            <CameraAngleSelector value={cameraAngle} onChange={setCameraAngle} />

            <AnalysisSpeedSelector value={speed} onChange={setSpeed} />

            {swing.error && (
              <div className="flex items-start gap-3 rounded-lg bg-error/10 border border-error/30 p-3">
                <AlertCircle className="w-5 h-5 text-error shrink-0" />
                <p className="text-sm text-error">{swing.error}</p>
              </div>
            )}

            <Button className="w-full" onClick={handleAnalyze}>
              <Zap className="w-4 h-4" />
              Analyze Swing with AI
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              To analyze your swing, a few still frames are extracted and sent to a third-party AI
              provider, where they are processed in that provider&apos;s cloud. Your full video file
              is never uploaded, and SwingVantage does not store the frames — but the AI provider
              receives them and handles them under its own privacy policy. For analysis that stays
              entirely on your device, use Motion Lab instead.
            </p>
          </div>
        )}

        {/* ── STEP 3: Analyzing ──────────────────────────────── */}
        {phase === 'analyzing' && (
          <div className="py-10">
            <div className="text-center mb-8">
              <Loader2 className="w-8 h-8 animate-spin text-golf-fairway mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-foreground">Analyzing your swing</h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                This can take a couple of minutes. You can leave this page — SwingVantage keeps working in
                the background and lets you know the moment it&apos;s ready.
              </p>
            </div>
            <AnalysisProgress stage={swing.stage} />
          </div>
        )}

        {/* ── STEP 4: Results ────────────────────────────────── */}
        {phase === 'results' && (
          <div className="space-y-5">
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
                      Saved to your swing history on this device — including the clip, so
                      you can replay it later. Nothing is uploaded.
                    </p>
                  )}
                </div>

                {/* Right: AI analysis */}
                <div className="space-y-4">
                  {swing.poseMetrics && <PoseSignalsCard metrics={swing.poseMetrics} />}
                  <AIVisualAnalysisPanel analysis={swing.analysis} />
                </div>
              </div>

              {/* First results? Show "how to read your analysis" once, then let it go. */}
              {history.length <= 1 && (
                <TutorialVideo placement="results-read" sport="golf" page="/video" />
              )}

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

      <SavedAnalysisModal
        record={viewingSaved}
        onClose={() => setViewingSaved(null)}
        onExport={downloadAnalysisJson}
      />
    </div>
  );
}
