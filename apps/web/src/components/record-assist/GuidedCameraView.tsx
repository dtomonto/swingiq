'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Circle, Square, SwitchCamera, Loader2 } from 'lucide-react';
import {
  useCameraStream,
  getStreamFromVideo,
  useGuidedCapture,
  useVoiceGuidance,
  useRecordingState,
} from '@/lib/record-assist/hooks';
import type { RecordingResult } from '@/lib/record-assist/hooks/useRecordingState';
import type {
  SportActionPreset,
  CameraOrientation,
  VoiceMode,
  FrameQualitySignals,
  VoiceGuidanceMessage,
} from '@/lib/record-assist/types';
import { CameraPermissionPanel } from './CameraPermissionPanel';
import { AthleteFrameOverlay } from './AthleteFrameOverlay';
import { ReadinessScoreBadge } from './ReadinessScoreBadge';
import { GuidanceCaption } from './GuidanceCaption';
import { RecordingCountdown } from './RecordingCountdown';

export interface GuidedRecordingMeta {
  readinessAtStart: number;
  detectionRate: number;
  quality: FrameQualitySignals | null;
  durationSeconds: number;
}

export interface GuidedCameraViewProps {
  preset: SportActionPreset;
  poseEnabled: boolean;
  voiceMode: VoiceMode;
  captionsOn: boolean;
  hapticsOn: boolean;
  hapticsSupported: boolean;
  onPermission?: (granted: boolean) => void;
  onReadinessPassed?: (score: number) => void;
  onVoiceMessage?: (m: VoiceGuidanceMessage) => void;
  onRecorded: (result: RecordingResult, meta: GuidedRecordingMeta) => void;
  className?: string;
}

type LivePhase = 'framing' | 'countdown' | 'recording';

/**
 * The live guided-recording surface. Handles camera permission, runs the
 * on-device guidance loop, speaks/captions corrections, manages the 3-2-1
 * countdown, and records the clip. Everything is local until the user opts
 * into analysis downstream.
 */
