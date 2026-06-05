// ============================================================
// SwingVantage — Client-side Video Metadata Extraction
// Extracts metadata from a File/Blob before upload.
// Runs entirely in the browser — no server round-trip needed.
// ============================================================

import type { SwingVideoMetadata } from '@swingiq/core';

export const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'] as const;
export const MAX_VIDEO_SIZE_BYTES = 500 * 1024 * 1024; // 500 MB
export const MAX_VIDEO_DURATION_SECONDS = 300; // 5 minutes

export interface VideoValidationResult {
  valid: boolean;
  errors: string[];
}

/** Validate a video file before processing. */
export function validateVideoFile(file: File): VideoValidationResult {
  const errors: string[] = [];

  if (!ACCEPTED_VIDEO_TYPES.includes(file.type as (typeof ACCEPTED_VIDEO_TYPES)[number])) {
    errors.push(`Unsupported file type: ${file.type}. Please upload an MP4, MOV, or WebM file.`);
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

    const cleanup = () => {
      video.src = '';
      video.load();
    };

    video.onloadedmetadata = () => {
      const duration = video.duration;

      if (duration > MAX_VIDEO_DURATION_SECONDS) {
        cleanup();
        reject(
          new Error(
            `Video is too long (${Math.round(duration)}s). Maximum is ${MAX_VIDEO_DURATION_SECONDS}s.`,
          ),
        );
        return;
      }

      resolve({
        file_name: file.name,
        file_size_bytes: file.size,
        mime_type: file.type,
        duration_seconds: duration,
        width: video.videoWidth,
        height: video.videoHeight,
        frame_rate_estimated: null, // browser can't reliably report FPS
        camera_angle: 'unknown',
        objectUrl,
      });

      cleanup();
    };

    video.onerror = () => {
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
