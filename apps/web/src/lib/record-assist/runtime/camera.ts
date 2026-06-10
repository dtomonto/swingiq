// ============================================================
// SwingVantage — RecordAssist runtime: camera + recorder
// ------------------------------------------------------------
// Defensive getUserMedia + MediaRecorder helpers, mirroring the codec
// negotiation already used by components/video/VideoRecorder. Kept here
// so the hooks stay small and the browser-only surface is isolated.
// ============================================================

export type CameraFacing = 'environment' | 'user';

export interface CameraStreamResult {
  stream: MediaStream;
  facing: CameraFacing;
}

export type CameraError =
  | 'denied'
  | 'not_found'
  | 'unsupported'
  | 'in_use'
  | 'unknown';

export function classifyCameraError(err: unknown): CameraError {
  const name = (err as { name?: string })?.name ?? '';
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'denied';
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'not_found';
  if (name === 'NotReadableError' || name === 'AbortError') return 'in_use';
  if (typeof navigator === 'undefined' || !navigator.mediaDevices) return 'unsupported';
  return 'unknown';
}

/** Request a camera stream, preferring the requested facing mode. */
export async function requestCamera(
  facing: CameraFacing = 'environment',
): Promise<CameraStreamResult> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    throw Object.assign(new Error('getUserMedia unsupported'), { name: 'NotSupportedError' });
  }
  const constraints: MediaStreamConstraints = {
    video: {
      facingMode: facing,
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: false,
  };
  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    return { stream, facing };
  } catch (err) {
    // Fall back to any camera if the exact facing mode was unavailable.
    if (classifyCameraError(err) === 'not_found') {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      return { stream, facing };
    }
    throw err;
  }
}

export function stopStream(stream: MediaStream | null): void {
  if (!stream) return;
  for (const track of stream.getTracks()) {
    try {
      track.stop();
    } catch {
      /* ignore */
    }
  }
}

/** Pick a supported recording MIME type (mirrors VideoRecorder negotiation). */
export function pickRecordingMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined;
  const candidates = [
    'video/mp4;codecs=h264',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ];
  for (const type of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(type)) return type;
    } catch {
      /* ignore */
    }
  }
  return undefined;
}
