'use client';

// ============================================================
// SwingVantage — Motion Lab: Wizard (top-level flow)
// select sport/motion → capture/upload → analyze → results
// Everything runs in the browser; the original video never leaves
// the device. Sessions persist locally (analysis + compact pose track).
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import {
  ChevronLeft, ChevronRight, Zap, AlertCircle, Loader2, FlaskConical,
  History, Trash2, ArrowRight, Upload, Video, Boxes, CheckCircle2, X, Sparkles,
} from 'lucide-react';
import { VideoUpload, VideoPreviewCard } from '@/components/video/VideoUpload';
import { MotionRecorder } from './MotionRecorder';
import { VideoTrimmer } from './VideoTrimmer';
import { SportMotionSelector } from './SportMotionSelector';
import { RecordingGuidance } from './RecordingGuidance';
import { MotionLabTrustNote } from './MotionLabTrustNote';
import { MotionAnalysisProgress } from './MotionAnalysisProgress';
import { MotionResultsDashboard } from './MotionResultsDashboard';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import {
  runMotionAnalysis, runMultiViewMotionAnalysis, saveSession, deleteSession, useMotionSessions, sessionsFor, getMotion, getSport, SKILL_LEVELS,
  SAMPLE_SPECS, buildSampleSession, isSampleSession,
} from '@/lib/motion-lab';
import type {
  SportId, MotionTypeId, CameraView, Handedness, MotionSession, MotionStage, CaptureContext, MotionSkillLevel, PoseModelQuality, SampleSpec,
} from '@/lib/motion-lab';
import type { SwingVideoMetadata } from '@swingiq/core';
import { cn } from '@/lib/utils';
import { track, ANALYTICS_EVENTS } from '@/lib/analytics';

type Step = 'select' | 'capture' | 'analyzing' | 'results';

const VIEW_OPTIONS: Array<{ id: CameraView; label: string }> = [
  { id: 'face_on', label: 'Face-on' },
  { id: 'down_the_line', label: 'Down the line' },
  { id: 'side', label: 'Side' },
  { id: 'unknown', label: 'Not sure' },
];
const HAND_OPTIONS: Array<{ id: Handedness; label: string }> = [
  { id: 'right', label: 'Right-handed' },
  { id: 'left', label: 'Left-handed' },
  { id: 'unknown', label: 'Not sure' },
];
const MODEL_OPTIONS: Array<{ id: PoseModelQuality; label: string }> = [
  { id: 'lite', label: 'Fast' },
  { id: 'full', label: 'Balanced' },
  { id: 'heavy', label: 'Accurate' },
];

