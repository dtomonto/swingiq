'use client';

// ============================================================
// SwingVantage — Video Studio: VideoModal
// ------------------------------------------------------------
// Accessible dialog that plays a Video Studio asset. Esc to close, focus
// trapped to the close button on open, background scroll locked, backdrop
// click closes. Reuses the shared VideoPlayer.
// ============================================================

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { VideoPlayer } from './VideoPlayer';
import type { VideoAsset, JourneyStage } from '@/lib/video-studio/types';

interface VideoModalProps {
  asset: VideoAsset;
  placementId: string;
  open: boolean;
  onClose: () => void;
  page?: string;
  sport?: string;
  journeyStage?: JourneyStage;
}

export function VideoModal({ asset, placementId, open, onClose, page, sport, journeyStage }: VideoModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/60" aria-hidden="true" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={asset.title}
        className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-card shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
          <h2 className="truncate text-base font-bold text-foreground">{asset.title}</h2>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close video"
            className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto p-4">
          <VideoPlayer
            asset={asset}
            placementId={placementId}
            page={page}
            sport={sport}
            journeyStage={journeyStage}
          />
        </div>
      </div>
    </div>
  );
}
