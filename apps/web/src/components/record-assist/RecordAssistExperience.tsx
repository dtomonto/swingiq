'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Video, ArrowLeft, Download, BookmarkPlus, RotateCw, Sparkles, Loader2 } from 'lucide-react';
import { useSport } from '@/contexts/SportContext';
import { extractVideoMetadata } from '@/lib/video-metadata';
import { getPreset } from '@/lib/record-assist/engines/sport-preset-engine';
import { evaluateRetake } from '@/lib/record-assist/engines/retake-engine';
import { setPendingClip } from '@/lib/record-assist/handoff';
import { toPlatformSport } from '@/lib/record-assist/sports';
import {
  useDeviceCompatibility,
  useRecordAssistAnalytics,
} from '@/lib/record-assist/hooks';
import type { RecordingResult } from '@/lib/record-assist/hooks/useRecordingState';
import type {
  RecordAssistSport,
  SportActionId,
  VoiceMode,
  CameraView,
} from '@/lib/record-assist/types';
import { SportAngleSelector } from './SportAngleSelector';
import { SetupInstructionCard } from './SetupInstructionCard';
import { VoiceGuidanceControls } from './VoiceGuidanceControls';
import { PrivacyNotice } from './PrivacyNotice';
import { DeviceCompatibilityWarning } from './DeviceCompatibilityWarning';
import { GuidedCameraView, type GuidedRecordingMeta } from './GuidedCameraView';
import { RetakeRecommendationCard } from './RetakeRecommendationCard';
import { SavedAnglesCard } from './SavedAnglesCard';
import { saveAnglePreset, type SavedAngle } from '@/lib/record-assist/saved-angles';

type Phase = 'select' | 'capture' | 'review';

export interface RecordAssistExperienceProps {
  initialSport?: RecordAssistSport;
  className?: string;
}

/** End-to-end guided self-recording: select → frame → record → review. */
/** Map a RecordAssist view to the analyzer's camera-angle field. */
function toCameraAngle(view: CameraView): 'down_the_line' | 'face_on' | 'unknown' {
  return view === 'down_the_line' || view === 'face_on' ? view : 'unknown';
}

