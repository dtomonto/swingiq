'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  requestCamera,
  stopStream,
  classifyCameraError,
  type CameraFacing,
  type CameraError,
} from '../runtime/camera';

export type CameraStatus = 'idle' | 'requesting' | 'ready' | 'error';

export interface UseCameraStream {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  status: CameraStatus;
  error: CameraError | null;
  facing: CameraFacing;
  start: () => void;
  stop: () => void;
  switchCamera: () => void;
}

/**
 * Owns the camera lifecycle: requests a stream on demand, attaches it to a
 * video element, and tears it down on unmount. Defensive — surfaces a typed
 * error (denied / not_found / in_use / unsupported) instead of throwing.
 */
export function useCameraStream(autoStart = false): UseCameraStream {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>('idle');
  const [error, setError] = useState<CameraError | null>(null);
  const [facing, setFacing] = useState<CameraFacing>('environment');

  const attach = useCallback((stream: MediaStream) => {
    streamRef.current = stream;
    const video = videoRef.current;
    if (video) {
      video.srcObject = stream;
      void video.play().catch(() => {
        /* autoplay can reject; the UI shows a tap-to-start affordance */
      });
    }
  }, []);

  const startWith = useCallback(
    async (f: CameraFacing) => {
      setStatus('requesting');
      setError(null);
      try {
        const { stream } = await requestCamera(f);
        attach(stream);
        setStatus('ready');
      } catch (err) {
        setError(classifyCameraError(err));
        setStatus('error');
      }
    },
    [attach],
  );

  const start = useCallback(() => {
    void startWith(facing);
  }, [startWith, facing]);

  const stop = useCallback(() => {
    stopStream(streamRef.current);
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setStatus('idle');
  }, []);

  const switchCamera = useCallback(() => {
    const next: CameraFacing = facing === 'environment' ? 'user' : 'environment';
    setFacing(next);
    stopStream(streamRef.current);
    void startWith(next);
  }, [facing, startWith]);

  useEffect(() => {
    if (autoStart) void startWith(facing);
    return () => {
      stopStream(streamRef.current);
      streamRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { videoRef, status, error, facing, start, stop, switchCamera };
}

/** Expose the underlying stream for the recorder (kept off the public API). */
export function getStreamFromVideo(video: HTMLVideoElement | null): MediaStream | null {
  const src = video?.srcObject;
  return src instanceof MediaStream ? src : null;
}
