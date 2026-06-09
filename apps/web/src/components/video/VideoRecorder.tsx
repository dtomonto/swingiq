'use client';

// ============================================================
// SwingVantage — In-app Swing Video Recorder
// ------------------------------------------------------------
// Records a swing directly in the browser via getUserMedia +
// MediaRecorder — no OS file picker, no upload. Works with the
// front (selfie) and back cameras so you can film yourself or
// someone else, and draws a sport-aware "where to stand" overlay
// on the live preview.
//
// Duration + dimensions are measured from the recording itself
// (elapsed time + track settings) to dodge the WebM "Infinity
// duration" quirk. The clip stays on-device and is handed off the
// same way an uploaded file is, via onVideoReady().
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Video,
  Circle,
  Square,
  RotateCcw,
  Check,
  SwitchCamera,
  AlertCircle,
  Smartphone,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { SwingVideoMetadata, VisualSport } from '@swingiq/core';
import { cn } from '@/lib/utils';
import { RecordingOverlay, type OverlayAngle } from './RecordingOverlay';

type RecState = 'idle' | 'ready' | 'countdown' | 'recording' | 'review';
type Facing = 'user' | 'environment';

/** Plenty for a swing with a moment to get set when self-recording. */
const MAX_SECONDS = 20;

function pickMimeType(): string {
  const candidates = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'];
  if (typeof MediaRecorder === 'undefined') return '';
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? '';
}

interface VideoRecorderProps {
  onVideoReady: (file: File, metadata: SwingVideoMetadata, objectUrl: string) => void;
  onError?: (message: string) => void;
  /** Drives the framing overlay + hints. Defaults to golf. */
  sport?: VisualSport;
  /** Gates the camera until any privacy notice is accepted. */
  disabled?: boolean;
}

