'use client';

// ============================================================
// SwingIQ — Motion Lab: In-app Camera Recorder
// ------------------------------------------------------------
// Records a clip directly in the browser via getUserMedia +
// MediaRecorder — no OS file picker, no upload. Builds metadata from
// the measured recording (duration from elapsed time, dimensions from
// the track) to avoid the well-known WebM "Infinity duration" quirk.
// The recording stays on-device; it's handed to the wizard exactly
// like an uploaded file.
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { Video, Circle, Square, RotateCcw, Check, SwitchCamera, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { SwingVideoMetadata } from '@swingiq/core';
import { cn } from '@/lib/utils';

type RecState = 'idle' | 'ready' | 'countdown' | 'recording' | 'review';

const MAX_SECONDS = 15;

function pickMimeType(): string {
  const candidates = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'];
  if (typeof MediaRecorder === 'undefined') return '';
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? '';
}

interface Props {
  onVideoReady: (file: File, metadata: SwingVideoMetadata, objectUrl: string) => void;
}

export function MotionRecorder({ onVideoReady }: Props) {
  const [state, setState] = useState<RecState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [facing, setFacing] = useState<'user' | 'environment'>('environment');

  const liveRef = useRef<HTMLVideoElement>(null);
  const reviewRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startMsRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  const reviewUrlRef = useRef<string | null>(null);
  const dimsRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const cleanup = useCallback(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    stopStream();
    if (reviewUrlRef.current) URL.revokeObjectURL(reviewUrlRef.current);
  }, [stopStream]);

  useEffect(() => () => cleanup(), [cleanup]);

  const enableCamera = useCallback(async (facingMode: 'user' | 'environment') => {
    setError(null);
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setError('Camera recording isn’t supported in this browser. Try uploading a file instead.');
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
    } catch {
      setError('Couldn’t access the camera. Check permissions, or upload a file instead.');
    }
  }, [stopStream]);

  const stopRecording = useCallback(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    try { recorderRef.current?.stop(); } catch { /* ignore */ }
  }, []);

  const beginRecording = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;
    chunksRef.current = [];
    const mimeType = pickMimeType();
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    recorder.onstop = () => {
      const type = mimeType || 'video/webm';
      const blob = new Blob(chunksRef.current, { type });
      if (reviewUrlRef.current) URL.revokeObjectURL(reviewUrlRef.current);
      const url = URL.createObjectURL(blob);
      reviewUrlRef.current = url;
      if (reviewRef.current) reviewRef.current.src = url;
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
  }, [stopRecording]);

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
    if (reviewUrlRef.current) { URL.revokeObjectURL(reviewUrlRef.current); reviewUrlRef.current = null; }
    setElapsed(0);
    enableCamera(facing);
  }, [enableCamera, facing]);

  const useClip = useCallback(() => {
    const blob = new Blob(chunksRef.current, { type: pickMimeType() || 'video/webm' });
    const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
    const file = new File([blob], `motion-recording-${Date.now()}.${ext}`, { type: blob.type });
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
    const next = facing === 'user' ? 'environment' : 'user';
    setFacing(next);
    enableCamera(next);
  }, [facing, enableCamera]);

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-start gap-3 rounded-lg bg-error/10 border border-error/30 p-3">
          <AlertCircle className="w-5 h-5 text-error shrink-0" />
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      {state === 'idle' && (
        <div className="rounded-xl border-2 border-dashed border-border bg-muted p-10 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-muted mx-auto flex items-center justify-center">
            <Video className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">Record your motion</p>
            <p className="text-sm text-muted-foreground mt-1">Up to {MAX_SECONDS}s. Stays on your device — nothing is uploaded.</p>
          </div>
          <Button onClick={() => enableCamera(facing)}><Video className="w-4 h-4" /> Enable camera</Button>
        </div>
      )}

      {state !== 'idle' && (
        <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
          {/* live preview */}
          <video
            ref={liveRef}
            playsInline muted
            className={cn('w-full h-full object-cover', state === 'review' && 'hidden')}
          />
          {/* recorded review */}
          <video
            ref={reviewRef}
            playsInline controls loop
            className={cn('w-full h-full object-contain bg-black', state !== 'review' && 'hidden')}
          />

          {state === 'countdown' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="text-6xl font-black text-white">{countdown}</span>
            </div>
          )}
          {state === 'recording' && (
            <div className="absolute top-3 left-3 flex items-center gap-2 bg-error/90 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
              <Circle className="w-2.5 h-2.5 fill-current animate-pulse" />
              REC {elapsed.toFixed(1)}s
            </div>
          )}
          {(state === 'ready' || state === 'countdown') && (
            <button onClick={flipCamera} className="absolute top-3 right-3 bg-black/50 text-white rounded-full p-2" aria-label="Flip camera">
              <SwitchCamera className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* controls */}
      {state === 'ready' && (
        <Button className="w-full" onClick={startCountdown}><Circle className="w-4 h-4 fill-current" /> Start recording</Button>
      )}
      {state === 'recording' && (
        <Button className="w-full" variant="danger" onClick={stopRecording}><Square className="w-4 h-4 fill-current" /> Stop</Button>
      )}
      {state === 'review' && (
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={retake}><RotateCcw className="w-4 h-4" /> Re-take</Button>
          <Button className="flex-1" onClick={useClip}><Check className="w-4 h-4" /> Use this clip</Button>
        </div>
      )}
    </div>
  );
}
