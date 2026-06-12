// ============================================================
// SwingVantage — Client-side Video Metadata Extraction
// Extracts metadata from a File/Blob before upload.
// Runs entirely in the browser — no server round-trip needed.
// ============================================================

import type { SwingVideoMetadata } from '@swingiq/core';

export const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'] as const;
export const MAX_VIDEO_SIZE_BYTES = 500 * 1024 * 1024; // 500 MB
export const MAX_VIDEO_DURATION_SECONDS = 300; // 5 minutes
/**
 * Hard ceiling on how long we'll wait for the browser to report a file's
 * metadata before giving up. Without this, a file the browser can't decode
 * (classically an iPhone HEVC .mov on desktop) fires neither `loadedmetadata`
 * nor `error`, so the promise hangs forever and the upload UI is stuck on its
 * "Reading video metadata…" spinner — i.e. "I upload and nothing happens".
 */
export const METADATA_READ_TIMEOUT_MS = 15_000;

/** File extensions we accept when the OS hands us a blank/unknown MIME type. */
const ACCEPTED_VIDEO_EXTENSIONS = ['.mp4', '.m4v', '.mov', '.webm'] as const;

export interface VideoValidationResult {
  valid: boolean;
  errors: string[];
}

/** True when a filename ends in one of the extensions we accept. */
function hasAcceptedExtension(name: string): boolean {
  const lower = name.toLowerCase();
  return ACCEPTED_VIDEO_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/** Validate a video file before processing. */
export function validateVideoFile(file: File): VideoValidationResult {
  const errors: string[] = [];

  // Some platforms (notably Android, and some desktop file pickers) hand over a
  // video file with an empty or generic MIME type. Don't reject those outright —
  // fall back to the file extension, and let the actual decode step below be the
  // real arbiter of whether the browser can read it.
  const mimeOk = ACCEPTED_VIDEO_TYPES.includes(file.type as (typeof ACCEPTED_VIDEO_TYPES)[number]);
  const extOk = hasAcceptedExtension(file.name);
  if (!mimeOk && !extOk) {
    const seen = file.type ? `Unsupported file type: ${file.type}.` : 'Unrecognized video format.';
    errors.push(`${seen} Please upload an MP4, MOV, or WebM file.`);
  }

  if (file.size > MAX_VIDEO_SIZE_BYTES) {
    const mb = Math.round(file.size / 1024 / 1024);
    errors.push(`File is too large (${mb} MB). Maximum size is 500 MB.`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Extract video metadata using the browser's HTMLVideoElement.
 * The video is loaded into memory temporarily — no network request.
 */
export async function extractVideoMetadata(
  file: File,
): Promise<SwingVideoMetadata & { objectUrl: string }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement('video');

    video.preload = 'metadata';
    video.muted = true;

    // Guard against the file the browser can neither decode nor error on
    // (e.g. HEVC .mov on a desktop browser): if neither event fires within the
    // timeout, reject with an actionable message instead of hanging forever.
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      URL.revokeObjectURL(objectUrl);
      reject(
        new Error(
          "Couldn't read this video in your browser. It may use a format this browser can't open " +
            '(for example an iPhone HEVC .mov). Try re-saving or exporting it as an MP4 (H.264) and upload again.',
        ),
      );
    }, METADATA_READ_TIMEOUT_MS);

    const cleanup = () => {
      clearTimeout(timer);
      video.onloadedmetadata = null;
      video.onerror = null;
      video.src = '';
      video.load();
    };

    video.onloadedmetadata = () => {
      if (settled) return;
      // Read every value off the element BEFORE cleanup() — emptying the
      // element's src resets videoWidth/videoHeight/duration back to 0.
      const duration = video.duration;
      const width = video.videoWidth;
      const height = video.videoHeight;

      if (duration > MAX_VIDEO_DURATION_SECONDS) {
        settled = true;
        cleanup();
        URL.revokeObjectURL(objectUrl);
        reject(
          new Error(
            `Video is too long (${Math.round(duration)}s). Maximum is ${MAX_VIDEO_DURATION_SECONDS}s.`,
          ),
        );
        return;
      }

      settled = true;
      cleanup();
      resolve({
        file_name: file.name,
        file_size_bytes: file.size,
        mime_type: file.type,
        duration_seconds: duration,
        width,
        height,
        frame_rate_estimated: null, // browser can't reliably report FPS
        camera_angle: 'unknown',
        objectUrl,
      });
    };

    video.onerror = () => {
      if (settled) return;
      settled = true;
      cleanup();
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to read video metadata. The file may be corrupted.'));
    };

    video.src = objectUrl;
  });
}

/** Format file size for display */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Format video duration for display */
export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