export function VideoRecorder({ onVideoReady, onError, sport = 'golf', disabled }: VideoRecorderProps) {
  const [state, setState] = useState<RecState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [facing, setFacing] = useState<Facing>('environment');
  const [canFlip, setCanFlip] = useState(false);
  const [angle, setAngle] = useState<OverlayAngle>(sport === 'golf' ? 'down_the_line' : 'unknown');

  const liveRef = useRef<HTMLVideoElement>(null);
  const reviewRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeRef = useRef<string>('');
  const startMsRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  const reviewUrlRef = useRef<string | null>(null);
  const dimsRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (liveRef.current) liveRef.current.srcObject = null;
  }, []);

  const cleanup = useCallback(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    stopStream();
    if (reviewUrlRef.current) URL.revokeObjectURL(reviewUrlRef.current);
  }, [stopStream]);

  useEffect(() => () => cleanup(), [cleanup]);

  const fail = useCallback(
    (message: string) => {
      setError(message);
      onError?.(message);
    },
    [onError],
  );

  const enableCamera = useCallback(
    async (facingMode: Facing) => {
      setError(null);
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        fail('Camera recording isn’t supported in this browser. Try uploading a file instead.');
        return;
      }
      try {
        stopStream();
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        streamRef.current = stream;
        const settings = stream.getVideoTracks()[0]?.getSettings();
        dimsRef.current = { w: settings?.width ?? 0, h: settings?.height ?? 0 };
        if (liveRef.current) {
          liveRef.current.srcObject = stream;
          await liveRef.current.play().catch(() => {});
        }
        setState('ready');

        // Only offer the flip control when more than one camera exists.
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          setCanFlip(devices.filter((d) => d.kind === 'videoinput').length > 1);
        } catch {
          /* enumerateDevices unavailable — leave flip hidden */
        }
      } catch (err) {
        const denied = err instanceof DOMException && err.name === 'NotAllowedError';
        const missing = err instanceof DOMException && err.name === 'NotFoundError';
        fail(
          denied
            ? 'Camera access was blocked. Allow camera permission in your browser, or upload a file instead.'
            : missing
              ? 'No camera was found on this device. Try uploading a file instead.'
              : 'Couldn’t access the camera. Check it isn’t in use by another app, or upload a file instead.',
        );
      }
    },
    [stopStream, fail],
  );

  // Note: revoking the privacy consent unmounts this component (the parent
  // stops rendering it), and the cleanup effect above shuts the camera down —
  // so there's no need to watch `disabled` here.

  const stopRecording = useCallback(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    try {
      recorderRef.current?.stop();
    } catch {
      /* already stopped */
    }
  }, []);

  const beginRecording = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;
    chunksRef.current = [];
    const mimeType = pickMimeType();
    mimeRef.current = mimeType || 'video/webm';
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeRef.current });
      if (reviewUrlRef.current) URL.revokeObjectURL(reviewUrlRef.current);
      const url = URL.createObjectURL(blob);
      reviewUrlRef.current = url;
      if (reviewRef.current) reviewRef.current.src = url;
      // Turn the camera light off as soon as we have the clip.
      stopStream();
      setState('review');
    };
    recorderRef.current = recorder;
    recorder.start();
    startMsRef.current = Date.now();
    setElapsed(0);
    setState('recording');
    timerRef.current = window.setInterval(() => {
      const secs = (Date.now() - startMsRef.current) / 1000;
      setElapsed(secs);
      if (secs >= MAX_SECONDS) stopRecording();
    }, 100);
  }, [stopRecording, stopStream]);

  const startCountdown = useCallback(() => {
    setCountdown(3);
    setState('countdown');
    let n = 3;
    const id = window.setInterval(() => {
      n -= 1;
      setCountdown(n);
      if (n <= 0) {
        window.clearInterval(id);
        beginRecording();
      }
    }, 1000);
  }, [beginRecording]);

  const retake = useCallback(() => {
    if (reviewUrlRef.current) {
      URL.revokeObjectURL(reviewUrlRef.current);
      reviewUrlRef.current = null;
    }
    setElapsed(0);
    enableCamera(facing);
  }, [enableCamera, facing]);

  const useClip = useCallback(() => {
    const blob = new Blob(chunksRef.current, { type: mimeRef.current || 'video/webm' });
    const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
    const file = new File([blob], `swing-recording-${Date.now()}.${ext}`, { type: blob.type });
    const metadata: SwingVideoMetadata = {
      file_name: file.name,
      file_size_bytes: file.size,
      mime_type: file.type,
      duration_seconds: Math.max(0.3, Number(elapsed.toFixed(2))),
      width: dimsRef.current.w,
      height: dimsRef.current.h,
      frame_rate_estimated: null,
      camera_angle: 'unknown',
    };
    const url = URL.createObjectURL(file);
    stopStream();
    onVideoReady(file, metadata, url);
  }, [elapsed, onVideoReady, stopStream]);

  const flipCamera = useCallback(() => {
    const next: Facing = facing === 'user' ? 'environment' : 'user';
    setFacing(next);
    enableCamera(next);
  }, [facing, enableCamera]);

  const remaining = Math.max(0, MAX_SECONDS - elapsed);
  const mirrored = facing === 'user' && state !== 'review';

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-start gap-3 rounded-lg bg-error/10 border border-error/30 p-3">
          <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      {/* ── Idle: explain + enable camera ── */}
      {state === 'idle' && (
        <div className="rounded-xl border-2 border-dashed border-border bg-muted p-10 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-card mx-auto flex items-center justify-center">
            <Video className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">Record your swing</p>
            <p className="text-sm text-muted-foreground mt-1">
              Up to {MAX_SECONDS}s. Film yourself or someone else — the recording stays on your
              device and nothing is uploaded.
            </p>
          </div>
          <Button onClick={() => enableCamera(facing)} disabled={disabled}>
            <Video className="w-4 h-4" /> Enable camera
          </Button>
        </div>
      )}

      {/* ── Live preview / review ── */}
      {state !== 'idle' && (
        <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
          {/* live preview (mirrored for the selfie camera so it reads like a mirror) */}
          <video
            ref={liveRef}
            playsInline
            muted
            className={cn('w-full h-full object-cover', state === 'review' && 'hidden')}
            style={mirrored ? { transform: 'scaleX(-1)' } : undefined}
          />
          {/* recorded review (always shown un-mirrored — this is what gets analyzed).
              Silent swing clip, no caption track to provide. */}
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            ref={reviewRef}
            playsInline
            controls
            loop
            className={cn('w-full h-full object-contain bg-black', state !== 'review' && 'hidden')}
          />

          {/* framing overlay — visible while setting up + recording, hidden in review */}
          {state !== 'review' && <RecordingOverlay sport={sport} angle={angle} />}

          {state === 'countdown' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="text-7xl font-black text-white drop-shadow-lg">{countdown}</span>
            </div>
          )}

          {state === 'recording' && (
            <div className="absolute top-3 left-3 flex items-center gap-2 bg-error/90 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
              <Circle className="w-2.5 h-2.5 fill-current animate-pulse" />
              REC {elapsed.toFixed(1)}s · {remaining.toFixed(0)}s left
            </div>
          )}

          {(state === 'ready' || state === 'countdown') && canFlip && (
            <button
              onClick={flipCamera}
              className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
              aria-label="Switch between front and back camera"
              title="Switch camera"
            >
              <SwitchCamera className="w-4 h-4" />
            </button>
          )}

          {state === 'ready' && (
            <div className="absolute top-3 left-3 bg-black/55 text-white text-[11px] font-medium px-2.5 py-1 rounded-full">
              {facing === 'user' ? 'Front camera (selfie)' : 'Back camera'}
            </div>
          )}
        </div>
      )}

      {/* ── Golf angle picker (drives the overlay) ── */}
      {sport === 'golf' && (state === 'ready' || state === 'countdown') && (
        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted w-fit">
          {(
            [
              ['down_the_line', 'Down the line'],
              ['face_on', 'Face on'],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setAngle(value)}
              className={cn(
                'text-xs font-medium rounded-md px-3 py-1.5 transition-colors',
                angle === value
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ── Controls ── */}
      {state === 'ready' && (
        <Button className="w-full" onClick={startCountdown}>
          <Circle className="w-4 h-4 fill-current" /> Start recording
        </Button>
      )}
      {state === 'recording' && (
        <Button className="w-full" variant="danger" onClick={stopRecording}>
          <Square className="w-4 h-4 fill-current" /> Stop
        </Button>
      )}
      {state === 'review' && (
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={retake}>
            <RotateCcw className="w-4 h-4" /> Re-take
          </Button>
          <Button className="flex-1" onClick={useClip}>
            <Check className="w-4 h-4" /> Use this clip
          </Button>
        </div>
      )}

      {/* ── Helper notes ── */}
      {state === 'ready' && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground sm:hidden">
          <Smartphone className="w-3.5 h-3.5 shrink-0" />
          Tip: turn your phone sideways (landscape) so your whole body and club fit.
        </p>
      )}
      {(state === 'idle' || state === 'ready') && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-primary" />
          Recorded on your device. Only sampled frames are sent for analysis — never the full video.
        </p>
      )}
    </div>
  );
}
