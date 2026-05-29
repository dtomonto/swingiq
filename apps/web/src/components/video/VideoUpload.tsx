'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, Video, AlertCircle, Shield, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import {
  validateVideoFile,
  extractVideoMetadata,
  formatFileSize,
  formatDuration,
  ACCEPTED_VIDEO_TYPES,
} from '@/lib/video-metadata';
import type { SwingVideoMetadata } from '@swingiq/core';

interface VideoUploadProps {
  onVideoReady: (file: File, metadata: SwingVideoMetadata, objectUrl: string) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
}

export function VideoUpload({ onVideoReady, onError, disabled }: VideoUploadProps) {
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
        setProcessingError(msg);
        onError?.(msg);
        return;
      }

      setIsProcessing(true);
      try {
        const result = await extractVideoMetadata(file);
        const { objectUrl, ...metadata } = result;
        onVideoReady(file, metadata, objectUrl);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to read video file.';
        setProcessingError(msg);
        onError?.(msg);
      } finally {
        setIsProcessing(false);
      }
    },
    [onVideoReady, onError],
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
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex gap-3">
          <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold mb-1">Privacy notice</p>
            <p className="text-amber-700 leading-relaxed">
              Your video is processed locally in your browser for analysis. We do not upload,
              store, or share your swing video on any external server without your explicit
              consent. No third parties will receive your video. Your video data is never used
              to train a shared model.
            </p>
            <label className="flex items-center gap-2 mt-3 cursor-pointer">
              <input
                type="checkbox"
                checked={privacyAcknowledged}
                onChange={(e) => setPrivacyAcknowledged(e.target.checked)}
                className="rounded border-amber-400 text-green-600"
              />
              <span className="font-medium">I understand and want to continue</span>
            </label>
          </div>
        </div>
      </div>

      {/* Drop zone */}
      <div
        className={cn(
          'relative rounded-xl border-2 border-dashed transition-all duration-200',
          'flex flex-col items-center justify-center gap-4 p-10 text-center',
          isDragging && privacyAcknowledged
            ? 'border-green-500 bg-green-50'
            : 'border-gray-300 bg-gray-50',
          (!privacyAcknowledged || disabled) && 'opacity-50 cursor-not-allowed',
          privacyAcknowledged && !disabled && !isProcessing && 'cursor-pointer hover:border-green-400 hover:bg-green-50/50',
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
            <div className="w-12 h-12 rounded-full border-4 border-green-500 border-t-transparent animate-spin" />
            <p className="text-sm text-gray-600 font-medium">Reading video metadata…</p>
          </>
        ) : (
          <>
            <div className={cn(
              'w-16 h-16 rounded-2xl flex items-center justify-center',
              isDragging && privacyAcknowledged ? 'bg-green-100' : 'bg-gray-100',
            )}>
              <Video className={cn(
                'w-8 h-8',
                isDragging && privacyAcknowledged ? 'text-green-600' : 'text-gray-400',
              )} />
            </div>

            <div>
              <p className="text-base font-semibold text-gray-800">
                {isDragging && privacyAcknowledged ? 'Drop your video here' : 'Upload your swing video'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Drag and drop, or{' '}
                <span className="text-green-600 font-medium">tap to browse</span>
              </p>
              <p className="text-xs text-gray-400 mt-2">
                MP4, MOV, WebM · Max 500 MB · Max 5 minutes
              </p>
            </div>

            {!privacyAcknowledged && (
              <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-100 px-3 py-1.5 rounded-full">
                <AlertCircle className="w-3.5 h-3.5" />
                Accept the privacy notice above to upload
              </div>
            )}
          </>
        )}
      </div>

      {/* Error display */}
      {processingError && (
        <div className="flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 p-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-700 font-medium">Upload failed</p>
            <p className="text-sm text-red-600">{processingError}</p>
          </div>
          <button onClick={() => setProcessingError(null)} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Format hints */}
      <div className="flex flex-wrap gap-2 justify-center">
        {(['MP4', 'MOV', 'WebM'] as const).map((fmt) => (
          <span key={fmt} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
            {fmt}
          </span>
        ))}
        <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
          iPhone / Android compatible
        </span>
      </div>
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
    <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
      <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
        <CheckCircle className="w-5 h-5 text-green-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{file.name}</p>
        <p className="text-xs text-gray-500 mt-0.5">
          {formatFileSize(metadata.file_size_bytes)} ·{' '}
          {formatDuration(metadata.duration_seconds)} ·{' '}
          {metadata.width > 0 ? `${metadata.width}×${metadata.height}` : 'unknown resolution'}
        </p>
      </div>
      <Button variant="ghost" size="sm" onClick={onRemove} className="text-gray-400 hover:text-red-500 flex-shrink-0">
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}