export function GuidedCameraView(props: GuidedCameraViewProps) {
  const {
    preset, poseEnabled, voiceMode, captionsOn, hapticsOn, hapticsSupported,
    onPermission, onReadinessPassed, onVoiceMessage, onRecorded, className,
  } = props;

  const camera = useCameraStream();
  const recording = useRecordingState();
  const [phase, setPhase] = useState<LivePhase>('framing');
  const [countdown, setCountdown] = useState<number | null>(null);
  const orientation: CameraOrientation = preset.recommendedOrientation;

  // Guidance loop runs while framing/counting down/recording (keeps the
  // detection-rate aggregate flowing) — voice is paused once we start.
  const cameraReady = camera.status === 'ready';
  const guided = useGuidedCapture({
    videoRef: camera.videoRef,
    preset,
    orientation,
    active: cameraReady,
    poseEnabled,
  });

  const voice = useVoiceGuidance({
    quality: guided.quality,
    readiness: guided.readiness,
    preset,
    mode: voiceMode,
    active: phase === 'framing',
    hapticsEnabled: hapticsOn && hapticsSupported,
    onMessage: onVoiceMessage,
  });

  // Track the latest guidance snapshot for the recording aggregate.
  const latest = useRef({ detectionRate: 0, quality: null as FrameQualitySignals | null, score: 0 });
  useEffect(() => {
    latest.current = {
      detectionRate: guided.detectionRate,
      quality: guided.quality,
      score: guided.readiness?.score ?? 0,
    };
  }, [guided.detectionRate, guided.quality, guided.readiness]);

  // Fire "readiness passed" once when crossing into usable territory.
  const passedRef = useRef(false);
  useEffect(() => {
    const score = guided.readiness?.score ?? 0;
    if (!passedRef.current && score >= 70) {
      passedRef.current = true;
      onReadinessPassed?.(score);
    }
    if (score < 60) passedRef.current = false;
  }, [guided.readiness, onReadinessPassed]);

  // Notify parent of permission outcome.
  const permittedRef = useRef<boolean | null>(null);
  useEffect(() => {
    if (camera.status === 'ready' && permittedRef.current !== true) {
      permittedRef.current = true;
      onPermission?.(true);
    }
    if (camera.status === 'error' && camera.error === 'denied' && permittedRef.current !== false) {
      permittedRef.current = false;
      onPermission?.(false);
    }
  }, [camera.status, camera.error, onPermission]);

  // Hand the finished clip back up.
  const recordingStartedAt = useRef(0);
  useEffect(() => {
    if (recording.status === 'stopped' && recording.result) {
      const durationSeconds = recording.result.durationMs / 1000;
      onRecorded(recording.result, {
        readinessAtStart: latest.current.score,
        detectionRate: latest.current.detectionRate,
        quality: latest.current.quality,
        durationSeconds,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording.status, recording.result]);

  const beginCountdown = useCallback(() => {
    setPhase('countdown');
    let n = 3;
    setCountdown(n);
    voice.speakCountdown(n);
    const tick = setInterval(() => {
      n -= 1;
      if (n > 0) {
        setCountdown(n);
        voice.speakCountdown(n);
      } else {
        clearInterval(tick);
        setCountdown(0);
        voice.speakCountdown(0);
        const stream = getStreamFromVideo(camera.videoRef.current);
        recordingStartedAt.current = Date.now();
        if (stream) recording.start(stream);
        setPhase('recording');
        setTimeout(() => setCountdown(null), 600);
      }
    }, 1000);
  }, [voice, camera.videoRef, recording]);

  const stopRecording = useCallback(() => {
    recording.stop();
    setPhase('framing');
  }, [recording]);

  if (camera.status !== 'ready') {
    return (
      <CameraPermissionPanel
        status={camera.status === 'error' ? 'error' : camera.status === 'requesting' ? 'requesting' : 'idle'}
        error={camera.error}
        onRequest={camera.start}
      />
    );
  }

  const elapsedS = (recording.elapsedMs / 1000).toFixed(1);

  return (
    <div className={cn('space-y-3', className)}>
      <div
        className={cn(
          'relative mx-auto overflow-hidden rounded-2xl bg-black',
          orientation === 'portrait' ? 'aspect-[9/16] max-h-[70vh]' : 'aspect-video',
        )}
      >
        <video
          ref={camera.videoRef}
          playsInline
          muted
          className="h-full w-full object-cover"
        />

        <AthleteFrameOverlay quality={guided.quality} preset={preset} />

        {/* Pose-loading hint */}
        {poseEnabled && !guided.poseReady && (
          <div className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1.5 text-xs text-white">
            <Loader2 className="mr-1 inline h-3 w-3 animate-spin" aria-hidden /> Loading body tracking…
          </div>
        )}

        {/* Readiness badge — top-right corner */}
        <div className="absolute right-2 top-2">
          <ReadinessScoreBadge readiness={guided.readiness} compact />
        </div>

        {/* REC indicator */}
        {phase === 'recording' && (
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-error px-2.5 py-1 text-xs font-semibold text-error-foreground">
            <span className="h-2 w-2 animate-pulse rounded-full bg-white" /> REC {elapsedS}s
          </div>
        )}

        {/* Camera switch */}
        {phase === 'framing' && (
          <button
            type="button"
            onClick={camera.switchCamera}
            aria-label="Switch camera"
            className="absolute bottom-3 right-3 rounded-full bg-black/60 p-2.5 text-white backdrop-blur-sm tap-target"
          >
            <SwitchCamera className="h-5 w-5" aria-hidden />
          </button>
        )}

        {/* Caption */}
        {captionsOn && voice.caption && phase !== 'recording' && (
          <div className="absolute inset-x-3 bottom-3 flex justify-center">
            <GuidanceCaption text={voice.caption} muted={voiceMode === 'silent'} />
          </div>
        )}

        <RecordingCountdown value={countdown} />
      </div>

      {/* Primary control */}
      <div className="flex justify-center">
        {phase === 'recording' ? (
          <Button variant="danger" size="lg" onClick={stopRecording} className="min-w-40">
            <Square className="h-4 w-4 fill-current" aria-hidden /> Stop
          </Button>
        ) : (
          <Button
            size="lg"
            onClick={beginCountdown}
            disabled={phase === 'countdown'}
            className="min-w-40"
          >
            <Circle className="h-4 w-4 fill-current" aria-hidden /> Record
          </Button>
        )}
      </div>
    </div>
  );
}
