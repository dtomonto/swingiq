'use client';

import { useState, useCallback, useRef } from 'react';
import { Video, AlertCircle, Shield, X, CheckCircle, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { track, ANALYTICS_EVENTS } from '@/lib/analytics';
import {
  validateVideoFile,
  extractVideoMetadata,
  formatFileSize,
  formatDuration,
  ACCEPTED_VIDEO_TYPES,
} from '@/lib/video-metadata';
import type { SwingVideoMetadata, VisualSport } from '@swingiq/core';
import { VideoRecorder } from './VideoRecorder';

interface VideoUploadProps {
  onVideoReady: (file: File, metadata: SwingVideoMetadata, objectUrl: string) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
  /** When true, offer an in-app "Record" tab alongside file upload. */
  enableRecording?: boolean;
  /** Drives the recorder's framing overlay + hints. */
  sport?: VisualSport;
}

export function VideoUpload({
  onVideoReady,
  onError,
  disabled,
  enableRecording = false,
  sport = 'golf',
}: VideoUploadProps) {
  const [mode, setMode] = useState<'upload' | 'record'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [privacyAcknowledged, setPrivacyAcknowledged] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setProcessingError(null);

      const validation = validateVideoFile(file);
      if (!validation.valid) {
        const msg = validation.errors[0];
        track(ANALYTICS_EVENTS.VIDEO_UPLOAD_FAILED, { sport, source: 'file', reason: 'validation' });
        setProcessingError(msg);
        onError?.(msg);
        return;
      }

      // Funnel: a valid file has been chosen and processing begins. The main
      // upload path for every sport routes through here, so this is the single
      // place the upload step is measured (the compare flow has its own input).
      track(ANALYTICS_EVENTS.VIDEO_UPLOAD_STARTED, { sport, source: 'file' });
      setIsProcessing(true);
      try {
        const result = await extractVideoMetadata(file);
        const { objectUrl, ...metadata } = result;
        track(ANALYTICS_EVENTS.VIDEO_UPLOAD_COMPLETED, {
          sport,
          source: 'file',
          duration_seconds: Math.round(metadata.duration_seconds ?? 0),
        });
        onVideoReady(file, metadata, objectUrl);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to read video file.';
        track(ANALYTICS_EVENTS.VIDEO_UPLOAD_FAILED, { sport, source: 'file', reason: 'metadata' });
        setProcessingError(msg);
        onError?.(msg);
      } finally {
        setIsProcessing(false);
      }
    },
    [onVideoReady, onError, sport],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled || !privacyAcknowledged) return;
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile, disabled, privacyAcknowledged],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset so the same file can be re-selected
    e.target.value = '';
  };

  return (
    <div className="space-y-4">
      {/* Privacy Notice */}
      <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
        <div className="flex gap-3">
          <Shield className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div className="text-sm text-warning">
            <p className="font-semibold mb-1">Privacy notice</p>
            <p className="text-warning leading-relaxed">
              Whether you upload a file or record in the app, your video is processed locally in your
              browser. When you run an analysis, SwingVantage sends only sampled still frames — not your
              full video file — to the AI vision provider so it can review your mechanics. Your
              original video is never uploaded or stored on our servers, the frames are not retained
              after analysis, and your video is never used to train a shared model.
            </p>
            <label className="flex items-center gap-2 mt-3 cursor-pointer">
              <input
                type="checkbox"
                checked={privacyAcknowledged}
                onChange={(e) => setPrivacyAcknowledged(e.target.checked)}
                className="rounded-sm border-warning/50 text-primary"
              />
              <span className="font-medium">I understand and want to continue</span>
            </label>
          </div>
        </div>
      </div>

      {/* Upload / Record tab control */}
      {enableRecording && (
        <div className="flex gap-1 p-1 rounded-lg bg-muted w-fit mx-auto">
          {(
            [
              ['upload', 'Upload file', Upload],
              ['record', 'Record now', Video],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setMode(id)}
              className={cn(
                'flex items-center gap-1.5 text-sm font-medium rounded-md px-4 py-1.5 transition-colors',
                mode === id
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ── Record mode ── */}
      {/* Only mount the recorder once privacy is accepted; un-accepting it
          unmounts the recorder, which stops the camera via its cleanup. */}
      {enableRecording && mode === 'record' && (
        privacyAcknowledged ? (
          <VideoRecorder
            onVideoReady={onVideoReady}
            onError={onError}
            sport={sport}
            disabled={disabled}
          />
        ) : (
          <div className="rounded-xl border-2 border-dashed border-border bg-muted p-10 text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-card mx-auto flex items-center justify-center">
              <Video className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-base font-semibold text-foreground">Record your swing in the app</p>
            <p className="flex items-center justify-center gap-1.5 text-xs text-warning">
              <AlertCircle className="w-3.5 h-3.5" />
              Accept the privacy notice above to start recording
            </p>
          </div>
        )
      )}

      {/* ── Upload mode ── */}
      {(!enableRecording || mode === 'upload') && (
        <>
      {/* Drop zone */}
      <div
        className={cn(
          'relative rounded-xl border-2 border-dashed transition-all duration-200',
          'flex flex-col items-center justify-center gap-4 p-10 text-center',
          isDragging && privacyAcknowledged
            ? 'border-primary bg-primary/10'
            : 'border-border bg-muted',
          (!privacyAcknowledged || disabled) && 'opacity-50 cursor-not-allowed',
          privacyAcknowledged && !disabled && !isProcessing && 'cursor-pointer hover:border-primary/50 hover:bg-primary/10',
        )}
        onDragOver={(e) => { e.preventDefault(); if (privacyAcknowledged) setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => {
          if (privacyAcknowledged && !disabled && !isProcessing) inputRef.current?.click();
        }}
        role="button"
        tabIndex={privacyAcknowledged ? 0 : -1}
        aria-label="Upload swing video"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (privacyAcknowledged && !disabled) inputRef.current?.click();
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_VIDEO_TYPES.join(',')}
          className="sr-only"
          onChange={handleInputChange}
          disabled={disabled || !privacyAcknowledged}
        />

        {isProcessing ? (
          <>
            <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <p className="text-sm text-muted-foreground font-medium">Reading video metadata…</p>
          </>
        ) : (
          <>
            <div className={cn(
              'w-16 h-16 rounded-2xl flex items-center justify-center',
              isDragging && privacyAcknowledged ? 'bg-primary/15' : 'bg-muted',
            )}>
              <Video className={cn(
                'w-8 h-8',
                isDragging && privacyAcknowledged ? 'text-primary' : 'text-muted-foreground',
              )} />
            </div>

            <div>
              <p className="text-base font-semibold text-foreground">
                {isDragging && privacyAcknowledged ? 'Drop your video here' : 'Upload your swing video'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Drag and drop, or{' '}
                <span className="text-primary font-medium">tap to browse</span>
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                MP4, MOV, WebM · Max 500 MB · Max 5 minutes
              </p>
            </div>

            {!privacyAcknowledged && (
              <div className="flex items-center gap-2 text-xs text-warning bg-warning/15 px-3 py-1.5 rounded-full">
                <AlertCircle className="w-3.5 h-3.5" />
                Accept the privacy notice above to upload
              </div>
            )}
          </>
        )}
      </div>

      {/* Error display */}
      {processingError && (
        <div className="flex items-start gap-3 rounded-lg bg-error/10 border border-error/30 p-3">
          <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-error font-medium">Upload failed</p>
            <p className="text-sm text-error">{processingError}</p>
          </div>
          <button onClick={() => setProcessingError(null)} className="text-error hover:text-error">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Format hints */}
      <div className="flex flex-wrap gap-2 justify-center">
        {(['MP4', 'MOV', 'WebM'] as const).map((fmt) => (
          <span key={fmt} className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full">
            {fmt}
          </span>
        ))}
        <span className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full">
          iPhone / Android compatible
        </span>
      </div>
        </>
      )}
    </div>
  );
}

// ── Video preview card (shown after upload) ──────────────────

interface VideoPreviewCardProps {
  file: File;
  metadata: SwingVideoMetadata;
  onRemove: () => void;
}

export function VideoPreviewCard({ file, metadata, onRemove }: VideoPreviewCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 p-4">
      <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
        <CheckCircle className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{file.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatFileSize(metadata.file_size_bytes)} ·{' '}
          {formatDuration(metadata.duration_seconds)} ·{' '}
          {metadata.width > 0 ? `${metadata.width}×${metadata.height}` : 'unknown resolution'}
        </p>
      </div>
      <Button variant="ghost" size="sm" onClick={onRemove} className="text-muted-foreground hover:text-error shrink-0">
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}