function Pills<T extends string>({ options, value, onChange }: {
  options: Array<{ id: T; label: string }>; value: T; onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            'text-xs font-medium rounded-full px-3 py-1.5 border transition-colors',
            value === o.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border hover:text-foreground',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function MotionLabWizard() {
  const [step, setStep] = useState<Step>('select');
  const [sport, setSport] = useState<SportId>('golf');
  const [motionType, setMotionType] = useState<MotionTypeId | null>(null);
  const [view, setView] = useState<CameraView>('unknown');
  const [handedness, setHandedness] = useState<Handedness>('right');
  const [skillLevel, setSkillLevel] = useState<MotionSkillLevel>('intermediate');
  const [modelQuality, setModelQuality] = useState<PoseModelQuality>('full');
  const [proDepth, setProDepth] = useState(true);

  const [captureMode, setCaptureMode] = useState<'single' | 'multi'>('single');
  const [inputMode, setInputMode] = useState<'upload' | 'record'>('upload');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoMeta, setVideoMeta] = useState<SwingVideoMetadata | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [trim, setTrim] = useState<{ start: number; end: number } | null>(null);
  // Second angle for true multi-view 3D.
  const [videoFileB, setVideoFileB] = useState<File | null>(null);
  const [objectUrlB, setObjectUrlB] = useState<string | null>(null);

  const [stage, setStage] = useState<MotionStage>('extracting');
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<MotionSession | null>(null);
  const [saved, setSaved] = useState(false);
  // The clip URL that belongs to the CURRENTLY-shown result. Set only on a
  // fresh analysis; cleared when opening a saved session so the video lab never
  // pairs one session's overlays with another clip's footage.
  const [resultVideoUrl, setResultVideoUrl] = useState<string | null>(null);

  const allSessions = useMotionSessions();

  // Fires once when the lab is opened (keyless/consent-safe — no-ops unless an
  // analytics provider is actually loaded). Carries no private data.
  useEffect(() => { track(ANALYTICS_EVENTS.MOTION_LAB_OPENED); }, []);

  useEffect(() => () => { if (objectUrl) URL.revokeObjectURL(objectUrl); }, [objectUrl]);
  useEffect(() => () => { if (objectUrlB) URL.revokeObjectURL(objectUrlB); }, [objectUrlB]);

  const resetCapture = useCallback(() => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    setVideoFile(null);
    setVideoMeta(null);
    setObjectUrl(null);
    setTrim(null);
    if (objectUrlB) URL.revokeObjectURL(objectUrlB);
    setVideoFileB(null);
    setObjectUrlB(null);
    setError(null);
  }, [objectUrl, objectUrlB]);

  const handleVideoReady = useCallback((file: File, metadata: SwingVideoMetadata, url: string) => {
    setVideoFile(file);
    setVideoMeta(metadata);
    setObjectUrl(url);
  }, []);

  const handleVideoReadyB = useCallback((file: File, _metadata: SwingVideoMetadata, url: string) => {
    setVideoFileB(file);
    setObjectUrlB(url);
  }, []);

  const startOver = useCallback(() => {
    resetCapture();
    setSession(null);
    setSaved(false);
    setResultVideoUrl(null);
    setMotionType(null);
    setStep('select');
  }, [resetCapture]);

  const analyze = useCallback(async () => {
    if (!videoFile || !motionType) return;
    if (captureMode === 'multi' && !videoFileB) {
      setError('Add the second camera angle (down-the-line) to reconstruct true 3D.');
      return;
    }
    setError(null);
    setStep('analyzing');
    setStage('extracting');
    track(ANALYTICS_EVENTS.MOTION_LAB_ANALYSIS_STARTED, { sport, motion: motionType, view, capture_mode: captureMode });
    const capture: CaptureContext = {
      sport,
      motionType,
      view: captureMode === 'multi' ? 'face_on' : view,
      handedness,
      skillLevel,
      heightCm: null,
      implement: null,
    };
    try {
      const result = captureMode === 'multi' && videoFileB
        ? await runMultiViewMotionAnalysis(videoFile, videoFileB, capture, {
            modelQuality,
            rig: 'face_dtl_90',
            onProgress: setStage,
          })
        : await (async () => {
            const estimatedFps = (videoMeta as { frame_rate_estimated?: number | null } | null)?.frame_rate_estimated ?? null;
            const dur = videoMeta?.duration_seconds ?? 0;
            const trimmed = trim && (trim.start > 0.05 || (dur > 0 && trim.end < dur - 0.05));
            return runMotionAnalysis(videoFile, capture, {
              estimatedFps,
              modelQuality,
              proDepth,
              trimStartSeconds: trimmed ? trim!.start : null,
              trimEndSeconds: trimmed ? trim!.end : null,
              onProgress: setStage,
            });
          })();
      const persisted = saveSession(result);
      setSession(persisted ?? result);
      setSaved(Boolean(persisted));
      setResultVideoUrl(objectUrl);
      setStep('results');
      track(ANALYTICS_EVENTS.MOTION_LAB_ANALYSIS_COMPLETED, {
        sport, motion: motionType,
        // a coarse band, never the raw biometric values
        confidence_band: result.scoreboard.confidence >= 0.66 ? 'high' : result.scoreboard.confidence >= 0.33 ? 'medium' : 'low',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed. Please try another clip.');
      setStep('capture');
      track(ANALYTICS_EVENTS.MOTION_LAB_ANALYSIS_FAILED, { sport, motion: motionType });
    }
  }, [videoFile, videoFileB, captureMode, motionType, sport, view, handedness, skillLevel, modelQuality, proDepth, videoMeta, trim, objectUrl]);

  const openSession = useCallback((s: MotionSession) => {
    setSession(s);
    setSaved(true);
    setResultVideoUrl(null); // saved sessions never retain the video
    setSport(s.capture.sport);
    setMotionType(s.capture.motionType);
    setStep('results');
  }, []);

  const openSample = useCallback((spec: SampleSpec) => {
    const s = buildSampleSession(spec);
    setSession(s);
    setSaved(false);
    setResultVideoUrl(null); // a sample has no video — the 3D viewer shows it
    setSport(s.capture.sport);
    setMotionType(s.capture.motionType);
    setStep('results');
    track(ANALYTICS_EVENTS.MOTION_LAB_SAMPLE_VIEWED, { sport: spec.sport, motion: spec.motion });
  }, []);

  const handleDelete = useCallback(() => {
    if (session) deleteSession(session.id);
    track(ANALYTICS_EVENTS.MOTION_LAB_SESSION_DELETED);
    startOver();
  }, [session, startOver]);

  // Samples are never persisted, so they have no real prior sessions to compare.
  const priorSessions = session && !isSampleSession(session)
    ? sessionsFor(session.capture.sport, session.capture.motionType).filter((s) => s.id !== session.id)
    : [];

  // ── Header (step dots) ──────────────────────────────────────
  const stepIndex = { select: 0, capture: 1, analyzing: 2, results: 3 }[step];

  return (
    <div className="min-h-screen bg-muted">
      <div className="bg-card border-b border-border sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {step !== 'select' && step !== 'analyzing' && (
              <button
                onClick={() => setStep(step === 'results' ? 'select' : 'select')}
                className="text-muted-foreground hover:text-foreground p-1 rounded-sm"
                aria-label="Back"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                <FlaskConical className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h1 className="text-base font-bold text-foreground leading-tight">Motion Lab</h1>
                <p className="text-[11px] text-muted-foreground hidden sm:block">AI biomechanics lab · in your browser</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={cn('h-2 rounded-full transition-all', i === stepIndex ? 'w-4 bg-primary' : i < stepIndex ? 'w-2 bg-primary/60' : 'w-2 bg-muted')} />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* ── STEP: select ───────────────────────────────────── */}
        {step === 'select' && (
          <div className="space-y-6">
            <div className="text-center max-w-xl mx-auto">
              <h2 className="text-xl font-bold text-foreground">Analyse any motion in 3D</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Upload or record a clip and get a 3D reconstruction, phase breakdown, biomechanical metrics, and a coaching plan — no special hardware.
              </p>
            </div>

            {allSessions.length > 0 && (
              <SessionLibrary sessions={allSessions} onOpen={openSession} onDelete={(id) => deleteSession(id)} />
            )}

            <Card>
              <CardBody>
                <SportMotionSelector
                  sport={sport}
                  motionType={motionType}
                  onSport={(s) => { setSport(s); setMotionType(null); track(ANALYTICS_EVENTS.MOTION_LAB_SPORT_SELECTED, { sport: s }); }}
                  onMotion={(m) => { setMotionType(m); track(ANALYTICS_EVENTS.MOTION_LAB_MOTION_SELECTED, { sport, motion: m }); }}
                />
              </CardBody>
            </Card>

            <SampleGallery onOpen={openSample} />

            <MotionLabTrustNote />

            <div className="flex justify-end">
              <Button disabled={!motionType} onClick={() => setStep('capture')}>
                Continue <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP: capture ──────────────────────────────────── */}
        {step === 'capture' && motionType && (
          <div className="max-w-2xl mx-auto space-y-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <button onClick={() => setStep('select')} className="text-primary font-medium hover:underline">← Change sport/motion</button>
              <span>·</span>
              <span>{getMotion(sport, motionType).label}</span>
            </div>

            {/* Capture mode: single camera (estimated 3D) vs two cameras (measured 3D) */}
            <div className="flex flex-col items-center gap-1">
              <div className="flex gap-1 p-1 rounded-lg bg-muted w-fit">
                {([['single', '1 camera'], ['multi', '2 cameras · true 3D']] as const).map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => setCaptureMode(id)}
                    className={cn(
                      'flex items-center gap-1.5 text-sm font-medium rounded-md px-4 py-1.5 transition-colors',
                      captureMode === id ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {id === 'multi' && <Boxes className="w-4 h-4" />}{label}
                  </button>
                ))}
              </div>
              {captureMode === 'multi' && (
                <p className="text-[11px] text-muted-foreground text-center max-w-md">
                  Film the SAME rep from two angles ~90° apart (one face-on, one down-the-line). SwingVantage triangulates true metric 3D — confidence comes from real reprojection error.
                </p>
              )}
            </div>

            {!videoFile ? (
              <>
                <RecordingGuidance sport={sport} motionType={motionType} accent={getSport(sport).accent} />
                <div className="flex gap-1 p-1 rounded-lg bg-muted w-fit mx-auto">
                  {([['upload', 'Upload', Upload], ['record', 'Record', Video]] as const).map(([id, label, Icon]) => (
                    <button
                      key={id}
                      onClick={() => setInputMode(id)}
                      className={cn(
                        'flex items-center gap-1.5 text-sm font-medium rounded-md px-4 py-1.5 transition-colors',
                        inputMode === id ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      <Icon className="w-4 h-4" />{label}
                    </button>
                  ))}
                </div>
                {inputMode === 'upload'
                  ? <VideoUpload onVideoReady={handleVideoReady} onError={setError} />
                  : <MotionRecorder onVideoReady={handleVideoReady} />}
              </>
            ) : (
              <>
                {videoMeta && <VideoPreviewCard file={videoFile} metadata={videoMeta} onRemove={resetCapture} />}
                {captureMode === 'single' && objectUrl && videoMeta && (
                  <VideoTrimmer
                    objectUrl={objectUrl}
                    durationSeconds={videoMeta.duration_seconds}
                    onChange={(start, end) => setTrim({ start, end })}
                  />
                )}
                {captureMode === 'multi' && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-foreground">Second angle <span className="text-muted-foreground font-normal">(down-the-line, same rep)</span></p>
                    {!videoFileB ? (
                      <VideoUpload onVideoReady={handleVideoReadyB} onError={setError} />
                    ) : (
                      <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 p-3">
                        <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                        <span className="text-sm text-foreground flex-1 truncate">{videoFileB.name}</span>
                        <button
                          onClick={() => { if (objectUrlB) URL.revokeObjectURL(objectUrlB); setVideoFileB(null); setObjectUrlB(null); }}
                          className="text-muted-foreground hover:text-error" aria-label="Remove second angle"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <Card>
                  <CardBody className="space-y-4">
                    {captureMode === 'single' && (
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-2">Camera angle <span className="text-muted-foreground font-normal">(optional — improves rotation reads)</span></p>
                        <Pills options={VIEW_OPTIONS} value={view} onChange={setView} />
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-2">Handedness</p>
                      <Pills options={HAND_OPTIONS} value={handedness} onChange={setHandedness} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-2">Skill level <span className="text-muted-foreground font-normal">(sets which reference range you’re scored against)</span></p>
                      <Pills options={SKILL_LEVELS} value={skillLevel} onChange={setSkillLevel} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-2">Tracking accuracy <span className="text-muted-foreground font-normal">(Accurate is slower; Fast suits older phones)</span></p>
                      <Pills options={MODEL_OPTIONS} value={modelQuality} onChange={setModelQuality} />
                    </div>
                    {captureMode === 'single' ? (
                      // Associated via htmlFor + visible text; jsx-a11y's depth
                      // heuristic can't see the label text nested in styled spans.
                      // eslint-disable-next-line jsx-a11y/label-has-associated-control
                      <label htmlFor="ml-pro-depth" className="flex items-start gap-2 cursor-pointer">
                        <input id="ml-pro-depth" type="checkbox" checked={proDepth} onChange={(e) => setProDepth(e.target.checked)} className="mt-0.5 rounded-sm border-border text-primary" />
                        <span className="text-xs text-foreground">
                          <span className="font-semibold">Pro 3D depth</span>
                          <span className="text-muted-foreground"> — refine the depth of every joint with SwingVantage&apos;s trained 3D lift model. Still a single-camera estimate, just a smarter one.</span>
                        </span>
                      </label>
                    ) : (
                      <div className="flex items-start gap-2 rounded-lg bg-primary/5 border border-primary/20 p-2.5">
                        <Boxes className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span className="text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">True multi-view 3D.</span> Both angles are triangulated into measured metric 3D. Best results: same rep, ~90° apart, both full-body and well-lit.
                        </span>
                      </div>
                    )}
                  </CardBody>
                </Card>

                {error && (
                  <div className="flex items-start gap-3 rounded-lg bg-error/10 border border-error/30 p-3">
                    <AlertCircle className="w-5 h-5 text-error shrink-0" />
                    <p className="text-sm text-error">{error}</p>
                  </div>
                )}

                <Button className="w-full" onClick={analyze} disabled={captureMode === 'multi' && !videoFileB}>
                  {captureMode === 'multi' ? <Boxes className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                  {captureMode === 'multi' ? 'Reconstruct true 3D & analyze' : 'Analyze motion'}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Pose detection and 3D reconstruction run entirely on your device. Your original video is never uploaded.
                </p>
              </>
            )}
          </div>
        )}

        {/* ── STEP: analyzing ────────────────────────────────── */}
        {step === 'analyzing' && (
          <div className="py-10">
            <div className="text-center mb-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-foreground">Building your 3D analysis</h2>
            </div>
            <MotionAnalysisProgress stage={stage} />
          </div>
        )}

        {/* ── STEP: results ──────────────────────────────────── */}
        {step === 'results' && session && (
          <MotionResultsDashboard
            session={session}
            priorSessions={priorSessions}
            saved={saved}
            videoUrl={resultVideoUrl}
            isSample={isSampleSession(session)}
            onNewMotion={startOver}
            onDelete={isSampleSession(session) ? undefined : handleDelete}
          />
        )}
      </div>
    </div>
  );
}

// ── Sample gallery (try-before-you-upload demos) ───────────────
function SampleGallery({ onOpen }: { onOpen: (spec: SampleSpec) => void }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <p className="text-sm font-semibold text-foreground">See it first — try a sample analysis</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {SAMPLE_SPECS.map((spec) => (
          <button
            key={spec.id}
            onClick={() => onOpen(spec)}
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 text-left hover:border-primary/40 transition-colors"
          >
            <span className="text-2xl">{spec.emoji}</span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-foreground truncate">{spec.label}</span>
              <span className="block text-xs text-muted-foreground truncate">{spec.blurb}</span>
            </span>
          </button>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground mt-1.5">
        Samples are a synthetic motion run through the real analysis engine — labelled “Sample,” not saved, and no video.
      </p>
    </div>
  );
}

// ── Session library (returning users) ──────────────────────────
function SessionLibrary({ sessions, onOpen, onDelete }: {
  sessions: MotionSession[];
  onOpen: (s: MotionSession) => void;
  onDelete: (id: string) => void;
}) {
  // Newest by createdAt rather than trusting array order — keeps "Welcome back"
  // pointing at the most recent session regardless of save/storage ordering.
  const latest = [...sessions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )[0];
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardBody>
        <div className="flex items-center gap-2 mb-3">
          <History className="w-4 h-4 text-primary" />
          <p className="text-sm font-semibold text-foreground">Welcome back</p>
        </div>
        <button
          onClick={() => onOpen(latest)}
          className="w-full flex items-center gap-3 rounded-lg border border-border bg-card p-3 text-left hover:border-primary/40 transition-colors"
        >
          <span className="text-2xl">{latest.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">{latest.sportLabel} · {latest.motionLabel}</p>
            <p className="text-xs text-muted-foreground">{new Date(latest.createdAt).toLocaleDateString()} · {latest.keyFault}</p>
          </div>
          <span className="text-lg font-bold text-foreground tabular-nums">{latest.scoreboard.overall}</span>
          <ArrowRight className="w-4 h-4 text-primary shrink-0" />
        </button>

        {sessions.length > 1 && (
          <div className="mt-2 space-y-1">
            {sessions.slice(1, 5).map((s) => (
              <div key={s.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-card group">
                <button onClick={() => onOpen(s)} className="flex-1 flex items-center gap-2 text-left min-w-0">
                  <span className="text-base">{s.emoji}</span>
                  <span className="text-xs text-foreground truncate">{s.motionLabel}</span>
                  <span className="text-[11px] text-muted-foreground ml-auto">{new Date(s.createdAt).toLocaleDateString()}</span>
                  <span className="text-xs font-semibold text-foreground tabular-nums w-7 text-right">{s.scoreboard.overall}</span>
                </button>
                <button onClick={() => onDelete(s.id)} aria-label="Delete session" className="text-muted-foreground hover:text-error opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
