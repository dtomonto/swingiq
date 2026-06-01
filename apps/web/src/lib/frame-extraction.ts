// ============================================================
// SwingIQ — Client-side Swing Frame Extraction
//
// Samples still frames from an uploaded swing video entirely in the
// browser (no network round-trip to extract). The frames span the
// WHOLE clip so the AI vision model sees the full motion — setup
// through finish — not just a narrow window.
//
// Only these downscaled still frames are later sent to the AI provider
// for analysis; the original video file never leaves the device.
// ============================================================

/** Default number of frames sampled across the clip. */
export const DEFAULT_FRAME_COUNT = 16;

/** Hard ceiling so payloads stay reasonable even if a caller asks for more. */
export const MAX_FRAME_COUNT = 24;

/** Longest edge (px) each frame is downscaled to before encoding. */
const DEFAULT_MAX_EDGE = 720;

/** JPEG quality for encoded frames (0–1). */
const DEFAULT_QUALITY = 0.72;

export interface ExtractedFrame {
  /** `data:image/jpeg;base64,...` */
  dataUrl: string;
  /** Source timestamp in seconds. */
  timestampSeconds: number;
  /** Coarse position label across the clip (approximate, not a measured phase). */
  position: 'early' | 'middle' | 'late';
  /** 0-based order across the clip. */
  index: number;
}

export interface FrameExtractionOptions {
  /** How many frames to sample (clamped to [1, MAX_FRAME_COUNT]). */
  count?: number;
  maxEdge?: number;
  quality?: number;
}

export interface FrameExtractionResult {
  frames: ExtractedFrame[];
  /** Resolution of the source video, e.g. "1920x1080". */
  resolution: string;
  durationSeconds: number;
}

function clampCount(count: number): number {
  if (!Number.isFinite(count) || count < 1) return 1;
  return Math.min(Math.floor(count), MAX_FRAME_COUNT);
}

function positionFor(fraction: number): ExtractedFrame['position'] {
  if (fraction < 0.34) return 'early';
  if (fraction < 0.67) return 'middle';
  return 'late';
}

/** Seek the element and resolve once the frame at that time is actually painted. */
function seekTo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const cleanup = () => {
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('error', onError);
      clearTimeout(timer);
    };
    const onSeeked = () => {
      if (settled) return;
      settled = true;
      cleanup();
      // Give the decoder a tick to paint the frame (iOS/Safari quirk).
      requestAnimationFrame(() => resolve());
    };
    const onError = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error('Video seek failed while extracting frames.'));
    };
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      // Don't hard-fail on a slow seek — resolve and let the draw proceed.
      resolve();
    }, 3000);

    video.addEventListener('seeked', onSeeked);
    video.addEventListener('error', onError);
    // Clamp into a safe range; exactly 0 or exactly duration can be flaky.
    video.currentTime = Math.max(0.01, Math.min(time, (video.duration || time) - 0.05));
  });
}

/**
 * Extract evenly-spaced frames across the entire video clip.
 *
 * @param source A File/Blob OR an existing object URL string.
 * @throws if the video cannot be loaded or no frames can be drawn.
 */
export async function extractSwingFrames(
  source: File | Blob | string,
  options: FrameExtractionOptions = {},
): Promise<FrameExtractionResult> {
  const count = clampCount(options.count ?? DEFAULT_FRAME_COUNT);
  const maxEdge = options.maxEdge ?? DEFAULT_MAX_EDGE;
  const quality = options.quality ?? DEFAULT_QUALITY;

  const ownsObjectUrl = typeof source !== 'string';
  const objectUrl = ownsObjectUrl ? URL.createObjectURL(source) : source;

  const video = document.createElement('video');
  video.preload = 'auto';
  video.muted = true;
  video.playsInline = true;
  video.crossOrigin = 'anonymous';

  const revoke = () => {
    if (ownsObjectUrl) URL.revokeObjectURL(objectUrl);
    video.removeAttribute('src');
    video.load();
  };

  try {
    await new Promise<void>((resolve, reject) => {
      const onLoaded = () => {
        video.removeEventListener('loadeddata', onLoaded);
        video.removeEventListener('error', onError);
        resolve();
      };
      const onError = () => {
        video.removeEventListener('loadeddata', onLoaded);
        video.removeEventListener('error', onError);
        reject(new Error('Could not load the video for frame extraction.'));
      };
      video.addEventListener('loadeddata', onLoaded);
      video.addEventListener('error', onError);
      video.src = objectUrl;
    });

    const duration = video.duration;
    if (!Number.isFinite(duration) || duration <= 0) {
      throw new Error('Video has no readable duration; cannot extract frames.');
    }

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    if (!vw || !vh) {
      throw new Error('Video has no readable dimensions; cannot extract frames.');
    }

    // Downscale preserving aspect ratio.
    const scale = Math.min(1, maxEdge / Math.max(vw, vh));
    const cw = Math.max(1, Math.round(vw * scale));
    const ch = Math.max(1, Math.round(vh * scale));

    const canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable; cannot extract frames.');

    const frames: ExtractedFrame[] = [];
    // Sample across the whole clip (2%..98%) so the full motion is covered.
    const startFrac = 0.02;
    const endFrac = 0.98;
    for (let i = 0; i < count; i++) {
      const fraction = count === 1 ? 0.5 : startFrac + ((endFrac - startFrac) * i) / (count - 1);
      const t = duration * fraction;
      await seekTo(video, t);
      ctx.drawImage(video, 0, 0, cw, ch);
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      // A blank/failed draw yields a tiny data URL — skip it rather than send junk.
      if (dataUrl.length > 1000) {
        frames.push({
          dataUrl,
          timestampSeconds: Number(t.toFixed(3)),
          position: positionFor(fraction),
          index: i,
        });
      }
    }

    if (frames.length === 0) {
      throw new Error('No frames could be extracted from this video. Try a different file.');
    }

    return {
      frames,
      resolution: `${vw}x${vh}`,
      durationSeconds: Number(duration.toFixed(2)),
    };
  } finally {
    revoke();
  }
}