export function RecordAssistExperience({ initialSport = 'golf', className }: RecordAssistExperienceProps) {
  const compat = useDeviceCompatibility();
  const analytics = useRecordAssistAnalytics();
  const router = useRouter();
  const { setActiveSport } = useSport();

  const [phase, setPhase] = useState<Phase>('select');
  const [handingOff, setHandingOff] = useState(false);
  const [sport, setSport] = useState<RecordAssistSport>(initialSport);
  const [action, setAction] = useState<SportActionId | null>(null);
  const [voiceMode, setVoiceMode] = useState<VoiceMode>('coach');
  const [captionsOn, setCaptionsOn] = useState(true);
  const [hapticsOn, setHapticsOn] = useState(true);
  const [recorded, setRecorded] = useState<{ result: RecordingResult; meta: GuidedRecordingMeta } | null>(null);
  const [savedAngle, setSavedAngle] = useState(false);

  const preset = useMemo(() => getPreset(sport, action ?? ''), [sport, action]);

  const poseEnabled = compat?.poseSupported ?? false;
  const voiceSupported = compat?.voiceSupported ?? false;
  const hapticsSupported = compat?.hapticsSupported ?? false;

  const handleSportChange = useCallback((s: RecordAssistSport) => {
    setSport(s);
    setAction(null);
    analytics.sportSelected(s);
  }, [analytics]);

  const handleActionChange = useCallback((a: SportActionId) => {
    setAction(a);
    const p = getPreset(sport, a);
    if (p) analytics.angleSelected(sport, a, p.recommendedView);
  }, [sport, analytics]);

  const startCapture = useCallback(() => {
    if (!preset) return;
    analytics.started(sport, preset.action);
    setPhase('capture');
  }, [preset, sport, analytics]);

  const handleRecorded = useCallback((result: RecordingResult, meta: GuidedRecordingMeta) => {
    setRecorded({ result, meta });
    setSavedAngle(false);
    analytics.recordingCompleted(sport, preset?.action ?? action ?? '', meta.durationSeconds);
    if (meta.trimWindow) {
      analytics.autoTrimApplied(meta.durationSeconds, meta.trimWindow.end - meta.trimWindow.start);
    }
    setPhase('review');
  }, [analytics, sport, preset, action]);

  const retestAngle = useCallback((angle: SavedAngle) => {
    setSport(angle.sport);
    setAction(angle.action);
    analytics.retestSameAngle(angle.sport, angle.action);
    const p = getPreset(angle.sport, angle.action);
    if (p) {
      analytics.started(angle.sport, p.action);
      setPhase('capture');
    }
  }, [analytics]);

  const recommendation = useMemo(() => {
    if (!recorded?.meta.quality) return null;
    return evaluateRetake({
      quality: recorded.meta.quality,
      readiness: recorded.meta.readinessAtStart,
      detectionRate: recorded.meta.detectionRate,
      durationSeconds: recorded.meta.durationSeconds,
    });
  }, [recorded]);

  const retake = useCallback(() => {
    analytics.retakeAccepted();
    if (recorded) URL.revokeObjectURL(recorded.result.url);
    setRecorded(null);
    setPhase('capture');
  }, [analytics, recorded]);

  const proceed = useCallback(async () => {
    if (!recorded || !preset || handingOff) return;
    analytics.retakeSkipped();
    analytics.analysisStarted(sport);
    setHandingOff(true);
    try {
      const platformSport = toPlatformSport(sport);
      const ext = recorded.result.mimeType.includes('mp4') ? 'mp4' : 'webm';
      const file = new File([recorded.result.blob], `swingvantage-${sport}-${preset.action}.${ext}`, {
        type: recorded.result.blob.type || recorded.result.mimeType,
      });
      // Reuse the analyzer's own metadata extractor so width/height/duration/
      // frame-rate are exactly what the pipeline expects.
      const meta = await extractVideoMetadata(file);
      const { objectUrl, ...metadata } = meta;
      // Hand the clip to the analyzer route and point the app at the right sport.
      setPendingClip({
        file,
        metadata: { ...metadata, camera_angle: toCameraAngle(preset.recommendedView) },
        objectUrl,
        sport: platformSport,
        action: preset.action,
        trimWindow: recorded.meta.trimWindow,
        createdAt: Date.now(),
      });
      setActiveSport(platformSport);
      // The original review object URL is superseded by the analyzer's.
      URL.revokeObjectURL(recorded.result.url);
      router.push('/video');
    } catch {
      // Extraction failed — stay on review; the download fallback still works.
      setHandingOff(false);
    }
  }, [recorded, preset, handingOff, analytics, sport, setActiveSport, router]);

  const saveAngle = useCallback(() => {
    if (!preset) return;
    saveAnglePreset({
      sport, action: preset.action, view: preset.recommendedView,
      orientation: preset.recommendedOrientation, savedAt: Date.now(),
    });
    setSavedAngle(true);
    analytics.savedAnglePreset(sport, preset.action);
  }, [preset, sport, analytics]);

  // ── Select phase ──────────────────────────────────────────
  if (phase === 'select') {
    return (
      <div className={cn('space-y-5', className)}>
        {compat && compat.tier !== 'full' && (
          <DeviceCompatibilityWarning result={compat} />
        )}
        <SavedAnglesCard onRetest={retestAngle} />
        <Card>
          <CardBody className="space-y-5">
            <SportAngleSelector
              sport={sport}
              action={action}
              onSportChange={handleSportChange}
              onActionChange={handleActionChange}
            />
            {preset && action && <SetupInstructionCard preset={preset} />}
            <VoiceGuidanceControls
              mode={voiceMode}
              onModeChange={(m) => { setVoiceMode(m); if (m === 'silent') analytics.muteEnabled(); }}
              captionsOn={captionsOn}
              onCaptionsChange={(v) => { setCaptionsOn(v); if (v) analytics.captionsEnabled(); }}
              hapticsOn={hapticsOn}
              onHapticsChange={setHapticsOn}
              voiceSupported={voiceSupported}
              hapticsSupported={hapticsSupported}
            />
            <Button
              size="lg"
              className="w-full"
              disabled={!action || compat?.tier === 'unsupported'}
              onClick={startCapture}
            >
              <Video className="h-4 w-4" aria-hidden /> Record with guidance
            </Button>
          </CardBody>
        </Card>
        <PrivacyNotice />
      </div>
    );
  }

  // ── Capture phase ─────────────────────────────────────────
  if (phase === 'capture' && preset) {
    return (
      <div className={cn('space-y-4', className)}>
        <button
          type="button"
          onClick={() => setPhase('select')}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Change setup
        </button>
        <GuidedCameraView
          preset={preset}
          poseEnabled={poseEnabled}
          voiceMode={voiceMode}
          captionsOn={captionsOn}
          hapticsOn={hapticsOn}
          hapticsSupported={hapticsSupported}
          onPermission={(g) => analytics.permission(g)}
          onReadinessPassed={(score) => analytics.readinessPassed(score, sport)}
          onVoiceMessage={(m) => analytics.voicePlayed(m.id, m.category)}
          onRecorded={handleRecorded}
        />
        <SetupInstructionCard preset={preset} />
      </div>
    );
  }

  // ── Review phase ──────────────────────────────────────────
  if (phase === 'review' && recorded) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="overflow-hidden rounded-2xl bg-black">
          <video src={recorded.result.url} controls playsInline className="mx-auto max-h-[60vh] w-full" />
        </div>

        {recorded.meta.trimWindow && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
            Auto-trim found the active motion at{' '}
            <span className="font-medium text-foreground">
              {recorded.meta.trimWindow.start.toFixed(1)}s–{recorded.meta.trimWindow.end.toFixed(1)}s
            </span>
            {' '}— analysis will focus there.
          </p>
        )}

        {recommendation && (
          <RetakeRecommendationCard
            recommendation={recommendation}
            onRetake={retake}
            onProceed={proceed}
          />
        )}

        {handingOff && (
          <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Opening the analyzer…
          </p>
        )}

        <Card>
          <CardBody className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <a
              href={recorded.result.url}
              download={`swingvantage-${sport}-${preset?.action ?? 'clip'}.${recorded.result.mimeType.includes('mp4') ? 'mp4' : 'webm'}`}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted tap-target"
            >
              <Download className="h-4 w-4" aria-hidden /> Download clip
            </a>
            <Button variant="outline" className="flex-1" onClick={saveAngle} disabled={savedAngle}>
              <BookmarkPlus className="h-4 w-4" aria-hidden /> {savedAngle ? 'Angle saved' : 'Save this angle'}
            </Button>
            <Button variant="ghost" className="flex-1" onClick={retake}>
              <RotateCw className="h-4 w-4" aria-hidden /> Record again
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return null;
}
