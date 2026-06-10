'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { pickRecordingMimeType } from '../runtime/camera';

export interface RecordingResult {
  blob: Blob;
  url: string;
  mimeType: string;
  durationMs: number;
}

export type RecordingStatus = 'idle' | 'recording' | 'stopped';

export interface UseRecordingState {
  status: RecordingStatus;
  elapsedMs: number;
  result: RecordingResult | null;
  start: (stream: MediaStream) => void;
  stop: () => void;
  reset: () => void;
}

const MAX_DURATION_MS = 20_000; // safety cap, matches VideoRecorder

/**
 * MediaRecorder wrapper for guided capture. Records to the best supported
 * container, caps duration, and hands back a Blob + object URL. The caller
 * owns the camera stream; we never request media here.
 */
export function useRecordingState(): UseRecordingState {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [status, setStatus] = useState<RecordingStatus>('idle');
  const [elapsedMs, setElapsedMs] = useState(0);
  const [result, setResult] = useState<RecordingResult | null>(null);

  const clearTimers = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (autoStopRef.current) clearTimeout(autoStopRef.current);
    timerRef.current = null;
    autoStopRef.current = null;
  }, []);

  const stop = useCallback(() => {
    const rec = recorderRef.current;
    if (rec && rec.state !== 'inactive') {
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
    }
    clearTimers();
  }, [clearTimers]);

  const start = useCallback(
    (stream: MediaStream) => {
      if (typeof MediaRecorder === 'undefined') return;
      const mimeType = pickRecordingMimeType();
      chunksRef.current = [];
      setResult(null);
      let rec: MediaRecorder;
      try {
        rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      } catch {
        return;
      }
      recorderRef.current = rec;

      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const type = rec.mimeType || mimeType || 'video/webm';
        const blob = new Blob(chunksRef.current, { type });
        const url = URL.createObjectURL(blob);
        const durationMs = Date.now() - startedAtRef.current;
        setResult({ blob, url, mimeType: type, durationMs });
        setStatus('stopped');
      };

      startedAtRef.current = Date.now();
      setElapsedMs(0);
      setStatus('recording');
      rec.start();

      timerRef.current = setInterval(() => {
        setElapsedMs(Date.now() - startedAtRef.current);
      }, 100);
      autoStopRef.current = setTimeout(stop, MAX_DURATION_MS);
    },
    [stop],
  );

  const reset = useCallback(() => {
    setResult((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return null;
    });
    setStatus('idle');
    setElapsedMs(0);
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  return { status, elapsedMs, result, start, stop, reset };
}
